const jwt = require('jsonwebtoken');

function signToken(user) {
  return jwt.sign(
    { id: user._id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '30d' },
  );
}

module.exports = { signToken };
