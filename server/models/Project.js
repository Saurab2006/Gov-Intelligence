const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
  user:       { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  document:   { type: mongoose.Schema.Types.ObjectId, ref: 'Document', required: true },
  name:       { type: String, required: true },
  sector:     { type: String, required: true },
  status:     { type: String, enum: ['planned', 'ongoing', 'completed', 'delayed'], default: 'planned' },
  budget:     { type: Number, default: 0 },
  district:   { type: String },
  fiscalYear: { type: String },
}, { timestamps: true });

projectSchema.index({ user: 1, sector: 1, status: 1 });
projectSchema.index({ user: 1, fiscalYear: 1 });

module.exports = mongoose.model('Project', projectSchema);
