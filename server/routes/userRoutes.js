const express = require('express');
const UserService = require('../services/userService.js');
const { requireUser } = require('./middleware/auth.js');

const router = express.Router();

// Get current user profile
router.get('/profile', requireUser, async (req, res) => {
  try {
    console.log('UserRoutes: Getting profile for user:', req.user.email);
    console.log('UserRoutes: User ID:', req.user._id);

    const user = await UserService.get(req.user._id);
    
    if (!user) {
      console.log('UserRoutes: User not found in database');
      return res.status(404).json({ message: 'User not found' });
    }

    console.log('UserRoutes: User found, returning profile data');
    console.log('UserRoutes: User onboarding status:', user.onboardingCompleted);

    // Return user data (password and sensitive fields are already excluded by the User model)
    return res.status(200).json(user);
  } catch (error) {
    console.error('UserRoutes: Error getting user profile:', error.message);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// Update user profile
router.put('/profile', requireUser, async (req, res) => {
  try {
    console.log('UserRoutes: Updating profile for user:', req.user.email);
    console.log('UserRoutes: Update data:', req.body);

    const updatedUser = await UserService.update(req.user._id, req.body);
    
    if (!updatedUser) {
      console.log('UserRoutes: User not found for update');
      return res.status(404).json({ message: 'User not found' });
    }

    console.log('UserRoutes: User profile updated successfully');
    return res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      user: updatedUser
    });
  } catch (error) {
    console.error('UserRoutes: Error updating user profile:', error.message);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;