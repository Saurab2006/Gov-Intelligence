const express = require('express');
const BudgetItem = require('../models/BudgetItem');
const Activity = require('../models/Activity');
const ChangeRequest = require('../models/ChangeRequest');
const { protect, requireRole } = require('../middleware/auth');

const router = express.Router();

router.get('/', protect, async (req, res) => {
  try {
    const filter = { user: req.user._id };
    if (req.query.sector && req.query.sector !== 'all') filter.sector = req.query.sector;
    if (req.query.fiscalYear && req.query.fiscalYear !== 'all') filter.fiscalYear = req.query.fiscalYear;
    if (req.query.q) filter.title = { $regex: req.query.q, $options: 'i' };

    const items = await BudgetItem.find(filter).sort({ amount: -1 }).limit(Number(req.query.limit) || 100).populate('document', 'title');
    res.json({
      items: items.map(i => ({
        _id: i._id, title: i.title, department: i.department, sector: i.sector,
        amount: i.amount, fiscalYear: i.fiscalYear, district: i.district, page: i.page,
        confidence: i.confidence, documentId: i.document?._id, documentTitle: i.document?.title,
      })),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/changes', protect, async (req, res) => {
  try {
    const filter = req.user.role === 'admin' ? {} : { requestedBy: req.user._id };
    if (req.query.status && req.query.status !== 'all') filter.status = req.query.status;

    const changes = await ChangeRequest.find(filter)
      .sort({ createdAt: -1 })
      .limit(Number(req.query.limit) || 100)
      .populate('budgetItem', 'title amount department sector fiscalYear district')
      .populate('requestedBy', 'name email role')
      .populate('reviewedBy', 'name email role');

    res.json({ changes });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/:id/changes', protect, requireRole('analyst'), async (req, res) => {
  try {
    const budgetItem = await BudgetItem.findOne({ _id: req.params.id, user: req.user._id });
    if (!budgetItem) return res.status(404).json({ error: 'Budget item not found' });

    const allowed = ['title', 'department', 'sector', 'amount', 'fiscalYear', 'district'];
    const proposed = {};
    allowed.forEach(key => {
      if (req.body[key] !== undefined && req.body[key] !== '') proposed[key] = req.body[key];
    });

    if (proposed.amount !== undefined) {
      proposed.amount = Number(proposed.amount);
      if (!Number.isFinite(proposed.amount) || proposed.amount < 0) {
        return res.status(422).json({ error: 'Amount must be a valid positive number' });
      }
    }

    if (Object.keys(proposed).length === 0) {
      return res.status(422).json({ error: 'Add at least one proposed change' });
    }

    const change = await ChangeRequest.create({
      user: budgetItem.user,
      budgetItem: budgetItem._id,
      requestedBy: req.user._id,
      reason: req.body.reason || '',
      proposed,
    });

    await Activity.create({ user: req.user._id, type: 'change-request', message: `Proposed a budget update for "${budgetItem.title}"` });
    res.status(201).json({ change });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/changes/:id', protect, requireRole('admin'), async (req, res) => {
  try {
    const { status } = req.body;
    if (!['approved', 'rejected'].includes(status)) return res.status(422).json({ error: 'Status must be approved or rejected' });

    const change = await ChangeRequest.findById(req.params.id).populate('budgetItem');
    if (!change) return res.status(404).json({ error: 'Change request not found' });
    if (change.status !== 'pending') return res.status(409).json({ error: 'Change request already reviewed' });

    change.status = status;
    change.reviewedBy = req.user._id;
    change.reviewedAt = new Date();
    await change.save();

    if (status === 'approved') {
      await BudgetItem.findByIdAndUpdate(change.budgetItem._id, change.proposed, { new: true });
      await Activity.create({ user: change.user, type: 'approval', message: `Approved budget update for "${change.budgetItem.title}"` });
    } else {
      await Activity.create({ user: change.user, type: 'approval', message: `Rejected budget update for "${change.budgetItem.title}"` });
    }

    res.json({ change });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
