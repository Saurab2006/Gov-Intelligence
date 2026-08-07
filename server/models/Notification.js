const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  user:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type:    { type: String, required: true, enum: ['new-report', 'assigned', 'eta-updated', 'verified', 'completed', 'flagged-fake', 'duplicate', 'comment', 'budget-flagged'] },
  title:   { type: String, required: true, trim: true },
  message: { type: String, required: true, trim: true },
  link:    { type: String, default: '' },
  read:    { type: Boolean, default: false },
  report:  { type: mongoose.Schema.Types.ObjectId, ref: 'IncidentReport' },
}, { timestamps: true });

notificationSchema.index({ user: 1, read: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
