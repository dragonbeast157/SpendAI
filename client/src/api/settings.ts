import api from './api';
import { updateUserProfile } from './users';

// Description: Get user notification preferences
// Endpoint: GET /api/settings/notifications
// Request: {}
// Response: { success: boolean, notifications: NotificationPreferences }
export const getNotificationPreferences = async () => {
  try {
    const response = await api.get('/api/settings/notifications');
    return response.data;
  } catch (error: any) {
    throw new Error(error?.response?.data?.message || error.message);
  }
};

// Description: Update user notification preferences
// Endpoint: PUT /api/settings/notifications
// Request: { notifications: NotificationPreferences }
// Response: { success: boolean, message: string, notifications: NotificationPreferences }
export const updateNotificationPreferences = async (preferences: any) => {
  try {
    const response = await api.put('/api/settings/notifications', { notifications: preferences });
    return response.data;
  } catch (error: any) {
    throw new Error(error?.response?.data?.message || error.message);
  }
};

// Description: Get connected accounts
// Endpoint: GET /api/settings/accounts
// Request: {}
// Response: { accounts: Array<ConnectedAccount> }
export const getConnectedAccounts = async () => {
  try {
    const response = await api.get('/api/settings/accounts');
    return response.data;
  } catch (error: any) {
    throw new Error(error?.response?.data?.message || error.message);
  }
};

// Description: Disconnect a bank account
// Endpoint: DELETE /api/bank-accounts/:accountId
// Request: { accountId: string }
// Response: { success: boolean, message: string }
export const disconnectAccount = async (accountId: string) => {
  try {
    console.log('API: Disconnecting bank account via settings:', accountId);
    const response = await api.delete(`/api/bank-accounts/${accountId}`);
    console.log('API: Disconnect account response:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('API: Error disconnecting account:', error);
    throw new Error(error?.response?.data?.message || error.message);
  }
};

// Description: Get spending categories
// Endpoint: GET /api/settings/categories
// Request: {}
// Response: { categories: Array<SpendingCategory> }
export const getSpendingCategories = async () => {
  // Mocking the response
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        categories: [
          { _id: '1', name: 'Dining', budget: 500, color: '#3B82F6' },
          { _id: '2', name: 'Groceries', budget: 400, color: '#10B981' },
          { _id: '3', name: 'Transport', budget: 200, color: '#F59E0B' },
          { _id: '4', name: 'Shopping', budget: 300, color: '#EF4444' },
          { _id: '5', name: 'Entertainment', budget: 150, color: '#8B5CF6' },
          { _id: '6', name: 'Healthcare', budget: 200, color: '#84CC16' },
          { _id: '7', name: 'Utilities', budget: 250, color: '#06B6D4' },
          { _id: '8', name: 'Other', budget: 100, color: '#6B7280' }
        ]
      });
    }, 350);
  });
  // Uncomment the below lines to make an actual API call
  // try {
  //   const response = await api.get('/api/settings/categories');
  //   return response.data;
  // } catch (error: any) {
  //   throw new Error(error?.response?.data?.message || error.message);
  // }
};

// Description: Update spending category
// Endpoint: PUT /api/settings/categories/:id
// Request: { id: string, name?: string, budget?: number, color?: string }
// Response: { success: boolean, message: string, category: SpendingCategory }
export const updateSpendingCategory = async (categoryId: string, data: any) => {
  // Mocking the response
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        success: true,
        message: 'Category updated successfully',
        category: {
          _id: categoryId,
          ...data
        }
      });
    }, 500);
  });
  // Uncomment the below lines to make an actual API call
  // try {
  //   const response = await api.put(`/api/settings/categories/${categoryId}`, data);
  //   return response.data;
  // } catch (error: any) {
  //   throw new Error(error?.response?.data?.message || error.message);
  // }
};

// Description: Export user data in specified format
// Endpoint: GET /api/settings/export
// Request: { format: 'json' | 'csv' }
// Response: File download (direct browser download)
export const exportUserData = async (params: { format: 'json' | 'csv' }) => {
  try {
    console.log('=== API EXPORT START ===');
    console.log('API: Exporting user data with format:', params.format);

    // Get the access token from localStorage
    const accessToken = localStorage.getItem('accessToken');
    if (!accessToken) {
      throw new Error('No access token found. Please log in again.');
    }

    console.log('API: Access token found, creating download URL');

    // Create the full URL for the export endpoint
    const baseURL = window.location.origin.replace(':5173', ':3000'); // Replace frontend port with backend port
    const exportURL = `${baseURL}/api/settings/export?format=${params.format}`;

    console.log('API: Export URL created:', exportURL);

    // Create a temporary link element for download
    const link = document.createElement('a');
    link.href = exportURL;
    link.style.display = 'none';

    // Add authorization header by creating a fetch request and converting to blob
    console.log('API: Making authenticated request for download');

    const response = await fetch(exportURL, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': params.format === 'csv' ? 'text/csv' : 'application/json'
      }
    });

    console.log('API: Fetch response received, status:', response.status);

    if (!response.ok) {
      throw new Error(`Export failed: ${response.status} ${response.statusText}`);
    }

    // Get the blob from response
    const blob = await response.blob();
    console.log('API: Blob created from response, size:', blob.size);

    // Create object URL and trigger download
    const url = window.URL.createObjectURL(blob);
    console.log('API: Object URL created:', url);

    // Generate filename with timestamp
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `spendwise-data-${timestamp}.${params.format}`;

    console.log('API: Generated filename:', filename);

    // Create and click download link
    link.href = url;
    link.download = filename;

    document.body.appendChild(link);
    console.log('API: Download link appended to body');

    link.click();
    console.log('API: Download link clicked');

    document.body.removeChild(link);
    console.log('API: Download link removed from body');

    // Clean up the URL object
    window.URL.revokeObjectURL(url);
    console.log('API: Object URL revoked');

    console.log('API: File download process completed successfully');
    console.log('=== API EXPORT END ===');

    return { success: true, message: 'Data exported successfully' };
  } catch (error: any) {
    console.error('=== API EXPORT ERROR ===');
    console.error('API: Error exporting user data:', error);
    console.error('API: Error type:', typeof error);
    console.error('API: Error message:', error.message);
    throw new Error(error.message || 'Failed to export data');
  }
};

// Description: Switch account type
// Endpoint: PUT /api/users/profile
// Request: { accountType: 'personal' | 'business' }
// Response: { success: boolean, message: string, user: User }
export const switchAccountType = async (accountType: 'personal' | 'business') => {
  try {
    const response = await updateUserProfile({ accountType });
    return response;
  } catch (error: any) {
    throw new Error(error?.response?.data?.message || error.message);
  }
};

// Description: Update user profile through settings
// Endpoint: PUT /api/users/profile
// Request: { name?: string, email?: string, companyName?: string, etc. }
// Response: { success: boolean, message: string, user: User }
export const updateProfile = async (profileData: any) => {
  try {
    const response = await updateUserProfile(profileData);
    return response;
  } catch (error: any) {
    throw new Error(error?.response?.data?.message || error.message);
  }
};