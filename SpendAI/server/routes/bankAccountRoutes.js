const express = require('express');
const multer = require('multer');
const BankAccountService = require('../services/bankAccountService');
const { requireUser } = require('./middleware/auth');

const router = express.Router();

// Configure multer for file uploads with better error handling
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 1 * 1024 * 1024 // 1MB limit for infrastructure compatibility
  },
  fileFilter: (req, file, cb) => {
    console.log('Backend: File filter - checking file:', file.originalname, file.mimetype);

    const allowedTypes = ['text/csv', 'application/pdf', 'application/vnd.ms-excel'];
    const allowedExtensions = ['.csv', '.pdf'];

    const hasValidType = allowedTypes.includes(file.mimetype);
    const hasValidExtension = allowedExtensions.some(ext =>
      file.originalname.toLowerCase().endsWith(ext)
    );

    if (hasValidType || hasValidExtension) {
      console.log('Backend: File type accepted');
      cb(null, true);
    } else {
      console.log('Backend: File type rejected:', file.mimetype);
      cb(new Error('Invalid file type. Only CSV and PDF files are allowed.'));
    }
  }
});

// Error handling middleware for multer
const handleMulterError = (error, req, res, next) => {
  console.error('Backend: Multer error:', error.message);
  
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File size too large. Maximum size is 1MB.'
      });
    }
  }
  
  return res.status(400).json({
    success: false,
    message: error.message
  });
};

// Get all bank accounts for the current user
router.get('/', requireUser, async (req, res) => {
  try {
    console.log('Backend: Fetching bank accounts for user:', req.user._id);

    const accounts = await BankAccountService.getByUserId(req.user._id);

    console.log('Backend: Retrieved', accounts.length, 'bank accounts');
    return res.status(200).json({
      success: true,
      accounts: accounts
    });
  } catch (error) {
    console.error('Backend: Error fetching bank accounts:', error.message);
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Create a new bank account connection
router.post('/', requireUser, async (req, res) => {
  try {
    console.log('Backend: Creating bank account for user:', req.user._id);
    console.log('Backend: Request body:', { ...req.body, credentials: '[HIDDEN]' });

    const accountData = req.body;

    // Validate required fields
    if (!accountData.bankName || !accountData.accountNumber) {
      return res.status(400).json({
        success: false,
        message: 'Bank name and account number are required'
      });
    }

    const newAccount = await BankAccountService.create(req.user._id, accountData);

    console.log('Backend: Bank account created successfully');
    return res.status(201).json({
      success: true,
      message: 'Bank account connected successfully',
      account: newAccount
    });
  } catch (error) {
    console.error('Backend: Error creating bank account:', error.message);
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// Get single bank account by ID
router.get('/:accountId', requireUser, async (req, res) => {
  try {
    console.log('Backend: Fetching bank account:', req.params.accountId);

    const account = await BankAccountService.getById(req.params.accountId, req.user._id);

    return res.status(200).json({
      success: true,
      account: account
    });
  } catch (error) {
    console.error('Backend: Error fetching bank account:', error.message);
    return res.status(404).json({
      success: false,
      message: error.message
    });
  }
});

// Update bank account
router.put('/:accountId', requireUser, async (req, res) => {
  try {
    console.log('Backend: Updating bank account:', req.params.accountId);

    const updatedAccount = await BankAccountService.update(
      req.params.accountId,
      req.user._id,
      req.body
    );

    return res.status(200).json({
      success: true,
      message: 'Bank account updated successfully',
      account: updatedAccount
    });
  } catch (error) {
    console.error('Backend: Error updating bank account:', error.message);
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// Delete/disconnect bank account
router.delete('/:accountId', requireUser, async (req, res) => {
  try {
    console.log('Backend: Deleting bank account:', req.params.accountId);

    await BankAccountService.delete(req.params.accountId, req.user._id);

    return res.status(200).json({
      success: true,
      message: 'Bank account disconnected successfully'
    });
  } catch (error) {
    console.error('Backend: Error deleting bank account:', error.message);
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// Upload bank statement
router.post('/:accountId/statements', requireUser, upload.single('statement'), handleMulterError, async (req, res) => {
  try {
    console.log('Backend: Processing statement upload for account:', req.params.accountId);

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    console.log('Backend: File details:', {
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size
    });

    const result = await BankAccountService.processStatement(
      req.params.accountId,
      req.user._id,
      req.file.buffer,
      req.file.originalname
    );

    return res.status(200).json({
      success: true,
      message: 'Statement processed successfully',
      ...result
    });
  } catch (error) {
    console.error('Backend: Error processing statement:', error.message);
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// Get supported banks list
router.get('/supported-banks', async (req, res) => {
  try {
    console.log('Backend: Fetching supported banks list');

    // In a real implementation, this would come from a bank API provider like Plaid
    const supportedBanks = [
      {
        _id: 'chase',
        name: 'Chase Bank',
        isPopular: true,
        logo: '/logos/chase.png'
      },
      {
        _id: 'wellsfargo',
        name: 'Wells Fargo',
        isPopular: true,
        logo: '/logos/wellsfargo.png'
      },
      {
        _id: 'bankofamerica',
        name: 'Bank of America',
        isPopular: true,
        logo: '/logos/boa.png'
      },
      {
        _id: 'citi',
        name: 'Citibank',
        isPopular: true,
        logo: '/logos/citi.png'
      },
      {
        _id: 'usbank',
        name: 'U.S. Bank',
        isPopular: false,
        logo: '/logos/usbank.png'
      },
      {
        _id: 'pnc',
        name: 'PNC Bank',
        isPopular: false,
        logo: '/logos/pnc.png'
      },
      {
        _id: 'capitalone',
        name: 'Capital One',
        isPopular: false,
        logo: '/logos/capitalone.png'
      },
      {
        _id: 'tdbank',
        name: 'TD Bank',
        isPopular: false,
        logo: '/logos/tdbank.png'
      }
    ];

    console.log('Backend: Retrieved', supportedBanks.length, 'supported banks');
    return res.status(200).json({
      success: true,
      banks: supportedBanks
    });
  } catch (error) {
    console.error('Backend: Error fetching supported banks:', error.message);
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Connect to a specific bank by ID
router.post('/connect/:bankId', requireUser, async (req, res) => {
  try {
    console.log('Backend: Connecting to bank:', req.params.bankId, 'for user:', req.user._id);

    const bankId = req.params.bankId;
    
    // In a real implementation, this would:
    // 1. Generate OAuth URL for the specific bank
    // 2. Redirect user to bank's authorization page
    // 3. Handle callback and exchange code for access token
    // 4. Fetch account details from bank API
    
    // For demo purposes, we'll simulate the OAuth flow
    const authUrl = `https://api.bank-provider.com/oauth/authorize?bank=${bankId}&redirect_uri=${encodeURIComponent('http://localhost:5173/bank-callback')}`;

    console.log('Backend: Generated auth URL for bank connection');
    return res.status(200).json({
      success: true,
      authUrl: authUrl,
      message: 'Redirecting to bank authorization'
    });
  } catch (error) {
    console.error('Backend: Error connecting to bank:', error.message);
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// Disconnect bank account
router.post('/disconnect/:accountId', requireUser, async (req, res) => {
  try {
    console.log('Backend: Disconnecting bank account:', req.params.accountId);

    await BankAccountService.delete(req.params.accountId, req.user._id);

    return res.status(200).json({
      success: true,
      message: 'Bank account disconnected successfully'
    });
  } catch (error) {
    console.error('Backend: Error disconnecting bank account:', error.message);
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// Upload bank statement (general endpoint without specific account)
router.post('/upload-statement', requireUser, upload.single('statement'), handleMulterError, async (req, res) => {
  try {
    console.log('Backend: Processing general statement upload for user:', req.user._id);

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    console.log('Backend: File details:', {
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size
    });

    // For general upload, we'll create a temporary account or use the first available account
    const userAccounts = await BankAccountService.getByUserId(req.user._id);
    let targetAccountId;

    if (userAccounts.length > 0) {
      targetAccountId = userAccounts[0]._id;
      console.log('Backend: Using existing account:', targetAccountId);
    } else {
      // Create a temporary account for statement upload
      const tempAccount = await BankAccountService.create(req.user._id, {
        bankName: 'Manual Upload',
        accountNumber: 'MANUAL-' + Date.now(),
        accountType: 'personal',
        credentials: { username: 'manual', password: 'manual' }
      });
      targetAccountId = tempAccount._id;
      console.log('Backend: Created temporary account:', targetAccountId);
    }

    console.log('Backend: Processing statement with account ID:', targetAccountId);
    const result = await BankAccountService.processStatement(
      targetAccountId,
      req.user._id,
      req.file.buffer,
      req.file.originalname
    );

    console.log('Backend: Statement processing result:', result);
    console.log('Backend: Transaction count:', result.transactionCount);

    const response = {
      success: true,
      message: 'Statement processed successfully',
      ...result
    };

    console.log('Backend: Sending response:', response);
    return res.status(200).json(response);
  } catch (error) {
    console.error('Backend: Error processing general statement:', error.message);
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;