import api from './api';
import { updateUserProfile } from './users';

// Description: Get user notification preferences
// Endpoint: GET /api/settings/notifications
// Request: {}
// Response: { preferences: NotificationPreferences }
export const getNotificationPreferences = async () => {
  // Mocking the response
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        preferences: {
          pushNotifications: true,
          emailSummaries: true,
          weeklyReports: true,
          aiCoachTips: true,
          policyAlerts: true,
          dealAlerts: false,
          goalMilestones: true
        }
      });
    }, 300);
  });
  // Uncomment the below lines to make an actual API call
  // try {
  //   const response = await api.get('/api/settings/notifications');
  //   return response.data;
  // } catch (error: any) {
  //   throw new Error(error?.response?.data?.message || error.message);
  // }
};

// Description: Update user notification preferences
// Endpoint: PUT /api/settings/notifications
// Request: { preferences: NotificationPreferences }
// Response: { success: boolean, message: string }
export const updateNotificationPreferences = async (preferences: any) => {
  // Mocking the response
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        success: true,
        message: 'Notification preferences updated successfully'
      });
    }, 500);
  });
  // Uncomment the below lines to make an actual API call
  // try {
  //   const response = await api.put('/api/settings/notifications', { preferences });
  //   return response.data;
  // } catch (error: any) {
  //   throw new Error(error?.response?.data?.message || error.message);
  // }
};

// Description: Get connected accounts
// Endpoint: GET /api/settings/accounts
// Request: {}
// Response: { accounts: Array<ConnectedAccount> }
export const getConnectedAccounts = async () => {
  // Mocking the response
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        accounts: [
          {
            _id: '1',
            bankName: 'Chase Bank',
            accountType: 'Checking',
            lastSync: new Date().toISOString(),
            status: 'connected'
          },
          {
            _id: '2',
            bankName: 'Wells Fargo',
            accountType: 'Credit Card',
            lastSync: new Date(Date.now() - 86400000).toISOString(),
            status: 'connected'
          }
        ]
      });
    }, 400);
  });
  // Uncomment the below lines to make an actual API call
  // try {
  //   const response = await api.get('/api/settings/accounts');
  //   return response.data;
  // } catch (error: any) {
  //   throw new Error(error?.response?.data?.message || error.message);
  // }
};

// Description: Disconnect a bank account
// Endpoint: DELETE /api/settings/accounts/:id
// Request: { id: string }
// Response: { success: boolean, message: string }
export const disconnectAccount = async (accountId: string) => {
  // Mocking the response
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        success: true,
        message: 'Account disconnected successfully'
      });
    }, 500);
  });
  // Uncomment the below lines to make an actual API call
  // try {
  //   const response = await api.delete(`/api/settings/accounts/${accountId}`);
  //   return response.data;
  // } catch (error: any) {
  //   throw new Error(error?.response?.data?.message || error.message);
  // }
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

// Description: Export user data
// Endpoint: GET /api/settings/export
// Request: { format: 'json' | 'csv' }
// Response: Blob (file download)
export const exportUserData = async (format: 'json' | 'csv') => {
  // Mocking the response
  return new Promise((resolve) => {
    setTimeout(() => {
      const mockData = format === 'json' 
        ? JSON.stringify({ message: 'Mock JSON export data' })
        : 'Date,Merchant,Amount,Category\n2024-01-01,Starbucks,-12.50,Dining';
      
      const blob = new Blob([mockData], { 
        type: format === 'json' ? 'application/json' : 'text/csv' 
      });
      resolve(blob);
    }, 1000);
  });
  // Uncomment the below lines to make an actual API call
  // try {
  //   const response = await api.get(`/api/settings/export?format=${format}`, {
  //     responseType: 'blob'
  //   });
  //   return response.data;
  // } catch (error: any) {
  //   throw new Error(error?.response?.data?.message || error.message);
  // }
};

// Description: Switch account type
// Endpoint: PUT /api/settings/account-type
// Request: { accountType: 'personal' | 'business' }
// Response: { success: boolean, message: string, user: User }
export const switchAccountType = async (accountType: 'personal' | 'business') => {
  // Use the correct function name from users.ts
  return await updateUserProfile({ accountType });
};

// Description: Update user profile through settings
// Endpoint: PUT /api/users/profile
// Request: { name?: string, email?: string, companyName?: string, etc. }
// Response: { success: boolean, message: string, user: User }
export const updateProfile = async (profileData: any) => {
  // Use the correct function name from users.ts
  return await updateUserProfile(profileData);
};