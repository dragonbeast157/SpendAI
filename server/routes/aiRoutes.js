const express = require('express');
const CoachingService = require('../services/coachingService');
const ChatHistory = require('../models/ChatHistory');
const { requireUser } = require('./middleware/auth');

const router = express.Router();

// Get chat history
router.get('/chat-history', requireUser, async (req, res) => {
  try {
    console.log('AI Routes: Getting chat history for user:', req.user._id);
    
    const history = await CoachingService.getChatHistory(req.user._id);
    
    console.log('AI Routes: Retrieved', history.length, 'chat history entries');
    return res.status(200).json({
      success: true,
      messages: history
    });
  } catch (error) {
    console.error('AI Routes: Error getting chat history:', error.message);
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Clear chat history
router.delete('/chat-history', requireUser, async (req, res) => {
  try {
    console.log('AI Routes: Clearing chat history for user:', req.user._id);
    
    const result = await ChatHistory.deleteMany({ userId: req.user._id });
    
    console.log('AI Routes: Deleted', result.deletedCount, 'chat history entries');
    return res.status(200).json({
      success: true,
      message: 'Chat history cleared successfully',
      deletedCount: result.deletedCount
    });
  } catch (error) {
    console.error('AI Routes: Error clearing chat history:', error.message);
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Get conversation starters
router.get('/conversation-starters', requireUser, async (req, res) => {
  try {
    console.log('AI Routes: Getting conversation starters for user:', req.user._id);
    console.log('AI Routes: Query params:', req.query);
    
    const { accountType } = req.query;
    console.log('AI Routes: Account type from query:', accountType);
    console.log('AI Routes: User account type:', req.user.accountType);
    
    const userAccountType = accountType || req.user.accountType;
    console.log('AI Routes: Using account type:', userAccountType);

    const starters = await CoachingService.generateConversationStarters(req.user._id, userAccountType);
    
    console.log('AI Routes: Generated', starters.length, 'conversation starters');
    console.log('AI Routes: Starters:', starters);
    
    return res.status(200).json({
      success: true,
      starters
    });
  } catch (error) {
    console.error('AI Routes: Error getting conversation starters:', error.message);
    console.error('AI Routes: Error stack:', error.stack);
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Get financial advice
router.post('/financial-advice', requireUser, async (req, res) => {
  try {
    console.log('AI Routes: Getting financial advice for user:', req.user._id);
    console.log('AI Routes: Request body:', req.body);
    
    const advice = await CoachingService.generateCategorizedAdvice(
      req.user._id,
      req.user.accountType,
      req.body
    );
    
    console.log('AI Routes: Financial advice generated successfully');
    return res.status(200).json({
      success: true,
      ...advice
    });
  } catch (error) {
    console.error('AI Routes: Error getting financial advice:', error.message);
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;