import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';

interface AuthStore {
  token: string | null;
  userId: string | null;
  isLoading: boolean;
  loadFromStorage: () => Promise<void>;
  setAuth: (token: string, userId: string) => Promise<void>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthStore>((set) => ({
  token: null,
  userId: null,
  isLoading: true,

  loadFromStorage: async () => {
    try {
      const token = await SecureStore.getItemAsync('auth_token');
      const userId = await SecureStore.getItemAsync('user_id');

      if (token && userId) {
        set({ token, userId, isLoading: false });
      } else {
        set({ isLoading: false });
      }
    } catch (error) {
      console.error('Failed to load auth from storage:', error);
      set({ isLoading: false });
    }
  },

  setAuth: async (token: string, userId: string) => {
    try {
      await SecureStore.setItemAsync('auth_token', token);
      await SecureStore.setItemAsync('user_id', userId);
      set({ token, userId });
    } catch (error) {
      console.error('Failed to save auth to storage:', error);
      throw error;
    }
  },

  logout: async () => {
    try {
      await SecureStore.deleteItemAsync('auth_token');
      await SecureStore.deleteItemAsync('user_id');
      set({ token: null, userId: null });
    } catch (error) {
      console.error('Failed to logout:', error);
      throw error;
    }
  },
}));
