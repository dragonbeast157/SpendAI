const express = require('express');
const UserService = require('../services/userService.js');
const { requireUser } = require('./middleware/auth.js');

const router = express.Router();

// Complete onboarding
router.post('/complete', requireUser, async (req, res) => {
  try {
    console.log('=== ONBOARDING COMPLETION START ===');
    console.log('Onboarding: User completing onboarding:', req.user.email);
    console.log('Onboarding: Current user onboarding status:', req.user.onboardingCompleted);
    console.log('Onboarding: Request body:', req.body);

    const { profile, preferences } = req.body;

    // Validate required data
    if (!profile) {
      console.log('Onboarding: Profile data missing');
      return res.status(400).json({ message: 'Profile data is required' });
    }

    console.log('Onboarding: Profile data received:', profile);
    console.log('Onboarding: Preferences data received:', preferences);

    // Prepare update data
    const updateData = {
      name: profile.name || req.user.name,
      onboardingCompleted: true,
      onboardingCompletedAt: new Date(),
    };

    // Add preferences if provided
    if (preferences) {
      updateData.preferences = {
        ...req.user.preferences,
        ...preferences,
        notifications: {
          ...req.user.preferences?.notifications,
          ...preferences.notifications
        }
      };
      console.log('Onboarding: Updated preferences:', updateData.preferences);
    }

    console.log('Onboarding: Final update data:', {
      ...updateData,
      onboardingCompletedAt: updateData.onboardingCompletedAt.toISOString()
    });

    // Update user in database
    console.log('Onboarding: Updating user with ID:', req.user._id);
    const updatedUser = await UserService.update(req.user._id, updateData);

    if (!updatedUser) {
      console.error('Onboarding: Failed to update user - user not found');
      return res.status(404).json({ message: 'User not found' });
    }

    console.log('Onboarding: User updated successfully');
    console.log('Onboarding: Updated user onboarding status:', updatedUser.onboardingCompleted);
    console.log('Onboarding: Updated user onboarding completed at:', updatedUser.onboardingCompletedAt);

    // Return success response
    const response = {
      success: true,
      message: 'Onboarding completed successfully',
      user: {
        _id: updatedUser._id,
        email: updatedUser.email,
        name: updatedUser.name,
        accountType: updatedUser.accountType,
        onboardingCompleted: updatedUser.onboardingCompleted,
        onboardingCompletedAt: updatedUser.onboardingCompletedAt,
        companyName: updatedUser.companyName,
        companySize: updatedUser.companySize,
        industry: updatedUser.industry,
        preferences: updatedUser.preferences
      }
    };

    console.log('Onboarding: Sending success response:', {
      ...response,
      user: {
        ...response.user,
        onboardingCompleted: response.user.onboardingCompleted,
        onboardingCompletedAt: response.user.onboardingCompletedAt?.toISOString()
      }
    });
    console.log('=== ONBOARDING COMPLETION END ===');

    res.status(200).json(response);
  } catch (error) {
    console.error('=== ONBOARDING COMPLETION ERROR ===');
    console.error('Onboarding: Error completing onboarding:', error.message);
    console.error('Onboarding: Error stack:', error.stack);
    console.error('=== END ONBOARDING COMPLETION ERROR ===');
    
    res.status(500).json({ 
      success: false,
      message: 'Internal server error',
      error: error.message 
    });
  }
});

module.exports = router;