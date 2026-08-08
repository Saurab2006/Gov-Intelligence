'use client';
import { useEffect, useRef, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, CheckCheck, AlertTriangle, UserCheck, Clock, PartyPopper, Copy, ShieldAlert, Megaphone, RotateCcw } from 'lucide-react';
import { get, patch } from '@/lib/api';
import { relativeTime, cn } from '@/lib/format';

const ICONS = {
  'new-report': AlertTriangle,
  assigned: UserCheck,
  'eta-updated': Clock,
  verified: CheckCheck,
  completed: PartyPopper,
  duplicate: Copy,
  'flagged-fake': ShieldAlert,
  'important-notice': Megaphone,
  reopened: RotateCcw,
};

export default function NotificationBell() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [unread, setUnread] = useState(0);
  const ref = useRef(null);

  const load = useCallback(() => {
    get('/api/notifications').then(d => { setItems(d.notifications || []); setUnread(d.unreadCount || 0); }).catch(() => {});
  }, []);

  useEffect(() => {
    load();
    const t = setInterval(load, 20000);
    return () => clearInterval(t);
  }, [load]);

  useEffect(() => {
    function onClick(e) { if (ref.current && !ref.current.contains(e.target)) setOpen(false); }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const openItem = async (n) => {
    if (!n.read) { setItems(prev => prev.map(x => x._id === n._id ? { ...x, read: true } : x)); setUnread(u => Math.max(0, u - 1)); patch(`/api/notifications/${n._id}`).catch(() => {}); }
    setOpen(false);
    if (n.link) router.push(n.link);
  };

  const markAllRead = async () => {
    setItems(prev => prev.map(x => ({ ...x, read: true })));
    setUnread(0);
    try { await patch('/api/notifications'); } catch {}
  };

  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen(o => !o)} className="relative p-2 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-50 transition-colors" title="Notifications">
        <Bell className="w-4 h-4" />
        {unread > 0 && <span className="absolute top-1 right-1 min-w-[16px] h-4 px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">{unread > 9 ? '9+' : unread}</span>}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-[340px] max-h-[420px] bg-white rounded-2xl border border-gray-100 shadow-xl overflow-hidden z-40 flex flex-col">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-900">Notifications</h3>
            {unread > 0 && <button onClick={markAllRead} className="text-xs font-medium text-brand-600 hover:text-brand-700">Mark all read</button>}
          </div>
          <div className="overflow-y-auto flex-1">
            {items.length === 0 ? (
              <div className="px-4 py-10 text-center text-sm text-gray-400">You're all caught up</div>
            ) : items.map(n => {
              const Icon = ICONS[n.type] || Bell;
              return (
                <button key={n._id} onClick={() => openItem(n)} className={cn('w-full text-left px-4 py-3 flex gap-3 border-b border-gray-50 hover:bg-gray-50/70 transition-colors', !n.read && 'bg-brand-50/40')}>
                  <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5', !n.read ? 'bg-brand-100 text-brand-600' : 'bg-gray-100 text-gray-400')}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className={cn('text-[13px] leading-snug', !n.read ? 'font-semibold text-gray-900' : 'font-medium text-gray-700')}>{n.title}</p>
                    <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{n.message}</p>
                    <p className="text-[10px] text-gray-400 mt-1">{relativeTime(n.createdAt)}</p>
                  </div>
                  {!n.read && <span className="w-2 h-2 rounded-full bg-brand-500 shrink-0 mt-1.5" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}