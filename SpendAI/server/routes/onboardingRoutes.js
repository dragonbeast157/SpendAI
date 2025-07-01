const express = require('express');
const UserService = require('../services/userService.js');
const { requireUser } = require('./middleware/auth.js');

const router = express.Router();

// Complete onboarding
router.post('/complete', requireUser, async (req, res) => {
  try {
    console.log('Backend: Onboarding completion request for user:', req.user.email);
    console.log('Backend: User current account type before onboarding completion:', req.user.accountType);
    console.log('Backend: Onboarding completion data received:', req.body);

    const { 
      accountType, 
      companyName, 
      companySize, 
      industry, 
      preferences,
      goals,
      notificationPreferences 
    } = req.body;

    // Prepare update data
    const updateData = {
      onboardingCompleted: true,
      onboardingCompletedAt: new Date(),
    };

    // Only update account type if it's provided in the request
    if (accountType) {
      updateData.accountType = accountType;
      console.log('Backend: Setting account type from onboarding to:', accountType);
    } else {
      console.log('Backend: No account type in onboarding data, preserving existing:', req.user.accountType);
    }

    // Add business fields if account type is business
    if ((accountType === 'business') || (req.user.accountType === 'business' && !accountType)) {
      console.log('Backend: Processing business account onboarding completion');
      if (companyName) updateData.companyName = companyName;
      if (companySize) updateData.companySize = companySize;
      if (industry) updateData.industry = industry;
      console.log('Backend: Business fields added to onboarding update:', {
        companyName: updateData.companyName,
        companySize: updateData.companySize,
        industry: updateData.industry
      });
    }

    // Update preferences if provided
    if (preferences) {
      updateData.preferences = {
        ...req.user.preferences,
        ...preferences
      };
    }

    // Update notification preferences if provided
    if (notificationPreferences) {
      updateData.preferences = {
        ...updateData.preferences,
        notifications: {
          ...req.user.preferences?.notifications,
          ...notificationPreferences
        }
      };
    }

    console.log('Backend: Final onboarding update data:', updateData);

    const updatedUser = await UserService.update(req.user._id, updateData);

    if (!updatedUser) {
      console.log('Backend: Failed to update user during onboarding completion');
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    console.log('Backend: Onboarding completed successfully for user:', updatedUser.email);
    console.log('Backend: User account type after onboarding completion:', updatedUser.accountType);
    console.log('Backend: User onboarding status:', updatedUser.onboardingCompleted);

    return res.status(200).json({
      success: true,
      message: 'Onboarding completed successfully',
      user: updatedUser.toObject()
    });

  } catch (error) {
    console.error('Backend: Error completing onboarding:', error.message);
    return res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
});

module.exports = router;