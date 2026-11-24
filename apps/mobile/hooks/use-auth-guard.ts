import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/store/auth';

export function useAuthGuard() {
  const router = useRouter();
  const { token, isLoading } = useAuthStore();

  useEffect(() => {
    if (!isLoading && !token) {
      router.replace('/(auth)/login');
    }
  }, [token, isLoading]);

  return { isLoading, isAuthenticated: !!token };
}
