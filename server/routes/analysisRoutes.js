const express = require('express');
const AnalysisService = require('../services/analysisService');
const Transaction = require('../models/Transaction');
const { requireUser } = require('./middleware/auth');

const router = express.Router();

// Add a simple test route first
router.get('/test', (req, res) => {
  console.log('=== ANALYSIS ROUTES TEST ===');
  console.log('Analysis routes are working');
  res.json({ 
    success: true, 
    message: 'Analysis routes are working',
    timestamp: new Date().toISOString()
  });
});

// Add a test route that requires authentication
router.get('/test-auth', requireUser, async (req, res) => {
  console.log('=== ANALYSIS ROUTES AUTH TEST ===');
  console.log('User:', req.user._id);
  
  try {
    const transactionCount = await Transaction.countDocuments({ userId: req.user._id });
    console.log('User transaction count:', transactionCount);
    
    res.json({ 
      success: true, 
      message: 'Analysis routes with auth are working',
      userId: req.user._id,
      transactionCount: transactionCount
    });
  } catch (error) {
    console.error('Auth test error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

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
    console.log('Backend: Request received at /api/analysis/anomalies');
    console.log('Backend: Request method:', req.method);
    console.log('Backend: Request URL:', req.url);
    console.log('Backend: Request query:', req.query);
    console.log('Backend: Getting anomalies for user:', req.user._id);
    console.log('Backend: User exists:', !!req.user);
    console.log('Backend: User ID type:', typeof req.user._id);
    console.log('Backend: User object:', JSON.stringify(req.user, null, 2));

    // Test basic database connection
    console.log('Backend: Testing basic database connection...');
    try {
      const mongoose = require('mongoose');
      console.log('Backend: Mongoose connection state:', mongoose.connection.readyState);
      console.log('Backend: Mongoose connection states: 0=disconnected, 1=connected, 2=connecting, 3=disconnecting');

      if (mongoose.connection.readyState !== 1) {
        console.error('Backend: DATABASE NOT CONNECTED! Connection state:', mongoose.connection.readyState);
        return res.status(500).json({
          success: false,
          message: 'Database connection error'
        });
      }
    } catch (dbError) {
      console.error('Backend: Database connection test failed:', dbError);
      return res.status(500).json({
        success: false,
        message: 'Database connection test failed'
      });
    }

    // Test if Transaction model is accessible
    console.log('Backend: Testing Transaction model access...');
    try {
      const transactionCount = await Transaction.countDocuments({});
      console.log('Backend: TOTAL transactions in database (all users):', transactionCount);
    } catch (modelError) {
      console.error('Backend: Transaction model access failed:', modelError);
      return res.status(500).json({
        success: false,
        message: 'Transaction model access failed'
      });
    }

    // Test user-specific query
    console.log('Backend: Testing user-specific transaction query...');
    try {
      const userTransactionCount = await Transaction.countDocuments({ userId: req.user._id });
      console.log('Backend: Total transactions for this user (count only):', userTransactionCount);

      if (userTransactionCount === 0) {
        console.log('Backend: USER HAS NO TRANSACTIONS - returning empty result');
        return res.status(200).json({
          success: true,
          anomalies: [],
          summary: { total: 0, major: 0, moderate: 0, minor: 0 },
          period: req.query.dateRange || 'this-month',
          message: 'No transactions found for user'
        });
      }
    } catch (userQueryError) {
      console.error('Backend: User transaction count query failed:', userQueryError);
      return res.status(500).json({
        success: false,
        message: 'User transaction query failed'
      });
    }

    // Get actual transaction data
    console.log('Backend: Fetching actual transaction data...');
    const allTransactions = await Transaction.find({ userId: req.user._id }).lean();
    console.log('Backend: Successfully fetched transactions count:', allTransactions.length);

    if (allTransactions.length === 0) {
      console.log('Backend: NO TRANSACTIONS FOUND for user after full query');
      return res.status(200).json({
        success: true,
        anomalies: [],
        summary: { total: 0, major: 0, moderate: 0, minor: 0 },
        period: req.query.dateRange || 'this-month',
        message: 'No transactions found for user'
      });
    }

    // Log sample transactions to verify data structure
    console.log('Backend: Sample transactions from database:');
    allTransactions.slice(0, 5).forEach((t, i) => {
      console.log(`  Transaction ${i + 1}:`, {
        id: t._id,
        userId: t.userId,
        amount: t.amount,
        merchant: t.merchant,
        date: t.date,
        category: t.category,
        hasAnomaly: t.hasAnomaly,
        hasAnomalyType: typeof t.hasAnomaly
      });
    });

    // Check for large transactions that should be obvious anomalies
    const largeTransactions = allTransactions.filter(t => Math.abs(t.amount) > 500);
    console.log('Backend: Large transactions (>$500) found:', largeTransactions.length);
    largeTransactions.forEach((t, i) => {
      console.log(`  Large transaction ${i + 1}:`, {
        id: t._id,
        amount: t.amount,
        merchant: t.merchant,
        category: t.category,
        hasAnomaly: t.hasAnomaly
      });
    });

    // Check for specific merchants that might be anomalies
    const bunningsTransactions = allTransactions.filter(t => t.merchant && t.merchant.toLowerCase().includes('bunnings'));
    console.log('Backend: Bunnings transactions found:', bunningsTransactions.length);
    bunningsTransactions.forEach((t, i) => {
      console.log(`  Bunnings transaction ${i + 1}:`, {
        id: t._id,
        amount: t.amount,
        merchant: t.merchant,
        category: t.category,
        hasAnomaly: t.hasAnomaly
      });
    });

    // Now proceed with anomaly detection
    const filters = {
      dateRange: req.query.dateRange || 'this-month',
      severityLevel: req.query.severityLevel || 'all'
    };

    console.log('Backend: Proceeding with AnalysisService.detectAnomalies...');
    console.log('Backend: Filters for anomaly detection:', filters);

    const anomaliesData = await AnalysisService.detectAnomalies(req.user._id, filters);

    console.log('Backend: AnalysisService completed');
    console.log('Backend: Anomalies data returned:', {
      anomaliesCount: anomaliesData.anomalies?.length || 0,
      summary: anomaliesData.summary,
      period: anomaliesData.period
    });

    if (anomaliesData.anomalies && anomaliesData.anomalies.length > 0) {
      console.log('Backend: Anomalies found by service:');
      anomaliesData.anomalies.forEach((anomaly, index) => {
        console.log(`  Service anomaly ${index + 1}:`, {
          id: anomaly._id,
          merchant: anomaly.merchant,
          amount: anomaly.amount,
          category: anomaly.category,
          hasAnomaly: anomaly.hasAnomaly,
          severity: anomaly.anomalyDetails?.severity,
          reason: anomaly.anomalyReason
        });
      });
    } else {
      console.log('Backend: NO ANOMALIES returned by service');
    }

    const responseData = {
      success: true,
      anomalies: anomaliesData.anomalies || [],
      summary: anomaliesData.summary || { total: 0, major: 0, moderate: 0, minor: 0 },
      period: anomaliesData.period,
      debug: {
        totalTransactions: allTransactions.length,
        largeTransactions: largeTransactions.length,
        bunningsTransactions: bunningsTransactions.length
      }
    };

    console.log('Backend: Final response data:', {
      success: responseData.success,
      anomaliesCount: responseData.anomalies.length,
      summary: responseData.summary,
      debug: responseData.debug
    });

    console.log('=== ANALYSIS ROUTES ANOMALIES END ===');
    return res.status(200).json(responseData);

  } catch (error) {
    console.error('=== ANALYSIS ROUTES ANOMALIES ERROR ===');
    console.error('Backend: Error getting anomalies:', error);
    console.error('Backend: Error name:', error.name);
    console.error('Backend: Error message:', error.message);
    console.error('Backend: Error stack:', error.stack);
    console.error('=== END ANALYSIS ROUTES ANOMALIES ERROR ===');
    return res.status(500).json({
      success: false,
      message: error.message,
      error: error.stack
    });
  }
});

module.exports = router;