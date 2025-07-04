const express = require('express');
const multer = require('multer');
const PolicyDatabaseService = require('../services/policyDatabaseService');
const { requireUser } = require('./middleware/auth');
const path = require('path');
const fs = require('fs').promises;

const router = express.Router();

// Configure multer for file uploads with disk storage
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads/policies');
    try {
      await fs.mkdir(uploadDir, { recursive: true });
      cb(null, uploadDir);
    } catch (error) {
      cb(error);
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'policy-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /pdf|doc|docx/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype) || file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

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
    console.log('PolicyRoutes: Fetching policy overview for user:', req.user._id);

    if (req.user.accountType !== 'business') {
      console.log('PolicyRoutes: Access denied - not a business account');
      return res.status(403).json({
        success: false,
        message: 'Policy management is only available for business accounts'
      });
    }

    const overview = await PolicyDatabaseService.getPolicyOverview(req.user._id);
    console.log('PolicyRoutes: Policy overview retrieved:', overview ? 'found' : 'not found');

    if (!overview) {
      console.log('PolicyRoutes: No policy found, returning default overview');
      return res.status(200).json({
        success: true,
        policy: {
          lastUpdated: new Date().toISOString(),
          overallCompliance: 100,
          dailyLimits: {
            dining: 50,
            transport: 100,
            entertainment: 75,
            shopping: 200,
            groceries: 75,
            healthcare: 200,
            utilities: 150,
            other: 50
          },
          restrictedCategories: [],
          approvalRequired: [],
          violationsThisMonth: 0,
          pendingApprovals: 0,
        }
      });
    }

    console.log('PolicyRoutes: Returning policy overview with compliance:', overview.overallCompliance);
    return res.status(200).json({
      success: true,
      policy: overview
    });
  } catch (error) {
    console.error('PolicyRoutes: Error fetching policy overview:', error.message);
    console.error('PolicyRoutes: Policy overview error stack:', error.stack);
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Get policy violations
router.get('/violations', requireUser, async (req, res) => {
  try {
    console.log('PolicyRoutes: Fetching policy violations for user:', req.user._id);

    if (req.user.accountType !== 'business') {
      console.log('PolicyRoutes: Access denied - not a business account');
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
    console.log('PolicyRoutes: Retrieved', violations.length, 'violations');

    return res.status(200).json({
      success: true,
      violations
    });
  } catch (error) {
    console.error('PolicyRoutes: Error fetching policy violations:', error.message);
    console.error('PolicyRoutes: Policy violations error stack:', error.stack);
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Submit violation justification
router.post('/violations/:id/justify', requireUser, async (req, res) => {
  try {
    console.log('PolicyRoutes: Submitting violation justification for ID:', req.params.id);

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

    console.log('PolicyRoutes: Violation justification submitted successfully');
    return res.status(200).json({
      success: true,
      message: 'Justification submitted for review',
      violation
    });
  } catch (error) {
    console.error('PolicyRoutes: Error submitting violation justification:', error.message);
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// Upload policy document
router.post('/upload', requireUser, upload.single('document'), async (req, res) => {
  console.log('PolicyRoutes: ===== POLICY UPLOAD ENDPOINT CALLED =====');
  console.log('PolicyRoutes: User ID:', req.user._id);
  console.log('PolicyRoutes: User account type:', req.user.accountType);
  console.log('PolicyRoutes: File uploaded?', !!req.file);

  try {
    if (req.user.accountType !== 'business') {
      return res.status(403).json({
        success: false,
        message: 'Policy management is only available for business accounts'
      });
    }

    if (!req.file) {
      console.log('PolicyRoutes: ERROR - No file uploaded');
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    console.log('PolicyRoutes: File details:', {
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
      path: req.file.path
    });

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

    console.log('PolicyRoutes: Creating policy with data:', {
      title: policyData.title,
      dailyLimits: policyData.dailyLimits
    });

    const policy = await PolicyDatabaseService.createPolicy(req.user._id, policyData);
    console.log('PolicyRoutes: Policy created successfully with ID:', policy._id);

    res.status(200).json({
      success: true,
      message: 'Policy document uploaded and processed successfully',
      policy: {
        _id: policy._id,
        title: policy.title,
        description: policy.description,
        effectiveDate: policy.effectiveDate,
        dailyLimits: policy.dailyLimits,
        status: policy.status
      }
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
    console.log('PolicyRoutes: Getting policy processing status for ID:', req.params.id);

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
    console.error('PolicyRoutes: Error getting policy processing status:', error.message);
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// Get all policies
router.get('/', requireUser, async (req, res) => {
  try {
    console.log('PolicyRoutes: Fetching policies for user:', req.user._id);

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
    console.log('PolicyRoutes: Retrieved', policies.length, 'policies');

    return res.status(200).json({
      success: true,
      policies
    });
  } catch (error) {
    console.error('PolicyRoutes: Error fetching policies:', error.message);
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Create new policy
router.post('/', requireUser, upload.single('document'), async (req, res) => {
  try {
    console.log('PolicyRoutes: Creating policy for user:', req.user._id);

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
      effectiveDate: new Date(effectiveDate),
      dailyLimits: dailyLimits ? JSON.parse(dailyLimits) : {
        dining: 50,
        transport: 100,
        entertainment: 75,
        shopping: 200,
        groceries: 75,
        healthcare: 200,
        utilities: 150,
        other: 50
      },
      restrictedCategories: restrictedCategories ? JSON.parse(restrictedCategories) : [],
      approvalRequired: approvalRequired ? JSON.parse(approvalRequired) : ['entertainment']
    };

    if (req.file) {
      policyData.documentPath = req.file.path;
      policyData.documentOriginalName = req.file.originalname;
    }

    const policy = await PolicyDatabaseService.createPolicy(req.user._id, policyData);
    console.log('PolicyRoutes: Policy created successfully');

    return res.status(201).json({
      success: true,
      message: 'Policy created successfully',
      policy
    });
  } catch (error) {
    console.error('PolicyRoutes: Error creating policy:', error.message);
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// Get single policy
router.get('/:id', requireUser, async (req, res) => {
  try {
    console.log('PolicyRoutes: Fetching policy with ID:', req.params.id);

    if (req.user.accountType !== 'business') {
      return res.status(403).json({
        success: false,
        message: 'Policy management is only available for business accounts'
      });
    }

    const policy = await PolicyDatabaseService.getPolicyById(req.params.id, req.user._id);
    console.log('PolicyRoutes: Policy retrieved successfully');

    return res.status(200).json({
      success: true,
      policy
    });
  } catch (error) {
    console.error('PolicyRoutes: Error fetching policy:', error.message);
    return res.status(404).json({
      success: false,
      message: error.message
    });
  }
});

// Update policy
router.put('/:id', requireUser, upload.single('document'), async (req, res) => {
  try {
    console.log('PolicyRoutes: Updating policy with ID:', req.params.id);

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

    if (req.file) {
      updateData.documentPath = req.file.path;
      updateData.documentOriginalName = req.file.originalname;
    }

    const policy = await PolicyDatabaseService.updatePolicy(req.params.id, req.user._id, updateData);
    console.log('PolicyRoutes: Policy updated successfully');

    return res.status(200).json({
      success: true,
      message: 'Policy updated successfully',
      policy
    });
  } catch (error) {
    console.error('PolicyRoutes: Error updating policy:', error.message);
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// Delete policy
router.delete('/:id', requireUser, async (req, res) => {
  try {
    console.log('PolicyRoutes: DELETE policy route called for ID:', req.params.id);

    if (req.user.accountType !== 'business') {
      console.log('PolicyRoutes: Access denied - not a business account');
      return res.status(403).json({
        success: false,
        message: 'Policy management is only available for business accounts'
      });
    }

    console.log('PolicyRoutes: Calling PolicyDatabaseService.deletePolicy');
    await PolicyDatabaseService.deletePolicy(req.params.id, req.user._id);
    console.log('PolicyRoutes: Policy deleted successfully');

    return res.status(200).json({
      success: true,
      message: 'Policy deleted successfully'
    });
  } catch (error) {
    console.error('PolicyRoutes: Error deleting policy:', error.message);
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// Document processing function
async function processDocumentForPolicyRules(filePath) {
  console.log('PolicyRoutes: Processing document for policy rules at path:', filePath);

  try {
    // Simulate document processing delay
    await new Promise(resolve => setTimeout(resolve, 2000));

    console.log('PolicyRoutes: Document processing completed (simulated)');

    // Return extracted rules based on typical policy document structure
    const extractedRules = {
      dailyLimits: {
        dining: 71,
        transport: 212,
        entertainment: 83,
        shopping: 212,
        groceries: 75,
        healthcare: 200,
        utilities: 150,
        other: 56
      },
      restrictedCategories: [],
      approvalRequired: ['entertainment']
    };

    console.log('PolicyRoutes: Extracted rules:', extractedRules);
    return extractedRules;
  } catch (error) {
    console.error('PolicyRoutes: Error processing document:', error.message);
    throw new Error(`Failed to process policy document: ${error.message}`);
  }
}

module.exports = router;