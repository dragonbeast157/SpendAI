const Transaction = require('../models/Transaction');
const ChatHistory = require('../models/ChatHistory');
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

      // Save to chat history
      await this.saveChatHistory(userId, specificQuestion, advice.response, 'general', advice);

      console.log('CoachingService: Advice generated successfully');
      return advice;
    } catch (error) {
      console.error('CoachingService: Error generating advice:', error.message);
      throw new Error(`Failed to generate financial advice: ${error.message}`);
    }
  }

  static async generateConversationStarters(userId, userAccountType) {
    console.log('CoachingService: Generating dynamic conversation starters for user:', userId);

    try {
      // Gather user data for personalized starters
      const userData = await this.gatherUserData(userId);

      // Generate personalized starters based on user's financial data
      const personalizedStarters = await this.createPersonalizedStarters(userData, userAccountType);

      console.log('CoachingService: Generated', personalizedStarters.length, 'personalized starters');
      return personalizedStarters;
    } catch (error) {
      console.error('CoachingService: Error generating conversation starters:', error.message);
      // Fallback to static starters
      return this.getStaticStarters(userAccountType);
    }
  }

  static async generateCategorizedAdvice(userId, userAccountType, options = {}) {
    console.log('CoachingService: Generating categorized advice for user:', userId);

    try {
      const { category, message, context, goals } = options;

      // Gather user data
      const userData = await this.gatherUserData(userId);

      // Generate category-specific advice
      const advice = await this.generateCategorySpecificAdvice(
        userData,
        userAccountType,
        category,
        message,
        context,
        goals
      );

      // Save to chat history
      await this.saveChatHistory(userId, message, advice.response, category, advice);

      console.log('CoachingService: Categorized advice generated successfully');
      return advice;
    } catch (error) {
      console.error('CoachingService: Error generating categorized advice:', error.message);
      throw new Error(`Failed to generate financial advice: ${error.message}`);
    }
  }

  static async createPersonalizedStarters(userData, userAccountType) {
    const { categoryAnalysis, anomalies, monthlySpending } = userData;
    const starters = [];

    // Base starters
    const baseStarters = userAccountType === 'business' ? [
      "How can I stay compliant with company policy?",
      "Show me compliant vendors in my area"
    ] : [
      "How can I improve my spending habits?",
      "What are my biggest money-saving opportunities?"
    ];

    starters.push(...baseStarters);

    // Personalized based on top spending category
    if (categoryAnalysis.categories.length > 0) {
      const topCategory = categoryAnalysis.categories[0];
      if (topCategory.percentage > 30) {
        starters.push(`How can I reduce my ${topCategory.category.toLowerCase()} expenses?`);
      }
    }

    // Anomaly-based starters
    if (anomalies.summary.total > 0) {
      starters.push("Why are some of my recent transactions flagged as unusual?");
    }

    // Spending trend starters
    if (monthlySpending.current > monthlySpending.average * 1.2) {
      starters.push("My spending is higher than usual this month - what should I do?");
    }

    // Business-specific personalized starters
    if (userAccountType === 'business') {
      starters.push("What are my most common policy violations?");
      starters.push("Help me justify this business expense");
    } else {
      starters.push("Am I on track for my savings goal?");
      starters.push("Show me ways to save money this month");
    }

    // Return unique starters, shuffled
    const uniqueStarters = [...new Set(starters)];
    return this.shuffleArray(uniqueStarters).slice(0, 6);
  }

  static getStaticStarters(userAccountType) {
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

    return userAccountType === 'business' ? businessStarters : personalStarters;
  }

  static async generateCategorySpecificAdvice(userData, userAccountType, category, message, context, goals) {
    console.log('CoachingService: Generating category-specific advice for:', category);

    try {
      // Build category-specific prompt
      const prompt = this.buildCategoryPrompt(userData, userAccountType, category, message, context, goals);

      // Use LLM service to generate advice
      let response;
      try {
        response = await sendLLMRequest('openai', 'gpt-3.5-turbo', prompt);
      } catch (openAIError) {
        console.log('CoachingService: OpenAI failed, trying Anthropic:', openAIError.message);
        try {
          response = await sendLLMRequest('anthropic', 'claude-3-haiku-20240307', prompt);
        } catch (anthropicError) {
          console.error('CoachingService: Both AI services failed:', anthropicError.message);
          response = this.generateCategoryFallbackAdvice(userData, userAccountType, category);
        }
      }

      // Structure the response
      return this.structureAdviceResponse(response, userData, category);
    } catch (error) {
      console.error('CoachingService: Error generating category-specific advice:', error.message);
      return this.generateCategoryFallbackAdvice(userData, userAccountType, category);
    }
  }

  static buildCategoryPrompt(userData, userAccountType, category, message, context, goals) {
    const { categoryAnalysis, anomalies, monthlySpending } = userData;

    let categoryContext = '';
    switch (category) {
      case 'savings':
        categoryContext = 'Focus on savings strategies, emergency fund building, and reducing unnecessary expenses.';
        break;
      case 'investment':
        categoryContext = 'Provide investment advice suitable for their income level and risk tolerance.';
        break;
      case 'debt':
        categoryContext = 'Focus on debt reduction strategies, payment prioritization, and debt consolidation options.';
        break;
      case 'spending':
        categoryContext = 'Analyze spending patterns and provide budgeting advice.';
        break;
      case 'policy':
        categoryContext = 'Focus on policy compliance and business expense optimization.';
        break;
      default:
        categoryContext = 'Provide general financial advice.';
    }

    let prompt = `You are a financial advisor specializing in ${category} advice. ${categoryContext}

User's Financial Profile:
Account Type: ${userAccountType}
Monthly Spending: $${monthlySpending.current || 0}
Average Monthly Spending: $${monthlySpending.average || 0}

Top Spending Categories:
${categoryAnalysis.categories.slice(0, 5).map(cat =>
  `- ${cat.category}: $${cat.amount} (${cat.percentage}%)`
).join('\n')}

Recent Anomalies: ${anomalies.summary.total} detected

${message ? `User Question: ${message}` : ''}
${context ? `Additional Context: ${context}` : ''}
${goals ? `User Goals: ${goals}` : ''}

Please provide:
1. Specific advice for ${category}
2. 3-4 actionable recommendations
3. Potential impact/savings estimate
4. Timeline for implementation

Keep the response practical and personalized to their financial situation.`;

    return prompt;
  }

  static generateCategoryFallbackAdvice(userData, userAccountType, category) {
    console.log('CoachingService: Generating fallback advice for category:', category);

    const { categoryAnalysis, monthlySpending } = userData;
    let advice = '';
    const suggestions = [];
    let potentialSavings = 0;

    switch (category) {
      case 'savings':
        advice = "Here are some savings strategies based on your spending patterns:";
        suggestions.push("Set up automatic transfers to a high-yield savings account");
        suggestions.push("Reduce your top spending category by 10-15%");
        suggestions.push("Use the 50/30/20 budgeting rule");
        potentialSavings = monthlySpending.average * 0.15;
        break;

      case 'investment':
        advice = "Consider these investment options based on your financial profile:";
        suggestions.push("Start with low-cost index funds");
        suggestions.push("Maximize employer 401(k) matching");
        suggestions.push("Consider a Roth IRA for tax-free growth");
        break;

      case 'debt':
        advice = "Here's a debt reduction strategy for your situation:";
        suggestions.push("List all debts and prioritize by interest rate");
        suggestions.push("Consider debt consolidation if beneficial");
        suggestions.push("Allocate extra payments to highest interest debt");
        break;

      case 'spending':
        advice = "Let's optimize your spending based on your patterns:";
        if (categoryAnalysis.categories.length > 0) {
          const topCategory = categoryAnalysis.categories[0];
          suggestions.push(`Review your ${topCategory.category.toLowerCase()} expenses - they're ${topCategory.percentage}% of your budget`);
        }
        suggestions.push("Track daily expenses for better awareness");
        suggestions.push("Set category-specific spending limits");
        potentialSavings = monthlySpending.average * 0.1;
        break;

      case 'policy':
        advice = "Here's how to improve your policy compliance:";
        suggestions.push("Review company policy guidelines regularly");
        suggestions.push("Use pre-approved vendors when possible");
        suggestions.push("Document business justifications for expenses");
        break;

      default:
        advice = "Based on your financial data, here are my recommendations:";
        suggestions.push("Create a monthly budget and stick to it");
        suggestions.push("Build an emergency fund of 3-6 months expenses");
        suggestions.push("Review and optimize your spending categories");
    }

    return {
      response: advice,
      suggestions: suggestions.slice(0, 4),
      potentialSavings: Math.round(potentialSavings),
      actions: [
        { type: 'set-goal', label: `Set ${category} goal` },
        { type: 'track-progress', label: 'Track progress' }
      ]
    };
  }

  static async saveChatHistory(userId, message, response, category, fullResponse) {
    try {
      const chatEntry = new ChatHistory({
        userId,
        message: message || 'AI Generated Response',
        response,
        type: 'ai',
        category,
        suggestions: fullResponse.suggestions || [],
        actions: fullResponse.actions || [],
        potentialSavings: fullResponse.potentialSavings || 0
      });

      await chatEntry.save();
      console.log('CoachingService: Chat history saved successfully');
    } catch (error) {
      console.error('CoachingService: Error saving chat history:', error.message);
      // Don't throw error - chat history is not critical
    }
  }

  static async getChatHistory(userId, limit = 50) {
    try {
      const history = await ChatHistory.find({ userId })
        .sort({ createdAt: -1 })
        .limit(limit)
        .lean();

      return history.reverse(); // Return in chronological order
    } catch (error) {
      console.error('CoachingService: Error fetching chat history:', error.message);
      return [];
    }
  }

  static shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
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

      console.log('CoachingService: Found', recentTransactions.length, 'recent transactions');

      // If no real transactions, create mock data for better personalization
      let categoryAnalysis, anomalies, monthlySpending;

      if (recentTransactions.length === 0) {
        console.log('CoachingService: No transactions found, using mock data for personalization');
        categoryAnalysis = this.generateMockCategoryAnalysis();
        anomalies = this.generateMockAnomalies();
        monthlySpending = this.generateMockMonthlySpending();
      } else {
        // Get category analysis
        categoryAnalysis = await AnalysisService.getCategoryAnalysis(userId, {
          dateRange: 'this-month'
        });

        // Get anomalies
        anomalies = await AnalysisService.detectAnomalies(userId, {
          dateRange: 'this-month'
        });

        // Calculate spending trends
        monthlySpending = await this.calculateMonthlyTrends(userId);
      }

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

  static generateMockCategoryAnalysis() {
    return {
      categories: [
        { category: 'Dining', amount: 650, percentage: 28 },
        { category: 'Transport', amount: 420, percentage: 18 },
        { category: 'Shopping', amount: 380, percentage: 16 },
        { category: 'Groceries', amount: 320, percentage: 14 },
        { category: 'Entertainment', amount: 280, percentage: 12 },
        { category: 'Other', amount: 290, percentage: 12 }
      ],
      totalAmount: 2340,
      totalTransactions: 45
    };
  }

  static generateMockAnomalies() {
    return {
      summary: {
        total: 3,
        major: 1,
        moderate: 1,
        minor: 1
      },
      anomalies: [
        {
          type: 'major',
          description: 'Unusually high dining expense: $85 vs usual $25',
          amount: 85,
          category: 'Dining'
        },
        {
          type: 'moderate',
          description: 'First time shopping at this store',
          amount: 45,
          category: 'Shopping'
        }
      ]
    };
  }

  static generateMockMonthlySpending() {
    return {
      monthly: [
        { _id: { year: 2024, month: 1 }, totalSpending: 2100 },
        { _id: { year: 2024, month: 2 }, totalSpending: 2300 },
        { _id: { year: 2024, month: 3 }, totalSpending: 2150 },
        { _id: { year: 2024, month: 4 }, totalSpending: 2400 },
        { _id: { year: 2024, month: 5 }, totalSpending: 2200 },
        { _id: { year: 2024, month: 6 }, totalSpending: 2340 }
      ],
      average: 2248.33,
      current: 2340,
      trend: 'increasing'
    };
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
        console.log('CoachingService: Attempting to use OpenAI...');
        response = await sendLLMRequest('openai', 'gpt-3.5-turbo', prompt);
        console.log('CoachingService: OpenAI response received:', typeof response);
      } catch (openAIError) {
        console.log('CoachingService: OpenAI failed, trying Anthropic:', openAIError.message);
        try {
          response = await sendLLMRequest('anthropic', 'claude-3-haiku-20240307', prompt);
          console.log('CoachingService: Anthropic response received:', typeof response);
        } catch (anthropicError) {
          console.error('CoachingService: Both AI services failed:', anthropicError.message);
          console.log('CoachingService: Using question-specific fallback advice');
          // Fallback to question-specific advice
          return this.generateQuestionSpecificAdvice(userData, userAccountType, specificQuestion);
        }
      }

      // Parse and structure the response
      return this.structureAdviceResponse(response, userData);
    } catch (error) {
      console.error('CoachingService: Error generating personalized advice:', error.message);
      console.log('CoachingService: Using question-specific fallback advice due to error');
      // Fallback to question-specific advice
      return this.generateQuestionSpecificAdvice(userData, userAccountType, specificQuestion);
    }
  }

  static generateQuestionSpecificAdvice(userData, userAccountType, specificQuestion) {
    console.log('CoachingService: Generating question-specific fallback advice for:', specificQuestion);

    const { categoryAnalysis, anomalies, monthlySpending } = userData;
    let response = '';
    let suggestions = [];
    let potentialSavings = 0;
    let actions = [];

    // Analyze the specific question and provide targeted advice
    const question = (specificQuestion || '').toLowerCase();

    if (question.includes('justify') && question.includes('expense')) {
      response = "To justify a business expense, you'll need to demonstrate its business necessity and compliance with company policy.";
      suggestions = [
        "Document the business purpose and expected benefit",
        "Ensure the expense falls within policy limits and categories",
        "Keep detailed receipts and supporting documentation",
        "Explain how this expense contributes to business objectives"
      ];
      actions = [
        { type: 'document-expense', label: 'Document business purpose' },
        { type: 'check-policy', label: 'Verify policy compliance' }
      ];
    } else if (question.includes('compliant') && question.includes('vendor')) {
      response = "Here are strategies to find policy-compliant vendors in your area:";
      suggestions = [
        "Check your company's approved vendor list first",
        "Look for vendors that offer corporate rates and proper invoicing",
        "Verify vendors can provide detailed receipts for expense reporting",
        "Consider vendors with established business accounts and tax documentation"
      ];
      actions = [
        { type: 'search-vendors', label: 'Search approved vendors' },
        { type: 'verify-compliance', label: 'Verify vendor compliance' }
      ];
    } else if (question.includes('policy') && (question.includes('compliant') || question.includes('compliance'))) {
      response = "Here's how to stay compliant with your company's spending policy:";
      suggestions = [
        "Review your company policy document regularly",
        "Set up spending alerts for category limits",
        "Use pre-approved vendors whenever possible",
        "Submit expense reports promptly with proper documentation"
      ];
      actions = [
        { type: 'review-policy', label: 'Review policy guidelines' },
        { type: 'set-alerts', label: 'Set spending alerts' }
      ];
    } else if (question.includes('violation') && question.includes('policy')) {
      response = "Based on your spending patterns, here are the most common policy violations to watch for:";
      suggestions = [
        "Exceeding daily or monthly spending limits in specific categories",
        "Using non-approved vendors without proper justification",
        "Missing or incomplete expense documentation",
        "Personal expenses mixed with business expenses"
      ];
      actions = [
        { type: 'review-violations', label: 'Review past violations' },
        { type: 'improve-compliance', label: 'Improve compliance practices' }
      ];
    } else if (question.includes('save') || question.includes('saving')) {
      response = `Based on your spending of $${monthlySpending.current}/month, here are personalized money-saving strategies:`;
      if (categoryAnalysis.categories.length > 0) {
        const topCategory = categoryAnalysis.categories[0];
        suggestions.push(`Focus on reducing ${topCategory.category.toLowerCase()} expenses - you spend $${topCategory.amount}/month (${topCategory.percentage}% of budget)`);
        potentialSavings = topCategory.amount * 0.2;
      }
      suggestions.push("Track daily expenses to identify small recurring costs");
      suggestions.push("Set up automatic transfers to savings");
      suggestions.push("Review and cancel unused subscriptions");
      actions = [
        { type: 'set-savings-goal', label: 'Set monthly savings goal' },
        { type: 'track-expenses', label: 'Track daily expenses' }
      ];
    } else if (question.includes('budget') || question.includes('spending')) {
      response = `Based on your $${monthlySpending.current}/month spending, let's create a better strategy:`;
      if (categoryAnalysis.categories.length > 0) {
        const topCategory = categoryAnalysis.categories[0];
        suggestions.push(`Your top expense is ${topCategory.category.toLowerCase()} at $${topCategory.amount}/month - consider reducing by 10-15%`);
      }
      suggestions.push("Use the 50/30/20 rule: 50% needs, 30% wants, 20% savings");
      suggestions.push("Review your spending weekly to stay on track");
      suggestions.push("Consider using spending apps or tools for better tracking");
      potentialSavings = monthlySpending.average * 0.1;
      actions = [
        { type: 'create-budget', label: 'Create monthly budget' },
        { type: 'set-limits', label: 'Set category limits' }
      ];
    } else {
      // Generic but more personalized fallback
      response = `Based on your $${monthlySpending.current}/month spending pattern, here are my recommendations:`;
      if (categoryAnalysis.categories.length > 0) {
        const topCategory = categoryAnalysis.categories[0];
        suggestions.push(`Your biggest expense category is ${topCategory.category.toLowerCase()} at $${topCategory.amount}/month - review for optimization opportunities`);
      }
      suggestions.push("Set up automatic savings to build your emergency fund");
      suggestions.push("Consider using budgeting tools to track expenses better");
      if (userAccountType === 'business') {
        suggestions.push("Ensure all business expenses comply with company policy");
      }
      actions = [
        { type: 'analyze-spending', label: 'Analyze spending patterns' },
        { type: 'set-goals', label: 'Set financial goals' }
      ];
    }

    return {
      response,
      suggestions: suggestions.slice(0, 4),
      potentialSavings: Math.round(potentialSavings),
      actions: actions.slice(0, 3)
    };
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
        { type: 'set-budget', label: 'Set monthly budget' },
        { type: 'review-category', label: 'Review top spending category' }
      ]
    };
  }

  static structureAdviceResponse(aiResponse, userData, category = null) {
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
        if (category) {
          actions.push({ type: 'track-category', label: `Track ${category} progress` });
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