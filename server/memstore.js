const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const { suggestAuthoritiesForArea } = require('./utils/authorityAI');

function id() { return crypto.randomBytes(12).toString('hex'); }
function now() { return new Date().toISOString(); }

// ---- stores ----
const users = [];
const documents = [];
const budgetItems = [];
const projects = [];
const activities = [];
const changeRequests = [];
const reports = [];
const notifications = [];
const authorities = [];
const reviews = [];

// ---- civic reporting reference data ----
const REPORT_CATEGORIES = [
  { value: 'flood', label: 'Flood / Waterlogging', baseDays: 3 },
  { value: 'road-damage', label: 'Road Damage / Pothole', baseDays: 7 },
  { value: 'tunnel-blockage', label: 'Tunnel Blockage / Overflow', baseDays: 2 },
  { value: 'bridge-damage', label: 'Bridge Damage', baseDays: 10 },
  { value: 'landslide', label: 'Landslide', baseDays: 5 },
  { value: 'drainage', label: 'Drainage / Sewerage', baseDays: 4 },
  { value: 'electrical', label: 'Electrical Hazard', baseDays: 1 },
  { value: 'water-supply', label: 'Water Supply Disruption', baseDays: 3 },
  { value: 'other', label: 'Other', baseDays: 5 },
];
const REPORT_AUTHORITIES = [
  'Department of Roads',
  'Municipal Ward Office',
  'Disaster Management Authority',
  'Water Supply & Sewerage Corporation',
  'Urban Development Dept',
  'Electricity Authority',
];

// ---- seed data ----
const SECTORS = ['Roads & Transport', 'Health', 'Education', 'Drinking Water', 'Agriculture', 'Energy', 'Urban Development', 'Disaster Management'];
const DEPTS = ['Municipal Executive', 'Department of Roads', 'Ministry of Health', 'Ministry of Education', 'Water Supply Dept', 'Agriculture Dept', 'Energy Dept', 'Urban Development Dept'];
const STATUSES = ['planned', 'ongoing', 'completed', 'delayed'];
const DOCS_SPEC = [
  { title: 'Kathmandu Metropolitan City — Annual Budget', docType: 'budget', fiscalYear: '2081/82', district: 'Kathmandu', municipality: 'Kathmandu Metro' },
  { title: 'Pokhara Metropolitan City — Annual Budget', docType: 'budget', fiscalYear: '2080/81', district: 'Kaski', municipality: 'Pokhara Metro' },
  { title: 'Office of Auditor General — Audit Report', docType: 'audit', fiscalYear: '2080/81', district: 'Chitwan', municipality: 'Bharatpur Metro' },
  { title: 'Butwal Sub-Metro — Development Plan', docType: 'development-plan', fiscalYear: '2081/82', district: 'Rupandehi', municipality: 'Butwal Sub-Metro' },
  { title: 'Dept of Roads — Procurement Notice', docType: 'procurement', fiscalYear: '2081/82', district: 'Sunsari', municipality: 'Dharan Sub-Metro' },
  { title: 'Dhangadhi Sub-Metro — Annual Report', docType: 'annual-report', fiscalYear: '2079/80', district: 'Kailali', municipality: 'Dhangadhi Sub-Metro' },
];
const PROJ_NAMES = ['Ring Road Upgrade', 'Health Post Construction', 'Seti River Bridge', 'Water Supply Network', 'Kalika School Block', 'Solar Street Lights', 'Sanitary Landfill', 'Bus Park Hub', 'Flood Embankment', 'Data Centre', 'Agriculture Centre', 'Heritage Walkway'];
const PREFIXES = ['Construction of', 'Upgrading of', 'Rehabilitation of', 'Expansion of'];
const SUBJECTS = ['Ward Office', 'Road Section', 'Health Post', 'School Block', 'Water Tank', 'Bridge', 'Street Lights', 'Market Centre'];

function rng(seed) { let a = seed >>> 0; return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
function pick(r, arr) { return arr[Math.floor(r() * arr.length)]; }

// ---- civic reporting helpers ----

// Lightweight rule-based "AI" estimator: takes the category's typical repair
// window and adjusts it by how urgent the citizen marked the problem.
// (Stands in for a model call — swap for a real completion if ever wired up.)
function estimateDays(category, severity) {
  const spec = REPORT_CATEGORIES.find(c => c.value === category) || REPORT_CATEGORIES[REPORT_CATEGORIES.length - 1];
  const factor = { critical: 0.5, high: 0.75, medium: 1, low: 1.3 }[severity] ?? 1;
  return Math.max(1, Math.round(spec.baseDays * factor));
}

function addDays(days) { const d = new Date(); d.setDate(d.getDate() + Number(days || 0)); return d.toISOString(); }

function normalizeText(s) { return (s || '').toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(Boolean); }

// Two reports are treated as "the same problem" when they share a category,
// sit in the same district, and their location text overlaps meaningfully —
// this is what lets many citizen reports of one broken tunnel collapse into
// a single work item instead of flooding the queue with duplicates.
function textOverlap(a, b) {
  const wa = new Set(normalizeText(a));
  const wb = new Set(normalizeText(b));
  if (wa.size === 0 || wb.size === 0) return 0;
  let shared = 0;
  wa.forEach(w => { if (wb.has(w)) shared++; });
  return shared / Math.min(wa.size, wb.size);
}

function findDuplicateCandidate(category, location) {
  const cutoff = Date.now() - 21 * 24 * 60 * 60 * 1000; // look back 3 weeks
  return reports.find(r =>
    !r.duplicateOf &&
    r.category === category &&
    !['completed', 'rejected'].includes(r.status) &&
    (r.location.district || '').toLowerCase() === (location.district || '').toLowerCase() &&
    new Date(r.createdAt).getTime() > cutoff &&
    textOverlap(r.location.address, location.address) >= 0.4
  ) || null;
}

// Base authorities every fresh install ships with, so "Assign" always has
// options even before any admin or AI suggestion has run.
(function seedBaseAuthorities() {
  REPORT_AUTHORITIES.forEach(name => {
    authorities.push({
      _id: id(), name, department: name, district: '', categories: [],
      contactEmail: '', contactPhone: '', source: 'seed', createdBy: null,
      ratingAvg: 0, ratingCount: 0, createdAt: now(), updatedAt: now(),
    });
  });
})();

function seedForUser(userId) {
  if (documents.length > 0) return 0;

  const r = rng(Date.now());
  let created = 0;

  for (const spec of DOCS_SPEC) {
    const totalBudget = (1 + r() * 8) * 1e9;
    const docId = id();
    documents.push({
      _id: docId, user: userId, ...spec,
      fileName: spec.title.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '.pdf',
      fileSize: 800000 + Math.floor(r() * 2000000),
      organization: spec.municipality, status: 'completed', pageCount: 8, totalBudget,
      summary: `This ${spec.docType} for FY ${spec.fiscalYear} from ${spec.municipality} contains extracted budget lines.`,
      highlights: [`Total: Rs ${(totalBudget / 1e9).toFixed(2)} Arab`, `${6 + Math.floor(r() * 12)} departments`],
      keywords: ['budget', spec.district.toLowerCase()],
      createdAt: now(), updatedAt: now(),
    });

    for (let i = 0; i < 14 + Math.floor(r() * 14); i++) {
      budgetItems.push({
        _id: id(), user: userId, document: docId,
        title: `${pick(r, PREFIXES)} ${pick(r, SUBJECTS)} — ${spec.municipality}`,
        department: pick(r, DEPTS), sector: pick(r, SECTORS),
        amount: (0.2 + r() * 12) * 1e7, fiscalYear: spec.fiscalYear,
        district: spec.district, page: 1 + Math.floor(r() * 8),
        confidence: 0.82 + r() * 0.16,
      });
    }

    for (let i = 0; i < 4 + Math.floor(r() * 8); i++) {
      projects.push({
        _id: id(), user: userId, document: docId,
        name: pick(r, PROJ_NAMES), sector: pick(r, SECTORS),
        status: pick(r, STATUSES), budget: (0.5 + r() * 18) * 1e7,
        district: spec.district, fiscalYear: spec.fiscalYear,
      });
    }
    created++;
  }

  activities.push({ _id: id(), user: userId, type: 'account', message: 'Workspace seeded with 6 sample documents', createdAt: now() });
  return created;
}

// ---- API ----
const store = {
  // Auth
  async findUserByEmail(email) { return users.find(u => u.email === email) || null; },
  async createUser({ name, email, password, role, organization }) {
    const hashed = await bcrypt.hash(password, 12);
    const jobTitle = role === 'admin' ? 'Administrator' : role === 'analyst' ? 'Analyst' : 'Researcher';
    const u = { _id: id(), name, email: email.toLowerCase().trim(), password: hashed, role, organization: organization || 'Independent', jobTitle, avatarHue: Math.floor(Math.random() * 360), status: 'active', createdAt: now() };
    users.push(u);
    return u;
  },
  async comparePassword(user, candidate) { return bcrypt.compare(candidate, user.password); },
  userCount() { return users.length; },
  toPublic(u) { const { password, ...rest } = u; return rest; },

  // Seed
  seedForUser,

  // Analytics
  getDocuments() { return documents; },
  getBudgets() { return budgetItems; },
  getProjects() { return projects; },
  getActivities() { return activities.slice().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5); },
  filterBudgets({ q, sector, fiscalYear, limit = 100 }) {
    let result = budgetItems.slice();
    if (q) { const re = new RegExp(q, 'i'); result = result.filter(b => re.test(b.title) || re.test(b.district || '')); }
    if (sector && sector !== 'all') result = result.filter(b => b.sector === sector);
    if (fiscalYear && fiscalYear !== 'all') result = result.filter(b => b.fiscalYear === fiscalYear);
    return result.sort((a, b) => b.amount - a.amount).slice(0, limit).map(b => {
      const doc = documents.find(d => d._id === b.document);
      return { ...b, documentId: doc?._id, documentTitle: doc?.title };
    });
  },

  createBudgetChange(budgetItemId, requestedBy, proposed, reason) {
    const item = budgetItems.find(b => b._id === budgetItemId);
    if (!item) return null;
    const change = {
      _id: id(),
      type: 'edit',
      budgetItem: item._id,
      requestedBy,
      status: 'pending',
      reason: reason || '',
      proposed,
      createdAt: now(),
      updatedAt: now(),
    };
    changeRequests.push(change);
    activities.push({ _id: id(), user: requestedBy, type: 'change-request', message: `Proposed a budget update for "${item.title}"`, createdAt: now() });
    return change;
  },
  createBudgetChangeNew(requestedBy, proposed, reason) {
    const change = {
      _id: id(),
      type: 'create',
      budgetItem: null,
      requestedBy,
      status: 'pending',
      reason: reason || '',
      proposed,
      createdAt: now(),
      updatedAt: now(),
    };
    changeRequests.push(change);
    activities.push({ _id: id(), user: requestedBy, type: 'change-request', message: `Proposed a new budget record: "${proposed.title}"`, createdAt: now() });
    return change;
  },
  getBudgetChanges(user, { status = 'all', limit = 100 } = {}) {
    let result = user.role === 'admin'
      ? changeRequests
      : changeRequests.filter(c => c.requestedBy === user._id);
    if (status !== 'all') result = result.filter(c => c.status === status);
    return result
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, Number(limit) || 100)
      .map(c => ({
        ...c,
        budgetItem: budgetItems.find(b => b._id === c.budgetItem) || null,
        requestedBy: store.toPublic(users.find(u => u._id === c.requestedBy) || {}),
        reviewedBy: c.reviewedBy ? store.toPublic(users.find(u => u._id === c.reviewedBy) || {}) : null,
      }));
  },
  reviewBudgetChange(changeId, reviewerId, status) {
    const change = changeRequests.find(c => c._id === changeId);
    if (!change || change.status !== 'pending') return null;

    if (change.type === 'create') {
      change.status = status;
      change.reviewedBy = reviewerId;
      change.reviewedAt = now();
      change.updatedAt = now();
      if (status === 'approved') {
        const p = change.proposed;
        const docId = id();
        documents.push({
          _id: docId, user: change.requestedBy, title: `${p.title} — Manually Added Record`,
          docType: 'manual-entry', fiscalYear: p.fiscalYear, district: p.district || '',
          fileName: null, fileSize: 0, organization: p.district || 'Manual Entry', status: 'completed',
          pageCount: 0, totalBudget: p.amount,
          summary: `Manually added record for ${p.district || 'an unspecified district'}, FY ${p.fiscalYear}.`,
          highlights: [], keywords: ['manual', (p.district || '').toLowerCase()],
          createdAt: now(), updatedAt: now(),
        });
        const newItem = {
          _id: id(), user: change.requestedBy, document: docId,
          title: p.title, department: p.department, sector: p.sector,
          amount: p.amount, fiscalYear: p.fiscalYear, district: p.district || '',
          page: 1, confidence: 1,
        };
        budgetItems.push(newItem);
        change.budgetItem = newItem._id;
      }
      activities.push({ _id: id(), user: change.requestedBy, type: 'approval', message: `${status === 'approved' ? 'Approved a new budget record' : 'Rejected a new budget record proposal'}: "${change.proposed.title}"`, createdAt: now() });
      return change;
    }

    const item = budgetItems.find(b => b._id === change.budgetItem);
    if (!item) return null;
    change.status = status;
    change.reviewedBy = reviewerId;
    change.reviewedAt = now();
    change.updatedAt = now();
    if (status === 'approved') Object.assign(item, change.proposed, { updatedAt: now() });
    activities.push({ _id: id(), user: change.requestedBy, type: 'approval', message: `${status === 'approved' ? 'Approved' : 'Rejected'} budget update for "${item.title}"`, createdAt: now() });
    return change;
  },

  // Users (admin)
  getAllUsers() {
    return users.map(u => {
      const docCount = documents.filter(d => d.user === u._id).length;
      return { ...store.toPublic(u), documentCount: docCount };
    });
  },
  updateUser(userId, updates) {
    const u = users.find(u => u._id === userId);
    if (!u) return null;
    if (updates.role) u.role = updates.role;
    if (updates.status) u.status = updates.status;
    return store.toPublic(u);
  },

  // Token lookup
  findUserById(userId) { return users.find(u => u._id === userId) || null; },

  // ---- Civic reports (flood / road / tunnel etc.) ----
  reportMeta() {
    const names = authorities.length ? authorities.map(a => a.name) : REPORT_AUTHORITIES;
    return { categories: REPORT_CATEGORIES, authorities: names };
  },

  publicReport(r) {
    const reporter = users.find(u => u._id === r.reportedBy);
    const original = r.duplicateOf ? reports.find(x => x._id === r.duplicateOf) : null;
    return {
      ...r,
      reportedBy: reporter ? store.toPublic(reporter) : null,
      duplicateOfTitle: original ? original.title : null,
      timeline: r.timeline.map(t => ({ ...t, by: (users.find(u => u._id === t.by) && store.toPublic(users.find(u => u._id === t.by))) || null })),
    };
  },

  createReport(userId, { title, category, description, severity, location, reporterContact }) {
    const spec = REPORT_CATEGORIES.find(c => c.value === category);
    if (!spec) return { error: 'Unknown category' };
    if (!title || !description || !location?.address) return { error: 'Title, description and address are required' };

    const dup = findDuplicateCandidate(category, location);
    const days = estimateDays(category, severity);
    const report = {
      _id: id(),
      title: title.trim(),
      category,
      description: description.trim(),
      severity: severity || 'medium',
      location: { address: location.address || '', district: location.district || '', municipality: location.municipality || '', ward: location.ward || '', lat: location.lat ?? null, lng: location.lng ?? null },
      reportedBy: userId,
      reporterContact: reporterContact || '',
      status: dup ? 'duplicate' : 'pending',
      estimatedDays: dup ? dup.estimatedDays : days,
      dueDate: dup ? dup.dueDate : addDays(days),
      completedAt: null,
      assignedDepartment: dup ? dup.assignedDepartment : '',
      assignedContact: dup ? dup.assignedContact : '',
      assignedBy: null,
      isFake: false,
      fakeReason: '',
      duplicateOf: dup ? dup._id : null,
      confirmations: 1,
      timeline: [{ action: dup ? 'reported (matched to existing issue)' : 'reported', note: dup ? `Linked to an existing report: "${dup.title}"` : `AI-suggested resolution window: ${days} day(s)`, by: userId, at: now() }],
      createdAt: now(), updatedAt: now(),
    };
    reports.push(report);

    if (dup) {
      dup.confirmations += 1;
      dup.updatedAt = now();
      dup.timeline.push({ action: 'duplicate-confirmed', note: `Another citizen reported the same issue (${dup.confirmations} reports total)`, by: userId, at: now() });
      // Let whoever is already handling the original know it's escalating.
      if (dup.assignedBy) store.createNotification(dup.assignedBy, { type: 'duplicate', title: 'Another report on an active issue', message: `"${dup.title}" now has ${dup.confirmations} citizen reports.`, link: `/issues/${dup._id}`, report: dup._id });
    } else {
      store.notifyRoles(['admin', 'analyst'], { type: 'new-report', title: 'New community report', message: `${title.trim()} — ${location.address}${location.district ? ', ' + location.district : ''}`, link: `/issues/${report._id}`, report: report._id });
    }
    activities.push({ _id: id(), user: userId, type: 'report', message: `Reported a ${spec.label.toLowerCase()} issue: "${title.trim()}"`, createdAt: now() });
    return { report: store.publicReport(report) };
  },

  listReports(user, { status = 'all', category = 'all', district = '', mine = false, flagged = false, limit = 200 } = {}) {
    let result = reports.slice();
    // Citizens / researchers only ever see their own submissions; staff see everything.
    if (user.role === 'researcher' || mine === 'true' || mine === true) {
      result = result.filter(r => r.reportedBy === user._id);
    }
    if (status !== 'all') result = result.filter(r => r.status === status);
    if (category !== 'all') result = result.filter(r => r.category === category);
    if (district) { const re = new RegExp(district, 'i'); result = result.filter(r => re.test(r.location.district || '')); }
    if (flagged === 'true' || flagged === true) result = result.filter(r => r.isFake);
    return result
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, Number(limit) || 200)
      .map(store.publicReport);
  },

  reportStats(user) {
    const scope = user.role === 'researcher' ? reports.filter(r => r.reportedBy === user._id) : reports;
    const active = scope.filter(r => !['completed', 'rejected', 'duplicate'].includes(r.status));
    return {
      total: scope.length,
      pending: scope.filter(r => r.status === 'pending').length,
      active: active.length,
      completed: scope.filter(r => r.status === 'completed').length,
      flagged: scope.filter(r => r.isFake).length,
      duplicates: scope.filter(r => r.duplicateOf).length,
    };
  },

  getReport(reportId, user) {
    const r = reports.find(x => x._id === reportId);
    if (!r) return null;
    if (user.role === 'researcher' && r.reportedBy !== user._id) return null;
    const duplicates = reports.filter(x => x.duplicateOf === r._id).map(store.publicReport);
    return { ...store.publicReport(r), duplicates };
  },

  // Single workflow entrypoint used by analysts/admins to move a report
  // forward: verify -> assign an authority -> (optionally re-estimate the
  // timeline) -> tick complete. Every transition is timestamped and the
  // reporter (plus anyone who confirmed the same issue) gets notified.
  updateReport(reportId, actingUser, action, payload = {}) {
    const r = reports.find(x => x._id === reportId);
    if (!r) return { error: 'Report not found' };
    if (!['admin', 'analyst'].includes(actingUser.role)) return { error: 'Only analysts or admins can manage reports' };

    const confirmers = () => reports.filter(x => x._id === r._id || x.duplicateOf === r._id).map(x => x.reportedBy);
    const notifyReporters = (payload2) => confirmers().forEach(uid => store.createNotification(uid, { ...payload2, link: `/issues/${r._id}`, report: r._id }));

    if (action === 'verify') {
      r.status = 'verified';
      r.timeline.push({ action: 'verified', note: payload.note || 'Confirmed as a genuine issue', by: actingUser._id, at: now() });
      notifyReporters({ type: 'verified', title: 'Your report was verified', message: `"${r.title}" has been confirmed and is being reviewed.` });
    } else if (action === 'assign') {
      if (!payload.assignedDepartment) return { error: 'Choose an authority to assign this to' };
      r.assignedDepartment = payload.assignedDepartment;
      r.assignedContact = payload.assignedContact || '';
      r.assignedBy = actingUser._id;
      r.status = 'assigned';
      r.timeline.push({ action: 'assigned', note: `Handed to ${payload.assignedDepartment}${payload.assignedContact ? ` (${payload.assignedContact})` : ''}`, by: actingUser._id, at: now() });
      notifyReporters({ type: 'assigned', title: 'Your report was assigned', message: `"${r.title}" was assigned to ${payload.assignedDepartment}.` });
    } else if (action === 'set-eta') {
      const days = Number(payload.estimatedDays);
      if (!Number.isFinite(days) || days <= 0) return { error: 'Enter a valid number of days' };
      r.estimatedDays = days;
      r.dueDate = addDays(days);
      r.status = r.status === 'pending' ? 'verified' : r.status;
      r.timeline.push({ action: 'eta-updated', note: `Analyst revised the estimate to ${days} day(s)${payload.note ? ` — ${payload.note}` : ''}`, by: actingUser._id, at: now() });
      notifyReporters({ type: 'eta-updated', title: 'Estimated completion updated', message: `"${r.title}" is now expected to be resolved in ${days} day(s).` });
    } else if (action === 'start') {
      r.status = 'in-progress';
      r.timeline.push({ action: 'in-progress', note: payload.note || 'Work has started on site', by: actingUser._id, at: now() });
      notifyReporters({ type: 'eta-updated', title: 'Work has started', message: `Crews have started work on "${r.title}".` });
    } else if (action === 'complete') {
      r.status = 'completed';
      r.completedAt = now();
      r.timeline.push({ action: 'completed', note: payload.note || 'Marked complete by analyst', by: actingUser._id, at: now() });
      notifyReporters({ type: 'completed', title: 'Issue resolved', message: `Good news — "${r.title}" has been marked complete.` });
      store.notifyRoles(['admin'], { type: 'completed', title: 'Report closed', message: `${actingUser.name} closed "${r.title}".`, link: `/issues/${r._id}`, report: r._id });
    } else if (action === 'mark-fake') {
      if (!payload.reason) return { error: 'Give a reason so it can be reviewed later' };
      r.isFake = true;
      r.fakeReason = payload.reason;
      r.status = 'rejected';
      r.timeline.push({ action: 'flagged-fake', note: payload.reason, by: actingUser._id, at: now() });
      store.createNotification(r.reportedBy, { type: 'flagged-fake', title: 'Your report was closed', message: `"${r.title}" was reviewed and closed: ${payload.reason}`, link: `/issues/${r._id}`, report: r._id });
    } else if (action === 'mark-duplicate') {
      const target = reports.find(x => x._id === payload.duplicateOf);
      if (!target || target._id === r._id) return { error: 'Pick a valid original report' };
      r.duplicateOf = target._id;
      r.status = 'duplicate';
      target.confirmations += 1;
      r.timeline.push({ action: 'marked-duplicate', note: `Merged into "${target.title}"`, by: actingUser._id, at: now() });
      store.createNotification(r.reportedBy, { type: 'duplicate', title: 'Report merged', message: `Your report was merged with an existing one: "${target.title}", which is already being tracked.`, link: `/issues/${target._id}`, report: target._id });
    } else {
      return { error: 'Unknown action' };
    }
    r.updatedAt = now();
    return { report: store.publicReport(r) };
  },

  // ---- Authorities ----
  listAuthorities({ district = '' } = {}) {
    let result = authorities.slice();
    if (district) { const re = new RegExp(`^${district}$`, 'i'); result = result.filter(a => re.test(a.district || '')); }
    return result.sort((a, b) => b.ratingAvg - a.ratingAvg || a.name.localeCompare(b.name));
  },
  createAuthority(createdBy, { name, department, district, categories, contactEmail, contactPhone }) {
    if (!name) return { error: 'Authority name is required' };
    if (authorities.some(a => a.name === name && (a.district || '') === (district || ''))) {
      return { error: 'That authority already exists for this district' };
    }
    const a = {
      _id: id(), name, department: department || '', district: district || '',
      categories: Array.isArray(categories) ? categories : [],
      contactEmail: contactEmail || '', contactPhone: contactPhone || '',
      source: 'admin', createdBy, ratingAvg: 0, ratingCount: 0, createdAt: now(), updatedAt: now(),
    };
    authorities.push(a);
    return { authority: a };
  },
  // Rule-based "AI" pass: fills in any authority types this district is
  // missing yet (roads, disaster mgmt, water, electricity, urban dev, ward office).
  aiSuggestAuthorities(createdBy, district) {
    if (!district) return { error: 'District is required' };
    const existingNames = new Set(authorities.filter(a => (a.district || '').toLowerCase() === district.toLowerCase()).map(a => a.name));
    const toCreate = suggestAuthoritiesForArea(district, existingNames);
    const created = toCreate.map(spec => {
      const a = { _id: id(), ...spec, contactEmail: '', contactPhone: '', createdBy, ratingAvg: 0, ratingCount: 0, createdAt: now(), updatedAt: now() };
      authorities.push(a);
      return a;
    });
    return { created, message: created.length ? `Added ${created.length} authority(ies) for ${district}` : `${district} already has full coverage` };
  },

  // ---- Reviews ----
  listReviews(authorityId) {
    return reviews.filter(r => r.authority === authorityId)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .map(r => ({ ...r, user: store.toPublic(users.find(u => u._id === r.user) || {}) }));
  },
  createReview(userId, authorityId, { rating, comment, report }) {
    const authority = authorities.find(a => a._id === authorityId);
    if (!authority) return { error: 'Authority not found' };
    const num = Number(rating);
    if (!Number.isFinite(num) || num < 1 || num > 5) return { error: 'Rating must be between 1 and 5' };
    const review = { _id: id(), authority: authorityId, report: report || null, user: userId, rating: num, comment: (comment || '').trim(), createdAt: now(), updatedAt: now() };
    reviews.push(review);
    const total = authority.ratingAvg * authority.ratingCount + num;
    authority.ratingCount += 1;
    authority.ratingAvg = Math.round((total / authority.ratingCount) * 10) / 10;
    return { review: { ...review, user: store.toPublic(users.find(u => u._id === userId) || {}) }, authority };
  },

  // ---- Notifications ----
  createNotification(userId, { type, title, message, link = '', report = null }) {
    if (!userId) return null;
    const n = { _id: id(), user: userId, type, title, message, link, read: false, report, createdAt: now() };
    notifications.push(n);
    return n;
  },
  notifyRoles(roles, payload) {
    users.filter(u => roles.includes(u.role)).forEach(u => store.createNotification(u._id, payload));
  },
  getNotifications(userId, { limit = 50 } = {}) {
    const mine = notifications.filter(n => n.user === userId).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    return { notifications: mine.slice(0, Number(limit) || 50), unreadCount: mine.filter(n => !n.read).length };
  },
  markNotificationRead(notificationId, userId) {
    const n = notifications.find(x => x._id === notificationId && x.user === userId);
    if (!n) return null;
    n.read = true;
    return n;
  },
  markAllNotificationsRead(userId) {
    notifications.filter(n => n.user === userId).forEach(n => { n.read = true; });
    return true;
  },
};

module.exports = store;