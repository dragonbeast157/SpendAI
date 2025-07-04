const express = require('express');
const UserService = require('../services/userService');
const SettingsService = require('../services/settingsService');
const BankAccountService = require('../services/bankAccountService');
const { requireUser } = require('./middleware/auth');

const router = express.Router();

// Get user notification preferences
router.get('/notifications', requireUser, async (req, res) => {
  try {
    console.log('Backend: Fetching notification preferences for user:', req.user._id);

    const user = await UserService.getByIdWithPreferences(req.user._id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    console.log('Backend: Returning notification preferences');
    return res.status(200).json({
      success: true,
      notifications: user.preferences?.notifications || {}
    });
  } catch (error) {
    console.error('Backend: Error fetching notification preferences:', error.message);
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Update user notification preferences
router.put('/notifications', requireUser, async (req, res) => {
  try {
    console.log('Backend: Updating notification preferences for user:', req.user._id);
    console.log('Backend: New preferences:', req.body.notifications);

    const user = await UserService.update(req.user._id, {
      'preferences.notifications': req.body.notifications
    });

    console.log('Backend: Notification preferences updated successfully');
    return res.status(200).json({
      success: true,
      message: 'Notification preferences updated successfully',
      notifications: user.preferences?.notifications || {}
    });
  } catch (error) {
    console.error('Backend: Error updating notification preferences:', error.message);
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Get connected accounts (NEW ROUTE)
router.get('/accounts', requireUser, async (req, res) => {
  try {
    console.log('Backend: Fetching connected accounts for user:', req.user._id);

    const result = await BankAccountService.getAccounts(req.user._id);

    console.log('Backend: Returning connected accounts:', result.accounts.length);
    return res.status(200).json({
      success: true,
      accounts: result.accounts
    });
  } catch (error) {
    console.error('Backend: Error fetching connected accounts:', error.message);
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Disconnect account (NEW ROUTE)
router.delete('/accounts/:id', requireUser, async (req, res) => {
  try {
    console.log('Backend: Disconnecting account:', req.params.id);

    await BankAccountService.delete(req.params.id, req.user._id);

    console.log('Backend: Account disconnected successfully');
    return res.status(200).json({
      success: true,
      message: 'Account disconnected successfully'
    });
  } catch (error) {
    console.error('Backend: Error disconnecting account:', error.message);
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Export user data
router.get('/export', requireUser, async (req, res) => {
  try {
    console.log('Backend: Exporting user data for user:', req.user._id);
    console.log('Backend: Export format:', req.query.format);

    const format = req.query.format || 'json';
    const result = await SettingsService.exportUserData(req.user._id, format);

    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `spendwise-data-${timestamp}.${format}`;

    if (format === 'csv') {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      return res.send(result.data);
    } else {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      return res.json(result.data);
    }
  } catch (error) {
    console.error('Backend: Error exporting user data:', error.message);
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;