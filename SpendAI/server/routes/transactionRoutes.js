const express = require('express');
const TransactionService = require('../services/transactionService');
const PolicyService = require('../services/policyService');
const AnalysisService = require('../services/analysisService');
const { requireUser } = require('./middleware/auth');

const router = express.Router();

// Get transactions list with filters
router.get('/', requireUser, async (req, res) => {
  try {
    console.log('Backend: Fetching transactions for user:', req.user._id);
    console.log('Backend: Query parameters:', req.query);

    const filters = {
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 20,
      category: req.query.category || '',
      searchTerm: req.query.searchTerm || '',
      dateRange: req.query.dateRange || 'this-month',
      anomaliesOnly: req.query.anomaliesOnly === 'true',
      policyStatus: req.query.policyStatus || '',
      sortBy: req.query.sortBy || 'recent'
    };

    const result = await TransactionService.getTransactions(req.user._id, filters);

    console.log('Backend: Returning', result.transactions.length, 'transactions');
    return res.status(200).json({
      success: true,
      ...result
    });
  } catch (error) {
    console.error('Backend: Error fetching transactions:', error.message);
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Create new transaction
router.post('/', requireUser, async (req, res) => {
  try {
    console.log('Backend: Creating transaction for user:', req.user._id);
    console.log('Backend: Transaction data:', req.body);

    const { amount, date, merchant, description, category, location } = req.body;

    // Validate required fields
    if (!amount || !merchant || !description) {
      return res.status(400).json({
        success: false,
        message: 'Amount, merchant, and description are required'
      });
    }

    const transactionData = {
      amount: parseFloat(amount),
      date: date ? new Date(date) : new Date(),
      merchant,
      description,
      category: category || 'other',
      location: location || 'Unknown'
    };

    const transaction = await TransactionService.create(
      req.user._id,
      transactionData,
      req.user.accountType
    );

    console.log('Backend: Transaction created successfully');
    return res.status(201).json({
      success: true,
      message: 'Transaction created successfully',
      transaction
    });
  } catch (error) {
    console.error('Backend: Error creating transaction:', error.message);
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// Check transaction for anomalies (before creating)
router.post('/check-anomaly', requireUser, async (req, res) => {
  try {
    console.log('Backend: Checking transaction anomaly for user:', req.user._id);
    console.log('Backend: Transaction data:', req.body);

    const { amount, category, merchant } = req.body;

    if (!amount || !category) {
      return res.status(400).json({
        success: false,
        message: 'Amount and category are required'
      });
    }

    const transactionData = {
      amount: parseFloat(amount),
      category,
      merchant: merchant || 'Unknown'
    };

    const anomalyResult = await TransactionService.detectAnomaly(req.user._id, transactionData);

    console.log('Backend: Anomaly check completed:', anomalyResult);
    return res.status(200).json({
      success: true,
      anomaly: anomalyResult
    });
  } catch (error) {
    console.error('Backend: Error checking anomaly:', error.message);
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Get single transaction by ID
router.get('/:id', requireUser, async (req, res) => {
  try {
    console.log('Backend: Fetching transaction:', req.params.id);

    const transaction = await TransactionService.getById(req.params.id, req.user._id);

    return res.status(200).json({
      success: true,
      transaction
    });
  } catch (error) {
    console.error('Backend: Error fetching transaction:', error.message);
    return res.status(404).json({
      success: false,
      message: error.message
    });
  }
});

// Update transaction
router.put('/:id', requireUser, async (req, res) => {
  try {
    console.log('Backend: Updating transaction:', req.params.id);
    console.log('Backend: Update data:', req.body);

    const updatedTransaction = await TransactionService.update(
      req.params.id,
      req.user._id,
      req.body,
      req.user.accountType
    );

    return res.status(200).json({
      success: true,
      message: 'Transaction updated successfully',
      transaction: updatedTransaction
    });
  } catch (error) {
    console.error('Backend: Error updating transaction:', error.message);
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// Delete transaction
router.delete('/:id', requireUser, async (req, res) => {
  try {
    console.log('Backend: Deleting transaction:', req.params.id);

    await TransactionService.delete(req.params.id, req.user._id);

    return res.status(200).json({
      success: true,
      message: 'Transaction deleted successfully'
    });
  } catch (error) {
    console.error('Backend: Error deleting transaction:', error.message);
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// Add voice note to transaction
router.post('/:id/voice-note', requireUser, async (req, res) => {
  try {
    console.log('Backend: Adding voice note to transaction:', req.params.id);

    const { audioData, transcript } = req.body;

    if (!audioData) {
      return res.status(400).json({
        success: false,
        message: 'Audio data is required'
      });
    }

    const transaction = await TransactionService.addVoiceNote(
      req.params.id,
      req.user._id,
      { audioData, transcript }
    );

    return res.status(200).json({
      success: true,
      message: 'Voice note added successfully',
      transaction
    });
  } catch (error) {
    console.error('Backend: Error adding voice note:', error.message);
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// Update transaction category
router.put('/:id/category', requireUser, async (req, res) => {
  try {
    console.log('Backend: Updating category for transaction:', req.params.id);

    const { category } = req.body;

    if (!category) {
      return res.status(400).json({
        success: false,
        message: 'Category is required'
      });
    }

    const transaction = await TransactionService.updateCategory(
      req.params.id,
      req.user._id,
      category,
      req.user.accountType
    );

    return res.status(200).json({
      success: true,
      message: 'Category updated successfully',
      transaction
    });
  } catch (error) {
    console.error('Backend: Error updating category:', error.message);
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// Mark anomaly as normal
router.post('/:id/mark-normal', requireUser, async (req, res) => {
  try {
    console.log('Backend: Marking anomaly as normal for transaction:', req.params.id);

    const transaction = await TransactionService.markAnomalyAsNormal(
      req.params.id,
      req.user._id
    );

    return res.status(200).json({
      success: true,
      message: 'Transaction marked as normal',
      transaction
    });
  } catch (error) {
    console.error('Backend: Error marking anomaly as normal:', error.message);
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// Mark transaction as expected (alias for mark-normal)
router.post('/:id/mark-expected', requireUser, async (req, res) => {
  try {
    console.log('Backend: Marking transaction as expected:', req.params.id);

    const transaction = await TransactionService.markAnomalyAsNormal(
      req.params.id,
      req.user._id
    );

    return res.status(200).json({
      success: true,
      message: 'Transaction marked as expected',
      transaction
    });
  } catch (error) {
    console.error('Backend: Error marking transaction as expected:', error.message);
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// Check policy compliance for a transaction
router.post('/:id/compliance-check', requireUser, async (req, res) => {
  try {
    console.log('Backend: Checking policy compliance for transaction:', req.params.id);

    const transaction = await TransactionService.getById(req.params.id, req.user._id);
    const userTransactions = await TransactionService.getTransactions(req.user._id, {});

    const complianceResult = await PolicyService.checkCompliance(
      transaction,
      req.user.accountType,
      userTransactions.transactions,
      req.user._id
    );

    return res.status(200).json({
      success: true,
      compliance: complianceResult
    });
  } catch (error) {
    console.error('Backend: Error checking policy compliance:', error.message);
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;