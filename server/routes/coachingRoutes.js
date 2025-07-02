const express = require('express');
const CoachingService = require('../services/coachingService');
const { requireUser } = require('./middleware/auth');

const router = express.Router();

// Get AI financial advice
router.post('/advice', requireUser, async (req, res) => {
  try {
    console.log('=== COACHING ROUTES: /advice CALLED ===');
    console.log('Backend: Request body:', req.body);
    console.log('Backend: Request user:', req.user._id);
    console.log('Backend: User account type:', req.user.accountType);
    console.log('Backend: Generating AI advice for user:', req.user._id);
    console.log('Backend: Request data:', req.body);

    const { message, context, includeGoals } = req.body;

    const options = {
      context,
      specificQuestion: message,
      includeGoals: includeGoals !== false
    };

    console.log('Backend: Calling CoachingService.generateAdvice with options:', options);
    const advice = await CoachingService.generateAdvice(
      req.user._id,
      req.user.accountType,
      options
    );

    console.log('Backend: AI advice generated successfully');
    console.log('Backend: Advice structure:', {
      hasResponse: 'response' in advice,
      responseType: typeof advice.response,
      hasSuggestions: 'suggestions' in advice,
      suggestionsCount: advice.suggestions?.length || 0,
      hasActions: 'actions' in advice,
      actionsCount: advice.actions?.length || 0
    });
    console.log('Backend: Full advice object:', advice);
    
    const responseData = {
      success: true,
      ...advice
    };
    console.log('Backend: Sending response:', responseData);
    
    return res.status(200).json(responseData);
  } catch (error) {
    console.error('=== COACHING ROUTES: ERROR IN /advice ===');
    console.error('Backend: Error generating AI advice:', error.message);
    console.error('Backend: Error stack:', error.stack);
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Get conversation starters based on user data
router.get('/starters', requireUser, async (req, res) => {
  try {
    console.log('Backend: Getting conversation starters for user:', req.user._id);

    const { accountType } = req.query;
    const userAccountType = accountType || req.user.accountType;

    const personalStarters = [
      "How can I reduce my dining expenses?",
      "Am I on track for my savings goal?",
      "What's my biggest spending category?",
      "Show me ways to save money",
      "Analyze my spending patterns"
    ];

    const businessStarters = [
      "How can I stay compliant with company policy?",
      "What are my most common policy violations?",
      "Find policy-compliant alternatives for dining",
      "Help me justify this business expense",
      "Show me compliant vendors in my area"
    ];

    const starters = userAccountType === 'business' ? businessStarters : personalStarters;

    console.log('Backend: Returning', starters.length, 'conversation starters');
    return res.status(200).json({
      success: true,
      starters
    });
  } catch (error) {
    console.error('Backend: Error getting conversation starters:', error.message);
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;