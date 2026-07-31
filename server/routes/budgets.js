const express = require('express');
const BudgetItem = require('../models/BudgetItem');
const { protect } = require('../middleware/auth');

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

module.exports = router;
