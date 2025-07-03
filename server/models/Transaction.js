const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  bankAccountId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'BankAccount',
    required: false // Some transactions might be manually created
  },
  amount: {
    type: Number,
    required: true
  },
  date: {
    type: Date,
    required: true,
    index: true
  },
  merchant: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  category: {
    type: String,
    enum: ['dining', 'transport', 'shopping', 'groceries', 'entertainment', 'healthcare', 'utilities', 'salary', 'wage', 'income', 'refund', 'deposit', 'transfer-in', 'other'],
    default: 'other'
  },
  location: {
    type: String,
    default: 'Unknown'
  },
  // Anomaly detection fields
  hasAnomaly: {
    type: Boolean,
    default: false
  },
  anomalyReason: {
    type: String,
    default: null
  },
  anomalyComparison: {
    type: String,
    default: null
  },
  // Voice note fields
  hasNote: {
    type: Boolean,
    default: false
  },
  voiceNote: {
    audioData: String,
    transcript: String,
    recordedAt: Date
  },
  // Policy compliance fields
  policyStatus: {
    type: String,
    enum: ['compliant', 'warning', 'violation'],
    default: 'compliant'
  },
  policyRule: {
    type: String,
    default: null
  },
  policyJustification: {
    type: String,
    default: null
  },
  // Original bank transaction data
  originalDescription: String,
  // Remove transactionType field entirely since amount sign indicates type
  // Status tracking
  isDeleted: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true,
  versionKey: false
});

// Indexes for efficient queries
transactionSchema.index({ userId: 1, date: -1 });
transactionSchema.index({ userId: 1, category: 1 });
transactionSchema.index({ userId: 1, hasAnomaly: 1 });
transactionSchema.index({ userId: 1, policyStatus: 1 });
transactionSchema.index({ userId: 1, amount: 1 }); // Add index for amount-based queries

const Transaction = mongoose.model('Transaction', transactionSchema);

module.exports = Transaction;