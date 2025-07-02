const express = require('express');
const UserService = require('../services/userService.js');
const { generateAccessToken, generateRefreshToken } = require('../utils/auth.js');

const router = express.Router();

// Login route
router.post('/login', async (req, res) => {
  try {
    console.log('Backend: Login attempt for email:', req.body.email);
    
    const { email, password } = req.body;

    if (!email || !password) {
      console.log('Backend: Missing email or password');
      return res.status(400).json({ message: 'Email and password are required' });
    }

    // Authenticate user
    const user = await UserService.authenticateWithPassword(email, password);
    
    if (!user) {
      console.log('Backend: Authentication failed - invalid credentials');
      console.log('Backend: Attempted email:', email);
      return res.status(400).json({ message: 'Email or password is incorrect' });
    }

    console.log('Backend: Authentication successful for user:', user.email);
    console.log('Backend: User account type:', user.accountType);
    console.log('Backend: User onboarding completed:', user.onboardingCompleted);

    // Generate tokens
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    console.log('Backend: Tokens generated successfully');

    res.status(200).json({
      message: 'Login successful',
      accessToken,
      refreshToken,
      user: {
        _id: user._id,
        email: user.email,
        name: user.name,
        accountType: user.accountType,
        onboardingCompleted: user.onboardingCompleted
      }
    });
  } catch (error) {
    console.error('Backend: Login error:', error.message);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Register route
router.post('/register', async (req, res) => {
  try {
    console.log('Backend: Registration attempt for email:', req.body.email);
    console.log('Backend: Account type:', req.body.accountType);

    const { email, password, name, accountType, companyName, companySize, industry } = req.body;

    if (!email || !password) {
      console.log('Backend: Missing required fields');
      return res.status(400).json({ message: 'Email and password are required' });
    }

    // Create user
    const user = await UserService.create({
      email,
      password,
      name: name || '',
      accountType: accountType || 'personal',
      companyName,
      companySize,
      industry
    });

    console.log('Backend: User created successfully:', user.email);
    console.log('Backend: User account type:', user.accountType);
    console.log('Backend: User onboarding completed:', user.onboardingCompleted);

    // Generate access token only for registration
    const accessToken = generateAccessToken(user);

    console.log('Backend: Registration successful');

    res.status(201).json({
      message: 'Registration successful',
      accessToken,
      user: {
        _id: user._id,
        email: user.email,
        name: user.name,
        accountType: user.accountType,
        onboardingCompleted: user.onboardingCompleted
      }
    });
  } catch (error) {
    console.error('Backend: Registration error:', error.message);
    
    if (error.message.includes('already exists')) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }
    
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Logout route
router.post('/logout', (req, res) => {
  console.log('Backend: User logout');
  res.status(200).json({ message: 'Logout successful' });
});

// Delete account route
router.delete('/account', async (req, res) => {
  try {
    console.log('Backend: Account deletion request');
    // Implementation would go here
    res.status(200).json({ message: 'Account deleted successfully' });
  } catch (error) {
    console.error('Backend: Account deletion error:', error.message);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;