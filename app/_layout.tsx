
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
import { OfflineNotice } from "@/src/components/ui/OfflineNotice";
import { NetworkProvider } from "@/src/providers/NetworkProvider";
import { WebSocketProvider } from "@/src/providers/WebSocketProvider";
import { PlanReviewProvider } from "@/src/features/rag-chat/context/PlanReviewContext";
import { ExpoPushProvider } from "@/src/features/notifications/context/ExpoPushContext";
import { ExpoPushBootstrap, configurePushNotifications } from "@/src/features/notifications";
import { OfflineDataProvider } from "@/src/features/offline";

import { useOfflineCacheSync } from "@/src/hooks/useOfflineCacheSync";
import { useIsOffline } from "@/src/providers/NetworkProvider";

// Configure how notifications appear while the app is in the foreground.
configurePushNotifications();


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



  useEffect(() => {
    if (loaded && isI18nReady) {
      SplashScreen.hideAsync();
    }
  }, [loaded, isI18nReady]);

  if (!loaded || !isI18nReady) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <NetworkProvider>
          <QueryClientProvider client={queryClient}>
            <AuthProvider>
              <WebSocketProvider>
                <PlanReviewProvider>
                  <ExpoPushProvider>
                    <OfflineDataProvider>
                      <RootLayoutNav />
                    </OfflineDataProvider>
                  </ExpoPushProvider>
                </PlanReviewProvider>
              </WebSocketProvider>
            </AuthProvider>
          </QueryClientProvider>
        </NetworkProvider>
      </GestureHandlerRootView>
    </SafeAreaProvider>
  );
}

function RootLayoutNav() {
  const { t } = useTranslation();
  const colorScheme = useColorScheme();
  const { isAuthenticated, isRestoringAuth } = useAuthContext();
  const router = useRouter();
  const segments = useSegments();
  const isOffline = useIsOffline();

  // Mount cache sync hook here since we are authenticated
  useOfflineCacheSync();

  // Redirect based on auth state
  useEffect(() => {
    if (isRestoringAuth) return;

    const inAuthGroup = segments[0] === "(auth)";
    const inOfflineGroup = segments[0] === "(offline)";

    if (!isAuthenticated && !inAuthGroup) {
      router.replace("/login");
    } else if (isAuthenticated) {
      if (isOffline && !inOfflineGroup) {
        router.replace("/(offline)");
      } else if (!isOffline && (inAuthGroup || inOfflineGroup)) {
        router.replace("/(main)");
      }
    }
  }, [isAuthenticated, isRestoringAuth, isOffline, segments]);

  // Show splash while restoring authentication state
  if (isRestoringAuth) {
    return null;
  }

  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      {/* Mount push bootstrap inside auth so it has access to the user */}
      {isAuthenticated && <ExpoPushBootstrap />}
      <Stack>
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(main)" options={{ headerShown: false }} />
        <Stack.Screen name="(offline)" options={{ headerShown: false }} />
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
    </ThemeProvider>
  );
}
