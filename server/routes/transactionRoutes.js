const express = require('express');
const TransactionService = require('../services/transactionService');
const { requireUser } = require('./middleware/auth');

const router = express.Router();

// Add this enhanced logging at the very beginning of the GET / route, around line 8
router.get('/', requireUser, async (req, res) => {
  try {
    console.log('=== TRANSACTION ROUTE DEBUG START ===');
    console.log('Backend: Getting transactions for user:', req.user._id);
    console.log('Backend: Raw query object:', req.query);
    console.log('Backend: Query keys:', Object.keys(req.query));
    console.log('Backend: Query searchTerm specifically:', req.query.searchTerm);
    console.log('Backend: Query searchTerm type:', typeof req.query.searchTerm);
    console.log('Backend: Query searchTerm length:', req.query.searchTerm?.length);
    
    // Log each query parameter individually
    Object.entries(req.query).forEach(([key, value]) => {
      console.log(`Backend: Query param ${key} = "${value}" (type: ${typeof value})`);
    });
    console.log('=== TRANSACTION ROUTE DEBUG END ===');

    const result = await TransactionService.getTransactions(req.user._id, req.query);

    console.log('=== TRANSACTION ROUTE RESPONSE ===');
    console.log('Backend: Returning', result.transactions.length, 'transactions');
    console.log('Backend: Pagination:', result.pagination);
    console.log('=== END TRANSACTION ROUTE RESPONSE ===');

    return res.status(200).json({
      success: true,
      transactions: result.transactions,
      pagination: result.pagination
    });
  } catch (error) {
    console.error('Backend: Error getting transactions:', error.message);
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Get transaction by ID
router.get('/:id', requireUser, async (req, res) => {
  try {
    console.log('Backend: Getting transaction by ID:', req.params.id);

    const transaction = await TransactionService.getById(req.params.id, req.user._id);

    return res.status(200).json({
      success: true,
      transaction
    });
  } catch (error) {
    console.error('Backend: Error getting transaction by ID:', error.message);
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

    const transaction = await TransactionService.create(req.user._id, req.body, req.user.accountType);

    return res.status(201).json({
      success: true,
      message: 'Transaction created successfully',
      transaction
    });
  } catch (error) {
    console.error('Backend: Error creating transaction:', error.message);
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Update transaction
router.put('/:id', requireUser, async (req, res) => {
  try {
    console.log('Backend: Updating transaction:', req.params.id);

    const transaction = await TransactionService.update(req.params.id, req.user._id, req.body, req.user.accountType);

    return res.status(200).json({
      success: true,
      message: 'Transaction updated successfully',
      transaction
    });
  } catch (error) {
    console.error('Backend: Error updating transaction:', error.message);
    return res.status(500).json({
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
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Add voice note to transaction
router.post('/:id/voice-note', requireUser, async (req, res) => {
  try {
    console.log('=== BACKEND: ADD VOICE NOTE START ===');
    console.log('Backend: Adding voice note to transaction:', req.params.id);
    console.log('Backend: User ID:', req.user._id);
    console.log('Backend: Voice note data:', { hasAudioData: !!req.body.audioData, transcript: req.body.transcript });

    const transaction = await TransactionService.addVoiceNote(req.params.id, req.user._id, req.body);

    console.log('Backend: Voice note added successfully');
    console.log('Backend: Updated transaction hasNote:', transaction.hasNote);
    console.log('=== BACKEND: ADD VOICE NOTE END ===');

    return res.status(200).json({
      success: true,
      message: 'Voice note added successfully',
      transaction
    });
  } catch (error) {
    console.error('=== BACKEND: ADD VOICE NOTE ERROR ===');
    console.error('Backend: Error adding voice note:', error.message);
    console.error('Backend: Error stack:', error.stack);
    console.error('=== END BACKEND: ADD VOICE NOTE ERROR ===');
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Update transaction category
router.put('/:id/category', requireUser, async (req, res) => {
  try {
    console.log('Backend: Updating category for transaction:', req.params.id);

    const transaction = await TransactionService.updateCategory(req.params.id, req.user._id, req.body.category, req.user.accountType);

    return res.status(200).json({
      success: true,
      message: 'Category updated successfully',
      transaction
    });
  } catch (error) {
    console.error('Backend: Error updating category:', error.message);
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Mark anomaly as normal
router.post('/:id/mark-normal', requireUser, async (req, res) => {
  try {
    console.log('=== BACKEND: MARK ANOMALY AS NORMAL START ===');
    console.log('Backend: Marking anomaly as normal for transaction:', req.params.id);
    console.log('Backend: User ID:', req.user._id);

    const transaction = await TransactionService.markAnomalyAsNormal(req.params.id, req.user._id);

    console.log('Backend: Anomaly marked as normal successfully');
    console.log('Backend: Updated transaction hasAnomaly:', transaction.hasAnomaly);
    console.log('Backend: Updated transaction anomalyReason:', transaction.anomalyReason);
    console.log('=== BACKEND: MARK ANOMALY AS NORMAL END ===');

    return res.status(200).json({
      success: true,
      message: 'Anomaly marked as normal',
      transaction
    });
  } catch (error) {
    console.error('=== BACKEND: MARK ANOMALY AS NORMAL ERROR ===');
    console.error('Backend: Error marking anomaly as normal:', error.message);
    console.error('Backend: Error stack:', error.stack);
    console.error('=== END BACKEND: MARK ANOMALY AS NORMAL ERROR ===');
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Check policy compliance
router.post('/:id/compliance-check', requireUser, async (req, res) => {
  try {
    console.log('Backend: Checking policy compliance for transaction:', req.params.id);

    // This would need to be implemented in TransactionService
    return res.status(200).json({
      success: true,
      compliance: { status: 'compliant', rule: null }
    });
  } catch (error) {
    console.error('Backend: Error checking policy compliance:', error.message);
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;