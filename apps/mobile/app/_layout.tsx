import { useEffect } from 'react';
import { DefaultTheme, ThemeProvider } from 'expo-router/react-navigation';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import 'react-native-reanimated';

import { palette } from '@/constants/theme';
import { useAuthStore } from '@/store/auth';

SplashScreen.preventAutoHideAsync();

const theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: palette.background,
    card: palette.surface,
    text: palette.ink,
    border: palette.border,
    primary: palette.ink,
  },
};

export default function RootLayout() {
  const { token, isLoading, loadFromStorage } = useAuthStore();

  useEffect(() => {
    loadFromStorage();
  }, [loadFromStorage]);

  useEffect(() => {
    if (!isLoading) SplashScreen.hideAsync();
  }, [isLoading]);

  if (isLoading) return null;

  const signedIn = !!token;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider value={theme}>
        <Stack
          screenOptions={{
            headerTintColor: palette.ink,
            headerTitleStyle: { fontWeight: '600' },
            headerShadowVisible: false,
            headerStyle: { backgroundColor: palette.background },
            headerBackButtonDisplayMode: 'minimal',
            contentStyle: { backgroundColor: palette.background },
          }}>
          <Stack.Protected guard={signedIn}>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="trade/[id]" options={{ title: '' }} />
            <Stack.Screen name="trade/new" options={{ presentation: 'modal', title: 'New Trade' }} />
            <Stack.Screen name="principle" options={{ presentation: 'modal', title: 'Principle' }} />
            <Stack.Screen name="report/[id]" options={{ title: 'AI Report' }} />
            <Stack.Screen name="market" options={{ title: 'Market Signals' }} />
          </Stack.Protected>
          <Stack.Protected guard={!signedIn}>
            <Stack.Screen name="(auth)" options={{ headerShown: false }} />
          </Stack.Protected>
        </Stack>
        <StatusBar style="dark" />
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
