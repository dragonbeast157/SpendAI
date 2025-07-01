const express = require('express');
const AnalyticsService = require('../services/analyticsService');
const { requireUser } = require('./middleware/auth');

const router = express.Router();

// Get spending analytics overview
router.get('/spending/overview', requireUser, async (req, res) => {
  try {
    console.log('Backend: Getting spending overview for user:', req.user._id);
    console.log('Backend: Query parameters:', req.query);

    const filters = {
      period: req.query.period || '6-months',
      categories: req.query.categories ? req.query.categories.split(',') : []
    };

    const overview = await AnalyticsService.getSpendingOverview(req.user._id, filters);

    console.log('Backend: Returning spending overview with trends for', overview.monthlyComparison.data.length, 'months');
    return res.status(200).json({
      success: true,
      ...overview
    });
  } catch (error) {
    console.error('Backend: Error getting spending overview:', error.message);
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Get savings opportunities
router.get('/savings/opportunities', requireUser, async (req, res) => {
  try {
    console.log('Backend: Getting savings opportunities for user:', req.user._id);

    const opportunities = await AnalyticsService.getSavingsOpportunities(req.user._id);

    console.log('Backend: Returning', opportunities.length, 'savings opportunities');
    return res.status(200).json({
      success: true,
      opportunities
    });
  } catch (error) {
    console.error('Backend: Error getting savings opportunities:', error.message);
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;