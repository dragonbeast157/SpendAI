const express = require('express');
const UserService = require('../services/userService');
const { requireUser } = require('./middleware/auth');

const router = express.Router();

// Get current user profile
router.get('/me', requireUser, async (req, res) => {
  try {
    console.log('Backend: Fetching user profile for:', req.user.email);
    
    const user = await UserService.get(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    return res.status(200).json({ user: user.toObject() });
  } catch (error) {
    console.error('Backend: Error fetching user profile:', error.message);
    return res.status(500).json({ message: 'Error fetching user profile' });
  }
});

// Update current user profile
router.put('/me', requireUser, async (req, res) => {
  try {
    console.log('Backend: Updating user profile for:', req.user.email);
    
    const updatedUser = await UserService.update(req.user._id, req.body);
    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    return res.status(200).json({ user: updatedUser.toObject() });
  } catch (error) {
    console.error('Backend: Error updating user profile:', error.message);
    return res.status(500).json({ message: 'Error updating user profile' });
  }
});

module.exports = router;