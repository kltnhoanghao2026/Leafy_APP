import { Tabs, useRouter } from 'expo-router';
import {
  Activity,
  Bell,
  ClipboardList,
  Home,
  Menu,
  RadioTower,
  User,
  Users,
} from 'lucide-react-native';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator as RNActivityIndicator,
  Pressable,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Drawer } from 'react-native-drawer-layout';
import { useQueryClient } from '@tanstack/react-query';
import {
  useNotificationState,
  useNotificationHistory,
  NotificationItem,
  useMarkNotificationReadMutation,
  notificationKeys,
} from '@/src/features/notifications';
import type { UserNotificationResponse } from '@/src/features/notifications';
import {
  CenterActionButton,
  NOTIFICATION_ROUTES,
  DRAWER_WIDTH,
  DRAWER_MENU_ITEMS,
  useAppColors,
  styles,
} from './_shared';
import { GlobalWebSocketListener } from '@/src/components/GlobalWebSocketListener';
import { useAlertEvents } from '@/src/features/iot/hooks/useAlerts';
import { getIotAlertRoute, isIotAlertNotification } from '@/src/features/iot/utils/alertNotification';

// ── Notification deep-link map ────────────────────────────────────────────────

const NOTIFICATION_ROUTES: Record<
  string,
  (referenceId: string) => string | null
> = {
  POST_COMMENT: (id) => `/(main)/community/post/${id}`,
  POST_UPVOTE: (id) => `/(main)/community/post/${id}`,
  COMMENT_REPLY: (id) => `/(main)/community/post/${id}`,
  COMMENT_UPVOTE: (id) => `/(main)/community/post/${id}`,
  USER_FOLLOW: (id) => `/(main)/profile/${id}`,
  CONSULT_REQUEST: (id) => `/(main)/profile/${id}`,
  PLAN_CONSULTING_CREATED: () => null,
  PLAN_APPLIED: () => null,
  SYSTEM: () => null,
  DIRECT_MESSAGE: (id) => `/(main)/chat/${id}`,
  IOT_ALERT: (id) => `/(main)/iot/alerts/${id}`,
  IOT_ALERT_EVENT: (id) => `/(main)/iot/alerts/${id}`,
  ALERT_EVENT: (id) => `/(main)/iot/alerts/${id}`,
  ALERT_TRIGGERED: (id) => `/(main)/iot/alerts/${id}`,
  DEVICE_ALERT: (id) => `/(main)/iot/alerts/${id}`,
};

const DRAWER_WIDTH = 280;

// ── Center action tab button ──────────────────────────────────────────────────

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

// ── Layout ────────────────────────────────────────────────────────────────────

export default function MainLayout() {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [moreDrawerVisible, setMoreDrawerVisible] = useState(false);
  const [notiDrawerVisible, setNotiDrawerVisible] = useState(false);
  const { scheme, palette } = useAppColors();
  const tabIconDefault = palette.tabIconDefault;
  const drawerBg = scheme === 'dark' ? palette.background : '#FFFFFF';
  const queryClient = useQueryClient();
  const markReadMutation = useMarkNotificationReadMutation();
  const openAlertsQuery = useAlertEvents({
    page: 0,
    size: 1,
    status: "OPEN",
    sortBy: "openedAt",
    sortDir: "desc",
  });

  const { data: stateData } = useNotificationState();
  const unreadCount = stateData?.data?.unreadCount ?? 0;

  const { data: historyData, isLoading: historyLoading } = useNotificationHistory(false, true);
  const recentNotifications = historyData?.pages?.[0]?.data?.slice(0, 5) ?? [];

  const openMoreDrawer = () => setMoreDrawerVisible(true);
  const openNotiDrawer = () => setNotiDrawerVisible(true);
  const closeMoreDrawer = () => setMoreDrawerVisible(false);
  const closeNotiDrawer = () => setNotiDrawerVisible(false);

  const handleNotificationPress = (notification: UserNotificationResponse) => {
    closeNotiDrawer();
    if (!notification.isRead) {
      markReadMutation.mutate(notification.id, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: notificationKeys.state() });
          queryClient.invalidateQueries({ queryKey: [...notificationKeys.all(), 'history'] });
        },
      });
    }
    if (isIotAlertNotification({
      referenceId: notification.referenceId ?? undefined,
      type: notification.type,
    })) {
      const path = getIotAlertRoute({
        referenceId: notification.referenceId ?? undefined,
        type: notification.type,
      });
      if (path) router.push(path as never);
      return;
    }

    if (notification.referenceId && notification.type) {
      const routeFn = NOTIFICATION_ROUTES[notification.type];
      if (routeFn) {
        const path = routeFn(notification.referenceId);
        if (path) router.push(path as never);
      }
    }
  };

  const navigate = (path: string) => {
    closeMoreDrawer();
    router.push(path as never);
  };

  // ── Drawer Icon Helper ──────────────────────────────────────────────────────

  const getDrawerIcon = (labelKey: string) => {
    const iconProps = { size: 20, color: palette.primary };
    switch (labelKey) {
      case 'mainNav.drawer.manageFarm':
        return <Home {...iconProps} />;
      case 'mainNav.drawer.managePlants':
        return <Users {...iconProps} />;
      case 'mainNav.drawer.managePlans':
        return <ClipboardList {...iconProps} />;
      case 'mainNav.drawer.manageEvents':
      case 'mainNav.drawer.eventCalendar':
        return <Bell {...iconProps} />;
      case 'offline.sync.title':
      case 'mainNav.drawer.predict':
        return <Activity {...iconProps} />;
      case 'mainNav.drawer.experts':
        return <Users {...iconProps} />;
      case 'mainNav.drawer.more':
        return <Users {...iconProps} />;
      default:
        return <Bell {...iconProps} />;
    }
  };

  // ── Drawer Content ───────────────────────────────────────────────────────────

  const leftDrawerContent = (
    <View
      style={{
        flex: 1,
        backgroundColor: drawerBg,
        paddingTop: insets.top + 16,
        paddingBottom: Math.max(insets.bottom, 24),
        paddingHorizontal: 16,
      }}
    >
      <Text style={[styles.drawerTitle, { color: palette.text }]}>
        {t('mainNav.drawer.options')}
      </Text>
      {DRAWER_MENU_ITEMS.map((item) => (
        <Pressable key={item.path} style={styles.drawerItem} onPress={() => navigate(item.path)}>
          {getDrawerIcon(item.labelKey)}
          <Text style={[styles.drawerItemText, { color: palette.text }]}>
            {item.label || t(item.labelKey)}
          </Text>
        </Pressable>
      ))}
    </View>
  );

  const rightDrawerContent = (
    <View
      style={{
        flex: 1,
        backgroundColor: drawerBg,
        paddingTop: insets.top + 16,
        paddingBottom: Math.max(insets.bottom, 24),
        paddingHorizontal: 16,
      }}
    >
      <Text style={[styles.drawerTitle, { color: palette.text, marginBottom: 12 }]}>
        {t('mainNav.drawer.notifications')}
      </Text>
      {historyLoading ? (
        <RNActivityIndicator color={palette.primary} style={{ marginVertical: 20 }} />
      ) : recentNotifications.length === 0 ? (
        <Text style={{ color: '#64748B', textAlign: 'center', marginVertical: 20 }}>
          {t('notifications.emptyAllTitle', 'No notifications yet')}
        </Text>
      ) : (
        <View style={{ marginHorizontal: -16 }}>
          {recentNotifications.map((notif) => (
            <NotificationItem key={notif.id} notification={notif} onPress={handleNotificationPress} />
          ))}
        </View>
      )}
      <Pressable
        style={[styles.drawerItem, { marginTop: 12 }]}
        onPress={() => router.push('/(main)/notifications' as never)}
      >
        <Bell size={20} color={palette.primary} />
        <Text style={[styles.drawerItemText, { color: palette.text }]}>
          {t('mainNav.drawer.viewAllNotifications')}
        </Text>
      </Pressable>
    </View>
  );

  // ── Shared Tab Screen Options ─────────────────────────────────────────────────

  const sharedTabScreenOptions = {
    tabBarActiveTintColor: palette.tint,
    tabBarInactiveTintColor: tabIconDefault,
    tabBarShowLabel: true,
    tabBarStyle: {
      height: 74 + insets.bottom,
      paddingBottom: insets.bottom + 4,
      paddingTop: 6,
      backgroundColor: scheme === 'dark' ? palette.background : '#FFFFFF',
      borderTopColor: scheme === 'dark' ? 'rgba(47,127,52,0.2)' : 'rgba(47,127,52,0.12)',
      borderTopWidth: 1,
      elevation: 12,
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: -4 },
      shadowOpacity: 0.12,
      shadowRadius: 12,
    },
    tabBarLabelStyle: { fontSize: 10, fontWeight: '600' as const },
    tabBarItemStyle: { paddingBottom: 0 },
    headerShown: true,
    headerStyle: {
      backgroundColor: scheme === 'dark' ? 'rgba(20,30,21,0.85)' : '#FFFFFF',
      borderBottomColor: scheme === 'dark' ? 'rgba(47,127,52,0.2)' : 'rgba(47,127,52,0.12)',
      borderBottomWidth: 1,
    },
    headerShadowVisible: false,
    headerTitleStyle: { fontSize: 18, fontWeight: '700' as const, color: palette.text, textAlign: 'center' as const },
    headerTitleAlign: 'center' as const,
    headerTitleContainerStyle: { alignItems: 'center' as const },
    headerLeft: () => (
      <Pressable style={styles.headerIconButton} onPress={openMoreDrawer}>
        <Menu size={20} color={palette.primary} />
      </Pressable>
    ),
    headerLeftContainerStyle: { paddingLeft: 16 },
    headerRight: () => (
      <Pressable style={styles.headerRightWrapper} onPress={openNotiDrawer}>
        <View style={styles.headerIconButton}>
          <Bell size={20} color={palette.primary} />
        </View>
        {unreadCount > 0 && (
          <View style={styles.notificationBadge}>
            <Text style={styles.notificationBadgeText}>
              {unreadCount > 99 ? '99+' : unreadCount}
            </Text>
          </View>
        )}
      </Pressable>
    ),
    headerRightContainerStyle: { paddingRight: 16 },
    animation: 'shift' as const,
    transitionSpec: { animation: 'timing' as const, config: { duration: 220 } },
  };
  const openAlertCount =
    openAlertsQuery.data?.totalItems ??
    openAlertsQuery.data?.totalElements ??
    openAlertsQuery.data?.items?.length ??
    0;

  // ── Tab Screens ──────────────────────────────────────────────────────────────

  const visibleTabs = [
    {
      name: 'index',
      title: t('mainNav.tabs.overview'),
      headerTitle: t('mainNav.headers.overview'),
      tabBarIcon: ({ color }: { color: string }) => <Home color={color} size={24} />,
    },
    {
      name: 'iot',
      title: 'IoT',
      headerTitle: 'IoT Dashboard',
      tabBarIcon: ({ color }: { color: string }) => <RadioTower color={color} size={24} />,
    },
    {
      name: 'calendar',
      headerTitle: t('mainNav.headers.calendar'),
      tabBarButton: (props: unknown) => (
        <CenterActionButton
          {...(props as object)}
          borderColor={palette.background}
          labelColor={palette.primary}
          label={t('mainNav.tabs.calendar')}
        />
      ),
    },
    {
      name: 'community',
      title: t('mainNav.tabs.community'),
      headerTitle: t('mainNav.headers.community'),
      headerLeft: () => null,
      headerRight: () => null,
      tabBarIcon: ({ color }: { color: string }) => <Users color={color} size={24} />,
    },
    {
      name: 'profile',
      title: t('mainNav.tabs.profile'),
      headerTitle: t('mainNav.headers.myAccount'),
      headerLeft: () => null,
      headerRight: () => null,
      tabBarIcon: ({ color }: { color: string }) => <User color={color} size={24} />,
    },
  ];

  const hiddenTabs = [
    'farm',
    'plants',
    'plans',
    'plant-events',
    'sync',
    'predict',
    'ai-chat',
    'notifications',
    'chat',
    'experts',
  ];

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <Drawer
      open={moreDrawerVisible}
      onOpen={() => setMoreDrawerVisible(true)}
      onClose={() => setMoreDrawerVisible(false)}
      drawerPosition="left"
      drawerType="front"
      drawerStyle={{ backgroundColor: drawerBg, width: DRAWER_WIDTH }}
      renderDrawerContent={() => leftDrawerContent}
      swipeEdgeWidth={40}
    >
      <Drawer
        open={notiDrawerVisible}
        onOpen={() => setNotiDrawerVisible(true)}
        onClose={() => setNotiDrawerVisible(false)}
        drawerPosition="right"
        drawerType="front"
        drawerStyle={{ backgroundColor: drawerBg, width: DRAWER_WIDTH }}
        renderDrawerContent={() => rightDrawerContent}
        swipeEdgeWidth={40}
      >
        <Tabs screenOptions={sharedTabScreenOptions}>
          {/* Visible tabs */}
          {visibleTabs.map((tab) => (
            <Tabs.Screen
              key={tab.name}
              name={tab.name}
              options={{
                title: tab.title,
                headerTitle: tab.headerTitle,
                tabBarIcon: tab.tabBarIcon,
                ...(tab.tabBarButton !== undefined ? { tabBarButton: tab.tabBarButton } : {}),
                ...(tab.headerLeft !== undefined ? { headerLeft: tab.headerLeft } : {}),
                ...(tab.headerRight !== undefined ? { headerRight: tab.headerRight } : {}),
              }}
            />
          ))}

          {/* Hidden feature stacks */}
          {hiddenTabs.map((name) => (
            <Tabs.Screen
              key={name}
              name={name}
              options={{
                href: null,
                headerShown: false,
                tabBarStyle: { display: 'none' },
              }}
            />
          ))}
        </Tabs>

        {/* Global WebSocket listeners — must be inside the Drawer so they
            are part of the main layout and not unmounted on screen navigation */}
        <GlobalWebSocketListener />
      </Drawer>
    </Drawer>
  );
}
