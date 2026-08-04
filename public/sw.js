// GovInsight Nepal — offline service worker.
//
// Strategy:
//  - App shell / static assets: cache-first, so core screens open with no
//    connection at all.
//  - GET /api/* calls: network-first, falling back to the last cached
//    response when offline (so a citizen can still see budgets/issues they
//    loaded earlier).
//  - POST/PATCH to /api/reports: if the network request fails (offline),
//    the request is queued in IndexedDB and replayed automatically via
//    Background Sync once connectivity returns — this is how issue reports
//    submitted offline eventually reach the server.

const CACHE_VERSION = 'govinsight-v1';
const APP_SHELL_CACHE = `${CACHE_VERSION}-shell`;
const API_CACHE = `${CACHE_VERSION}-api`;
const QUEUE_DB = 'govinsight-offline-queue';
const QUEUE_STORE = 'pending-requests';

const APP_SHELL_URLS = [
  '/',
  '/dashboard',
  '/manifest.json',
  '/icons/icon-192.svg',
  '/icons/icon-512.svg',
];

// ---- IndexedDB helpers for the offline write queue ----
function openQueueDb() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(QUEUE_DB, 1);
    req.onupgradeneeded = () => {
      req.result.createObjectStore(QUEUE_STORE, { keyPath: 'id', autoIncrement: true });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function queueRequest(entry) {
  const db = await openQueueDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(QUEUE_STORE, 'readwrite');
    tx.objectStore(QUEUE_STORE).add(entry);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function getQueuedRequests() {
  const db = await openQueueDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(QUEUE_STORE, 'readonly');
    const req = tx.objectStore(QUEUE_STORE).getAll();
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function deleteQueuedRequest(id) {
  const db = await openQueueDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(QUEUE_STORE, 'readwrite');
    tx.objectStore(QUEUE_STORE).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

// ---- install / activate ----
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(APP_SHELL_CACHE).then((cache) => cache.addAll(APP_SHELL_URLS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => !k.startsWith(CACHE_VERSION)).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// ---- fetch handling ----
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Only handle same-origin requests.
  if (url.origin !== self.location.origin) return;

  const isApi = url.pathname.startsWith('/api/');
  const isReportWrite = isApi && url.pathname.startsWith('/api/reports') && request.method !== 'GET';

  // Queue report writes made while offline; replay them later via sync.
  if (isReportWrite) {
    event.respondWith(
      fetch(request.clone()).catch(async () => {
        const body = await request.clone().text();
        await queueRequest({
          url: request.url,
          method: request.method,
          headers: Object.fromEntries(request.headers.entries()),
          body,
          queuedAt: Date.now(),
        });
        if ('sync' in self.registration) {
          try { await self.registration.sync.register('sync-queued-reports'); } catch { /* ignore */ }
        }
        return new Response(
          JSON.stringify({ queued: true, offline: true, message: 'Saved offline — will submit automatically once you\u2019re back online.' }),
          { status: 202, headers: { 'Content-Type': 'application/json' } }
        );
      })
    );
    return;
  }

  // Network-first for other API GETs, fall back to cache when offline.
  if (isApi && request.method === 'GET') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(API_CACHE).then((cache) => cache.put(request, copy));
          return response;
        })
        .catch(() => caches.match(request))
    );
    return;
  }

  // Cache-first for everything else (app shell, static assets).
  if (request.method === 'GET') {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request)
          .then((response) => {
            const copy = response.clone();
            caches.open(APP_SHELL_CACHE).then((cache) => cache.put(request, copy));
            return response;
          })
          .catch(() => caches.match('/dashboard'));
      })
    );
  }
});

// ---- background sync: replay queued report submissions ----
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-queued-reports') {
    event.waitUntil(replayQueuedRequests());
  }
});

// Fallback for browsers without Background Sync (e.g. iOS Safari): the app
// can call navigator.serviceWorker.controller.postMessage({type:'flush-queue'})
// on regaining connectivity (see LanguageContext-adjacent online listener in
// the app shell) to trigger the same replay logic manually.
self.addEventListener('message', (event) => {
  if (event.data?.type === 'flush-queue') {
    event.waitUntil(replayQueuedRequests());
  }
});

async function replayQueuedRequests() {
  const queued = await getQueuedRequests();
  for (const entry of queued) {
    try {
      const response = await fetch(entry.url, {
        method: entry.method,
        headers: entry.headers,
        body: entry.body,
      });
      if (response.ok) {
        await deleteQueuedRequest(entry.id);
        const clients = await self.clients.matchAll();
        clients.forEach((client) => client.postMessage({ type: 'queued-report-synced', id: entry.id }));
      }
    } catch {
      // Still offline — leave it queued, try again on the next sync event.
      break;
    }
  }
}
