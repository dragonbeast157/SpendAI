const mongoose = require('mongoose');

const policyViolationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  policyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Policy',
    required: true
  },
  transactionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Transaction',
    required: false // Some violations might not be tied to specific transactions
  },
  violationType: {
    type: String,
    enum: ['daily_limit', 'monthly_limit', 'restricted_category', 'requires_approval', 'other'],
    required: true
  },
  merchant: {
    type: String,
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  ruleViolated: {
    type: String,
    required: true
  },
  severity: {
    type: String,
    enum: ['Minor', 'Major', 'Critical'],
    default: 'Minor'
  },
  status: {
    type: String,
    enum: ['Needs Review', 'Pending Approval', 'Approved', 'Denied', 'Resolved'],
    default: 'Needs Review'
  },
  justification: {
    type: String,
    default: null
  },
  justificationDate: {
    type: Date,
    default: null
  },
  documents: [{
    type: String // Paths to supporting documents
  }],
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  reviewDate: {
    type: Date,
    default: null
  },
  reviewNotes: {
    type: String,
    default: null
  }
}, {
  timestamps: true,
  versionKey: false
});

// Indexes for efficient queries
policyViolationSchema.index({ userId: 1, date: -1 });
policyViolationSchema.index({ userId: 1, status: 1 });
policyViolationSchema.index({ policyId: 1, status: 1 });

const PolicyViolation = mongoose.model('PolicyViolation', policyViolationSchema);

module.exports = PolicyViolation;