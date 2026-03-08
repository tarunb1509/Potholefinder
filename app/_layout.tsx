import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import 'react-native-reanimated';

import { useColorScheme } from '@/components/useColorScheme';
import MobileFrame from '@/components/MobileFrame';

export { ErrorBoundary } from 'expo-router';

export const unstable_settings = {
  initialRouteName: 'index',
};

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return <RootLayoutNav />;
}

function RootLayoutNav() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <MobileFrame>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="camera" />
          <Stack.Screen name="submit" options={{ headerShown: true, title: 'Submit Report', headerBackTitle: 'Back' }} />
          <Stack.Screen name="thankyou" />
          <Stack.Screen name="map" options={{ headerShown: true, title: 'Pothole Map', headerBackTitle: 'Home' }} />
          <Stack.Screen name="gallery" options={{ headerShown: true, title: 'Reported by me', headerBackTitle: 'Map' }} />
          <Stack.Screen name="report/[id]" options={{ headerShown: true, title: 'Report Details', headerBackTitle: 'Back' }} />
        </Stack>
      </MobileFrame>
    </ThemeProvider>
  );
}
