const express = require('express');
const BankAccountService = require('../services/bankAccountService');
const { requireUser } = require('./middleware/auth');
const { uploadMiddleware } = require('../middleware/uploadMiddleware');

const router = express.Router();

// Get all bank accounts for user
router.get('/', requireUser, async (req, res) => {
  try {
    console.log('Backend: Fetching bank accounts for user:', req.user._id);

    const result = await BankAccountService.getAccounts(req.user._id);

    console.log('Backend: Returning', result.accounts.length, 'bank accounts');
    return res.status(200).json(result);
  } catch (error) {
    console.error('Backend: Error fetching bank accounts:', error.message);
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Get supported banks
router.get('/supported-banks', requireUser, async (req, res) => {
  try {
    console.log('Backend: Fetching supported banks');

    const result = await BankAccountService.getSupportedBanks();

    console.log('Backend: Returning', result.banks.length, 'supported banks');
    return res.status(200).json(result);
  } catch (error) {
    console.error('Backend: Error fetching supported banks:', error.message);
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Connect new bank account
router.post('/connect', requireUser, async (req, res) => {
  try {
    console.log('Backend: Connecting bank account for user:', req.user._id);
    console.log('Backend: Bank account data:', req.body);

    const bankAccount = await BankAccountService.create(req.user._id, req.body);

    console.log('Backend: Bank account connected successfully');
    return res.status(201).json({
      success: true,
      message: 'Bank account connected successfully',
      account: bankAccount
    });
  } catch (error) {
    console.error('Backend: Error connecting bank account:', error.message);
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Connect to a bank by bank ID (for bank selection modal)
router.post('/connect/:bankId', requireUser, async (req, res) => {
  try {
    console.log('Backend: Connecting to bank:', req.params.bankId, 'for user:', req.user._id);

    const result = await BankAccountService.connectToBank(req.user._id, req.params.bankId);

    console.log('Backend: Bank connection initiated successfully');
    return res.status(200).json(result);
  } catch (error) {
    console.error('Backend: Error connecting to bank:', error.message);
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Disconnect bank account
router.delete('/:accountId', requireUser, async (req, res) => {
  try {
    console.log('Backend: Disconnecting bank account:', req.params.accountId);

    await BankAccountService.delete(req.params.accountId, req.user._id);

    console.log('Backend: Bank account disconnected successfully');
    return res.status(200).json({
      success: true,
      message: 'Bank account disconnected successfully'
    });
  } catch (error) {
    console.error('Backend: Error disconnecting bank account:', error.message);
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Disconnect bank account (alternative endpoint for POST method)
router.post('/disconnect/:accountId', requireUser, async (req, res) => {
  try {
    console.log('Backend: Disconnecting bank account (POST):', req.params.accountId);

    await BankAccountService.delete(req.params.accountId, req.user._id);

    console.log('Backend: Bank account disconnected successfully');
    return res.status(200).json({
      success: true,
      message: 'Bank account disconnected successfully'
    });
  } catch (error) {
    console.error('Backend: Error disconnecting bank account:', error.message);
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Upload bank statement (general endpoint)
router.post('/upload-statement', requireUser, uploadMiddleware, async (req, res) => {
  try {
    console.log('=== BACKEND: UPLOAD STATEMENT ROUTE START ===');
    console.log('Backend: Processing general statement upload for user:', req.user._id);
    console.log('Backend: Request headers:', {
      'content-type': req.headers['content-type'],
      'content-length': req.headers['content-length']
    });
    
    if (!req.file) {
      console.error('Backend: No file received in request');
      console.log('Backend: req.body:', req.body);
      console.log('Backend: req.files:', req.files);
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    console.log('Backend: File received successfully:', {
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
      fieldname: req.file.fieldname,
      path: req.file.path,
      filename: req.file.filename
    });

    console.log('Backend: Calling BankAccountService.processGeneralStatement...');
    const result = await BankAccountService.processGeneralStatement(req.user._id, req.file);

    console.log('Backend: Service returned result:', {
      success: result.success,
      transactionCount: result.transactionCount,
      duplicatesSkipped: result.duplicatesSkipped,
      message: result.message
    });
    console.log('=== BACKEND: UPLOAD STATEMENT ROUTE SUCCESS ===');
    return res.status(200).json(result);

  } catch (error) {
    console.error('=== BACKEND: UPLOAD STATEMENT ROUTE ERROR ===');
    console.error('Backend: Error processing general statement:', error.message);
    console.error('Backend: Error stack:', error.stack);
    console.error('=== END BACKEND ERROR ===');
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Upload statement for specific account
router.post('/:accountId/upload-statement', requireUser, uploadMiddleware, async (req, res) => {
  try {
    console.log('Backend: Processing statement upload for account:', req.params.accountId);

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    const result = await BankAccountService.processStatement(
      req.user._id,
      req.params.accountId,
      req.file
    );

    console.log('Backend: Statement processed successfully');
    return res.status(200).json(result);
  } catch (error) {
    console.error('Backend: Error processing statement:', error.message);
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;