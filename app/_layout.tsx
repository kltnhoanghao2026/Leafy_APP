
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
import { Stack, useRouter, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { LogBox } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import "react-native-reanimated";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { initializeI18n } from "@/src/i18n";
import NetInfo from "@react-native-community/netinfo";
import { useNetworkStore } from "@/src/store/useNetworkStore";
import { OfflineNotice } from "@/src/components/ui/OfflineNotice";

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
  const [isI18nReady, setIsI18nReady] = useState(false);
  const [loaded, error] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
  });

  // Expo Router uses Error Boundaries to catch errors in the navigation tree.
  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    let mounted = true;

    void initializeI18n().finally(() => {
      if (mounted) {
        setIsI18nReady(true);
      }
    });

    return () => {
      mounted = false;
    };
  }, []);

  // Set up network listener
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      useNetworkStore.getState().setNetworkState(state);
    });

    // Fetch initial state
    NetInfo.fetch().then((state) => {
      useNetworkStore.getState().setNetworkState(state);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (loaded && isI18nReady) {
      SplashScreen.hideAsync();
    }
  }, [loaded, isI18nReady]);

  if (!loaded || !isI18nReady) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <RootLayoutNav />
        </AuthProvider>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}

function RootLayoutNav() {
  const { t } = useTranslation();
  const colorScheme = useColorScheme();
  const { isAuthenticated, isRestoringAuth } = useAuthContext();
  const router = useRouter();
  const segments = useSegments();

  // Redirect based on auth state
  useEffect(() => {
    if (isRestoringAuth) return;

    const inAuthGroup = segments[0] === "(auth)";

    if (!isAuthenticated && !inAuthGroup) {
      router.replace("/login");
    } else if (isAuthenticated && inAuthGroup) {
      router.replace("/");
    }
  }, [isAuthenticated, isRestoringAuth, segments]);

  // Show splash while restoring authentication state
  if (isRestoringAuth) {
    return null;
  }

  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <SafeAreaProvider>
        <Stack>
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
          <Stack.Screen name="(main)" options={{ headerShown: false }} />
          <Stack.Screen
            name="composer"
            options={{
              title: t("community.composer.title"),
            }}
          />
          <Stack.Screen
            name="modal"
            options={{
              presentation: "transparentModal",
              animation: "slide_from_bottom",
              headerShown: false,
              contentStyle: { backgroundColor: "transparent" },
            }}
          />
        </Stack>
        <OfflineNotice />
      </SafeAreaProvider>
    </ThemeProvider>
  );
}
