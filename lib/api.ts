import axios from 'axios';
import Constants from 'expo-constants';
import { useAuthStore } from '../store/auth';

// Determine API URL based on environment
let baseURL = 'https://trady-api.onrender.com';

if (__DEV__) {
  // Development: auto-detect Mac IP from Expo hostUri
  const hostUri = Constants.expoConfig?.hostUri;
  if (hostUri) {
    // hostUri format: "192.168.1.100:19000" or "192.168.1.100"
    const ip = hostUri.split(':')[0];
    baseURL = `http://${ip}:8000`;
  }
} else {
  // Production: use Render backend URL
  baseURL = process.env.EXPO_PUBLIC_API_URL || 'https://trady-api.onrender.com';
}

export const api = axios.create({
  baseURL,
  // Render's free tier can take a while to wake up.
  timeout: 30000,
});

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    // Expired or invalid session: drop the token so the router shows the login screen.
    if (error.response?.status === 401 && useAuthStore.getState().token) {
      await useAuthStore.getState().logout();
    }
    return Promise.reject(error);
  }
);

export function errorMessage(error: unknown, fallback = 'Something went wrong') {
  if (axios.isAxiosError(error)) {
    const detail = error.response?.data?.detail;
    if (typeof detail === 'string') return detail;
    if (error.code === 'ECONNABORTED') return 'The server took too long to respond. Please try again.';
    if (!error.response) return 'Cannot reach the server. Check your connection.';
  }
  return fallback;
}
