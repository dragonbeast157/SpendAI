const multer = require('multer');
const path = require('path');
const fs = require('fs');

console.log('Upload Middleware: Initializing upload middleware');

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  console.log('Upload Middleware: Creating uploads directory at:', uploadsDir);
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Create subdirectories for different file types
const subdirectories = ['statements', 'policies', 'documents'];
subdirectories.forEach(subdir => {
  const subdirPath = path.join(uploadsDir, subdir);
  if (!fs.existsSync(subdirPath)) {
    console.log('Upload Middleware: Creating subdirectory:', subdirPath);
    fs.mkdirSync(subdirPath, { recursive: true });
  }
});

// Configure multer storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    console.log('Upload Middleware: Determining destination for file:', file.originalname);
    console.log('Upload Middleware: File fieldname:', file.fieldname);
    console.log('Upload Middleware: File mimetype:', file.mimetype);
    
    let subfolder = 'documents';
    
    // Determine subfolder based on field name or file type
    if (file.fieldname === 'statement' || file.fieldname === 'bankStatement') {
      subfolder = 'statements';
    } else if (file.fieldname === 'policy' || file.fieldname === 'policyDocument') {
      subfolder = 'policies';
    } else if (file.mimetype && file.mimetype.includes('csv')) {
      subfolder = 'statements';
    } else if (file.mimetype && (file.mimetype.includes('pdf') || file.mimetype.includes('document'))) {
      subfolder = 'policies';
    }
    
    const destinationPath = path.join(uploadsDir, subfolder);
    console.log('Upload Middleware: Using destination path:', destinationPath);
    
    cb(null, destinationPath);
  },
  filename: function (req, file, cb) {
    console.log('Upload Middleware: Generating filename for file:', file.originalname);
    
    try {
      // Generate unique filename with timestamp
      const timestamp = Date.now();
      const randomString = Math.random().toString(36).substring(2, 15);
      const extension = path.extname(file.originalname);
      const baseName = path.basename(file.originalname, extension);
      
      // Sanitize filename
      const sanitizedBaseName = baseName.replace(/[^a-zA-Z0-9_-]/g, '_');
      const filename = `${timestamp}_${randomString}_${sanitizedBaseName}${extension}`;
      
      console.log('Upload Middleware: Generated filename:', filename);
      cb(null, filename);
    } catch (error) {
      console.error('Upload Middleware: Error generating filename:', error);
      cb(error, null);
    }
  }
});

// File filter function
const fileFilter = (req, file, cb) => {
  console.log('Upload Middleware: Filtering file:', file.originalname);
  console.log('Upload Middleware: File mimetype:', file.mimetype);
  console.log('Upload Middleware: File fieldname:', file.fieldname);
  
  try {
    const allowedTypes = {
      'statement': [
        'text/csv',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'text/plain'
      ],
      'bankStatement': [
        'text/csv',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'text/plain'
      ],
      'policy': [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'text/plain'
      ],
      'policyDocument': [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'text/plain'
      ]
    };
    
    const fieldAllowedTypes = allowedTypes[file.fieldname] || [
      'text/csv',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain'
    ];
    
    if (fieldAllowedTypes.includes(file.mimetype)) {
      console.log('Upload Middleware: File type accepted');
      cb(null, true);
    } else {
      console.log('Upload Middleware: File type rejected:', file.mimetype);
      const error = new Error(`File type not allowed. Allowed types: ${fieldAllowedTypes.join(', ')}`);
      error.code = 'INVALID_FILE_TYPE';
      cb(error, false);
    }
  } catch (error) {
    console.error('Upload Middleware: Error in file filter:', error);
    cb(error, false);
  }
};

// Configure multer
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
    files: 5 // Maximum 5 files per request
  }
});

// Error handling middleware
const handleUploadError = (error, req, res, next) => {
  console.error('Upload Middleware: Upload error occurred:', error);
  console.error('Upload Middleware: Error code:', error.code);
  console.error('Upload Middleware: Error message:', error.message);
  console.error('Upload Middleware: Full error:', error);
  
  if (error instanceof multer.MulterError) {
    console.log('Upload Middleware: Multer error detected');
    
    switch (error.code) {
      case 'LIMIT_FILE_SIZE':
        return res.status(400).json({
          error: 'File too large. Maximum size is 10MB.',
          code: error.code
        });
      case 'LIMIT_FILE_COUNT':
        return res.status(400).json({
          error: 'Too many files. Maximum is 5 files per request.',
          code: error.code
        });
      case 'LIMIT_UNEXPECTED_FILE':
        return res.status(400).json({
          error: 'Unexpected file field. Please check the field name.',
          code: error.code
        });
      default:
        return res.status(400).json({
          error: `Upload error: ${error.message}`,
          code: error.code
        });
    }
  } else if (error.code === 'INVALID_FILE_TYPE') {
    console.log('Upload Middleware: Invalid file type error');
    return res.status(400).json({
      error: error.message,
      code: error.code
    });
  } else {
    console.log('Upload Middleware: General upload error');
    return res.status(500).json({
      error: `Upload failed: ${error.message}`,
      code: 'UPLOAD_ERROR'
    });
  }
};

// Single file upload middleware
const uploadSingle = (fieldName) => {
  console.log('Upload Middleware: Creating single file upload middleware for field:', fieldName);
  
  return (req, res, next) => {
    console.log('Upload Middleware: Processing single file upload for field:', fieldName);
    console.log('Upload Middleware: Request headers:', req.headers);
    
    const uploadHandler = upload.single(fieldName);
    
    uploadHandler(req, res, (error) => {
      if (error) {
        console.error('Upload Middleware: Error in single file upload:', error);
        return handleUploadError(error, req, res, next);
      }
      
      if (req.file) {
        console.log('Upload Middleware: File uploaded successfully:', {
          originalname: req.file.originalname,
          filename: req.file.filename,
          size: req.file.size,
          mimetype: req.file.mimetype,
          path: req.file.path
        });
      } else {
        console.log('Upload Middleware: No file uploaded');
      }
      
      next();
    });
  };
};

// Multiple files upload middleware
const uploadMultiple = (fieldName, maxCount = 5) => {
  console.log('Upload Middleware: Creating multiple files upload middleware for field:', fieldName, 'maxCount:', maxCount);
  
  return (req, res, next) => {
    console.log('Upload Middleware: Processing multiple files upload for field:', fieldName);
    console.log('Upload Middleware: Request headers:', req.headers);
    
    const uploadHandler = upload.array(fieldName, maxCount);
    
    uploadHandler(req, res, (error) => {
      if (error) {
        console.error('Upload Middleware: Error in multiple files upload:', error);
        return handleUploadError(error, req, res, next);
      }
      
      if (req.files && req.files.length > 0) {
        console.log('Upload Middleware: Files uploaded successfully:', req.files.map(file => ({
          originalname: file.originalname,
          filename: file.filename,
          size: file.size,
          mimetype: file.mimetype,
          path: file.path
        })));
      } else {
        console.log('Upload Middleware: No files uploaded');
      }
      
      next();
    });
  };
};

// Mixed fields upload middleware
const uploadFields = (fields) => {
  console.log('Upload Middleware: Creating fields upload middleware for fields:', fields);
  
  return (req, res, next) => {
    console.log('Upload Middleware: Processing fields upload');
    console.log('Upload Middleware: Request headers:', req.headers);
    
    const uploadHandler = upload.fields(fields);
    
    uploadHandler(req, res, (error) => {
      if (error) {
        console.error('Upload Middleware: Error in fields upload:', error);
        return handleUploadError(error, req, res, next);
      }
      
      if (req.files) {
        console.log('Upload Middleware: Files uploaded successfully via fields:', req.files);
      } else {
        console.log('Upload Middleware: No files uploaded via fields');
      }
      
      next();
    });
  };
};

// Cleanup uploaded files utility
const cleanupFiles = (files) => {
  console.log('Upload Middleware: Cleaning up files:', files);
  
  if (!files) {
    console.log('Upload Middleware: No files to cleanup');
    return;
  }
  
  const filesToClean = Array.isArray(files) ? files : [files];
  
  filesToClean.forEach(file => {
    if (file && file.path) {
      try {
        if (fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
          console.log('Upload Middleware: Cleaned up file:', file.path);
        }
      } catch (error) {
        console.error('Upload Middleware: Error cleaning up file:', file.path, error);
      }
    }
  });
};

// Validate file middleware
const validateFile = (required = false) => {
  return (req, res, next) => {
    console.log('Upload Middleware: Validating file upload');
    console.log('Upload Middleware: Required:', required);
    console.log('Upload Middleware: Has file:', !!req.file);
    console.log('Upload Middleware: Has files:', !!(req.files && req.files.length > 0));
    
    if (required && !req.file && (!req.files || req.files.length === 0)) {
      console.log('Upload Middleware: File is required but not provided');
      return res.status(400).json({
        error: 'File is required for this operation',
        code: 'FILE_REQUIRED'
      });
    }
    
    console.log('Upload Middleware: File validation passed');
    next();
  };
};

console.log('Upload Middleware: Upload middleware initialized successfully');

module.exports = {
  upload,
  uploadSingle,
  uploadMultiple,
  uploadFields,
  handleUploadError,
  cleanupFiles,
  validateFile
};