import api from './api';

// Description: Complete user onboarding
// Endpoint: POST /api/onboarding/complete
// Request: { profile: object, preferences: object }
// Response: { success: boolean, message: string, user: object }
export const completeOnboarding = async (data: { profile: any; preferences: any }) => {
  try {
    console.log('=== ONBOARDING API CALL START ===');
    console.log('OnboardingAPI: completeOnboarding called with data:', data);
    console.log('OnboardingAPI: Profile data:', data.profile);
    console.log('OnboardingAPI: Preferences data:', data.preferences);

    const response = await api.post('/api/onboarding/complete', data);

    console.log('OnboardingAPI: API response received');
    console.log('OnboardingAPI: Response status:', response.status);
    console.log('OnboardingAPI: Response data:', response.data);
    console.log('OnboardingAPI: Response success:', response.data.success);
    console.log('OnboardingAPI: Response user:', response.data.user);
    console.log('OnboardingAPI: Response user onboarding status:', response.data.user?.onboardingCompleted);
    console.log('=== ONBOARDING API CALL END ===');

    return response.data;
  } catch (error: any) {
    console.error('=== ONBOARDING API ERROR ===');
    console.error('OnboardingAPI: Error completing onboarding:', error);
    console.error('OnboardingAPI: Error message:', error.message);
    console.error('OnboardingAPI: Error response:', error.response);
    console.error('OnboardingAPI: Error response data:', error.response?.data);
    console.error('OnboardingAPI: Error response status:', error.response?.status);
    console.error('=== END ONBOARDING API ERROR ===');
    throw new Error(error?.response?.data?.message || error.message);
  }
};

// Mock implementations for other onboarding functions
export const saveProfile = (data: any) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({ success: true, message: 'Profile saved successfully' });
    }, 500);
  });
};

export const savePreferences = (data: any) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({ success: true, message: 'Preferences saved successfully' });
    }, 500);
  });
};

export const uploadDocument = (file: File) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({ success: true, message: 'Document uploaded successfully' });
    }, 1000);
  });
};

export const connectBankAccount = (data: any) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({ success: true, message: 'Bank account connected successfully' });
    }, 1500);
  });
};

export const getOnboardingStatus = () => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({ completed: false, step: 1 });
    }, 300);
  });
};