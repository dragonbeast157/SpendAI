const express = require('express');
const AnalysisService = require('../services/analysisService');
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
    console.log('Backend: Getting anomalies for user:', req.user._id);
    console.log('Backend: Query parameters:', req.query);

    const filters = {
      dateRange: req.query.dateRange || 'this-month',
      severityLevel: req.query.severityLevel || 'all'
    };

    const anomaliesData = await AnalysisService.detectAnomalies(req.user._id, filters);

    console.log('Backend: Returning', anomaliesData.anomalies.length, 'anomalies');
    return res.status(200).json({
      success: true,
      anomalies: anomaliesData.anomalies,
      summary: anomaliesData.summary,
      period: anomaliesData.period
    });
  } catch (error) {
    console.error('Backend: Error getting anomalies:', error.message);
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;