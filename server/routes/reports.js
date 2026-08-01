const express = require('express');
const IncidentReport = require('../models/IncidentReport');
const Notification = require('../models/Notification');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

const router = express.Router();

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
  'Department of Roads', 'Municipal Ward Office', 'Disaster Management Authority',
  'Water Supply & Sewerage Corporation', 'Urban Development Dept', 'Electricity Authority',
];

function estimateDays(category, severity) {
  const spec = REPORT_CATEGORIES.find(c => c.value === category) || REPORT_CATEGORIES[REPORT_CATEGORIES.length - 1];
  const factor = { critical: 0.5, high: 0.75, medium: 1, low: 1.3 }[severity] ?? 1;
  return Math.max(1, Math.round(spec.baseDays * factor));
}
function addDays(days) { const d = new Date(); d.setDate(d.getDate() + Number(days || 0)); return d; }
function normalizeText(s) { return (s || '').toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(Boolean); }
function textOverlap(a, b) {
  const wa = new Set(normalizeText(a)), wb = new Set(normalizeText(b));
  if (wa.size === 0 || wb.size === 0) return 0;
  let shared = 0; wa.forEach(w => { if (wb.has(w)) shared++; });
  return shared / Math.min(wa.size, wb.size);
}

async function findDuplicateCandidate(category, location) {
  const cutoff = new Date(Date.now() - 21 * 24 * 60 * 60 * 1000);
  const candidates = await IncidentReport.find({
    category, duplicateOf: null, status: { $nin: ['completed', 'rejected'] },
    'location.district': new RegExp(`^${(location.district || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i'),
    createdAt: { $gt: cutoff },
  });
  return candidates.find(r => textOverlap(r.location.address, location.address) >= 0.4) || null;
}

async function notifyRoles(roles, payload) {
  const recipients = await User.find({ role: { $in: roles } }).select('_id');
  await Notification.insertMany(recipients.map(u => ({ user: u._id, ...payload })));
}
async function notifyReporters(report, payload) {
  const linked = await IncidentReport.find({ $or: [{ _id: report._id }, { duplicateOf: report._id }] }).select('reportedBy');
  await Notification.insertMany(linked.map(r => ({ user: r.reportedBy, ...payload, report: report._id })));
}

router.get('/meta', protect, (req, res) => res.json({ categories: REPORT_CATEGORIES, authorities: REPORT_AUTHORITIES }));

router.get('/stats', protect, async (req, res) => {
  try {
    const filter = req.user.role === 'researcher' ? { reportedBy: req.user._id } : {};
    const [total, pending, completed, flagged, duplicates, active] = await Promise.all([
      IncidentReport.countDocuments(filter),
      IncidentReport.countDocuments({ ...filter, status: 'pending' }),
      IncidentReport.countDocuments({ ...filter, status: 'completed' }),
      IncidentReport.countDocuments({ ...filter, isFake: true }),
      IncidentReport.countDocuments({ ...filter, duplicateOf: { $ne: null } }),
      IncidentReport.countDocuments({ ...filter, status: { $nin: ['completed', 'rejected', 'duplicate'] } }),
    ]);
    res.json({ total, pending, completed, flagged, duplicates, active });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/', protect, async (req, res) => {
  try {
    const { status = 'all', category = 'all', district = '', mine, flagged } = req.query;
    const filter = {};
    if (req.user.role === 'researcher' || mine === 'true') filter.reportedBy = req.user._id;
    if (status !== 'all') filter.status = status;
    if (category !== 'all') filter.category = category;
    if (district) filter['location.district'] = new RegExp(district, 'i');
    if (flagged === 'true') filter.isFake = true;
    const items = await IncidentReport.find(filter).sort({ createdAt: -1 }).limit(200)
      .populate('reportedBy', 'name email role organization avatarHue')
      .populate('timeline.by', 'name email role avatarHue');
    res.json({ reports: items });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', protect, async (req, res) => {
  try {
    const { title, category, description, severity, location, reporterContact } = req.body;
    const spec = REPORT_CATEGORIES.find(c => c.value === category);
    if (!spec) return res.status(422).json({ error: 'Unknown category' });
    if (!title || !description || !location?.address) return res.status(422).json({ error: 'Title, description and address are required' });

    const dup = await findDuplicateCandidate(category, location);
    const days = estimateDays(category, severity);

    const report = await IncidentReport.create({
      title, category, description, severity: severity || 'medium', location, reporterContact,
      reportedBy: req.user._id,
      status: dup ? 'duplicate' : 'pending',
      estimatedDays: dup ? dup.estimatedDays : days,
      dueDate: dup ? dup.dueDate : addDays(days),
      assignedDepartment: dup ? dup.assignedDepartment : '',
      assignedContact: dup ? dup.assignedContact : '',
      duplicateOf: dup ? dup._id : null,
      timeline: [{ action: dup ? 'reported (matched to existing issue)' : 'reported', note: dup ? `Linked to an existing report: "${dup.title}"` : `AI-suggested resolution window: ${days} day(s)`, by: req.user._id }],
    });

    if (dup) {
      dup.confirmations += 1;
      dup.timeline.push({ action: 'duplicate-confirmed', note: `Another citizen reported the same issue (${dup.confirmations} reports total)`, by: req.user._id });
      await dup.save();
      if (dup.assignedBy) await Notification.create({ user: dup.assignedBy, type: 'duplicate', title: 'Another report on an active issue', message: `"${dup.title}" now has ${dup.confirmations} citizen reports.`, link: `/issues/${dup._id}`, report: dup._id });
    } else {
      await notifyRoles(['admin', 'analyst'], { type: 'new-report', title: 'New community report', message: `${title} — ${location.address}${location.district ? ', ' + location.district : ''}`, link: `/issues/${report._id}`, report: report._id });
    }
    res.status(201).json({ report });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:id', protect, async (req, res) => {
  try {
    const report = await IncidentReport.findById(req.params.id).populate('reportedBy', 'name email role organization avatarHue').populate('timeline.by', 'name email role avatarHue');
    if (!report) return res.status(404).json({ error: 'Report not found' });
    if (req.user.role === 'researcher' && String(report.reportedBy._id) !== String(req.user._id)) return res.status(404).json({ error: 'Report not found' });
    const duplicates = await IncidentReport.find({ duplicateOf: report._id }).populate('reportedBy', 'name email role avatarHue');
    res.json({ report: { ...report.toObject(), duplicates } });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.patch('/:id', protect, async (req, res) => {
  try {
    if (!['admin', 'analyst'].includes(req.user.role)) return res.status(403).json({ error: 'Only analysts or admins can manage reports' });
    const report = await IncidentReport.findById(req.params.id);
    if (!report) return res.status(404).json({ error: 'Report not found' });
    const { action, ...payload } = req.body;

    if (action === 'verify') {
      report.status = 'verified';
      report.timeline.push({ action: 'verified', note: payload.note || 'Confirmed as a genuine issue', by: req.user._id });
      await notifyReporters(report, { type: 'verified', title: 'Your report was verified', message: `"${report.title}" has been confirmed and is being reviewed.` });
    } else if (action === 'assign') {
      if (!payload.assignedDepartment) return res.status(422).json({ error: 'Choose an authority to assign this to' });
      report.assignedDepartment = payload.assignedDepartment;
      report.assignedContact = payload.assignedContact || '';
      report.assignedBy = req.user._id;
      report.status = 'assigned';
      report.timeline.push({ action: 'assigned', note: `Handed to ${payload.assignedDepartment}${payload.assignedContact ? ` (${payload.assignedContact})` : ''}`, by: req.user._id });
      await notifyReporters(report, { type: 'assigned', title: 'Your report was assigned', message: `"${report.title}" was assigned to ${payload.assignedDepartment}.` });
    } else if (action === 'set-eta') {
      const days = Number(payload.estimatedDays);
      if (!Number.isFinite(days) || days <= 0) return res.status(422).json({ error: 'Enter a valid number of days' });
      report.estimatedDays = days;
      report.dueDate = addDays(days);
      if (report.status === 'pending') report.status = 'verified';
      report.timeline.push({ action: 'eta-updated', note: `Analyst revised the estimate to ${days} day(s)${payload.note ? ` — ${payload.note}` : ''}`, by: req.user._id });
      await notifyReporters(report, { type: 'eta-updated', title: 'Estimated completion updated', message: `"${report.title}" is now expected to be resolved in ${days} day(s).` });
    } else if (action === 'start') {
      report.status = 'in-progress';
      report.timeline.push({ action: 'in-progress', note: payload.note || 'Work has started on site', by: req.user._id });
      await notifyReporters(report, { type: 'eta-updated', title: 'Work has started', message: `Crews have started work on "${report.title}".` });
    } else if (action === 'complete') {
      report.status = 'completed';
      report.completedAt = new Date();
      report.timeline.push({ action: 'completed', note: payload.note || 'Marked complete by analyst', by: req.user._id });
      await notifyReporters(report, { type: 'completed', title: 'Issue resolved', message: `Good news — "${report.title}" has been marked complete.` });
      await notifyRoles(['admin'], { type: 'completed', title: 'Report closed', message: `${req.user.name} closed "${report.title}".`, link: `/issues/${report._id}`, report: report._id });
    } else if (action === 'mark-fake') {
      if (!payload.reason) return res.status(422).json({ error: 'Give a reason so it can be reviewed later' });
      report.isFake = true;
      report.fakeReason = payload.reason;
      report.status = 'rejected';
      report.timeline.push({ action: 'flagged-fake', note: payload.reason, by: req.user._id });
      await Notification.create({ user: report.reportedBy, type: 'flagged-fake', title: 'Your report was closed', message: `"${report.title}" was reviewed and closed: ${payload.reason}`, link: `/issues/${report._id}`, report: report._id });
    } else if (action === 'mark-duplicate') {
      const target = await IncidentReport.findById(payload.duplicateOf);
      if (!target || String(target._id) === String(report._id)) return res.status(422).json({ error: 'Pick a valid original report' });
      report.duplicateOf = target._id;
      report.status = 'duplicate';
      target.confirmations += 1;
      await target.save();
      report.timeline.push({ action: 'marked-duplicate', note: `Merged into "${target.title}"`, by: req.user._id });
      await Notification.create({ user: report.reportedBy, type: 'duplicate', title: 'Report merged', message: `Your report was merged with an existing one: "${target.title}", which is already being tracked.`, link: `/issues/${target._id}`, report: target._id });
    } else {
      return res.status(422).json({ error: 'Unknown action' });
    }

    await report.save();
    res.json({ report });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;