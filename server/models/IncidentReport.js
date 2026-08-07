const mongoose = require('mongoose');

const timelineEntrySchema = new mongoose.Schema({
  action:  { type: String, required: true },
  note:    { type: String, default: '' },
  by:      { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  at:      { type: Date, default: Date.now },
}, { _id: false });

const commentSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  text: { type: String, required: true, trim: true, maxlength: 1000 },
  createdAt: { type: Date, default: Date.now },
}, { _id: true });

const incidentReportSchema = new mongoose.Schema({
  title:       { type: String, required: true, trim: true },
  category:    { type: String, required: true, enum: ['flood', 'road-damage', 'tunnel-blockage', 'bridge-damage', 'landslide', 'drainage', 'electrical', 'water-supply', 'other'] },
  description: { type: String, required: true, trim: true },
  severity:    { type: String, enum: ['low', 'medium', 'high', 'critical'], default: 'medium' },

  location: {
    address:      { type: String, trim: true },
    district:     { type: String, trim: true },
    municipality: { type: String, trim: true },
    ward:         { type: String, trim: true },
    lat:          { type: Number },
    lng:          { type: Number },
  },

  reportedBy:      { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  reporterContact: { type: String, trim: true, default: '' },
  photo:           { type: String, default: '' },
  photoName:       { type: String, trim: true, default: '' },
  viaSms:          { type: Boolean, default: false },
  upvotes:         [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  comments:        [commentSchema],

  status: {
    type: String,
    enum: ['pending', 'verified', 'assigned', 'in-progress', 'completed', 'rejected', 'duplicate'],
    default: 'pending',
  },

  estimatedDays: { type: Number, default: 3 },
  dueDate:       { type: Date },
  completedAt:   { type: Date },

  assignedDepartment: { type: String, trim: true, default: '' },
  assignedContact:    { type: String, trim: true, default: '' },
  assignedBy:          { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

  isFake:     { type: Boolean, default: false },
  fakeReason: { type: String, trim: true, default: '' },

  duplicateOf:   { type: mongoose.Schema.Types.ObjectId, ref: 'IncidentReport', default: null },
  confirmations: { type: Number, default: 1 },

  timeline: [timelineEntrySchema],
}, { timestamps: true });

incidentReportSchema.index({ status: 1, createdAt: -1 });
incidentReportSchema.index({ category: 1, 'location.district': 1 });
incidentReportSchema.index({ reportedBy: 1, createdAt: -1 });
incidentReportSchema.index({ duplicateOf: 1 });

module.exports = mongoose.model('IncidentReport', incidentReportSchema);
