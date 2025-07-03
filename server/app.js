const express = require('express');
const cors = require('cors');
const path = require('path');
const connectDB = require('./config/database');
require('dotenv').config();

const app = express();

// Connect to database
connectDB();

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Add middleware to log all incoming requests BEFORE routes
app.use('/api', (req, res, next) => {
  console.log('=== INCOMING API REQUEST ===');
  console.log('Method:', req.method);
  console.log('URL:', req.url);
  console.log('Full URL:', req.originalUrl);
  console.log('Headers:', req.headers);
  console.log('Query:', req.query);
  console.log('Body:', req.body);
  console.log('=== END INCOMING REQUEST ===');
  next();
});

// Import routes
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const transactionRoutes = require('./routes/transactionRoutes');
const bankAccountRoutes = require('./routes/bankAccountRoutes');
const policyRoutes = require('./routes/policyRoutes');
const onboardingRoutes = require('./routes/onboardingRoutes');
const settingsRoutes = require('./routes/settingsRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const analysisRoutes = require('./routes/analysisRoutes');
const aiRoutes = require('./routes/aiRoutes');
const coachingRoutes = require('./routes/coachingRoutes');

// Add logging for route registration
console.log('=== REGISTERING API ROUTES ===');

// API Routes
app.use('/api/auth', authRoutes);
console.log('Registered: /api/auth');

app.use('/api/users', userRoutes);
console.log('Registered: /api/users');

app.use('/api/transactions', transactionRoutes);
console.log('Registered: /api/transactions');

app.use('/api/bank-accounts', bankAccountRoutes);
console.log('Registered: /api/bank-accounts');

app.use('/api/policy', policyRoutes);
console.log('Registered: /api/policy');

app.use('/api/onboarding', onboardingRoutes);
console.log('Registered: /api/onboarding');

app.use('/api/settings', settingsRoutes);
console.log('Registered: /api/settings');

app.use('/api/dashboard', dashboardRoutes);
console.log('Registered: /api/dashboard');

app.use('/api/analytics', analyticsRoutes);
console.log('Registered: /api/analytics');

app.use('/api/analysis', analysisRoutes);
console.log('Registered: /api/analysis');

app.use('/api/ai', aiRoutes);
console.log('Registered: /api/ai');

app.use('/api/coaching', coachingRoutes);
console.log('Registered: /api/coaching');

console.log('=== ROUTE REGISTRATION COMPLETE ===');

// Add a test route to verify API is working
app.get('/api/test', (req, res) => {
  console.log('=== API TEST ROUTE HIT ===');
  res.json({
    success: true,
    message: 'API is working',
    timestamp: new Date().toISOString()
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('=== GLOBAL ERROR HANDLER ===');
  console.error('Error:', err);
  console.error('Stack:', err.stack);
  console.error('Request URL:', req.url);
  console.error('Request Method:', req.method);
  console.error('=== END GLOBAL ERROR ===');
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: err.message
  });
});

// 404 handler for API routes
app.use('/api/*', (req, res) => {
  console.log('=== 404 API ROUTE ===');
  console.log('Requested URL:', req.originalUrl);
  console.log('Method:', req.method);
  console.log('Available routes should include /api/analysis/anomalies');
  console.log('=== END 404 ===');
  res.status(404).json({
    success: false,
    message: 'API route not found',
    requestedUrl: req.originalUrl
  });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;