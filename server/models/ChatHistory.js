const mongoose = require('mongoose');

const chatHistorySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  message: {
    type: String,
    required: true
  },
  response: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['user', 'ai'],
    required: true
  },
  category: {
    type: String,
    enum: ['general', 'savings', 'investment', 'debt', 'spending', 'policy'],
    default: 'general'
  },
  context: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  },
  suggestions: [{
    type: String
  }],
  actions: [{
    type: {
      type: String
    },
    label: String,
    data: mongoose.Schema.Types.Mixed
  }],
  potentialSavings: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true,
  versionKey: false
});

// Indexes for efficient queries
chatHistorySchema.index({ userId: 1, createdAt: -1 });
chatHistorySchema.index({ userId: 1, category: 1 });

const ChatHistory = mongoose.model('ChatHistory', chatHistorySchema);

module.exports = ChatHistory;