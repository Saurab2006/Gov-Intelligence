/**
 * In-memory document store that mirrors the Mongoose model API just enough
 * for all the routes to work unchanged. Data persists for the process lifetime.
 */
const crypto = require('crypto');
const bcrypt = require('bcryptjs');

function id() { return crypto.randomBytes(12).toString('hex'); }
function now() { return new Date().toISOString(); }

// ---- stores ----
const users = [];
const documents = [];
const budgetItems = [];
const projects = [];
const activities = [];
const changeRequests = [];

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

function seedForUser(userId) {
  const existingDocs = documents.filter(d => d.user === userId);
  if (existingDocs.length >= 6) return 0;

  const r = rng(userId.charCodeAt(0) * 31 + Date.now() % 10000);
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
    const u = { _id: id(), name, email: email.toLowerCase().trim(), password: hashed, role, organization: organization || 'Independent', jobTitle: role === 'admin' ? 'Administrator' : 'Analyst', avatarHue: Math.floor(Math.random() * 360), status: 'active', createdAt: now() };
    users.push(u);
    return u;
  },
  async comparePassword(user, candidate) { return bcrypt.compare(candidate, user.password); },
  userCount() { return users.length; },
  toPublic(u) { const { password, ...rest } = u; return rest; },

  // Seed
  seedForUser,

  // Analytics
  getDocuments(userId) { return documents.filter(d => d.user === userId); },
  getBudgets(userId) { return budgetItems.filter(b => b.user === userId); },
  getProjects(userId) { return projects.filter(p => p.user === userId); },
  getActivities(userId) { return activities.filter(a => a.user === userId).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5); },
  filterBudgets(userId, { q, sector, fiscalYear, limit = 100 }) {
    let result = budgetItems.filter(b => b.user === userId);
    if (q) { const re = new RegExp(q, 'i'); result = result.filter(b => re.test(b.title)); }
    if (sector && sector !== 'all') result = result.filter(b => b.sector === sector);
    if (fiscalYear && fiscalYear !== 'all') result = result.filter(b => b.fiscalYear === fiscalYear);
    return result.sort((a, b) => b.amount - a.amount).slice(0, limit).map(b => {
      const doc = documents.find(d => d._id === b.document);
      return { ...b, documentId: doc?._id, documentTitle: doc?.title };
    });
  },

  createBudgetChange(userId, budgetItemId, requestedBy, proposed, reason) {
    const item = budgetItems.find(b => b._id === budgetItemId && b.user === userId);
    if (!item) return null;
    const change = {
      _id: id(),
      user: userId,
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
    const item = budgetItems.find(b => b._id === change.budgetItem);
    if (!item) return null;
    change.status = status;
    change.reviewedBy = reviewerId;
    change.reviewedAt = now();
    change.updatedAt = now();
    if (status === 'approved') Object.assign(item, change.proposed, { updatedAt: now() });
    activities.push({ _id: id(), user: change.user, type: 'approval', message: `${status === 'approved' ? 'Approved' : 'Rejected'} budget update for "${item.title}"`, createdAt: now() });
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
};

module.exports = store;
