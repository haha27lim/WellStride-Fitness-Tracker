const BACKEND_URL = process.env.VITE_API_URL || 'http://localhost:8080';

const getToken = () => {
  try {
    const userStr = localStorage.getItem('user');
    if (!userStr) return null;

    const user = JSON.parse(userStr);
    return user?.token || null;
  } catch (e) {
    console.error('Error getting token:', e);
    return null;
  }
};


export const debugToken = () => {
  const token = getToken();
  if (!token) {
    console.log('No token found in localStorage');
    return;
  }

  console.log('Token:', token.substring(0, 20) + '...');
  try {

    const payload = token.split('.')[1];
    if (payload) {
      const decoded = JSON.parse(atob(payload));
      console.log('Decoded token:', decoded);
      console.log('Roles:', decoded.roles || decoded.authorities || 'None found');
      console.log('Expiration:', new Date(decoded.exp * 1000).toLocaleString());
    }
  } catch (e) {
    console.log('Not a valid JWT token or cannot decode');
  }
};


export const request = async (url, options = {}) => {

  const fullUrl = url.startsWith('http') ? url : `${BACKEND_URL}${url}`;

  try {
    const token = getToken();
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(url, {
      method: options.method || 'GET',
      headers,
      body: options.body ? JSON.stringify(options.body) : undefined,
      credentials: 'include',
    });

    console.log(`API Response for ${url}:`, response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('API Error Response:', errorText);
      throw new Error(errorText || response.statusText);
    }

    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return await response.json();
    }

    return await response.text();
  } catch (error) {
    console.error('API Direct error:', error);
    throw error;
  }
};


export const get = (url, headers) => request(url, { headers });

export const post = (url, data, headers) =>
  request(url, { method: 'POST', body: data, headers });

export const put = (url, data, headers) =>
  request(url, { method: 'PUT', body: data, headers });

export const del = (url, headers) =>
  request(url, { method: 'DELETE', headers });

export default {
  debugToken,
  request,
  get,
  post,
  put,
  delete: del
};