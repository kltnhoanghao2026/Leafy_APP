import { Tabs, useGlobalSearchParams, useRouter } from "expo-router";
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
  ScanLine,
} from "lucide-react-native";
import BackButton from "@/src/components/ui/BackButton";
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
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { BottomTabBarButtonProps } from "@react-navigation/bottom-tabs";
import { useQueryClient } from "@tanstack/react-query";

import Colors from "@/src/constants/Colors";
import { useColorScheme } from "@/src/hooks/useColorScheme";
import {
  useNotificationState,
  useNotificationHistory,
  NotificationItem,
  useMarkNotificationReadMutation,
  notificationKeys,
} from "@/src/features/notifications";
import type { UserNotificationResponse } from "@/src/features/notifications";

const NOTIFICATION_ROUTES: Record<
  string,
  (referenceId: string) => string | null
> = {
  POST_COMMENT: (id) => `/community-post/${id}`,
  POST_UPVOTE: (id) => `/community-post/${id}`,
  COMMENT_REPLY: (id) => `/community-post/${id}`,
  COMMENT_UPVOTE: (id) => `/community-post/${id}`,
  USER_FOLLOW: (id) => `/(main)/profile/${id}`,
  CONSULT_REQUEST: (id) => `/(main)/profile/${id}`,
  PLAN_CONSULTING_CREATED: () => null,
  PLAN_APPLIED: () => null,
  SYSTEM: () => null,
};


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
  const routeParams = useGlobalSearchParams<{ returnTo?: string | string[] }>();
  const insets = useSafeAreaInsets();
  const [moreDrawerVisible, setMoreDrawerVisible] = useState(false);
  const [notiDrawerVisible, setNotiDrawerVisible] = useState(false);
  const colorScheme = useColorScheme();
  const queryClient = useQueryClient();
  const markReadMutation = useMarkNotificationReadMutation();
  
  const { data: historyData, isLoading: historyLoading } = useNotificationHistory(false, true);
  const recentNotifications = historyData?.pages?.[0]?.data?.slice(0, 5) ?? [];

  const handleNotificationPress = (notification: UserNotificationResponse) => {
    closeNotiDrawer();

    if (!notification.isRead) {
      markReadMutation.mutate(notification.id, {
        onSuccess: () => {
          queryClient.invalidateQueries({
            queryKey: notificationKeys.state(),
          });
          queryClient.invalidateQueries({
            queryKey: [...notificationKeys.all(), "history"],
          });
        },
      });
    }

    if (notification.referenceId && notification.type) {
      const routeFn = NOTIFICATION_ROUTES[notification.type];
      if (routeFn) {
        const path = routeFn(notification.referenceId);
        if (path) {
          router.push(path as never);
        }
      }
    }
  };
  const scheme = colorScheme ?? "light";
  const palette = Colors[scheme];
  const tabIconDefault = palette.tabIconDefault;

  const openMoreDrawer = () => setMoreDrawerVisible(true);
  const openNotiDrawer = () => setNotiDrawerVisible(true);
  const closeMoreDrawer = () => setMoreDrawerVisible(false);
  const closeNotiDrawer = () => setNotiDrawerVisible(false);

  const openNotificationsPage = () => {
    router.push("/(main)/notifications" as never);
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

  const openCalendarPage = () => {
    closeMoreDrawer();
    router.push("/(main)/plant-events-calendar");
  };

  const openPredictPage = () => {
    closeMoreDrawer();
    router.push("/(main)/predict");
  };

  const returnToParam = Array.isArray(routeParams.returnTo)
    ? routeParams.returnTo[0]
    : routeParams.returnTo;

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

        <Pressable style={styles.drawerItem} onPress={openCalendarPage}>
          <CalendarDays size={20} color={palette.primary} />
          <Text style={[styles.drawerItemText, { color: palette.text }]}>
            {t("mainNav.drawer.eventCalendar")}
          </Text>
        </Pressable>

        <Pressable style={styles.drawerItem} onPress={openPredictPage}>
          <ScanLine size={20} color={palette.primary} />
          <Text style={[styles.drawerItemText, { color: palette.text }]}>
            {t("mainNav.drawer.predict", "Disease Detection")}
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
        <Text style={[styles.drawerTitle, { color: palette.text, marginBottom: 12 }]}>
          {t("mainNav.drawer.notifications")}
        </Text>

        {historyLoading ? (
          <ActivityIndicator color={palette.primary} style={{ marginVertical: 20 }} />
        ) : recentNotifications.length === 0 ? (
          <Text style={{ color: "#64748B", textAlign: "center", marginVertical: 20 }}>
            {t("notifications.emptyAllTitle", "No notifications yet")}
          </Text>
        ) : (
          <View style={{ marginHorizontal: -16 }}>
            {recentNotifications.map((notif) => (
              <NotificationItem
                key={notif.id}
                notification={notif}
                onPress={handleNotificationPress}
              />
            ))}
          </View>
        )}

        <Pressable style={[styles.drawerItem, { marginTop: 12 }]} onPress={openNotificationsPage}>
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
          headerRight: () => {
            // eslint-disable-next-line react-hooks/rules-of-hooks
            const { data: stateData } = useNotificationState();
            const unreadCount = stateData?.data?.unreadCount ?? 0;
            return (
              <Pressable
                style={styles.headerRightWrapper}
                onPress={openNotiDrawer}
              >
                <View style={styles.headerIconButton}>
                  <Bell size={20} color={palette.primary} />
                </View>
                {unreadCount > 0 && (
                  <View style={styles.notificationBadge}>
                    <Text style={styles.notificationBadgeText}>
                      {unreadCount > 99 ? "99+" : unreadCount}
                    </Text>
                  </View>
                )}
              </Pressable>
            );
          },
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
            headerLeft: () => null,
            headerRight: () => null,
            tabBarIcon: ({ color }) => <Users color={color} size={24} />,
          }}
        />
        <Tabs.Screen
          name="profile/index"
          options={{
            title: t("mainNav.tabs.profile"),
            headerTitle: t("mainNav.headers.myAccount"),
            headerLeft: () => <BackButton fallback="/(main)/profile" />,
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
            headerLeft: () => <BackButton fallback="/" />,
          }}
        />

        <Tabs.Screen
          name="plants"
          options={{
            href: null,
            headerTitle: t("mainNav.headers.managePlants"),
            tabBarStyle: { display: "none" },
            headerLeft: () => <BackButton fallback="/(main)/farm" />,
          }}
        />

        <Tabs.Screen
          name="farm/add"
          options={{
            href: null,
            headerTitle: t("farm.form.titleCreate"),
            tabBarStyle: { display: "none" },
            headerLeft: () => <BackButton fallback="/(main)/farm" />,
            headerRight: () => null,
          }}
        />

        <Tabs.Screen
          name="farm/edit/[id]"
          options={{
            href: null,
            headerTitle: t("farm.form.titleEdit"),
            tabBarStyle: { display: "none" },
            headerLeft: () => <BackButton fallback="/(main)/farm" />,
            headerRight: () => null,
          }}
        />

        <Tabs.Screen
          name="plants/add"
          options={{
            href: null,
            headerTitle: t("plant.form.titleCreate"),
            tabBarStyle: { display: "none" },
            headerLeft: () => <BackButton fallback="/(main)/plants" />,
            headerRight: () => null,
          }}
        />

        <Tabs.Screen
          name="plants/edit/[id]"
          options={{
            href: null,
            headerTitle: t("plant.form.titleEdit"),
            tabBarStyle: { display: "none" },
            headerLeft: () => <BackButton fallback="/(main)/plants" />,
            headerRight: () => null,
          }}
        />

        <Tabs.Screen
          name="plant-events"
          options={{
            href: null,
            headerTitle: t("mainNav.headers.manageEvents"),
            tabBarStyle: { display: "none" },
            headerLeft: () => <BackButton fallback="/" />,
          }}
        />

        <Tabs.Screen
          name="plant-events-week"
          options={{
            href: null,
            headerTitle: t("calendar.title"),
            tabBarStyle: { display: "none" },
            headerLeft: () => <BackButton fallback="/(main)/plant-events" />,
            headerRight: () => null,
          }}
        />

        <Tabs.Screen
          name="plant-events-calendar"
          options={{
            href: null,
            headerTitle: t("calendar.title"),
            tabBarStyle: { display: "none" },
            headerLeft: () => <BackButton fallback="/(main)/plant-events" />,
            headerRight: () => null,
          }}
        />

        <Tabs.Screen
          name="plant-events-timeline"
          options={{
            href: null,
            headerTitle: t("calendar.title"),
            tabBarStyle: { display: "none" },
            headerLeft: () => <BackButton fallback="/(main)/plant-events" />,
            headerRight: () => null,
          }}
        />

        <Tabs.Screen
          name="plant-events/add"
          options={{
            href: null,
            headerTitle: t("plantEvent.form.titleCreate"),
            tabBarStyle: { display: "none" },
            headerLeft: () => <BackButton fallback="/(main)/plant-events" />,
            headerRight: () => null,
          }}
        />

        <Tabs.Screen
          name="plant-events/edit/[id]"
          options={{
            href: null,
            headerTitle: t("plantEvent.form.titleEdit"),
            tabBarStyle: { display: "none" },
            headerLeft: () => <BackButton fallback="/(main)/plant-events" />,
            headerRight: () => null,
          }}
        />

        <Tabs.Screen
          name="plant-events/[id]"
          options={{
            href: null,
            headerTitle: t("plantEvent.detail.title"),
            tabBarStyle: { display: "none" },
            headerLeft: () => (
              <BackButton
                onPress={() => {
                  if (returnToParam) {
                    router.replace(returnToParam as never);
                    return;
                  }
                  if (router.canGoBack()) {
                    router.back();
                  } else {
                    router.replace("/(main)/plant-events");
                  }
                }}
              />
            ),
            headerRight: () => null,
          }}
        />

        <Tabs.Screen
          name="conversation/[threadId]"
          options={{
            href: null,
            headerTitle: t("community.conversation.title"),
            tabBarStyle: { display: "none" },
            headerLeft: () => <BackButton fallback="/(main)/community" />,
            headerRight: () => null,
          }}
        />

        <Tabs.Screen
          name="profile/edit"
          options={{
            href: null,
            headerTitle: t("screens.profileEdit.title"),
            tabBarStyle: { display: "none" },
            headerLeft: () => <BackButton fallback="/(main)/profile" />,
            headerRight: () => null,
          }}
        />

        <Tabs.Screen
          name="profile/certificate"
          options={{
            href: null,
            headerTitle: t("screens.profileCertificate.title"),
            tabBarStyle: { display: "none" },
            headerLeft: () => <BackButton fallback="/(main)/profile" />,
            headerRight: () => null,
          }}
        />

        <Tabs.Screen
          name="profile/[profileId]"
          options={{
            href: null,
            headerTitle: t("profileDetail.infoSection"),
            tabBarStyle: { display: "none" },
            headerLeft: () => <BackButton fallback="/(main)/profile" />,
            headerRight: () => null,
          }}
        />

        <Tabs.Screen
          name="ai-chat"
          options={{
            href: null,
            headerTitle: t("ragChat.title", "Trợ lý AI"),
            tabBarStyle: { display: "none" },
            headerLeft: () => <BackButton fallback="/" />,
            headerRight: () => null,
          }}
        />

        <Tabs.Screen
          name="treatment-plan-review"
          options={{
            href: null,
            headerTitle: t("ragChat.reviewer.title", "Treatment Plan Reviewer"),
            tabBarStyle: { display: "none" },
            headerLeft: () => <BackButton fallback="/(main)/ai-chat" />,
            headerRight: () => null,
          }}
        />

        <Tabs.Screen
          name="community-search"
          options={{
            href: null,
            headerShown: false,
            tabBarStyle: { display: "none" },
          }}
        />

        <Tabs.Screen
          name="community-messages"
          options={{
            href: null,
            headerShown: false,
            tabBarStyle: { display: "none" },
          }}
        />

        <Tabs.Screen
          name="community-post/[postId]"
          options={{
            href: null,
            headerTitle: t("community.postDetail.title"),
            tabBarStyle: { display: "none" },
            headerLeft: () => <BackButton fallback="/(main)/community" />,
            headerRight: () => null,
          }}
        />

        <Tabs.Screen
          name="predict"
          options={{
            href: null,
            headerTitle: t("diseaseDetection.title", "Disease Detection"),
            tabBarStyle: { display: "none" },
            headerLeft: () => <BackButton fallback="/" />,
            headerRight: () => null,
          }}
        />

        <Tabs.Screen
          name="scan-capture"
          options={{
            href: null,
            headerTitle: t("diseaseDetection.localCapture", "Local Scan"),
            tabBarStyle: { display: "none" },
            headerLeft: () => <BackButton fallback="/(main)/predict" />,
            headerRight: () => null,
          }}
        />

        <Tabs.Screen
          name="scan-realtime"
          options={{
            href: null,
            headerTitle: t("diseaseDetection.realtimeScan", "Real-time Scan"),
            headerShown: false,
            tabBarStyle: { display: "none" },
          }}
        />

        <Tabs.Screen
          name="notifications"
          options={{
            href: null,
            headerShown: false,
            tabBarStyle: { display: "none" },
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
  notificationBadge: {
    position: "absolute",
    top: -4,
    right: -6,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "#EF4444",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 3,
    borderWidth: 1.5,
    borderColor: "#FFFFFF",
  },
  notificationBadgeText: {
    fontSize: 9,
    fontWeight: "800",
    color: "#FFFFFF",
    lineHeight: 12,
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
