const Transaction = require('../models/Transaction');

class AnalyticsService {

  static async getSpendingOverview(userId, filters = {}) {
    console.log('AnalyticsService: Getting spending overview for user:', userId);
    console.log('AnalyticsService: Filters:', filters);

    try {
      const { period = '6-months', categories = [] } = filters;

      // Build base query
      const query = {
        userId,
        isDeleted: false
      };

      // Add category filter if specified
      if (categories.length > 0) {
        query.category = { $in: categories };
      }

      // Get date range based on period
      const now = new Date();
      let startDate;
      let monthsBack;

      switch (period) {
        case '1-month':
          monthsBack = 1;
          break;
        case '3-months':
          monthsBack = 3;
          break;
        case '12-months':
          monthsBack = 12;
          break;
        case '6-months':
        default:
          monthsBack = 6;
          break;
      }

      startDate = new Date(now.getFullYear(), now.getMonth() - monthsBack, 1);
      query.date = { $gte: startDate };

      // Get all transactions for the period
      const transactions = await Transaction.find(query).sort({ date: 1 }).lean();

      console.log('AnalyticsService: Found transactions for compliance check:', {
        total: transactions.length,
        violations: transactions.filter(t => t.policyStatus === 'violation').length,
        warnings: transactions.filter(t => t.policyStatus === 'warning').length,
        compliant: transactions.filter(t => t.policyStatus === 'compliant').length,
        period: period
      });

      // Calculate monthly spending trends
      const monthlyData = this.calculateMonthlyTrends(transactions, monthsBack);

      // Calculate total and average spending
      const totalSpending = transactions.reduce((sum, t) => sum + Math.abs(t.amount), 0);
      const averageMonthlySpend = totalSpending / monthsBack;

      // Calculate spending velocity
      const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const currentMonthTransactions = transactions.filter(t => t.date >= currentMonth);
      const currentMonthSpending = currentMonthTransactions.reduce((sum, t) => sum + Math.abs(t.amount), 0);

      const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
      const lastMonthTransactions = transactions.filter(t =>
        t.date >= lastMonth && t.date <= lastMonthEnd
      );
      const lastMonthSpending = lastMonthTransactions.reduce((sum, t) => sum + Math.abs(t.amount), 0);

      const velocityPercentage = lastMonthSpending > 0
        ? ((currentMonthSpending - lastMonthSpending) / lastMonthSpending) * 100
        : 0;

      // Calculate compliance data if business account
      const complianceData = await this.calculateComplianceMetrics(userId, transactions);

      console.log('AnalyticsService: Final compliance data being returned:', complianceData);
      console.log('AnalyticsService: Spending overview calculated successfully');

      return {
        monthlyComparison: {
          data: monthlyData
        },
        seasonality: {
          categories: this.calculateSeasonality(transactions)
        },
        velocity: {
          currentPace: parseFloat(velocityPercentage.toFixed(1)),
          projectedTotal: parseFloat((currentMonthSpending * (30 / now.getDate())).toFixed(2)),
          policyBurnRate: complianceData.burnRate || 0
        },
        compliance: complianceData.compliance,
        complianceScore: complianceData.compliance.overallScore, // Add this for frontend compatibility
        totalSpending: parseFloat(totalSpending.toFixed(2)),
        averageMonthlySpend: parseFloat(averageMonthlySpend.toFixed(2)),
        period: period
      };
    } catch (error) {
      console.error('AnalyticsService: Error getting spending overview:', error.message);
      throw new Error(`Failed to get spending overview: ${error.message}`);
    }
  }

  static calculateMonthlyTrends(transactions, monthsBack) {
    const now = new Date();
    const monthlyData = [];

    for (let i = monthsBack - 1; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);

      const monthTransactions = transactions.filter(t =>
        t.date >= monthStart && t.date <= monthEnd
      );

      const currentAmount = monthTransactions.reduce((sum, t) => sum + Math.abs(t.amount), 0);

      // Calculate previous month for comparison
      const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - i - 1, 1);
      const prevMonthEnd = new Date(now.getFullYear(), now.getMonth() - i, 0);
      const prevMonthTransactions = transactions.filter(t =>
        t.date >= prevMonthStart && t.date <= prevMonthEnd
      );
      const previousAmount = prevMonthTransactions.reduce((sum, t) => sum + Math.abs(t.amount), 0);

      // Calculate compliance percentage
      const violations = monthTransactions.filter(t => t.policyStatus === 'violation').length;
      const compliance = monthTransactions.length > 0
        ? ((monthTransactions.length - violations) / monthTransactions.length) * 100
        : 100;

      monthlyData.push({
        month: monthStart.toLocaleDateString('en-US', { month: 'short' }),
        current: parseFloat(currentAmount.toFixed(2)),
        previous: parseFloat(previousAmount.toFixed(2)),
        compliance: parseFloat(compliance.toFixed(1)),
        violations: violations
      });
    }

    return monthlyData;
  }

  static calculateSeasonality(transactions) {
    const categorySeasonality = {};

    transactions.forEach(transaction => {
      const month = transaction.date.getMonth();
      const category = transaction.category;

      if (!categorySeasonality[category]) {
        categorySeasonality[category] = new Array(12).fill(0);
      }

      categorySeasonality[category][month] += Math.abs(transaction.amount);
    });

    return categorySeasonality;
  }

  static async calculateComplianceMetrics(userId, transactions) {
    try {
      const violations = transactions.filter(t => t.policyStatus === 'violation');
      const warnings = transactions.filter(t => t.policyStatus === 'warning');

      const totalTransactions = transactions.length;
      const complianceRate = totalTransactions > 0
        ? ((totalTransactions - violations.length) / totalTransactions) * 100
        : 100;

      console.log('AnalyticsService: Compliance calculation details:', {
        totalTransactions,
        violationsCount: violations.length,
        warningsCount: warnings.length,
        complianceRate: complianceRate.toFixed(1)
      });

      // Calculate monthly compliance trend
      const trend = this.calculateComplianceTrend(transactions);

      // Calculate violations by category
      const violationsByCategory = {};
      violations.forEach(v => {
        violationsByCategory[v.category] = (violationsByCategory[v.category] || 0) + 1;
      });

      console.log('AnalyticsService: Violations by category:', violationsByCategory);

      // Fix NaN burnRate calculation
      const burnRate = totalTransactions > 0 
        ? parseFloat(((violations.length / totalTransactions) * 100).toFixed(1))
        : 0;

      return {
        compliance: {
          trend: trend,
          violationsByCategory: violationsByCategory,
          overallScore: parseFloat(complianceRate.toFixed(1)), // Add overall score
          totalViolations: violations.length,
          totalWarnings: warnings.length
        },
        burnRate: burnRate
      };
    } catch (error) {
      console.error('AnalyticsService: Error calculating compliance metrics:', error.message);
      return {
        compliance: {
          trend: [100, 100, 100, 100, 100, 100],
          violationsByCategory: {},
          overallScore: 100,
          totalViolations: 0,
          totalWarnings: 0
        },
        burnRate: 0
      };
    }
  }

  static calculateComplianceTrend(transactions) {
    const now = new Date();
    const trend = [];

    for (let i = 5; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);

      const monthTransactions = transactions.filter(t =>
        t.date >= monthStart && t.date <= monthEnd
      );

      const violations = monthTransactions.filter(t => t.policyStatus === 'violation').length;
      const compliance = monthTransactions.length > 0
        ? ((monthTransactions.length - violations) / monthTransactions.length) * 100
        : 100;

      trend.push(parseFloat(compliance.toFixed(1)));
    }

    return trend;
  }

  static async getSavingsOpportunities(userId) {
    console.log('AnalyticsService: Getting savings opportunities for user:', userId);

    try {
      // Get last 3 months of transactions
      const now = new Date();
      const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, 1);

      const transactions = await Transaction.find({
        userId,
        isDeleted: false,
        date: { $gte: threeMonthsAgo }
      }).sort({ date: -1 }).lean();

      const opportunities = [];

      // Analyze duplicate subscriptions
      const duplicateSubscriptions = this.findDuplicateSubscriptions(transactions);
      opportunities.push(...duplicateSubscriptions);

      // Analyze high-frequency merchants
      const frequentMerchants = this.analyzeFrequentMerchants(transactions);
      opportunities.push(...frequentMerchants);

      // Analyze category overspending
      const categoryOpportunities = this.analyzeCategorySpending(transactions);
      opportunities.push(...categoryOpportunities);

      // Analyze policy violations (for business accounts)
      const policyOpportunities = this.analyzePolicyViolations(transactions);
      opportunities.push(...policyOpportunities);

      // Sort by potential savings (highest first)
      opportunities.sort((a, b) => b.potentialSavings - a.potentialSavings);

      console.log('AnalyticsService: Found', opportunities.length, 'savings opportunities');
      return opportunities;
    } catch (error) {
      console.error('AnalyticsService: Error getting savings opportunities:', error.message);
      throw new Error(`Failed to get savings opportunities: ${error.message}`);
    }
  }

  static findDuplicateSubscriptions(transactions) {
    const subscriptionKeywords = ['subscription', 'monthly', 'premium', 'pro', 'plus'];
    const merchantCounts = {};
    const opportunities = [];

    transactions.forEach(transaction => {
      const merchant = transaction.merchant.toLowerCase();
      const hasSubscriptionKeyword = subscriptionKeywords.some(keyword =>
        merchant.includes(keyword) || transaction.description.toLowerCase().includes(keyword)
      );

      if (hasSubscriptionKeyword) {
        merchantCounts[transaction.merchant] = (merchantCounts[transaction.merchant] || 0) + 1;
      }
    });

    Object.entries(merchantCounts).forEach(([merchant, count]) => {
      if (count >= 2) {
        const merchantTransactions = transactions.filter(t => t.merchant === merchant);
        const avgAmount = merchantTransactions.reduce((sum, t) => sum + Math.abs(t.amount), 0) / merchantTransactions.length;

        opportunities.push({
          _id: `duplicate-${merchant}`,
          title: 'Duplicate Subscription Detected',
          description: `You have ${count} transactions from ${merchant}. This might be a duplicate subscription.`,
          category: 'subscriptions',
          potentialSavings: parseFloat((avgAmount * (count - 1)).toFixed(2)),
          confidence: 'high',
          action: `Review ${merchant} subscriptions and cancel duplicates`,
          severity: count > 3 ? 'high' : 'medium'
        });
      }
    });

    return opportunities;
  }

  static analyzeFrequentMerchants(transactions) {
    const merchantSpending = {};
    const opportunities = [];

    transactions.forEach(transaction => {
      const merchant = transaction.merchant;
      if (!merchantSpending[merchant]) {
        merchantSpending[merchant] = {
          total: 0,
          count: 0,
          category: transaction.category
        };
      }
      merchantSpending[merchant].total += Math.abs(transaction.amount);
      merchantSpending[merchant].count += 1;
    });

    Object.entries(merchantSpending).forEach(([merchant, data]) => {
      if (data.count >= 5 && data.total > 100) {
        const avgPerTransaction = data.total / data.count;
        const potentialSavings = data.total * 0.15; // Assume 15% potential savings

        opportunities.push({
          _id: `frequent-${merchant}`,
          title: 'High-Frequency Spending',
          description: `You've spent $${data.total.toFixed(2)} at ${merchant} over ${data.count} transactions.`,
          category: data.category,
          potentialSavings: parseFloat(potentialSavings.toFixed(2)),
          confidence: 'medium',
          action: `Look for alternatives to ${merchant} or negotiate better rates`,
          severity: data.total > 500 ? 'high' : 'medium'
        });
      }
    });

    return opportunities;
  }

  static analyzeCategorySpending(transactions) {
    const categorySpending = {};
    const opportunities = [];

    // Calculate spending by category
    transactions.forEach(transaction => {
      const category = transaction.category;
      categorySpending[category] = (categorySpending[category] || 0) + Math.abs(transaction.amount);
    });

    // Define typical spending thresholds (monthly)
    const monthlyThresholds = {
      dining: 400,
      entertainment: 200,
      shopping: 300,
      transport: 200
    };

    Object.entries(categorySpending).forEach(([category, total]) => {
      const threshold = monthlyThresholds[category];
      if (threshold && total > threshold) {
        const excess = total - threshold;
        const potentialSavings = excess * 0.3; // 30% of excess could be saved

        opportunities.push({
          _id: `category-${category}`,
          title: `High ${category.charAt(0).toUpperCase() + category.slice(1)} Spending`,
          description: `Your ${category} spending of $${total.toFixed(2)} is above the typical range.`,
          category: category,
          potentialSavings: parseFloat(potentialSavings.toFixed(2)),
          confidence: 'medium',
          action: `Consider setting a budget for ${category} expenses`,
          severity: excess > threshold * 0.5 ? 'high' : 'medium'
        });
      }
    });

    return opportunities;
  }

  static analyzePolicyViolations(transactions) {
    const violations = transactions.filter(t => t.policyStatus === 'violation');
    const opportunities = [];

    if (violations.length > 0) {
      const totalViolationAmount = violations.reduce((sum, t) => sum + Math.abs(t.amount), 0);
      const avgViolationAmount = totalViolationAmount / violations.length;

      opportunities.push({
        _id: 'policy-violations',
        title: 'Policy Compliance Opportunity',
        description: `${violations.length} policy violations detected. Staying compliant could reduce costs.`,
        category: 'policy',
        potentialSavings: parseFloat((totalViolationAmount * 0.2).toFixed(2)), // 20% of violation amount
        confidence: 'high',
        action: 'Review and follow company spending policies',
        severity: violations.length > 5 ? 'high' : 'medium'
      });
    }

    return opportunities;
  }
}

module.exports = AnalyticsService;