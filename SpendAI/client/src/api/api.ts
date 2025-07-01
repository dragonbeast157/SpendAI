import axios from 'axios';

const api = axios.create({
  baseURL: '',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add authentication token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle authentication and token refresh
api.interceptors.response.use(
  (response) => {
    console.log('API Response interceptor - success path');
    console.log('Response config:', response.config);
    console.log('Response data type:', typeof response.data);
    console.log('Response data instanceof Blob:', response.data instanceof Blob);
    console.log('ResponseType requested:', response.config.responseType);

    // Don't parse blob responses as JSON
    if (response.config.responseType === 'blob') {
      console.log('API Response interceptor - blob response detected, returning as-is');
      return response;
    }

    console.log('API Response interceptor - returning normal response');
    return response;
  },
  async (error) => {
    console.log('API Response interceptor - error path');
    console.log('Error config:', error.config);
    console.log('Error response:', error.response);
    console.log('Error response data type:', typeof error.response?.data);
    console.log('Error response data instanceof Blob:', error.response?.data instanceof Blob);

    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (refreshToken) {
          const response = await axios.post('/api/auth/refresh', {
            refreshToken: refreshToken,
          });

          const { accessToken } = response.data;
          localStorage.setItem('accessToken', accessToken);

          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    // Don't try to parse blob error responses as JSON
    if (error.response?.data instanceof Blob && originalRequest.responseType === 'blob') {
      console.log('API Response interceptor - blob error response detected, handling specially');
      // For blob responses that are actually errors, we need to convert the blob to text first
      try {
        const text = await error.response.data.text();
        console.log('API Response interceptor - blob error text:', text);
        try {
          const errorData = JSON.parse(text);
          error.response.data = errorData;
        } catch (parseError) {
          console.log('API Response interceptor - could not parse blob error as JSON');
          error.response.data = { message: text };
        }
      } catch (blobError) {
        console.error('API Response interceptor - could not read blob error:', blobError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;