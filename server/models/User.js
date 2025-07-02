const mongoose = require('mongoose');

const { validatePassword, isPasswordHash } = require('../utils/password.js');
const {randomUUID} = require("crypto");

const schema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    index: true,
    unique: true,
    lowercase: true,
  },
  password: {
    type: String,
    required: true,
    validate: { validator: isPasswordHash, message: 'Invalid password hash' },
  },
  name: {
    type: String,
    default: '',
  },
  accountType: {
    type: String,
    enum: ['personal', 'business'],
    default: 'personal',
  },
  // Business account specific fields
  companyName: {
    type: String,
    required: function() {
      return this.accountType === 'business';
    },
  },
  companySize: {
    type: String,
    enum: ['1-10', '11-50', '51-200', '201-1000', '1000+'],
    required: function() {
      return this.accountType === 'business';
    },
  },
  industry: {
    type: String,
    required: function() {
      return this.accountType === 'business';
    },
  },
  // Add onboarding completion tracking - EXPLICITLY set to false for new users
  onboardingCompleted: {
    type: Boolean,
    default: false,
  },
  onboardingCompletedAt: {
    type: Date,
    default: null,
  },
  // Profile preferences
  preferences: {
    currency: {
      type: String,
      default: 'USD',
      enum: ['USD', 'EUR', 'GBP'],
    },
    dateFormat: {
      type: String,
      default: 'MM/DD/YYYY',
      enum: ['MM/DD/YYYY', 'DD/MM/YYYY', 'YYYY-MM-DD'],
    },
    theme: {
      type: String,
      default: 'light',
      enum: ['light', 'dark', 'auto'],
    },
    notifications: {
      anomalies: {
        type: Boolean,
        default: true,
      },
      policyViolations: {
        type: Boolean,
        default: true,
      },
      dailySummary: {
        type: Boolean,
        default: true,
      },
      weeklyReports: {
        type: Boolean,
        default: true,
      },
      aiCoachTips: {
        type: Boolean,
        default: true,
      },
      dealAlerts: {
        type: Boolean,
        default: true,
      },
    },
  },
  createdAt: {
    type: Date,
    default: Date.now,
    immutable: true,
  },
  lastLoginAt: {
    type: Date,
    default: Date.now,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  refreshToken: {
    type: String,
    unique: true,
    index: true,
    default: () => randomUUID(),
  },
}, {
  versionKey: false,
});

schema.pre('save', function(next) {
  console.log('=== USER MODEL PRE-SAVE ===');
  console.log('User model: About to save user with account type:', this.accountType);
  console.log('User model: Onboarding completed:', this.onboardingCompleted);
  console.log('User model: Full user object being saved:', this.toObject());
  if (this.accountType === 'business') {
    console.log('User model: Business account fields:', {
      companyName: this.companyName,
      companySize: this.companySize,
      industry: this.industry
    });
  }
  console.log('=== END USER MODEL PRE-SAVE ===');
  next();
});

// Fix the toJSON transform to properly exclude sensitive fields
schema.set('toJSON', {
  transform: function(doc, ret, options) {
    // Remove sensitive fields from JSON output
    delete ret.password;
    delete ret.refreshToken;
    return ret;
  }
});

const User = mongoose.model('User', schema);

module.exports = User;