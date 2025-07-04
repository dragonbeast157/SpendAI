const express = require('express');
const { requireUser } = require('./middleware/auth');
const Transaction = require('../models/Transaction');
const Policy = require('../models/Policy');
const PolicyViolation = require('../models/PolicyViolation');
const BankAccount = require('../models/BankAccount');

const router = express.Router();

// Get dashboard summary
router.get('/dashboard/summary', requireUser, async (req, res) => {
  try {
    console.log('Dashboard Routes: Getting summary for user:', req.user._id);

    // Get current month transactions
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const currentMonthTransactions = await Transaction.find({
      userId: req.user._id,
      isDeleted: false,
      date: { $gte: startOfMonth, $lte: endOfMonth }
    });

    // Get all connected bank accounts for the user
    console.log('Dashboard Routes: Fetching bank accounts for user:', req.user._id);
    const bankAccounts = await BankAccount.find({
      userId: req.user._id,
      status: 'connected'
    });

    console.log('Dashboard Routes: Found', bankAccounts.length, 'connected bank accounts');

    // Calculate total balance from all connected accounts
    let totalBalance = 0;
    if (bankAccounts.length > 0) {
      totalBalance = bankAccounts.reduce((sum, account) => {
        console.log('Dashboard Routes: Adding account balance:', account.balance, 'from account:', account.bankName);
        return sum + (account.balance || 0);
      }, 0);
      console.log('Dashboard Routes: Calculated total balance from bank accounts:', totalBalance);
    } else {
      // If no bank accounts are connected, calculate balance from transactions
      console.log('Dashboard Routes: No connected bank accounts, calculating balance from transactions');
      const allTransactions = await Transaction.find({
        userId: req.user._id,
        isDeleted: false
      });
      
      totalBalance = allTransactions.reduce((sum, transaction) => {
        // Positive amounts are income, negative amounts are expenses
        return sum + transaction.amount;
      }, 0);
      
      console.log('Dashboard Routes: Calculated total balance from transactions:', totalBalance);
    }

    const monthlySpending = currentMonthTransactions.reduce((sum, t) => sum + Math.abs(t.amount), 0) || 0;
    const transactionCount = currentMonthTransactions.length;

    // Calculate compliance for business accounts
    let complianceScore = 100;
    let violations = 0;

    if (req.user.accountType === 'business') {
      const policyViolations = await PolicyViolation.find({
        userId: req.user._id,
        createdAt: { $gte: startOfMonth, $lte: endOfMonth }
      });
      violations = policyViolations.length;
      complianceScore = Math.max(0, 100 - (violations * 5));
    }

    const summary = {
      totalBalance: parseFloat(totalBalance.toFixed(2)),
      balanceChange: 5.2, // This could be calculated by comparing with previous month
      monthlySpending: parseFloat(monthlySpending.toFixed(2)),
      spendingChange: -8.1, // This could be calculated by comparing with previous month
      transactionCount,
      complianceScore,
      violations
    };

    console.log('Dashboard Routes: Final summary calculated:', summary);
    res.json(summary);
  } catch (error) {
    console.error('Dashboard Routes: Error getting summary:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get spending weather - UPDATED WITH REAL LOGIC
router.get('/dashboard/weather', requireUser, async (req, res) => {
  try {
    console.log('Dashboard Routes: Getting weather for user:', req.user._id);

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    // Get current month transactions
    const currentMonthTransactions = await Transaction.find({
      userId: req.user._id,
      isDeleted: false,
      date: { $gte: startOfMonth }
    });

    // Get last month transactions for comparison
    const lastMonthTransactions = await Transaction.find({
      userId: req.user._id,
      isDeleted: false,
      date: { $gte: startOfLastMonth, $lte: endOfLastMonth }
    });

    const currentSpending = currentMonthTransactions.reduce((sum, t) => sum + Math.abs(t.amount), 0);
    const lastMonthSpending = lastMonthTransactions.reduce((sum, t) => sum + Math.abs(t.amount), 0);

    // Calculate spending velocity (how fast we're spending compared to last month)
    const daysIntoMonth = now.getDate();
    const projectedMonthlySpending = (currentSpending / daysIntoMonth) * 30;
    const spendingIncrease = lastMonthSpending > 0 ? ((projectedMonthlySpending - lastMonthSpending) / lastMonthSpending) * 100 : 0;

    // Check for anomalies and policy violations
    const anomalies = currentMonthTransactions.filter(t => t.hasAnomaly).length;
    const violations = currentMonthTransactions.filter(t => t.policyStatus === 'violation').length;

    console.log('Dashboard Routes: Weather analysis:', {
      currentSpending,
      lastMonthSpending,
      projectedMonthlySpending,
      spendingIncrease,
      anomalies,
      violations,
      daysIntoMonth
    });

    let status = 'sunny';
    let message = '';
    let recommendation = '';

    // Determine weather status based on multiple factors
    if (violations > 3 || anomalies > 5 || spendingIncrease > 50) {
      status = 'stormy';
      message = 'Storm warning - significant spending concerns detected';
      if (violations > 3) {
        recommendation = `You have ${violations} policy violations this month. Review your spending against company policies.`;
      } else if (spendingIncrease > 50) {
        recommendation = `Your spending is ${spendingIncrease.toFixed(1)}% higher than last month. Consider reducing discretionary expenses.`;
      } else {
        recommendation = `${anomalies} unusual transactions detected. Review your recent purchases for accuracy.`;
      }
    } else if (violations > 0 || anomalies > 2 || (spendingIncrease > 20 && spendingIncrease <= 50)) {
      status = 'cloudy';
      message = 'Partly cloudy - some areas need attention';
      if (violations > 0) {
        recommendation = `${violations} policy violations need review. Check flagged transactions.`;
      } else if (spendingIncrease > 20) {
        recommendation = `Spending is up ${spendingIncrease.toFixed(1)}% from last month. Monitor your budget closely.`;
      } else {
        recommendation = `${anomalies} transactions flagged as unusual. Review if needed.`;
      }
    } else {
      status = 'sunny';
      if (spendingIncrease < -10) {
        message = 'Sunny skies - great job reducing your spending!';
        recommendation = `You're spending ${Math.abs(spendingIncrease).toFixed(1)}% less than last month. Keep up the good work!`;
      } else if (spendingIncrease < 10) {
        message = 'Sunny skies - your spending is well controlled';
        recommendation = 'Your spending patterns look healthy. Continue monitoring your budget.';
      } else {
        message = 'Mostly sunny - spending is within normal range';
        recommendation = 'Your spending is slightly up but still manageable. Stay mindful of your budget.';
      }
    }

    const weather = { status, message, recommendation };
    console.log('Dashboard Routes: Weather result:', weather);
    res.json(weather);
  } catch (error) {
    console.error('Dashboard Routes: Error getting weather:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get spending trends - UPDATED TO USE REAL INCOME DATA
router.get('/dashboard/trends', requireUser, async (req, res) => {
  try {
    console.log('Dashboard Routes: Getting trends for user:', req.user._id);

    const now = new Date();
    const trends = [];

    // Get last 6 months of data
    for (let i = 5; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);

      const monthTransactions = await Transaction.find({
        userId: req.user._id,
        isDeleted: false,
        date: { $gte: monthStart, $lte: monthEnd }
      });

      // Calculate actual spending (negative amounts) and income (positive amounts)
      let spending = 0;
      let income = 0;

      monthTransactions.forEach(transaction => {
        if (transaction.amount < 0) {
          spending += Math.abs(transaction.amount);
        } else {
          income += transaction.amount;
        }
      });

      console.log('Dashboard Routes: Month', monthStart.toLocaleDateString('en-US', { month: 'short' }), 
                  '- Spending:', spending, 'Income:', income);

      trends.push({
        month: monthStart.toLocaleDateString('en-US', { month: 'short' }),
        spending: parseFloat(spending.toFixed(2)),
        income: parseFloat(income.toFixed(2))
      });
    }

    console.log('Dashboard Routes: Calculated trends with real data:', trends);
    res.json(trends);
  } catch (error) {
    console.error('Dashboard Routes: Error getting trends:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get category breakdown - UPDATED TO USE REAL DATA
router.get('/dashboard/categories', requireUser, async (req, res) => {
  try {
    console.log('Dashboard Routes: Getting categories for user:', req.user._id);

    // Get current month transactions
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const transactions = await Transaction.find({
      userId: req.user._id,
      isDeleted: false,
      date: { $gte: startOfMonth }
    });

    console.log('Dashboard Routes: Found', transactions.length, 'transactions for category breakdown');

    // Calculate category totals
    const categoryTotals = {};
    let totalSpending = 0;

    transactions.forEach(transaction => {
      const category = transaction.category || 'other';
      const amount = Math.abs(transaction.amount);
      categoryTotals[category] = (categoryTotals[category] || 0) + amount;
      totalSpending += amount;
    });

    console.log('Dashboard Routes: Category totals:', categoryTotals);
    console.log('Dashboard Routes: Total spending:', totalSpending);

    // Convert to array with percentages and colors
    const categoryColors = {
      dining: '#ef4444',
      transport: '#3b82f6',
      shopping: '#8b5cf6',
      groceries: '#10b981',
      entertainment: '#f59e0b',
      healthcare: '#ec4899',
      utilities: '#14b8a6',
      other: '#6b7280'
    };

    const categories = Object.entries(categoryTotals).map(([category, amount]) => ({
      category: category.charAt(0).toUpperCase() + category.slice(1),
      amount: parseFloat(amount.toFixed(2)),
      percentage: totalSpending > 0 ? Math.round((amount / totalSpending) * 100) : 0,
      color: categoryColors[category] || '#6b7280'
    }));

    // Sort by amount descending
    categories.sort((a, b) => b.amount - a.amount);

    console.log('Dashboard Routes: Final categories:', categories);
    res.json(categories);
  } catch (error) {
    console.error('Dashboard Routes: Error getting categories:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get recent transactions - UPDATED TO FIX FIELD MAPPING
router.get('/dashboard/transactions', requireUser, async (req, res) => {
  try {
    console.log('Dashboard Routes: Getting recent transactions for user:', req.user._id);

    const transactions = await Transaction.find({
      userId: req.user._id,
      isDeleted: false
    })
    .sort({ date: -1 })
    .limit(10)
    .lean();

    console.log('Dashboard Routes: Found', transactions.length, 'recent transactions');

    const formattedTransactions = transactions.map(t => ({
      _id: t._id,
      merchant: t.merchant || 'Unknown Merchant',
      amount: t.amount,
      date: t.date,
      category: t.category || 'other',
      hasAnomaly: t.hasAnomaly || false,
      policyStatus: t.policyStatus || 'compliant'
    }));

    console.log('Dashboard Routes: Formatted transactions:', formattedTransactions);
    res.json(formattedTransactions);
  } catch (error) {
    console.error('Dashboard Routes: Error getting transactions:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get insights - UPDATED WITH REAL DATA ANALYSIS
router.get('/dashboard/insights', requireUser, async (req, res) => {
  try {
    console.log('Dashboard Routes: Getting insights for user:', req.user._id);

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    // Get current and last month transactions
    const currentMonthTransactions = await Transaction.find({
      userId: req.user._id,
      isDeleted: false,
      date: { $gte: startOfMonth }
    });

    const lastMonthTransactions = await Transaction.find({
      userId: req.user._id,
      isDeleted: false,
      date: { $gte: startOfLastMonth, $lte: endOfLastMonth }
    });

    console.log('Dashboard Routes: Analyzing insights from', currentMonthTransactions.length, 'current and', lastMonthTransactions.length, 'last month transactions');

    const insights = [];

    // Analyze spending by category
    const currentCategorySpending = {};
    const lastCategorySpending = {};

    currentMonthTransactions.forEach(t => {
      const category = t.category || 'other';
      const amount = Math.abs(t.amount);
      currentCategorySpending[category] = (currentCategorySpending[category] || 0) + amount;
    });

    lastMonthTransactions.forEach(t => {
      const category = t.category || 'other';
      const amount = Math.abs(t.amount);
      lastCategorySpending[category] = (lastCategorySpending[category] || 0) + amount;
    });

    // Find categories with significant changes
    Object.entries(currentCategorySpending).forEach(([category, currentAmount]) => {
      const lastAmount = lastCategorySpending[category] || 0;
      
      if (lastAmount > 0) {
        const changePercent = ((currentAmount - lastAmount) / lastAmount) * 100;
        
        if (changePercent > 30 && currentAmount > 100) {
          insights.push({
            _id: `category-increase-${category}`,
            type: 'spending',
            title: `${category.charAt(0).toUpperCase() + category.slice(1)} spending up ${changePercent.toFixed(0)}%`,
            description: `You've spent $${currentAmount.toFixed(2)} on ${category} this month, up from $${lastAmount.toFixed(2)} last month.`,
            action: `Consider reviewing your ${category} expenses`,
            priority: changePercent > 50 ? 'high' : 'medium'
          });
        } else if (changePercent < -20 && lastAmount > 50) {
          insights.push({
            _id: `category-decrease-${category}`,
            type: 'saving',
            title: `Great job reducing ${category} spending!`,
            description: `You've saved $${(lastAmount - currentAmount).toFixed(2)} on ${category} compared to last month.`,
            action: 'Keep up the good work',
            priority: 'low'
          });
        }
      } else if (currentAmount > 100) {
        insights.push({
          _id: `new-category-${category}`,
          type: 'spending',
          title: `New spending in ${category}`,
          description: `You've started spending in ${category} category with $${currentAmount.toFixed(2)} this month.`,
          action: `Monitor your ${category} budget`,
          priority: 'medium'
        });
      }
    });

    // Check for anomalies
    const anomalies = currentMonthTransactions.filter(t => t.hasAnomaly);
    if (anomalies.length > 0) {
      const totalAnomalyAmount = anomalies.reduce((sum, t) => sum + Math.abs(t.amount), 0);
      insights.push({
        _id: 'anomalies-detected',
        type: 'spending',
        title: `${anomalies.length} unusual transactions detected`,
        description: `Transactions worth $${totalAnomalyAmount.toFixed(2)} have been flagged as unusual.`,
        action: 'Review flagged transactions',
        priority: anomalies.length > 3 ? 'high' : 'medium'
      });
    }

    // Business account specific insights
    if (req.user.accountType === 'business') {
      const violations = currentMonthTransactions.filter(t => t.policyStatus === 'violation');
      if (violations.length > 0) {
        insights.push({
          _id: 'policy-violations',
          type: 'policy',
          title: `${violations.length} policy violations need attention`,
          description: 'Some transactions may not comply with company spending policies.',
          action: 'Review and justify flagged transactions',
          priority: violations.length > 2 ? 'high' : 'medium'
        });
      } else {
        insights.push({
          _id: 'policy-compliant',
          type: 'goal',
          title: 'All transactions are policy compliant!',
          description: 'Great job following company spending guidelines.',
          action: 'Keep maintaining compliance',
          priority: 'low'
        });
      }
    }

    // If no specific insights, add general positive message
    if (insights.length === 0) {
      const totalCurrentSpending = Object.values(currentCategorySpending).reduce((sum, amount) => sum + amount, 0);
      const totalLastSpending = Object.values(lastCategorySpending).reduce((sum, amount) => sum + amount, 0);
      
      if (totalCurrentSpending < totalLastSpending) {
        insights.push({
          _id: 'general-positive',
          type: 'saving',
          title: 'Your spending is under control',
          description: `You're spending less than last month. Keep up the good financial habits!`,
          action: 'Continue monitoring your budget',
          priority: 'low'
        });
      } else {
        insights.push({
          _id: 'general-neutral',
          type: 'goal',
          title: 'Your finances look stable',
          description: 'No major changes in your spending patterns detected.',
          action: 'Keep tracking your expenses',
          priority: 'low'
        });
      }
    }

    // Sort insights by priority
    const priorityOrder = { high: 3, medium: 2, low: 1 };
    insights.sort((a, b) => priorityOrder[b.priority] - priorityOrder[a.priority]);

    console.log('Dashboard Routes: Generated', insights.length, 'insights');
    res.json(insights);
  } catch (error) {
    console.error('Dashboard Routes: Error getting insights:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;