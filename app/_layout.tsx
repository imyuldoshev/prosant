import React, { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { ThemeProvider, useTheme } from '../src/theme';
import { AuthProvider, useAuth } from '../src/lib/auth';
import { useFonts, Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold } from '@expo-google-fonts/inter';
import * as SplashScreen from 'expo-splash-screen';
import { AppProviders } from '../src/features/store';
import { registerForPushNotificationsAsync } from '../src/lib/notifications';

SplashScreen.preventAutoHideAsync();

const RootLayoutNav = () => {
  const { user, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const { colors } = useTheme();

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (!user && !inAuthGroup) {
      router.replace('/(auth)/login');
    } else if (user && inAuthGroup) {
      router.replace('/(tabs)');
    }
  }, [user, isLoading, segments]);

  return (
    <Stack screenOptions={{ headerShown: false, animation: 'none', contentStyle: { backgroundColor: colors.background } }}>
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(tabs)" />
    </Stack>
  );
};

export default function RootLayout() {
  const [loaded, error] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  useEffect(() => {
    if (loaded || error) {
      SplashScreen.hideAsync();
    }
  }, [loaded, error]);

  useEffect(() => {
    registerForPushNotificationsAsync();
  }, []);

  if (!loaded && !error) {
    return null;
  }

  return (
    <ThemeProvider>
      <AppProviders>
        <AuthProvider>
          <RootLayoutNav />
        </AuthProvider>
      </AppProviders>
    </ThemeProvider>
  );
}
