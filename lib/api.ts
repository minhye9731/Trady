import axios from 'axios';
import { useAuthStore } from '../store/auth';

// The deployed API works on both the simulator and a physical iPhone.
// For a local backend, set EXPO_PUBLIC_API_URL in .env (use your Mac's LAN IP on a device).
const baseURL = process.env.EXPO_PUBLIC_API_URL || 'https://trady-api.onrender.com';

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
