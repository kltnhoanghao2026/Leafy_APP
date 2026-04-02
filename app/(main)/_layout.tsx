import { Tabs, useRouter } from "expo-router";
import {
  Home,
  Cpu,
  Activity,
  User,
  Users,
  Sprout,
  CalendarDays,
  Menu,
  Bell,
  MoreHorizontal,
  ChevronLeft,
} from "lucide-react-native";
import React, { useState, useRef, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import {
  Animated,
  Dimensions,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { BottomTabBarButtonProps } from "@react-navigation/bottom-tabs";

import Colors from "@/src/constants/Colors";
import { useColorScheme } from "@/src/hooks/useColorScheme";

const DRAWER_WIDTH = 280;
const SCREEN_WIDTH = Dimensions.get("window").width;
const ANIMATION_DURATION = 400;

type SlideDrawerProps = {
  visible: boolean;
  onClose: () => void;
  side: "left" | "right";
  backgroundColor: string;
  paddingTop: number;
  children: React.ReactNode;
};

function SlideDrawer({
  visible,
  onClose,
  side,
  backgroundColor,
  paddingTop,
  children,
}: SlideDrawerProps) {
  const [mounted, setMounted] = useState(false);
  const translateX = useRef(
    new Animated.Value(side === "left" ? -DRAWER_WIDTH : DRAWER_WIDTH),
  ).current;
  const overlayOpacity = useRef(new Animated.Value(0)).current;

  const animateIn = useCallback(() => {
    setMounted(true);
    Animated.parallel([
      Animated.timing(translateX, {
        toValue: 0,
        duration: ANIMATION_DURATION,
        useNativeDriver: true,
      }),
      Animated.timing(overlayOpacity, {
        toValue: 1,
        duration: ANIMATION_DURATION,
        useNativeDriver: true,
      }),
    ]).start();
  }, [translateX, overlayOpacity]);

  const animateOut = useCallback(
    (callback?: () => void) => {
      Animated.parallel([
        Animated.timing(translateX, {
          toValue: side === "left" ? -DRAWER_WIDTH : DRAWER_WIDTH,
          duration: ANIMATION_DURATION,
          useNativeDriver: true,
        }),
        Animated.timing(overlayOpacity, {
          toValue: 0,
          duration: ANIMATION_DURATION,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setMounted(false);
        callback?.();
      });
    },
    [translateX, overlayOpacity, side],
  );

  useEffect(() => {
    if (visible) {
      animateIn();
    } else if (mounted) {
      animateOut();
    }
  }, [visible]);

  const handleClose = () => {
    animateOut(onClose);
  };

  if (!mounted && !visible) return null;

  return (
    <Modal
      visible={mounted}
      transparent
      animationType="none"
      onRequestClose={handleClose}
      statusBarTranslucent
    >
      <View style={styles.drawerRoot}>
        {/* Dim overlay */}
        <Animated.View
          style={[styles.drawerOverlay, { opacity: overlayOpacity }]}
        />
        {/* Tap outside to close */}
        <Pressable style={StyleSheet.absoluteFill} onPress={handleClose} />
        {/* Drawer panel */}
        <Animated.View
          style={[
            styles.drawerPanel,
            side === "left" ? styles.drawerPanelLeft : styles.drawerPanelRight,
            { backgroundColor, paddingTop, transform: [{ translateX }] },
          ]}
        >
          <Pressable onPress={(e) => e.stopPropagation()}>{children}</Pressable>
        </Animated.View>
      </View>
    </Modal>
  );
}

type CenterActionButtonProps = BottomTabBarButtonProps & {
  borderColor: string;
  labelColor: string;
  label: string;
};

function CenterActionButton({
  onPress,
  borderColor,
  labelColor,
  label,
}: CenterActionButtonProps) {
  return (
    <Pressable onPress={onPress} style={styles.centerButtonWrapper}>
      <View style={[styles.centerButton, { borderColor }]}>
        <Activity color="#FFFFFF" size={34} strokeWidth={2.5} />
      </View>
      <Text style={[styles.centerButtonLabel, { color: labelColor }]}>
        {label}
      </Text>
    </Pressable>
  );
}

export default function MainLayout() {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [moreDrawerVisible, setMoreDrawerVisible] = useState(false);
  const [notiDrawerVisible, setNotiDrawerVisible] = useState(false);
  const colorScheme = useColorScheme();
  const scheme = colorScheme ?? "light";
  const palette = Colors[scheme];
  const tabIconDefault = palette.tabIconDefault;

  const openMoreDrawer = () => setMoreDrawerVisible(true);
  const openNotiDrawer = () => setNotiDrawerVisible(true);
  const closeMoreDrawer = () => setMoreDrawerVisible(false);
  const closeNotiDrawer = () => setNotiDrawerVisible(false);

  const openNotificationsPage = () => {
    closeNotiDrawer();
    router.push("/modal");
  };

  const openMorePage = () => {
    closeMoreDrawer();
    router.push("/(main)/community");
  };

  const openFarmPage = () => {
    closeMoreDrawer();
    router.push("/(main)/farm");
  };

  const openPlantsPage = () => {
    closeMoreDrawer();
    router.push("/(main)/plants");
  };

  const openPlantEventsPage = () => {
    closeMoreDrawer();
    router.push("/(main)/plant-events");
  };

  type BackFallbackPath =
    | "/"
    | "/(main)/farm"
    | "/(main)/plants"
    | "/(main)/profile";

  const goBackInHistory = (fallbackPath: BackFallbackPath) => {
    if (router.canGoBack()) {
      router.back();
      return;
    }

    router.replace(fallbackPath);
  };

  const drawerBg = scheme === "dark" ? palette.background : "#FFFFFF";
  const drawerPaddingTop = insets.top + 16;

  return (
    <>
      {/* Left (More) Drawer */}
      <SlideDrawer
        visible={moreDrawerVisible}
        onClose={closeMoreDrawer}
        side="left"
        backgroundColor={drawerBg}
        paddingTop={drawerPaddingTop}
      >
        <Text style={[styles.drawerTitle, { color: palette.text }]}>
          {t("mainNav.drawer.options")}
        </Text>

        <Pressable style={styles.drawerItem} onPress={openFarmPage}>
          <Home size={20} color={palette.primary} />
          <Text style={[styles.drawerItemText, { color: palette.text }]}>
            {t("mainNav.drawer.manageFarm")}
          </Text>
        </Pressable>

        <Pressable style={styles.drawerItem} onPress={openPlantsPage}>
          <Sprout size={20} color={palette.primary} />
          <Text style={[styles.drawerItemText, { color: palette.text }]}>
            {t("mainNav.drawer.managePlants")}
          </Text>
        </Pressable>

        <Pressable style={styles.drawerItem} onPress={openPlantEventsPage}>
          <CalendarDays size={20} color={palette.primary} />
          <Text style={[styles.drawerItemText, { color: palette.text }]}>
            {t("mainNav.drawer.manageEvents")}
          </Text>
        </Pressable>

        <Pressable style={styles.drawerItem} onPress={openMorePage}>
          <MoreHorizontal size={20} color={palette.primary} />
          <Text style={[styles.drawerItemText, { color: palette.text }]}>
            {t("mainNav.drawer.more")}
          </Text>
        </Pressable>
      </SlideDrawer>

      {/* Right (Notifications) Drawer */}
      <SlideDrawer
        visible={notiDrawerVisible}
        onClose={closeNotiDrawer}
        side="right"
        backgroundColor={drawerBg}
        paddingTop={drawerPaddingTop}
      >
        <Text style={[styles.drawerTitle, { color: palette.text }]}>
          {t("mainNav.drawer.notifications")}
        </Text>
        <Pressable style={styles.drawerItem} onPress={openNotificationsPage}>
          <Bell size={20} color={palette.primary} />
          <Text style={[styles.drawerItemText, { color: palette.text }]}>
            {t("mainNav.drawer.viewAllNotifications")}
          </Text>
        </Pressable>
      </SlideDrawer>

      <Tabs
        screenOptions={{
          animation: "shift",
          transitionSpec: {
            animation: "timing",
            config: {
              duration: 220,
            },
          },
          tabBarActiveTintColor: palette.tint,
          tabBarInactiveTintColor: tabIconDefault,
          tabBarShowLabel: true,
          tabBarStyle: {
            height: 74,
            paddingBottom: 4,
            paddingTop: 6,
            backgroundColor: scheme === "dark" ? palette.background : "#FFFFFF",
            borderTopColor:
              scheme === "dark"
                ? "rgba(47, 127, 52, 0.2)"
                : "rgba(47, 127, 52, 0.12)",
            borderTopWidth: 1,
            elevation: 12,
            shadowColor: "#000000",
            shadowOffset: { width: 0, height: -4 },
            shadowOpacity: 0.12,
            shadowRadius: 12,
          },
          tabBarLabelStyle: {
            fontSize: 10,
            fontWeight: "600",
          },
          tabBarItemStyle: {
            paddingBottom: 0,
          },
          headerShown: true,
          headerStyle: {
            backgroundColor:
              scheme === "dark" ? "rgba(20, 30, 21, 0.85)" : "#FFFFFF",
            borderBottomColor:
              scheme === "dark"
                ? "rgba(47, 127, 52, 0.2)"
                : "rgba(47, 127, 52, 0.12)",
            borderBottomWidth: 1,
          },
          headerShadowVisible: false,
          headerTitleStyle: {
            fontSize: 18,
            fontWeight: "700",
            color: palette.text,
            textAlign: "center",
          },
          headerTitleAlign: "center",
          headerTitleContainerStyle: {
            alignItems: "center",
          },
          headerLeft: () => (
            <Pressable style={styles.headerIconButton} onPress={openMoreDrawer}>
              <Menu size={20} color={palette.primary} />
            </Pressable>
          ),
          headerLeftContainerStyle: {
            paddingLeft: 16,
          },
          headerRight: () => (
            <Pressable
              style={styles.headerRightWrapper}
              onPress={openNotiDrawer}
            >
              <View style={styles.headerIconButton}>
                <Bell size={20} color={palette.primary} />
              </View>
              <View style={styles.notificationDot} />
            </Pressable>
          ),
          headerRightContainerStyle: {
            paddingRight: 16,
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: t("mainNav.tabs.overview"),
            headerTitle: t("mainNav.headers.overview"),
            tabBarIcon: ({ color }) => <Home color={color} size={24} />,
          }}
        />
        <Tabs.Screen
          name="sensors"
          options={{
            title: t("mainNav.tabs.sensors"),
            headerTitle: t("mainNav.headers.sensors"),
            tabBarIcon: ({ color }) => <Cpu color={color} size={24} />,
          }}
        />
        <Tabs.Screen
          name="diagnosis"
          options={{
            title: "",
            headerTitle: t("mainNav.headers.diagnosis"),
            tabBarButton: (props) => (
              <CenterActionButton
                {...props}
                borderColor={palette.background}
                labelColor={palette.primary}
                label={t("mainNav.tabs.diagnosis")}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="community"
          options={{
            title: t("mainNav.tabs.community"),
            headerTitle: t("mainNav.headers.community"),
            tabBarIcon: ({ color }) => <Users color={color} size={24} />,
          }}
        />
        <Tabs.Screen
          name="profile/index"
          options={{
            title: t("mainNav.tabs.profile"),
            headerTitle: t("mainNav.headers.myAccount"),
            headerLeft: () => (
              <Pressable
                style={styles.headerIconButton}
                onPress={() => goBackInHistory("/")}
              >
                <ChevronLeft size={20} color={palette.primary} />
              </Pressable>
            ),
            headerRight: () => null,
            tabBarIcon: ({ color }) => <User color={color} size={24} />,
          }}
        />

        <Tabs.Screen
          name="farm"
          options={{
            href: null,
            headerTitle: t("mainNav.headers.manageFarm"),
            tabBarStyle: { display: "none" },
            headerLeft: () => (
              <Pressable
                style={styles.headerIconButton}
                onPress={() => goBackInHistory("/")}
              >
                <ChevronLeft size={20} color={palette.primary} />
              </Pressable>
            ),
          }}
        />

        <Tabs.Screen
          name="plants"
          options={{
            href: null,
            headerTitle: t("mainNav.headers.managePlants"),
            tabBarStyle: { display: "none" },
            headerLeft: () => (
              <Pressable
                style={styles.headerIconButton}
                onPress={() => goBackInHistory("/")}
              >
                <ChevronLeft size={20} color={palette.primary} />
              </Pressable>
            ),
          }}
        />

        <Tabs.Screen
          name="farm/add"
          options={{
            href: null,
            headerTitle: t("farm.form.titleCreate"),
            tabBarStyle: { display: "none" },
            headerLeft: () => (
              <Pressable
                style={styles.headerIconButton}
                onPress={() => router.navigate("/(main)/farm")}
              >
                <ChevronLeft size={20} color={palette.primary} />
              </Pressable>
            ),
            headerRight: () => null,
          }}
        />

        <Tabs.Screen
          name="farm/edit/[id]"
          options={{
            href: null,
            headerTitle: t("farm.form.titleEdit"),
            tabBarStyle: { display: "none" },
            headerLeft: () => (
              <Pressable
                style={styles.headerIconButton}
                onPress={() => router.navigate("/(main)/farm")}
              >
                <ChevronLeft size={20} color={palette.primary} />
              </Pressable>
            ),
            headerRight: () => null,
          }}
        />

        <Tabs.Screen
          name="plants/add"
          options={{
            href: null,
            headerTitle: t("plant.form.titleCreate"),
            tabBarStyle: { display: "none" },
            headerLeft: () => (
              <Pressable
                style={styles.headerIconButton}
                onPress={() => goBackInHistory("/(main)/plants")}
              >
                <ChevronLeft size={20} color={palette.primary} />
              </Pressable>
            ),
            headerRight: () => null,
          }}
        />

        <Tabs.Screen
          name="plants/edit/[id]"
          options={{
            href: null,
            headerTitle: t("plant.form.titleEdit"),
            tabBarStyle: { display: "none" },
            headerLeft: () => (
              <Pressable
                style={styles.headerIconButton}
                onPress={() => goBackInHistory("/(main)/plants")}
              >
                <ChevronLeft size={20} color={palette.primary} />
              </Pressable>
            ),
            headerRight: () => null,
          }}
        />

        <Tabs.Screen
          name="plant-events"
          options={{
            href: null,
            headerTitle: t("mainNav.headers.manageEvents"),
            tabBarStyle: { display: "none" },
            headerLeft: () => (
              <Pressable
                style={styles.headerIconButton}
                onPress={() => goBackInHistory("/")}
              >
                <ChevronLeft size={20} color={palette.primary} />
              </Pressable>
            ),
          }}
        />

        <Tabs.Screen
          name="plant-events/add"
          options={{
            href: null,
            headerTitle: t("plantEvent.form.titleCreate"),
            tabBarStyle: { display: "none" },
            headerLeft: () => (
              <Pressable
                style={styles.headerIconButton}
                onPress={() => goBackInHistory("/")}
              >
                <ChevronLeft size={20} color={palette.primary} />
              </Pressable>
            ),
            headerRight: () => null,
          }}
        />

        <Tabs.Screen
          name="plant-events/edit/[id]"
          options={{
            href: null,
            headerTitle: t("plantEvent.form.titleEdit"),
            tabBarStyle: { display: "none" },
            headerLeft: () => (
              <Pressable
                style={styles.headerIconButton}
                onPress={() => goBackInHistory("/")}
              >
                <ChevronLeft size={20} color={palette.primary} />
              </Pressable>
            ),
            headerRight: () => null,
          }}
        />

        <Tabs.Screen
          name="profile/edit"
          options={{
            href: null,
            headerTitle: t("screens.profileEdit.title"),
            tabBarStyle: { display: "none" },
            headerLeft: () => (
              <Pressable
                style={styles.headerIconButton}
                onPress={() => goBackInHistory("/(main)/profile")}
              >
                <ChevronLeft size={20} color={palette.primary} />
              </Pressable>
            ),
            headerRight: () => null,
          }}
        />
      </Tabs>
    </>
  );
}

const styles = StyleSheet.create({
  headerIconButton: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "rgba(47, 127, 52, 0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerRightWrapper: {
    position: "relative",
    width: 36,
    height: 36,
  },
  notificationDot: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#EF4444",
  },
  drawerRoot: {
    flex: 1,
  },
  drawerOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  drawerPanel: {
    position: "absolute",
    top: 0,
    bottom: 0,
    width: DRAWER_WIDTH,
    paddingHorizontal: 16,
    paddingBottom: 32,
    shadowColor: "#000",
    shadowOffset: { width: 4, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 20,
  },
  drawerPanelLeft: {
    left: 0,
  },
  drawerPanelRight: {
    right: 0,
  },
  drawerTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 16,
  },
  drawerItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: 10,
    backgroundColor: "rgba(47, 127, 52, 0.08)",
    marginBottom: 10,
  },
  drawerItemText: {
    fontSize: 15,
    fontWeight: "600",
  },
  centerButtonWrapper: {
    top: -26,
    alignItems: "center",
    justifyContent: "center",
    width: 88,
  },
  centerButton: {
    width: 74,
    height: 74,
    borderRadius: 37,
    backgroundColor: "#2F7F34",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 6,
    borderColor: "#F6F8F6",
    shadowColor: "#2F7F34",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 10,
  },
  centerButtonLabel: {
    marginTop: 4,
    fontWeight: "700",
    fontSize: 11,
  },
});
