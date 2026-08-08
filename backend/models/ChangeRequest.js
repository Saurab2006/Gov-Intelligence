const mongoose = require('mongoose');

const changeRequestSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  budgetItem: { type: mongoose.Schema.Types.ObjectId, ref: 'BudgetItem', default: null },
  type: { type: String, enum: ['update', 'create'], default: 'update' },
  requestedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  reason: { type: String, trim: true },
  proposed: {
    title: { type: String, trim: true },
    department: { type: String, trim: true },
    sector: { type: String, trim: true },
    amount: { type: Number },
    fiscalYear: { type: String, trim: true },
    district: { type: String, trim: true },
    municipality: { type: String, trim: true },
    ward: { type: String, trim: true },
    document: { type: mongoose.Schema.Types.ObjectId, ref: 'Document' },
  },
  reviewedAt: { type: Date },
}, { timestamps: true });

changeRequestSchema.index({ status: 1, createdAt: -1 });
changeRequestSchema.index({ requestedBy: 1, createdAt: -1 });
changeRequestSchema.index({ budgetItem: 1, status: 1 });

module.exports = mongoose.model('ChangeRequest', changeRequestSchema);
