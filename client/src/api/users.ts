import api from './api';

// Description: Get current user profile
// Endpoint: GET /api/users/profile
// Request: {}
// Response: { _id: string, email: string, name: string, accountType: string, onboardingCompleted: boolean, ... }
export const getCurrentUser = async () => {
  try {
    console.log('=== USERS API GET CURRENT USER START ===');
    console.log('UsersAPI: getCurrentUser called');
    
    const response = await api.get('/api/users/profile');
    
    console.log('UsersAPI: Real API response received');
    console.log('UsersAPI: Response data:', response.data);
    console.log('UsersAPI: User onboarding status:', response.data.onboardingCompleted);
    console.log('=== USERS API GET CURRENT USER END ===');
    
    return response.data;
  } catch (error: any) {
    console.error('UsersAPI: Error getting current user:', error);
    throw new Error(error?.response?.data?.message || error.message);
  }
};

// Description: Update user profile
// Endpoint: PUT /api/users/profile
// Request: { name?: string, preferences?: object, accountType?: string }
// Response: { success: boolean, message: string, user: object }
export const updateUserProfile = async (data: any) => {
  try {
    console.log('UsersAPI: updateUserProfile called with data:', data);
    
    const response = await api.put('/api/users/profile', data);
    
    console.log('UsersAPI: Update profile response:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('UsersAPI: Error updating user profile:', error);
    throw new Error(error?.response?.data?.message || error.message);
  }
};