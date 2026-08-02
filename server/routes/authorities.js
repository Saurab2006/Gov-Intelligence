const express = require('express');
const Authority = require('../models/Authority');
const Review = require('../models/Review');
const { protect } = require('../middleware/auth');
const { suggestAuthoritiesForArea } = require('../utils/authorityAI');

const router = express.Router();

router.get('/', protect, async (req, res) => {
  try {
    const { district = '' } = req.query;
    const filter = {};
    if (district) filter.district = new RegExp(`^${district.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i');
    const authorities = await Authority.find(filter).sort({ ratingAvg: -1, name: 1 });
    res.json({ authorities });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', protect, async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Only admins can add authorities' });
    const { name, department, district, categories, contactEmail, contactPhone } = req.body;
    if (!name) return res.status(422).json({ error: 'Authority name is required' });
    const authority = await Authority.create({
      name, department: department || '', district: district || '',
      categories: Array.isArray(categories) ? categories : [],
      contactEmail: contactEmail || '', contactPhone: contactPhone || '',
      source: 'admin', createdBy: req.user._id,
    });
    res.status(201).json({ authority });
  } catch (err) {
    if (err.code === 11000) return res.status(409).json({ error: 'That authority already exists for this district' });
    res.status(500).json({ error: err.message });
  }
});

// Rule-based "AI" pass: fills in any authority types this district is
// missing (roads, disaster mgmt, water, electricity, urban dev, ward office).
router.post('/ai-suggest', protect, async (req, res) => {
  try {
    if (!['admin', 'analyst'].includes(req.user.role)) return res.status(403).json({ error: 'Only admins or analysts can run area suggestions' });
    const { district } = req.body;
    if (!district) return res.status(422).json({ error: 'District is required' });
    const existing = await Authority.find({ district: new RegExp(`^${district.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') }).select('name');
    const toCreate = suggestAuthoritiesForArea(district, new Set(existing.map(a => a.name)));
    const created = toCreate.length ? await Authority.insertMany(toCreate.map(a => ({ ...a, createdBy: req.user._id }))) : [];
    res.status(201).json({ created, message: created.length ? `Added ${created.length} authority(ies) for ${district}` : `${district} already has full coverage` });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:id/reviews', protect, async (req, res) => {
  try {
    const reviews = await Review.find({ authority: req.params.id }).sort({ createdAt: -1 }).populate('user', 'name role avatarHue');
    res.json({ reviews });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/:id/reviews', protect, async (req, res) => {
  try {
    const authority = await Authority.findById(req.params.id);
    if (!authority) return res.status(404).json({ error: 'Authority not found' });
    const rating = Number(req.body.rating);
    if (!Number.isFinite(rating) || rating < 1 || rating > 5) return res.status(422).json({ error: 'Rating must be between 1 and 5' });
    const review = await Review.create({ authority: authority._id, report: req.body.report || null, user: req.user._id, rating, comment: (req.body.comment || '').trim() });

    const total = authority.ratingAvg * authority.ratingCount + rating;
    authority.ratingCount += 1;
    authority.ratingAvg = Math.round((total / authority.ratingCount) * 10) / 10;
    await authority.save();

    await review.populate('user', 'name role avatarHue');
    res.status(201).json({ review, authority });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;