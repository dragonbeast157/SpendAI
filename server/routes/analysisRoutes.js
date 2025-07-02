const express = require('express');
const AnalysisService = require('../services/analysisService');
const Transaction = require('../models/Transaction');
const { requireUser } = require('./middleware/auth');

const router = express.Router();

// Get spending categories analysis
router.get('/spending-categories', requireUser, async (req, res) => {
  try {
    console.log('Backend: Getting spending categories analysis for user:', req.user._id);
    console.log('Backend: Query parameters:', req.query);

    const filters = {
      dateRange: req.query.dateRange || 'this-month',
      startDate: req.query.startDate,
      endDate: req.query.endDate
    };

    const analysis = await AnalysisService.getCategoryAnalysis(req.user._id, filters);

    console.log('Backend: Returning spending categories analysis with', analysis.categories.length, 'categories');
    return res.status(200).json({
      success: true,
      data: analysis.categories,
      totalSpending: analysis.totalSpending,
      period: analysis.period,
      dateRange: analysis.dateRange
    });
  } catch (error) {
    console.error('Backend: Error getting spending categories analysis:', error.message);
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Get anomalies detection
router.get('/anomalies', requireUser, async (req, res) => {
  try {
    console.log('=== ANALYSIS ROUTES ANOMALIES START ===');
    console.log('Backend: Getting anomalies for user:', req.user._id);
    console.log('Backend: User exists:', !!req.user);
    console.log('Backend: User ID type:', typeof req.user._id);
    console.log('Backend: Query parameters:', req.query);

    // Let's first check if we can find ANY transactions for this user
    const allTransactions = await Transaction.find({ userId: req.user._id }).lean();
    console.log('Backend: DIRECT DB QUERY - Total transactions for user:', allTransactions.length);

    if (allTransactions.length > 0) {
      console.log('Backend: Sample transactions from direct query:');
      allTransactions.slice(0, 3).forEach((t, i) => {
        console.log(`  ${i + 1}. ID: ${t._id}, Amount: ${t.amount}, Merchant: ${t.merchant}, Date: ${t.date}`);
      });
    }

    const filters = {
      dateRange: req.query.dateRange || 'this-month',
      severityLevel: req.query.severityLevel || 'all'
    };

    console.log('Backend: Calling AnalysisService.detectAnomalies with filters:', filters);

    const anomaliesData = await AnalysisService.detectAnomalies(req.user._id, filters);

    console.log('Backend: AnalysisService returned:', {
      anomaliesCount: anomaliesData.anomalies?.length || 0,
      summary: anomaliesData.summary,
      period: anomaliesData.period
    });

    const responseData = {
      success: true,
      anomalies: anomaliesData.anomalies || [],
      summary: anomaliesData.summary || { total: 0, major: 0, moderate: 0, minor: 0 },
      period: anomaliesData.period
    };

    console.log('Backend: Sending response:', responseData);
    console.log('=== ANALYSIS ROUTES ANOMALIES END ===');

    return res.status(200).json(responseData);
  } catch (error) {
    console.error('=== ANALYSIS ROUTES ANOMALIES ERROR ===');
    console.error('Backend: Error getting anomalies:', error.message);
    console.error('Backend: Error stack:', error.stack);
    console.error('=== END ANALYSIS ROUTES ANOMALIES ERROR ===');
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;