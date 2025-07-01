const mongoose = require('mongoose');

const policySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  effectiveDate: {
    type: Date,
    required: true
  },
  expiryDate: {
    type: Date,
    default: null
  },
  documentPath: {
    type: String,
    required: false // Path to uploaded policy document
  },
  documentOriginalName: {
    type: String,
    required: false
  },
  // Extracted policy rules (from document processing)
  dailyLimits: {
    dining: { type: Number, required: true },
    transport: { type: Number, required: true },
    entertainment: { type: Number, required: true },
    shopping: { type: Number, required: true },
    groceries: { type: Number, required: true },
    healthcare: { type: Number, required: true },
    utilities: { type: Number, required: true },
    other: { type: Number, required: true }
  },
  restrictedCategories: [{
    type: String
  }],
  approvalRequired: [{
    type: String
  }],
  status: {
    type: String,
    enum: ['active', 'inactive', 'draft'],
    default: 'active'
  },
  isDeleted: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true,
  versionKey: false
});

// Indexes for efficient queries
policySchema.index({ userId: 1, effectiveDate: -1 });
policySchema.index({ userId: 1, status: 1 });

const Policy = mongoose.model('Policy', policySchema);

module.exports = Policy;