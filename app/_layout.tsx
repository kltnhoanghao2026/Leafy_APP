import "@/global.css";
import { queryClient } from "@/src/lib";
import { useColorScheme } from "@/src/hooks/useColorScheme";
import { AuthProvider, useAuthContext } from "@/src/features/auth";
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { QueryClientProvider } from "@tanstack/react-query";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import { LogBox } from "react-native";
import "react-native-reanimated";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { TamaguiProvider } from "tamagui";
import tamaguiConfig from "@/tamagui.config";
import "@/src/i18n";

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from "expo-router";

export const unstable_settings = {
  // Ensure that reloading on `/modal` keeps a back button present.
  initialRouteName: "(auth)",
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

LogBox.ignoreLogs([
  "SafeAreaView has been deprecated and will be removed in a future release.",
]);

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded, error] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
  });

  // Expo Router uses Error Boundaries to catch errors in the navigation tree.
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

  return (
    <TamaguiProvider
      config={tamaguiConfig}
      defaultTheme={colorScheme ?? "light"}
    >
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <RootLayoutNav />
        </AuthProvider>
      </QueryClientProvider>
    </TamaguiProvider>
  );
}

function RootLayoutNav() {
  const colorScheme = useColorScheme();
  const { isAuthenticated, isRestoringAuth } = useAuthContext();

  // Show splash while restoring authentication state
  if (isRestoringAuth) {
    return null;
  }

  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <SafeAreaProvider>
        <Stack>
          {!isAuthenticated ? (
            // Public (auth) routes
            <Stack.Screen name="(auth)" options={{ headerShown: false }} />
          ) : (
            // Protected (main) routes
            <Stack.Screen name="(main)" options={{ headerShown: false }} />
          )}
          <Stack.Screen name="modal" options={{ presentation: "modal" }} />
        </Stack>
      </SafeAreaProvider>
    </ThemeProvider>
  );
}
