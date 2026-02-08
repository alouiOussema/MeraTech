import axios from 'axios';
import { speak } from './voice';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:4000/api',
  timeout: 8000,
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
    if (error.code === 'ERR_NETWORK' || !error.response) {
       speak("ما نجمتش نوصل للسيرفر. تأكد الباك اند يخدم.");
       console.error(`[API] Connection failed to ${api.defaults.baseURL}:`, error.message);
    }
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

// --- Bank & Orders ---

export const fetchBalance = async () => {
  try {
    const response = await api.get('/bank/balance');
    return response.data;
  } catch (error) {
    console.error("Fetch Balance Error:", error);
    throw error;
  }
};

export const fetchTransactions = async () => {
  try {
    const response = await api.get('/bank/transactions');
    return response.data;
  } catch (error) {
    console.error("Fetch Transactions Error:", error);
    throw error;
  }
};

export const checkoutOrder = async (items) => {
  try {
    const response = await api.post('/orders/checkout', { items });
    return response.data;
  } catch (error) {
    console.error("Checkout Error:", error);
    throw error;
  }
};

export const transferMoney = async (toName, amount) => {
  try {
    const response = await api.post('/bank/transfer', { toName, amount });
    return response.data;
  } catch (error) {
    console.error("Transfer Error:", error);
    throw error;
  }
};

export default api;
