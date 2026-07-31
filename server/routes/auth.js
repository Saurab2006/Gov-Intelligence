const express = require('express');
const User = require('../models/User');
const { signToken } = require('../utils/token');
const { protect } = require('../middleware/auth');
const { seedForUser } = require('../utils/seed');

const router = express.Router();

// POST /api/auth/signup
router.post('/signup', async (req, res) => {
  try {
    const { name, email, password, role, organization } = req.body;
    if (!name || !email || !password) return res.status(422).json({ error: 'Name, email and password are required' });
    if (password.length < 6) return res.status(422).json({ error: 'Password must be at least 6 characters' });

    const exists = await User.findOne({ email: email.toLowerCase().trim() });
    if (exists) return res.status(409).json({ error: 'An account with this email already exists' });

    const isFirst = (await User.countDocuments()) === 0;
    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password,
      role: isFirst ? 'admin' : (['analyst', 'researcher'].includes(role) ? role : 'researcher'),
      organization: organization || 'Independent',
    });

    const token = signToken(user);
    await seedForUser(user._id);
    res.status(201).json({ user: user.toPublic(), token });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(422).json({ error: 'Email and password are required' });

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ error: 'Incorrect email or password' });
    }
    if (user.status !== 'active') return res.status(403).json({ error: 'Account suspended' });

    const token = signToken(user);
    await seedForUser(user._id);
    res.json({ user: user.toPublic(), token });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/auth/me
router.get('/me', protect, (req, res) => {
  res.json({ user: req.user.toPublic() });
});

module.exports = router;
