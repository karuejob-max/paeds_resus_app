/**
 * _layout.tsx — Root layout for PaedsResus mobile app
 *
 * Sets up:
 * - Expo Router navigation
 * - React Query + tRPC provider
 * - Global theme (dark/light)
 * - Keep-awake during active ResusGPS session
 * - Push notification registration
 */

import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { httpBatchLink } from '@trpc/client';
import { createTRPCReact } from '@trpc/react-query';
import * as SplashScreen from 'expo-splash-screen';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import type { AppRouter } from '../../server/routers';

// Keep splash screen visible while loading
SplashScreen.preventAutoHideAsync();

// Configure how notifications appear when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export const trpc = createTRPCReact<AppRouter>();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 30_000,
    },
  },
});

// Replace with your deployed API URL
const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'https://your-api.paedsresus.com';

const trpcClient = trpc.createClient({
  links: [
    httpBatchLink({
      url: `${API_URL}/api/trpc`,
      headers: () => ({
        'Content-Type': 'application/json',
      }),
    }),
  ],
});

async function registerForPushNotifications() {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('care-signal', {
      name: 'Care Signal Alerts',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
    await Notifications.setNotificationChannelAsync('resus-alerts', {
      name: 'ResusGPS Alerts',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 500],
      lightColor: '#FF0000',
    });
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  if (finalStatus !== 'granted') {
    console.warn('[Push] Permission not granted');
    return;
  }

  const token = await Notifications.getExpoPushTokenAsync();
  console.log('[Push] Expo push token:', token.data);
  // TODO: Send token to server via trpc.notifications.registerPushToken
}

export default function RootLayout() {
  useEffect(() => {
    registerForPushNotifications();
    SplashScreen.hideAsync();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <trpc.Provider client={trpcClient} queryClient={queryClient}>
          <QueryClientProvider client={queryClient}>
            <StatusBar style="auto" />
            <Stack>
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              <Stack.Screen name="resus" options={{ headerShown: false }} />
              <Stack.Screen
                name="resus/active"
                options={{
                  headerShown: false,
                  gestureEnabled: false, // Prevent accidental swipe-back during active code
                  animation: 'slide_from_bottom',
                }}
              />
            </Stack>
          </QueryClientProvider>
        </trpc.Provider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
