const express = require('express');
const UserService = require('../services/userService.js');
const { requireUser } = require('./middleware/auth.js');
const User = require('../models/User.js');
const { generateAccessToken, generateRefreshToken } = require('../utils/auth.js');
const jwt = require('jsonwebtoken');

const router = express.Router();

// Development route to delete user account (for testing purposes)
router.delete('/delete-account', async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: 'Email is required' });
  }

  try {
    console.log('Backend: Deleting user account for testing:', email);
    const result = await UserService.deleteByEmail(email);

    if (result) {
      console.log('Backend: User account deleted successfully:', email);
      return res.status(200).json({
        success: true,
        message: 'User account deleted successfully'
      });
    } else {
      console.log('Backend: User account not found:', email);
      return res.status(404).json({
        message: 'User account not found'
      });
    }
  } catch (error) {
    console.error('Backend: Error deleting user account:', error.message);
    return res.status(500).json({
      message: 'Error deleting user account'
    });
  }
});

router.post('/login', async (req, res) => {
  const sendError = msg => res.status(400).json({ message: msg });
  const { email, password } = req.body;

  console.log('Backend: Login attempt for email:', email);

  if (!email || !password) {
    console.log('Backend: Missing email or password');
    return sendError('Email and password are required');
  }

  try {
    const user = await UserService.authenticateWithPassword(email, password);
    console.log('Backend: Authentication result:', user ? 'Success' : 'Failed');

    if (user) {
      const accessToken = generateAccessToken(user);
      const refreshToken = generateRefreshToken(user);

      user.refreshToken = refreshToken;
      await user.save();

      const response = { ...user.toObject(), accessToken, refreshToken };
      console.log('Backend: Sending login response with tokens');
      return res.json(response);
    } else {
      console.log('Backend: Invalid credentials');
      return sendError('Email or password is incorrect');
    }
  } catch (error) {
    console.error('Backend: Login error:', error);
    return sendError('Internal server error');
  }
});

router.post('/register', async (req, res) => {
  if (req.user) {
    return res.json({ user: req.user });
  }

  console.log('Backend: Registration request received');

  try {
    const { email, password, name, accountType, companyName, companySize, industry } = req.body;

    console.log('Backend: Registration data:', {
      email,
      name,
      accountType,
      companyName: accountType === 'business' ? companyName : '[N/A]',
      companySize: accountType === 'business' ? companySize : '[N/A]',
      industry: accountType === 'business' ? industry : '[N/A]'
    });

    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    // Validate business account fields
    if (accountType === 'business') {
      if (!companyName || !companySize || !industry) {
        return res.status(400).json({ 
          message: 'Company name, size, and industry are required for business accounts' 
        });
      }
    }

    // Create user data object
    const userCreateData = {
      email,
      password,
      name: name || '',
      accountType: accountType || 'personal'
    };

    // Add business fields if provided
    if (accountType === 'business') {
      userCreateData.companyName = companyName;
      userCreateData.companySize = companySize;
      userCreateData.industry = industry;
    }

    console.log('Backend: Creating user with account type:', userCreateData.accountType);

    // Create user
    const user = await UserService.create(userCreateData);
    console.log('Backend: User created successfully');

    // Generate access token for immediate login
    const accessToken = generateAccessToken(user);

    const responseData = {
      success: true,
      user: user.toObject(),
      accessToken
    };

    console.log('Backend: Registration successful, sending response');
    return res.status(201).json(responseData);
  } catch (error) {
    console.error('Backend: Registration error:', error.message);
    
    if (error.message.includes('User with this email already exists')) {
      return res.status(409).json({ message: error.message });
    }
    
    return res.status(400).json({ message: error.message });
  }
});

router.post('/logout', async (req, res) => {
  const { email } = req.body;

  const user = await User.findOne({ email });
  if (user) {
    user.refreshToken = null;
    await user.save();
  }

  res.status(200).json({ message: 'User logged out successfully.' });
});

router.post('/refresh', async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(401).json({
      success: false,
      message: 'Refresh token is required'
    });
  }

  try {
    // Verify the refresh token
    const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);

    // Find the user
    const user = await UserService.get(decoded.sub);

    if (!user) {
      return res.status(403).json({
        success: false,
        message: 'User not found'
      });
    }

    if (user.refreshToken !== refreshToken) {
      return res.status(403).json({
        success: false,
        message: 'Invalid refresh token'
      });
    }

    // Generate new tokens
    const newAccessToken = generateAccessToken(user);
    const newRefreshToken = generateRefreshToken(user);

    // Update user's refresh token in database
    user.refreshToken = newRefreshToken;
    await user.save();

    // Return new tokens
    return res.status(200).json({
      success: true,
      data: {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken
      }
    });

  } catch (error) {
    console.error(`Token refresh error: ${error.message}`);

    if (error.name === 'TokenExpiredError') {
      return res.status(403).json({
        success: false,
        message: 'Refresh token has expired'
      });
    }

    return res.status(403).json({
      success: false,
      message: 'Invalid refresh token'
    });
  }
});

router.get('/me', requireUser, async (req, res) => {
  console.log('Backend: Fetching user profile for:', req.user.email);
  return res.status(200).json(req.user);
});

module.exports = router;