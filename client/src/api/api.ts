import axios from 'axios';

const api = axios.create({
  baseURL: '/',
  timeout: 10000,
});

// Add request interceptor to include auth token
api.interceptors.request.use(
  (config) => {
    console.log('=== API REQUEST INTERCEPTOR ===');
    console.log('API Request: Method:', config.method?.toUpperCase());
    console.log('API Request: URL:', config.url);
    console.log('API Request: Full URL:', config.baseURL + config.url);
    console.log('API Request: Params:', config.params);
    console.log('API Request: Data:', config.data);
    
    const token = localStorage.getItem('accessToken')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
      console.log('API Request: Authorization header added');
    } else {
      console.log('API Request: No access token found in localStorage');
    }
    
    console.log('API Request: Final headers:', config.headers);
    return config
  },
  (error) => {
    console.error('API Request Interceptor Error:', error);
    return Promise.reject(error)
  }
);

// Add response interceptor to handle errors
api.interceptors.response.use(
  (response) => {
    console.log('=== API RESPONSE INTERCEPTOR ===');
    console.log('API Response: Status:', response.status);
    console.log('API Response: URL:', response.config.url);
    console.log('API Response: Data type:', typeof response.data);
    console.log('API Response: Data:', response.data);
    
    // Handle blob responses (file downloads)
    if (response.data instanceof Blob) {
      console.log('API Response: Blob detected, size:', response.data.size);
      return response
    }
    
    return response
  },
  (error) => {
    console.error('=== API RESPONSE ERROR ===');
    console.error('API Error: Status:', error.response?.status);
    console.error('API Error: URL:', error.config?.url);
    console.error('API Error: Response data:', error.response?.data);
    console.error('API Error: Message:', error.message);
    
    if (error.response?.status === 401) {
      console.log('API Error: 401 Unauthorized - clearing tokens');
      localStorage.removeItem('accessToken')
      localStorage.removeItem('refreshToken')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
);

export default api;