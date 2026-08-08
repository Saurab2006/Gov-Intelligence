const express = require('express');
const User = require('../models/User');
const Document = require('../models/Document');
const { protect, requireRole } = require('../middleware/auth');
const WardUnit = require('../models/WardUnit');
const { accountDecisionEmail } = require('../utils/authEmails');

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
    const { role, status, verificationStatus, wardRepresentativeStatus } = req.body;
    const update = {};
    if (role && ['admin', 'analyst', 'researcher', 'ward_rep'].includes(role)) update.role = role;
    if (status && ['active', 'suspended'].includes(status)) update.status = status;
    if (verificationStatus && ['pending', 'verified', 'rejected'].includes(verificationStatus)) { update.verificationStatus = verificationStatus; if (verificationStatus === 'rejected') update.status = 'suspended'; }
        const before = await User.findById(req.params.id);
    if (wardRepresentativeStatus && ['approved', 'rejected'].includes(wardRepresentativeStatus)) {
      update['wardRepresentativeApplication.status'] = wardRepresentativeStatus;
      update['wardRepresentativeApplication.reviewedAt'] = new Date();
      if (wardRepresentativeStatus === 'approved') {
        update.role = 'ward_rep';
        update.status = 'active';
        update.verificationStatus = 'verified';
      } else {
        update.status = 'suspended';
        update.verificationStatus = 'rejected';
      }
    }
    const user = await User.findByIdAndUpdate(req.params.id, update, { new: true }).select('-password');
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ user: user.toPublic() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/users/:id/citizenship-doc — admin/analyst only. Lets staff verify
// a citizen's identity, e.g. before/after flagging one of their reports as fake.
router.get('/:id/citizenship-doc', protect, requireRole('admin', 'analyst'), async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('citizenshipDoc citizenshipDocName name verificationStatus');
    if (!user) return res.status(404).json({ error: 'User not found' });
    if (!user.citizenshipDoc) return res.status(404).json({ error: 'No citizenship document on file' });
    res.json({ citizenshipDoc: user.citizenshipDoc, citizenshipDocName: user.citizenshipDocName, name: user.name, verificationStatus: user.verificationStatus });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;