const mongoose = require('mongoose');

const bankAccountSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  bankName: {
    type: String,
    required: true
  },
  accountNumber: {
    type: String,
    required: true
  },
  accountType: {
    type: String,
    enum: ['personal', 'business', 'checking', 'savings'],
    default: 'personal'
  },
  balance: {
    type: Number,
    default: 0
  },
  currency: {
    type: String,
    default: 'USD',
    enum: ['USD', 'EUR', 'GBP']
  },
  status: {
    type: String,
    enum: ['connected', 'disconnected', 'error', 'pending'],
    default: 'pending'
  },
  // Store encrypted credentials (in real implementation, use proper encryption)
  credentials: {
    username: String,
    // Note: In production, this should be properly encrypted
    encryptedPassword: String
  },
  lastSync: {
    type: Date,
    default: Date.now
  },
  syncStatus: {
    type: String,
    enum: ['success', 'failed', 'in_progress'],
    default: 'success'
  },
  // Bank-specific information
  routingNumber: String,
  institutionId: String,
  logo: String,
  // Statement upload tracking
  lastStatementUpload: {
    type: Date,
    default: null
  },
  statementCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true,
  versionKey: false
});

// Virtual field for isConnected
bankAccountSchema.virtual('isConnected').get(function() {
  return this.status === 'connected';
});

// Ensure virtual fields are serialized
bankAccountSchema.set('toJSON', { virtuals: true });
bankAccountSchema.set('toObject', { virtuals: true });

// Index for efficient queries
bankAccountSchema.index({ userId: 1, status: 1 });
bankAccountSchema.index({ userId: 1, bankName: 1 });

const BankAccount = mongoose.model('BankAccount', bankAccountSchema);

module.exports = BankAccount;