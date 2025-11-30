import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});


api.interceptors.request.use(
  (config) => {
    const userStr = localStorage.getItem('user');
    
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        
        if (user && user.token) {
          const token = user.token.startsWith('Bearer ') ? user.token : `Bearer ${user.token}`;
          config.headers['Authorization'] = token;
        }
      } catch (e) {

        console.error('Error parsing user from localStorage', e);
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);


api.interceptors.response.use(
  (response) => response,
  (error) => {

    console.error('API Error:', error?.config?.url, error?.response?.status, error?.response?.data || error?.message);

    const status = error?.response?.status;
    const requestUrl = error?.config?.url || '';
    

    const authPathsToSkip = [
      '/api/auth/signin',
      '/api/auth/signup',
      '/api/auth/forgot-password',
      '/api/auth/reset-password',
      '/oauth2/authorization',
      '/oauth2/redirect'
    ];
    const shouldSkipRedirect = authPathsToSkip.some(p => requestUrl.includes(p));

    if (status === 401 && !shouldSkipRedirect) {
      console.log('Authentication expired, redirecting to login...');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }

    return Promise.reject(error);
  }
);

export default api; 