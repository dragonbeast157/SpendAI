const multer = require('multer');
const path = require('path');
const fs = require('fs');

console.log('Upload Middleware: Initializing upload middleware');

// Create upload directories if they don't exist
const uploadsDir = path.join(__dirname, '../uploads');
const statementsDir = path.join(uploadsDir, 'statements');
const documentsDir = path.join(uploadsDir, 'documents');

[uploadsDir, statementsDir, documentsDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    console.log('Upload Middleware: Creating subdirectory:', dir);
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Configure multer storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Determine destination based on file type or route
    let uploadPath = statementsDir;
    
    if (req.route && req.route.path.includes('policy')) {
      uploadPath = documentsDir;
    }
    
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    // Generate unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// File filter function
const fileFilter = (req, file, cb) => {
  console.log('=== UPLOAD MIDDLEWARE FILE FILTER START ===');
  console.log('Backend: File filter - checking file:', {
    originalname: file.originalname,
    mimetype: file.mimetype,
    fieldname: file.fieldname,
    encoding: file.encoding
  });

  // Allow common document and image formats
  const allowedTypes = [
    'application/pdf',
    'text/csv',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'image/jpeg',
    'image/jpg',
    'image/png',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ];

  console.log('Backend: Allowed file types:', allowedTypes);
  console.log('Backend: File mimetype matches allowed:', allowedTypes.includes(file.mimetype));

  if (allowedTypes.includes(file.mimetype)) {
    console.log('Backend: File type accepted');
    console.log('=== UPLOAD MIDDLEWARE FILE FILTER SUCCESS ===');
    cb(null, true);
  } else {
    console.log('Backend: File type rejected:', file.mimetype);
    console.log('=== UPLOAD MIDDLEWARE FILE FILTER REJECTED ===');
    cb(new Error('Invalid file type. Only PDF, CSV, Excel, Word documents and images are allowed.'), false);
  }
};

// Create multer instance
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

// Export different middleware for different field names
const uploadMiddleware = upload.single('file'); // For general uploads
const uploadStatementMiddleware = upload.single('statement'); // For account-specific uploads

console.log('Upload Middleware: Upload middleware initialized successfully');

module.exports = {
  uploadMiddleware,
  uploadStatementMiddleware,
  upload
};