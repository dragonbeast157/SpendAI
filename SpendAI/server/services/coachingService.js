const Transaction = require('../models/Transaction');
const AnalysisService = require('./analysisService');
const { sendLLMRequest } = require('./llmService');

class CoachingService {

  static async generateAdvice(userId, userAccountType, options = {}) {
    console.log('CoachingService: Generating advice for user:', userId);

    try {
      const { context, specificQuestion, includeGoals = true } = options;

      // Gather user data
      const userData = await this.gatherUserData(userId);
      
      // Generate advice based on data
      const advice = await this.generatePersonalizedAdvice(userData, userAccountType, specificQuestion, context);

      console.log('CoachingService: Advice generated successfully');
      return advice;
    } catch (error) {
      console.error('CoachingService: Error generating advice:', error.message);
      throw new Error(`Failed to generate financial advice: ${error.message}`);
    }
  }

  static async gatherUserData(userId) {
    console.log('CoachingService: Gathering user data for analysis');

    try {
      // Get recent transactions (last 3 months)
      const now = new Date();
      const threeMonthsAgo = new Date(now);
      threeMonthsAgo.setMonth(now.getMonth() - 3);

      const recentTransactions = await Transaction.find({
        userId,
        isDeleted: false,
        date: { $gte: threeMonthsAgo }
      }).sort({ date: -1 }).lean();

      // Get category analysis
      const categoryAnalysis = await AnalysisService.getCategoryAnalysis(userId, {
        dateRange: 'this-month'
      });

      // Get anomalies
      const anomalies = await AnalysisService.detectAnomalies(userId, {
        dateRange: 'this-month'
      });

      // Calculate spending trends
      const monthlySpending = await this.calculateMonthlyTrends(userId);

      return {
        recentTransactions: recentTransactions.slice(0, 50), // Limit for AI processing
        categoryAnalysis,
        anomalies,
        monthlySpending,
        totalTransactions: recentTransactions.length,
        averageMonthlySpending: monthlySpending.average
      };
    } catch (error) {
      console.error('CoachingService: Error gathering user data:', error.message);
      throw error;
    }
  }

  static async generatePersonalizedAdvice(userData, userAccountType, specificQuestion, context) {
    console.log('CoachingService: Generating personalized advice using AI');

    try {
      // Prepare prompt for AI
      const prompt = this.buildAdvicePrompt(userData, userAccountType, specificQuestion, context);

      // Use LLM service to generate advice
      let response;
      try {
        // Try OpenAI first
        response = await sendLLMRequest('openai', 'gpt-3.5-turbo', prompt);
      } catch (openAIError) {
        console.log('CoachingService: OpenAI failed, trying Anthropic:', openAIError.message);
        try {
          response = await sendLLMRequest('anthropic', 'claude-3-haiku-20240307', prompt);
        } catch (anthropicError) {
          console.error('CoachingService: Both AI services failed:', anthropicError.message);
          // Fallback to rule-based advice
          response = this.generateRuleBasedAdvice(userData, userAccountType);
        }
      }

      // Parse and structure the response
      return this.structureAdviceResponse(response, userData);
    } catch (error) {
      console.error('CoachingService: Error generating personalized advice:', error.message);
      // Fallback to rule-based advice
      return this.generateRuleBasedAdvice(userData, userAccountType);
    }
  }

  static buildAdvicePrompt(userData, userAccountType, specificQuestion, context) {
    const { categoryAnalysis, anomalies, monthlySpending } = userData;

    let prompt = `You are a financial advisor providing personalized advice. Here's the user's financial data:

Account Type: ${userAccountType}
Monthly Spending: $${monthlySpending.current || 0}
Average Monthly Spending: $${monthlySpending.average || 0}

Top Spending Categories:
${categoryAnalysis.categories.slice(0, 5).map(cat => 
  `- ${cat.category}: $${cat.amount} (${cat.percentage}%)`
).join('\n')}

Recent Anomalies: ${anomalies.summary.total} detected
- Major: ${anomalies.summary.major}
- Moderate: ${anomalies.summary.moderate}
- Minor: ${anomalies.summary.minor}

${specificQuestion ? `Specific Question: ${specificQuestion}` : ''}
${context ? `Context: ${context}` : ''}

Please provide:
1. A main insight or recommendation
2. 2-3 specific actionable suggestions
3. Potential savings estimate (if applicable)
${userAccountType === 'business' ? '4. Policy compliance tips' : ''}

Keep the response conversational and practical. Focus on the most impactful recommendations.`;

    return prompt;
  }

  static generateRuleBasedAdvice(userData, userAccountType) {
    console.log('CoachingService: Generating rule-based fallback advice');

    const { categoryAnalysis, anomalies, monthlySpending } = userData;
    
    let mainAdvice = "Based on your spending patterns, here's what I recommend:";
    const suggestions = [];
    let potentialSavings = 0;

    // Analyze top spending category
    if (categoryAnalysis.categories.length > 0) {
      const topCategory = categoryAnalysis.categories[0];
      
      if (topCategory.percentage > 40) {
        suggestions.push(`Consider reducing ${topCategory.category.toLowerCase()} expenses - they make up ${topCategory.percentage}% of your spending`);
        potentialSavings += topCategory.amount * 0.15; // 15% potential savings
      }
    }

    // Analyze anomalies
    if (anomalies.summary.major > 0) {
      suggestions.push("Review your recent major spending anomalies to ensure they were necessary");
    }

    // Monthly trend analysis
    if (monthlySpending.current > monthlySpending.average * 1.2) {
      suggestions.push("Your spending is 20% higher than usual this month - consider reviewing your budget");
    }

    // Business-specific advice
    if (userAccountType === 'business') {
      suggestions.push("Ensure all business expenses comply with your company policy to avoid violations");
    }

    // Default suggestions if none generated
    if (suggestions.length === 0) {
      suggestions.push("Your spending looks well-balanced. Consider setting up automatic savings to build your emergency fund");
      suggestions.push("Track your daily expenses to identify small recurring costs that add up over time");
    }

    return {
      response: mainAdvice,
      suggestions: suggestions.slice(0, 3),
      potentialSavings: Math.round(potentialSavings),
      actions: [
        { type: 'set-budget', label: 'Set monthly budget', data: { suggested: monthlySpending.average } },
        { type: 'review-category', label: 'Review top spending category' }
      ]
    };
  }

  static structureAdviceResponse(aiResponse, userData) {
    try {
      // Try to parse if it's JSON, otherwise use as text
      let response = aiResponse;
      let suggestions = [];
      let actions = [];

      // Extract suggestions from text if they exist
      if (typeof aiResponse === 'string') {
        const lines = aiResponse.split('\n').filter(line => line.trim());
        const suggestionLines = lines.filter(line => 
          line.includes('•') || line.includes('-') || line.includes('1.') || line.includes('2.') || line.includes('3.')
        );
        
        suggestions = suggestionLines.slice(0, 3).map(line => 
          line.replace(/^[\d\.\-\•\s]+/, '').trim()
        );

        // Generate actions based on content
        if (aiResponse.toLowerCase().includes('budget')) {
          actions.push({ type: 'set-budget', label: 'Set monthly budget' });
        }
        if (aiResponse.toLowerCase().includes('saving')) {
          actions.push({ type: 'explore-savings', label: 'Explore savings opportunities' });
        }
      }

      return {
        response: response,
        suggestions: suggestions.length > 0 ? suggestions : [
          "Track your spending patterns more closely",
          "Consider setting up automatic savings",
          "Review your largest expense categories"
        ],
        actions: actions.length > 0 ? actions : [
          { type: 'set-goal', label: 'Set financial goal' },
          { type: 'review-spending', label: 'Review recent spending' }
        ],
        potentialSavings: Math.round(userData.averageMonthlySpending * 0.1) // 10% estimated savings
      };
    } catch (error) {
      console.error('CoachingService: Error structuring response:', error.message);
      return this.generateRuleBasedAdvice(userData, userData.userAccountType);
    }
  }

  static async calculateMonthlyTrends(userId) {
    try {
      const now = new Date();
      const sixMonthsAgo = new Date(now);
      sixMonthsAgo.setMonth(now.getMonth() - 6);

      const monthlyData = await Transaction.aggregate([
        {
          $match: {
            userId,
            isDeleted: false,
            date: { $gte: sixMonthsAgo }
          }
        },
        {
          $group: {
            _id: {
              year: { $year: '$date' },
              month: { $month: '$date' }
            },
            totalSpending: { $sum: { $abs: '$amount' } }
          }
        },
        { $sort: { '_id.year': 1, '_id.month': 1 } }
      ]);

      const amounts = monthlyData.map(m => m.totalSpending);
      const average = amounts.length > 0 ? amounts.reduce((sum, amount) => sum + amount, 0) / amounts.length : 0;
      const current = amounts.length > 0 ? amounts[amounts.length - 1] : 0;

      return {
        monthly: monthlyData,
        average: parseFloat(average.toFixed(2)),
        current: parseFloat(current.toFixed(2)),
        trend: current > average ? 'increasing' : 'decreasing'
      };
    } catch (error) {
      console.error('CoachingService: Error calculating monthly trends:', error.message);
      return { monthly: [], average: 0, current: 0, trend: 'stable' };
    }
  }
}

module.exports = CoachingService;