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

// Get spending weather
router.get('/dashboard/weather', requireUser, async (req, res) => {
  try {
    console.log('Dashboard Routes: Getting weather for user:', req.user._id);

    const weather = {
      status: 'sunny',
      message: 'Your spending is on track this month!',
      recommendation: 'Keep up the good work with your budgeting.'
    };

    res.json(weather);
  } catch (error) {
    console.error('Dashboard Routes: Error getting weather:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get spending trends - UPDATED TO USE REAL DATA
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

      const spending = monthTransactions.reduce((sum, t) => sum + Math.abs(t.amount), 0);
      const income = 4500; // Mock income data - would come from income transactions or external source

      trends.push({
        month: monthStart.toLocaleDateString('en-US', { month: 'short' }),
        spending: parseFloat(spending.toFixed(2)),
        income: income
      });
    }

    console.log('Dashboard Routes: Calculated trends:', trends);
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

// Get insights
router.get('/dashboard/insights', requireUser, async (req, res) => {
  try {
    console.log('Dashboard Routes: Getting insights for user:', req.user._id);

    const insights = [
      {
        type: 'spending',
        title: 'Dining spending up 40% this month',
        description: 'You\'ve spent $650 on dining, which is higher than usual.',
        action: 'Consider cooking at home more often',
        priority: 'medium'
      },
      {
        type: 'savings',
        title: 'Great job staying under budget!',
        description: 'You\'re under budget in 4 categories this month.',
        action: 'Keep up the good work',
        priority: 'low'
      }
    ];

    if (req.user.accountType === 'business') {
      insights.push({
        type: 'policy',
        title: '3 transactions need policy review',
        description: 'Some recent transactions may exceed policy limits.',
        action: 'Review flagged transactions',
        priority: 'high'
      });
    }

    res.json(insights);
  } catch (error) {
    console.error('Dashboard Routes: Error getting insights:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;