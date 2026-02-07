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

export default api;