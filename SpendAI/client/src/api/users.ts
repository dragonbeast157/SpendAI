import api from './api';

// Description: Get current user profile
// Endpoint: GET /api/users/profile
// Request: {}
// Response: { user: User }
export const getCurrentUser = async () => {
  console.log('=== USERS API GET CURRENT USER START ===');
  console.log('UsersAPI: getCurrentUser called');

  // Mocking the response
  return new Promise((resolve) => {
    setTimeout(() => {
      console.log('UsersAPI: getCurrentUser mock response resolving');
      const mockUser = {
        _id: 'mock-user-id',
        email: 'test@example.com',
        name: 'Test User',
        accountType: 'business',
        onboardingCompleted: true, // Changed to true to allow dashboard access
        companyName: 'Test Company',
        companySize: '1-10',
        industry: 'Technology'
      };
      console.log('UsersAPI: Mock user data being returned:', mockUser);
      console.log('UsersAPI: Mock user onboardingCompleted status:', mockUser.onboardingCompleted);
      resolve({ user: mockUser });
    }, 300);
  });
  // Uncomment the below lines to make an actual API call
  // try {
  //   console.log('UsersAPI: Making actual API call to get current user');
  //   const response = await api.get('/api/users/profile');
  //   console.log('UsersAPI: getCurrentUser API response:', response.data);
  //   console.log('UsersAPI: User onboardingCompleted status from API:', response.data.user?.onboardingCompleted);
  //   return response.data;
  // } catch (error: any) {
  //   console.error('UsersAPI: getCurrentUser API error:', error);
  //   throw new Error(error?.response?.data?.message || error.message);
  // }
};

// Description: Update user profile
// Endpoint: PUT /api/users/profile
// Request: { name?: string, email?: string, accountType?: string, companyName?: string, companySize?: string, industry?: string }
// Response: { success: boolean, message: string, user: User }
export const updateUserProfile = async (userData: any) => {
  console.log('=== USERS API UPDATE PROFILE START ===');
  console.log('UsersAPI: updateUserProfile called with data:', userData);

  // Mocking the response
  return new Promise((resolve) => {
    setTimeout(() => {
      console.log('UsersAPI: updateUserProfile mock response resolving');
      resolve({
        success: true,
        message: 'Profile updated successfully',
        user: {
          _id: 'mock-user-id',
          email: 'test@example.com',
          name: 'Test User',
          accountType: 'business',
          onboardingCompleted: true, // Should be updated to true after completion
          companyName: 'Test Company',
          companySize: '1-10',
          industry: 'Technology',
          ...userData
        }
      });
    }, 500);
  });
  // Uncomment the below lines to make an actual API call
  // try {
  //   console.log('UsersAPI: Making actual API call to update user profile');
  //   const response = await api.put('/api/users/profile', userData);
  //   console.log('UsersAPI: updateUserProfile API response:', response.data);
  //   return response.data;
  // } catch (error: any) {
  //   console.error('UsersAPI: updateUserProfile API error:', error);
  //   throw new Error(error?.response?.data?.message || error.message);
  // }
};