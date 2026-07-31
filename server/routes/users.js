const express = require('express');
const User = require('../models/User');
const Document = require('../models/Document');
const { protect, requireRole } = require('../middleware/auth');

const router = express.Router();

// GET /api/users — admin only
router.get('/', protect, requireRole('admin'), async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    const enriched = await Promise.all(users.map(async u => {
      const docCount = await Document.countDocuments({ user: u._id });
      return { ...u.toPublic(), documentCount: docCount };
    }));
    res.json({ users: enriched });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/users/:id — admin only
router.patch('/:id', protect, requireRole('admin'), async (req, res) => {
  try {
    const { role, status } = req.body;
    const update = {};
    if (role && ['admin', 'analyst', 'researcher'].includes(role)) update.role = role;
    if (status && ['active', 'suspended'].includes(status)) update.status = status;
    const user = await User.findByIdAndUpdate(req.params.id, update, { new: true }).select('-password');
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ user: user.toPublic() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
