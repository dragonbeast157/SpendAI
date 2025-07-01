const express = require('express');
const UserService = require('../services/userService.js');
const SettingsService = require('../services/settingsService.js');
const { requireUser } = require('./middleware/auth.js');

const router = express.Router();

// Get notification preferences
router.get('/notifications', requireUser, async (req, res) => {
  try {
    console.log('Backend: Fetching notification preferences for user:', req.user.email);

    const user = await UserService.get(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const notifications = user.preferences?.notifications || {
      anomalies: true,
      policyViolations: true,
      dailySummary: true,
      weeklyReports: true,
      aiCoachTips: true,
      dealAlerts: true
    };

    console.log('Backend: Returning notification preferences:', notifications);
    return res.status(200).json({
      success: true,
      notifications
    });
  } catch (error) {
    console.error('Backend: Error fetching notification preferences:', error.message);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// Update notification preferences
router.put('/notifications', requireUser, async (req, res) => {
  try {
    console.log('Backend: Updating notification preferences for user:', req.user.email);
    console.log('Backend: New notification preferences:', req.body);

    const { notifications } = req.body;

    if (!notifications || typeof notifications !== 'object') {
      return res.status(400).json({ message: 'Invalid notification preferences' });
    }

    const updateData = {
      preferences: {
        ...req.user.preferences,
        notifications: {
          ...req.user.preferences?.notifications,
          ...notifications
        }
      }
    };

    console.log('Backend: Updating user with preferences:', updateData);

    const updatedUser = await UserService.update(req.user._id, updateData);

    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    console.log('Backend: Notification preferences updated successfully');
    return res.status(200).json({
      success: true,
      message: 'Notification preferences updated successfully',
      notifications: updatedUser.preferences.notifications
    });
  } catch (error) {
    console.error('Backend: Error updating notification preferences:', error.message);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// Export user data
router.get('/export', requireUser, async (req, res) => {
  try {
    console.log('=== BACKEND EXPORT DEBUG START ===');
    console.log('Backend: Starting data export for user:', req.user.email);
    console.log('Backend: Export request query params:', req.query);
    console.log('Backend: Request headers:', req.headers);
    console.log('Backend: Request method:', req.method);
    console.log('Backend: Request URL:', req.url);

    const { format = 'json' } = req.query;

    if (!['json', 'csv'].includes(format)) {
      console.log('Backend: Invalid format requested:', format);
      return res.status(400).json({ message: 'Invalid export format. Use json or csv.' });
    }

    console.log('Backend: Calling SettingsService.exportUserData with format:', format);
    const exportData = await SettingsService.exportUserData(req.user._id, format);

    console.log('Backend: Data export prepared successfully');
    console.log('Backend: Export data type:', typeof exportData);
    console.log('Backend: Export data length/size:', 
      format === 'json' ? JSON.stringify(exportData).length : exportData.length);

    // Generate filename with timestamp
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `spendwise-data-${req.user.email}-${timestamp}.${format}`;

    console.log('Backend: Generated filename:', filename);

    // Prepare response data
    let responseData;
    let contentType;
    let contentLength;

    if (format === 'json') {
      responseData = JSON.stringify(exportData, null, 2);
      contentType = 'application/json';
      contentLength = Buffer.byteLength(responseData, 'utf8');
      
      console.log('Backend: JSON response prepared');
      console.log('Backend: JSON content length:', contentLength);
      console.log('Backend: JSON sample (first 200 chars):', responseData.substring(0, 200));
    } else {
      responseData = exportData;
      contentType = 'text/csv';
      contentLength = Buffer.byteLength(responseData, 'utf8');
      
      console.log('Backend: CSV response prepared');
      console.log('Backend: CSV content length:', contentLength);
      console.log('Backend: CSV sample (first 200 chars):', responseData.substring(0, 200));
    }

    // Set headers
    const headers = {
      'Content-Type': contentType,
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': contentLength,
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    };

    console.log('Backend: Setting response headers:', headers);

    // Set each header explicitly
    Object.entries(headers).forEach(([key, value]) => {
      res.setHeader(key, value);
      console.log(`Backend: Header set - ${key}: ${value}`);
    });

    console.log('Backend: All headers set successfully');
    console.log('Backend: Response headers before send:', res.getHeaders());

    console.log('Backend: Sending response with status 200');
    console.log('Backend: Response data type being sent:', typeof responseData);
    console.log('Backend: Response data length being sent:', responseData.length);

    // Send the response
    res.status(200).send(responseData);
    
    console.log('Backend: Response sent successfully');
    console.log('=== BACKEND EXPORT DEBUG END ===');

  } catch (error) {
    console.error('=== BACKEND EXPORT ERROR ===');
    console.error('Backend: Error exporting user data:', error.message);
    console.error('Backend: Error stack:', error.stack);
    console.error('Backend: Error type:', typeof error);
    console.error('Backend: Error constructor:', error.constructor.name);
    
    return res.status(500).json({ 
      message: 'Internal server error',
      error: error.message 
    });
  }
});

module.exports = router;