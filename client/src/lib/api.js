import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:4000/api',
});

export const setupAxiosInterceptors = (getToken) => {
  api.interceptors.request.use(async (config) => {
    try {
      const token = await getToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('Error fetching token for API request:', error);
    }
    return config;
  }, (error) => {
    return Promise.reject(error);
  });
};

export const registerVoicePin = async (fullName, voicePin) => {
  try {
    const response = await api.post('/auth/register', { fullName, voicePin });
    return response.data;
  } catch (error) {
    console.error("Voice Register Error:", error);
    throw error;
  }
};

export const loginWithVoicePin = async (fullName, voicePin) => {
  try {
    const response = await api.post('/auth/voice-login', { fullName, voicePin });
    return response.data;
  } catch (error) {
    console.error("Voice Login Error:", error);
    throw error;
  }
};

export const fetchProducts = async (page = 1, limit = 12, category = '') => {
  try {
    const params = { page, limit };
    if (category) params.category = category;
    const response = await api.get('/products', { params });
    return response.data;
  } catch (error) {
    console.error("Fetch Products Error:", error);
    throw error;
  }
};

export const fetchProductById = async (id) => {
  try {
    const response = await api.get(`/products/${id}`);
    return response.data;
  } catch (error) {
    console.error("Fetch Product Error:", error);
    throw error;
  }
};

export default api;