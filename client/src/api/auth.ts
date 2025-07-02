import api from './api';

// Description: User login
// Endpoint: POST /api/auth/login
// Request: { email: string, password: string }
// Response: { accessToken: string, refreshToken: string, user: User }
export const login = async (email: string, password: string) => {
  console.log('API: Starting login process');
  try {
    const response = await api.post('/api/auth/login', { email, password });
    console.log('API: Login successful');
    return response.data;
  } catch (error: any) {
    console.error('API: Login error:', error?.response?.data?.message || error.message);
    throw new Error(error?.response?.data?.message || error.message);
  }
};

// Description: User registration
// Endpoint: POST /api/auth/register
// Request: { email: string, password: string, name: string, accountType: string, companyName?: string, companySize?: string, industry?: string }
// Response: { accessToken: string, refreshToken: string, user: User }
export const register = async (formData: any) => {
  console.log('API: Starting registration process');
  console.log('API: Form data being sent:', formData);
  try {
    // Send the form data directly, not nested under email
    const response = await api.post('/api/auth/register', formData);
    console.log('API: Registration successful');
    return response.data;
  } catch (error: any) {
    console.error('API: Registration error:', error?.response?.data?.message || error.message);
    throw new Error(error?.response?.data?.message || error.message);
  }
};

// Description: User logout
// Endpoint: POST /api/auth/logout
// Request: {}
// Response: { success: boolean }
export const logout = async () => {
  try {
    const response = await api.post('/api/auth/logout');
    return response.data;
  } catch (error: any) {
    throw new Error(error?.response?.data?.message || error.message);
  }
};

// Description: Delete user account
// Endpoint: DELETE /api/auth/delete-account
// Request: {}
// Response: { success: boolean, message: string }
export const deleteAccount = async () => {
  try {
    const response = await api.delete('/api/auth/delete-account');
    return response.data;
  } catch (error: any) {
    throw new Error(error?.response?.data?.message || error.message);
  }
};