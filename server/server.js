require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { connectDB } = require('./config/database');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const transactionRoutes = require('./routes/transactionRoutes');
const bankAccountRoutes = require('./routes/bankAccountRoutes');
const policyRoutes = require('./routes/policyRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const analysisRoutes = require('./routes/analysisRoutes');
const coachingRoutes = require('./routes/coachingRoutes');
const aiRoutes = require('./routes/aiRoutes');
const onboardingRoutes = require('./routes/onboardingRoutes');
const settingsRoutes = require('./routes/settingsRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const indexRoutes = require('./routes/index');

const app = express();

// Connect to database
connectDB();

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/bank-accounts', bankAccountRoutes);
app.use('/api/onboarding', onboardingRoutes);
app.use('/api/policy', policyRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/analysis', analysisRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/coaching', coachingRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api', dashboardRoutes);

// Add logging to see what routes are registered
console.log('=== REGISTERED ROUTES ===');
console.log('Auth routes: /api/auth');
console.log('User routes: /api/users');
console.log('Transaction routes: /api/transactions');
console.log('Bank account routes: /api/bank-accounts');
console.log('Onboarding routes: /api/onboarding');
console.log('Policy routes: /api/policy');
console.log('Analytics routes: /api/analytics');
console.log('Analysis routes: /api/analysis');
console.log('Settings routes: /api/settings');
console.log('Coaching routes: /api/coaching');
console.log('AI routes: /api/ai');
console.log('Dashboard routes: /api');
console.log('=== END REGISTERED ROUTES ===');

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server Error:', err.stack);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;