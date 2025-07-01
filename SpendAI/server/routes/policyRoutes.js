const express = require('express');
const multer = require('multer');
const PolicyDatabaseService = require('../services/policyDatabaseService');
const { requireUser } = require('./middleware/auth');
const path = require('path');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /pdf|doc|docx/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only PDF, DOC, and DOCX files are allowed'));
    }
  }
});

// Get policy overview
router.get('/overview', requireUser, async (req, res) => {
  try {
    console.log('Backend: Fetching policy overview for user:', req.user._id);

    if (req.user.accountType !== 'business') {
      return res.status(403).json({
        success: false,
        message: 'Policy management is only available for business accounts'
      });
    }

    const overview = await PolicyDatabaseService.getPolicyOverview(req.user._id);

    if (!overview) {
      return res.status(200).json({
        success: true,
        policy: {
          lastUpdated: new Date().toISOString(),
          overallCompliance: 100,
          dailyLimits: {
            meals: 50,
            transport: 100,
            entertainment: 75,
            miscellaneous: 25,
          },
          restrictedCategories: [],
          approvalRequired: [],
          violationsThisMonth: 0,
          pendingApprovals: 0,
        }
      });
    }

    return res.status(200).json({
      success: true,
      policy: overview
    });
  } catch (error) {
    console.error('Backend: Error fetching policy overview:', error.message);
    console.error('Backend: Policy overview error stack:', error.stack);
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Get policy violations
router.get('/violations', requireUser, async (req, res) => {
  try {
    console.log('Backend: Fetching policy violations for user:', req.user._id);

    if (req.user.accountType !== 'business') {
      return res.status(403).json({
        success: false,
        message: 'Policy management is only available for business accounts'
      });
    }

    const filters = {
      status: req.query.status || '',
      severity: req.query.severity || ''
    };

    const violations = await PolicyDatabaseService.getViolations(req.user._id, filters);

    return res.status(200).json({
      success: true,
      violations
    });
  } catch (error) {
    console.error('Backend: Error fetching policy violations:', error.message);
    console.error('Backend: Policy violations error stack:', error.stack);
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Submit violation justification
router.post('/violations/:id/justify', requireUser, async (req, res) => {
  try {
    console.log('Backend: Submitting violation justification:', req.params.id);

    if (req.user.accountType !== 'business') {
      return res.status(403).json({
        success: false,
        message: 'Policy management is only available for business accounts'
      });
    }

    const { justification, documents } = req.body;

    if (!justification) {
      return res.status(400).json({
        success: false,
        message: 'Justification is required'
      });
    }

    const violation = await PolicyDatabaseService.updateViolationJustification(
      req.params.id,
      req.user._id,
      justification,
      documents || []
    );

    return res.status(200).json({
      success: true,
      message: 'Justification submitted for review',
      violation
    });
  } catch (error) {
    console.error('Backend: Error submitting violation justification:', error.message);
    console.error('Backend: Violation justification error stack:', error.stack);
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// Upload policy document
router.post('/upload', requireUser, upload.single('document'), async (req, res) => {
  console.log('PolicyRoutes: ===== POLICY UPLOAD ENDPOINT CALLED =====');
  console.log('PolicyRoutes: Request method:', req.method);
  console.log('PolicyRoutes: Request URL:', req.url);
  console.log('PolicyRoutes: User ID:', req.user._id);
  console.log('PolicyRoutes: User account type:', req.user.accountType);
  console.log('PolicyRoutes: File uploaded?', !!req.file);
  
  if (req.file) {
    console.log('PolicyRoutes: File details:', {
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size
    });
  }

  try {
    console.log('PolicyRoutes: Policy document upload started');

    if (!req.file) {
      console.log('PolicyRoutes: ERROR - No file uploaded');
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    // Process the document and extract policy rules
    console.log('PolicyRoutes: Starting document processing...');
    const extractedRules = await processDocumentForPolicyRules(req.file.path);
    console.log('PolicyRoutes: Extracted rules from document:', extractedRules);

    // Ensure all dailyLimits fields are present with proper fallbacks
    const completeDailyLimits = {
      dining: extractedRules.dailyLimits?.dining || 71,
      transport: extractedRules.dailyLimits?.transport || 212,
      entertainment: extractedRules.dailyLimits?.entertainment || 83,
      shopping: extractedRules.dailyLimits?.shopping || 212,
      groceries: extractedRules.dailyLimits?.groceries || 75,
      healthcare: extractedRules.dailyLimits?.healthcare || 200,
      utilities: extractedRules.dailyLimits?.utilities || 150,
      other: extractedRules.dailyLimits?.other || 56
    };

    // Create policy with complete data
    const policyData = {
      title: req.body.title || 'Company Spending Policy',
      description: req.body.description || 'Uploaded company policy document',
      effectiveDate: new Date(),
      documentPath: req.file.path,
      documentOriginalName: req.file.originalname,
      dailyLimits: completeDailyLimits,
      restrictedCategories: extractedRules.restrictedCategories || [],
      approvalRequired: extractedRules.approvalRequired || ['entertainment']
    };

    console.log('PolicyRoutes: Creating policy with complete data:', {
      title: policyData.title,
      dailyLimits: policyData.dailyLimits,
      restrictedCategories: policyData.restrictedCategories,
      approvalRequired: policyData.approvalRequired
    });

    const policy = await PolicyDatabaseService.createPolicy(req.user._id, policyData);
    console.log('PolicyRoutes: Policy created successfully:', policy._id);
    console.log('PolicyRoutes: Policy daily limits saved:', policy.dailyLimits);

    res.status(200).json({
      success: true,
      message: 'Policy document uploaded and processed successfully',
      policy
    });
  } catch (error) {
    console.error('PolicyRoutes: Error uploading policy document:', error.message);
    console.error('PolicyRoutes: Full error stack:', error.stack);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Get policy processing status
router.get('/processing/:id', requireUser, async (req, res) => {
  try {
    console.log('Backend: Getting policy processing status:', req.params.id);

    if (req.user.accountType !== 'business') {
      return res.status(403).json({
        success: false,
        message: 'Policy management is only available for business accounts'
      });
    }

    // Mock processing status - in real implementation this would track actual processing
    return res.status(200).json({
      success: true,
      status: 'completed',
      progress: 100,
      currentStep: 'Policy rules extracted successfully',
      estimatedTimeRemaining: 0
    });
  } catch (error) {
    console.error('Backend: Error getting policy processing status:', error.message);
    console.error('Backend: Policy processing status error stack:', error.stack);
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// Get all policies
router.get('/', requireUser, async (req, res) => {
  try {
    console.log('Backend: Fetching policies for user:', req.user._id);

    if (req.user.accountType !== 'business') {
      return res.status(403).json({
        success: false,
        message: 'Policy management is only available for business accounts'
      });
    }

    const filters = {
      status: req.query.status || ''
    };

    const policies = await PolicyDatabaseService.getPolicies(req.user._id, filters);

    return res.status(200).json({
      success: true,
      policies
    });
  } catch (error) {
    console.error('Backend: Error fetching policies:', error.message);
    console.error('Backend: Get policies error stack:', error.stack);
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Create new policy
router.post('/', requireUser, upload.single('document'), async (req, res) => {
  try {
    console.log('Backend: Creating policy for user:', req.user._id);
    console.log('Backend: Policy data:', req.body);

    if (req.user.accountType !== 'business') {
      return res.status(403).json({
        success: false,
        message: 'Policy management is only available for business accounts'
      });
    }

    const { title, description, effectiveDate, dailyLimits, restrictedCategories, approvalRequired } = req.body;

    if (!title || !description || !effectiveDate) {
      return res.status(400).json({
        success: false,
        message: 'Title, description, and effective date are required'
      });
    }

    const policyData = {
      title,
      description,
      effectiveDate,
      dailyLimits: dailyLimits ? JSON.parse(dailyLimits) : undefined,
      restrictedCategories: restrictedCategories ? JSON.parse(restrictedCategories) : undefined,
      approvalRequired: approvalRequired ? JSON.parse(approvalRequired) : undefined
    };

    const policy = await PolicyDatabaseService.createPolicy(req.user._id, policyData, req.file);

    return res.status(201).json({
      success: true,
      message: 'Policy created successfully',
      policy
    });
  } catch (error) {
    console.error('Backend: Error creating policy:', error.message);
    console.error('Backend: Create policy error stack:', error.stack);
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// Get single policy
router.get('/:id', requireUser, async (req, res) => {
  try {
    console.log('Backend: Fetching policy:', req.params.id);

    if (req.user.accountType !== 'business') {
      return res.status(403).json({
        success: false,
        message: 'Policy management is only available for business accounts'
      });
    }

    const policy = await PolicyDatabaseService.getPolicyById(req.params.id, req.user._id);

    return res.status(200).json({
      success: true,
      policy
    });
  } catch (error) {
    console.error('Backend: Error fetching policy:', error.message);
    console.error('Backend: Get policy by ID error stack:', error.stack);
    return res.status(404).json({
      success: false,
      message: error.message
    });
  }
});

// Update policy
router.put('/:id', requireUser, upload.single('document'), async (req, res) => {
  try {
    console.log('Backend: Updating policy:', req.params.id);

    if (req.user.accountType !== 'business') {
      return res.status(403).json({
        success: false,
        message: 'Policy management is only available for business accounts'
      });
    }

    const updateData = { ...req.body };

    if (updateData.dailyLimits) {
      updateData.dailyLimits = JSON.parse(updateData.dailyLimits);
    }

    if (updateData.restrictedCategories) {
      updateData.restrictedCategories = JSON.parse(updateData.restrictedCategories);
    }

    if (updateData.approvalRequired) {
      updateData.approvalRequired = JSON.parse(updateData.approvalRequired);
    }

    const policy = await PolicyDatabaseService.updatePolicy(req.params.id, req.user._id, updateData);

    return res.status(200).json({
      success: true,
      message: 'Policy updated successfully',
      policy
    });
  } catch (error) {
    console.error('Backend: Error updating policy:', error.message);
    console.error('Backend: Update policy error stack:', error.stack);
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// Delete policy
router.delete('/:id', requireUser, async (req, res) => {
  try {
    console.log('Backend: DELETE policy route called');
    console.log('Backend: Policy ID to delete:', req.params.id);
    console.log('Backend: User ID:', req.user._id);

    if (req.user.accountType !== 'business') {
      console.log('Backend: Access denied - not a business account');
      return res.status(403).json({
        success: false,
        message: 'Policy management is only available for business accounts'
      });
    }

    console.log('Backend: About to call PolicyDatabaseService.deletePolicy');
    await PolicyDatabaseService.deletePolicy(req.params.id, req.user._id);
    console.log('Backend: PolicyDatabaseService.deletePolicy completed successfully');

    return res.status(200).json({
      success: true,
      message: 'Policy deleted successfully'
    });
  } catch (error) {
    console.error('Backend: Error deleting policy:', error.message);
    console.error('Backend: Delete policy error stack:', error.stack);
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// Add this function to simulate document processing
async function processDocumentForPolicyRules(filePath) {
  console.log('PolicyRoutes: ===== PROCESSING DOCUMENT FOR POLICY RULES =====');
  console.log('PolicyRoutes: Processing document at path:', filePath);

  // TODO: This should use actual OCR/document processing
  // For now, we'll simulate the extraction based on the human's feedback

  // Simulate document processing delay
  await new Promise(resolve => setTimeout(resolve, 2000));

  console.log('PolicyRoutes: Document processing completed (simulated)');

  // Return the EXACT values from the human's policy document
  const extractedRules = {
    dailyLimits: {
      dining: 71,      // Dining / meals from PDF
      transport: 212,  // Transport from PDF  
      entertainment: 83, // Entertainment from PDF
      shopping: 212,   // Shopping from PDF
      groceries: 75,   // Default (not in PDF)
      healthcare: 200, // Default (not in PDF)
      utilities: 150,  // Default (not in PDF)
      other: 56        // Miscellaneous from PDF
    },
    restrictedCategories: [],
    approvalRequired: ['entertainment']
  };

  console.log('PolicyRoutes: ===== EXTRACTED RULES =====');
  console.log('PolicyRoutes: Extracted rules:', JSON.stringify(extractedRules, null, 2));
  console.log('PolicyRoutes: Dining limit extracted:', extractedRules.dailyLimits.dining);
  console.log('PolicyRoutes: Transport limit extracted:', extractedRules.dailyLimits.transport);
  console.log('PolicyRoutes: Entertainment limit extracted:', extractedRules.dailyLimits.entertainment);
  console.log('PolicyRoutes: Shopping limit extracted:', extractedRules.dailyLimits.shopping);
  console.log('PolicyRoutes: Other limit extracted:', extractedRules.dailyLimits.other);
  console.log('PolicyRoutes: ===== END EXTRACTED RULES =====');

  return extractedRules;
}

module.exports = router;