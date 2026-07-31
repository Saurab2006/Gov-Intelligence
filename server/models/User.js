const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name:         { type: String, required: true, trim: true },
  email:        { type: String, required: true, unique: true, lowercase: true, trim: true },
  password:     { type: String, required: true, minlength: 6 },
  role:         { type: String, enum: ['admin', 'analyst', 'researcher'], default: 'analyst' },
  organization: { type: String, default: 'Independent' },
  jobTitle:     { type: String, default: 'Analyst' },
  avatarHue:    { type: Number, default: () => Math.floor(Math.random() * 360) },
  status:       { type: String, enum: ['active', 'suspended'], default: 'active' },
}, { timestamps: true });

userSchema.index({ role: 1, status: 1 });

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

userSchema.methods.toPublic = function () {
  return {
    _id: this._id,
    name: this.name,
    email: this.email,
    role: this.role,
    organization: this.organization,
    jobTitle: this.jobTitle,
    avatarHue: this.avatarHue,
    status: this.status,
    createdAt: this.createdAt,
  };
};

module.exports = mongoose.model('User', userSchema);
