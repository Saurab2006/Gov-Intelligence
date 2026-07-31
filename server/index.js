require('dotenv').config();
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const { connect, getMode } = require('./db');
const store = require('./memstore');

const JWT_SECRET = process.env.JWT_SECRET || 'govinsight-nepal-jwt-secret';

function signToken(user) {
  return jwt.sign({ id: user._id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '30d' });
}

async function protect(req, res, next) {
  const h = req.headers.authorization;
  if (!h || !h.startsWith('Bearer ')) return res.status(401).json({ error: 'Not authenticated' });
  try {
    const decoded = jwt.verify(h.split(' ')[1], JWT_SECRET);
    const user = store.findUserById(decoded.id);
    if (!user || user.status !== 'active') return res.status(401).json({ error: 'Invalid session' });
    req.user = user;
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

const SECTOR_COLORS = { 'Roads & Transport': '#2563EB', Health: '#10B981', Education: '#8B5CF6', 'Drinking Water': '#06B6D4', Agriculture: '#F59E0B', Energy: '#EF4444', 'Urban Development': '#EC4899', 'Disaster Management': '#F97316' };
function shortDept(n) { return n.replace(/^(Ministry|Department) of /, '').split(',')[0]; }

const app = express();
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '12mb' }));

// Health
app.get('/api/health', (_, res) => res.json({ ok: true }));

// ---- AUTH ----
app.post('/api/auth/signup', async (req, res) => {
  try {
    const { name, email, password, role, organization } = req.body;
    if (!name || !email || !password) return res.status(422).json({ error: 'Name, email and password are required' });
    if (password.length < 6) return res.status(422).json({ error: 'Password must be at least 6 characters' });
    const exists = await store.findUserByEmail(email.toLowerCase().trim());
    if (exists) return res.status(409).json({ error: 'An account with this email already exists' });
    const isFirst = store.userCount() === 0;
    const user = await store.createUser({ name: name.trim(), email, password, role: isFirst ? 'admin' : (['analyst', 'researcher'].includes(role) ? role : 'analyst'), organization });
    const token = signToken(user);
    store.seedForUser(user._id);
    res.status(201).json({ user: store.toPublic(user), token });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(422).json({ error: 'Email and password are required' });
    let user = await store.findUserByEmail(email.toLowerCase().trim());
    // Auto-provision demo accounts
    if (!user && email.endsWith('@govinsight.np')) {
      const roleMap = { 'admin@govinsight.np': 'admin', 'analyst@govinsight.np': 'analyst', 'researcher@govinsight.np': 'researcher' };
      const names = { 'admin@govinsight.np': 'Anisha Adhikari', 'analyst@govinsight.np': 'Bikash Thapa', 'researcher@govinsight.np': 'Sunita Rai' };
      const demoRole = roleMap[email] || 'analyst';
      user = await store.createUser({ name: names[email] || 'Demo User', email, password: password, role: demoRole, organization: 'GovInsight Nepal' });
      store.seedForUser(user._id);
    }
    if (!user) return res.status(401).json({ error: 'Incorrect email or password' });
    const valid = await store.comparePassword(user, password);
    if (!valid) return res.status(401).json({ error: 'Incorrect email or password' });
    if (user.status !== 'active') return res.status(403).json({ error: 'Account suspended' });
    const token = signToken(user);
    store.seedForUser(user._id);
    res.json({ user: store.toPublic(user), token });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/auth/me', protect, (req, res) => {
  res.json({ user: store.toPublic(req.user) });
});

// ---- ANALYTICS ----
app.get('/api/analytics', protect, (req, res) => {
  const uid = req.user._id;
  const docs = store.getDocuments(uid);
  const budgets = store.getBudgets(uid);
  const projs = store.getProjects(uid);
  const acts = store.getActivities(uid);

  const totalBudget = docs.reduce((a, d) => a + (d.totalBudget || 0), 0);
  const deptSet = new Set(budgets.map(b => b.department));
  const fys = [...new Set(docs.map(d => d.fiscalYear))].sort();

  const sectorMap = {}; budgets.forEach(b => { sectorMap[b.sector] = (sectorMap[b.sector] || 0) + b.amount; });
  const sectorBreakdown = Object.entries(sectorMap).map(([key, value]) => ({ key, value, color: SECTOR_COLORS[key] || '#2563EB' })).sort((a, b) => b.value - a.value).slice(0, 8);

  const fyMap = {}; budgets.forEach(b => { fyMap[b.fiscalYear] = (fyMap[b.fiscalYear] || 0) + b.amount; });
  const budgetTrend = Object.entries(fyMap).map(([key, value]) => ({ key, value })).sort((a, b) => a.key.localeCompare(b.key));

  const deptMap = {}; budgets.forEach(b => { const k = shortDept(b.department); deptMap[k] = (deptMap[k] || 0) + b.amount; });
  const topDepartments = Object.entries(deptMap).map(([key, value]) => ({ key, value })).sort((a, b) => b.value - a.value).slice(0, 6);

  const distMap = {}; budgets.filter(b => b.district).forEach(b => { distMap[b.district] = (distMap[b.district] || 0) + b.amount; });
  const districts = Object.entries(distMap).map(([key, value]) => ({ key, value })).sort((a, b) => b.value - a.value).slice(0, 8);

  const utilMap = {};
  projs.forEach(p => { const e = utilMap[p.sector] || { key: p.sector, total: 0, utilized: 0 }; e.total += p.budget; if (p.status === 'completed' || p.status === 'ongoing') e.utilized += p.budget; utilMap[p.sector] = e; });
  const utilization = Object.values(utilMap).filter(u => u.total > 0).map(u => ({ ...u, percent: Math.round((u.utilized / u.total) * 100), color: SECTOR_COLORS[u.key] || '#2563EB' })).sort((a, b) => b.total - a.total).slice(0, 6);

  const recentDocuments = docs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 6);

  res.json({
    kpis: { documents: docs.length, totalBudget, departments: deptSet.size, projects: projs.length, latestFy: fys[fys.length - 1] || '—' },
    sectorBreakdown, budgetTrend, topDepartments, districts, utilization, recentDocuments,
    activity: acts.map(a => ({ _id: a._id, type: a.type, message: a.message, createdAt: a.createdAt })),
  });
});

// ---- BUDGETS ----
app.get('/api/budgets', protect, (req, res) => {
  const items = store.filterBudgets(req.user._id, req.query);
  res.json({ items });
});

// ---- DEPARTMENTS ----
app.get('/api/departments', protect, (req, res) => {
  const budgets = store.getBudgets(req.user._id);
  const name = req.query.name;

  const map = {};
  budgets.forEach(b => {
    const key = shortDept(b.department);
    const e = map[key] || { name: key, total: 0, count: 0, sectors: {}, districts: new Set(), byYear: {} };
    e.total += b.amount; e.count++;
    e.sectors[b.sector] = (e.sectors[b.sector] || 0) + b.amount;
    if (b.district) e.districts.add(b.district);
    e.byYear[b.fiscalYear] = (e.byYear[b.fiscalYear] || 0) + b.amount;
    map[key] = e;
  });

  if (!name) {
    const list = Object.values(map).map(e => ({ name: e.name, total: e.total, count: e.count, topSector: Object.entries(e.sectors).sort((a, b) => b[1] - a[1])[0]?.[0] || '—', districts: e.districts.size })).sort((a, b) => b.total - a.total);
    return res.json({ departments: list });
  }

  const entry = map[name];
  if (!entry) return res.json({ department: null });
  const lines = budgets.filter(b => shortDept(b.department) === name).sort((a, b) => b.amount - a.amount).slice(0, 60).map(b => ({ _id: b._id, title: b.title, sector: b.sector, amount: b.amount, fiscalYear: b.fiscalYear, district: b.district, page: b.page, documentId: b.document }));
  res.json({ department: { name, total: entry.total, count: entry.count, districts: entry.districts.size, topSector: Object.entries(entry.sectors).sort((a, b) => b[1] - a[1])[0]?.[0] || '—', sectors: Object.entries(entry.sectors).map(([key, value]) => ({ key, value, color: SECTOR_COLORS[key] || '#2563EB' })).sort((a, b) => b.value - a.value), trend: Object.entries(entry.byYear).map(([key, value]) => ({ key, value })).sort((a, b) => a.key.localeCompare(b.key)), lines } });
});

// ---- USERS (admin) ----
app.get('/api/users', protect, (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
  res.json({ users: store.getAllUsers() });
});

app.patch('/api/users/:id', protect, (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
  const updated = store.updateUser(req.params.id, req.body);
  if (!updated) return res.status(404).json({ error: 'User not found' });
  res.json({ user: updated });
});

const PORT = process.env.PORT || 5000;

async function start() {
  await connect();
  app.listen(PORT, () => console.log(`✓ Express API on :${PORT} (${getMode()} mode)`));
}

start();
