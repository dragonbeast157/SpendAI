const express = require('express');
const AnalyticsService = require('../services/analyticsService');
const TransactionService = require('../services/transactionService');
const { requireUser } = require('./middleware/auth');

const router = express.Router();

// Root path response
router.get("/", (req, res) => {
  res.status(200).send("Welcome to Your Website!");
});

router.get("/ping", (req, res) => {
  res.status(200).send("pong");
});

// Dashboard summary endpoint
router.get('/api/dashboard/summary', requireUser, async (req, res) => {
  try {
    console.log('Dashboard: Getting summary for user:', req.user._id);
    
    // Get basic transaction stats
    const transactionResult = await TransactionService.getTransactions(req.user._id, {});
    const transactions = transactionResult.transactions || [];
    
    // Calculate basic metrics
    const currentMonth = new Date();
    const currentMonthStart = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
    const currentMonthTransactions = transactions.filter(t => new Date(t.date) >= currentMonthStart);
    
    const monthlySpending = currentMonthTransactions.reduce((sum, t) => sum + Math.abs(t.amount), 0);
    const transactionCount = currentMonthTransactions.length;
    
    // Get compliance data from analytics service
    let complianceScore = null;
    let violations = 0;
    
    if (req.user.accountType === 'business') {
      try {
        const analyticsData = await AnalyticsService.getSpendingOverview(req.user._id, { period: '1-month' });
        complianceScore = analyticsData.complianceScore || analyticsData.compliance?.overallScore;
        violations = analyticsData.compliance?.totalViolations || 0;
        console.log('Dashboard: Got compliance data from analytics:', { complianceScore, violations });
      } catch (error) {
        console.error('Dashboard: Error getting compliance data:', error.message);
      }
    }
    
    const summary = {
      totalBalance: 12450.75, // This would come from bank account service
      balanceChange: 5.2,
      monthlySpending: parseFloat(monthlySpending.toFixed(2)),
      spendingChange: -8.1, // This would be calculated from previous month
      transactionCount,
      ...(complianceScore !== null && { complianceScore, violations })
    };
    
    console.log('Dashboard: Returning summary:', summary);
    res.json(summary);
  } catch (error) {
    console.error('Dashboard: Error getting summary:', error.message);
    res.status(500).json({ error: 'Failed to get dashboard summary' });
  }
});

module.exports = router;