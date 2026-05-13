import { Tabs, useRouter } from 'expo-router';
import {
  Home,
  RadioTower,
  Activity,
  Users,
  User,
  Menu,
  Bell,
  ClipboardList,
} from 'lucide-react-native';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  ActivityIndicator as RNActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Drawer } from 'react-native-drawer-layout';
import type { BottomTabBarButtonProps } from '@react-navigation/bottom-tabs';
import { useQueryClient } from '@tanstack/react-query';
import { Dimensions } from 'react-native';
import BackButton from '@/src/components/ui/BackButton';

import Colors from '@/src/constants/Colors';
import { useColorScheme } from '@/src/hooks/useColorScheme';
import {
  useNotificationState,
  useNotificationHistory,
  NotificationItem,
  useMarkNotificationReadMutation,
  notificationKeys,
} from '@/src/features/notifications';
import type { UserNotificationResponse } from '@/src/features/notifications';

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
  const colorScheme = useColorScheme();
  const queryClient = useQueryClient();
  const markReadMutation = useMarkNotificationReadMutation();

  const { data: historyData, isLoading: historyLoading } = useNotificationHistory(false, true);
  const recentNotifications = historyData?.pages?.[0]?.data?.slice(0, 5) ?? [];

  const scheme = colorScheme ?? 'light';
  const palette = Colors[scheme];
  const tabIconDefault = palette.tabIconDefault;
  const drawerBg = scheme === 'dark' ? palette.background : '#FFFFFF';

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

  // ── Drawers ─────────────────────────────────────────────────────────────────

  const renderLeftDrawer = () => (
    <View style={{ flex: 1, backgroundColor: drawerBg, paddingTop: insets.top + 16, paddingBottom: Math.max(insets.bottom, 24), paddingHorizontal: 16 }}>
      <Text style={[styles.drawerTitle, { color: palette.text }]}>
        {t('mainNav.drawer.options')}
      </Text>
      {([
        { label: t('mainNav.drawer.manageFarm'), path: '/(main)/farm', icon: <Home size={20} color={palette.primary} /> },
        { label: t('mainNav.drawer.managePlants'), path: '/(main)/plants', icon: <Users size={20} color={palette.primary} /> },
        { label: t('mainNav.drawer.managePlans', 'Quản lý kế hoạch'), path: '/(main)/plans', icon: <ClipboardList size={20} color={palette.primary} /> },
        { label: t('mainNav.drawer.manageEvents'), path: '/(main)/plant-events', icon: <Bell size={20} color={palette.primary} /> },
        { label: t('mainNav.drawer.eventCalendar'), path: '/(main)/plant-events/calendar', icon: <Bell size={20} color={palette.primary} /> },
        { label: t('offline.sync.title', 'Sync Data'), path: '/(main)/sync', icon: <Activity size={20} color={palette.primary} /> },
        { label: t('mainNav.drawer.predict', 'Disease Detection'), path: '/(main)/predict', icon: <Activity size={20} color={palette.primary} /> },
        { label: t('mainNav.drawer.more'), path: '/(main)/community', icon: <Users size={20} color={palette.primary} /> },
      ] as const).map(({ label, path, icon }) => (
        <Pressable key={path} style={styles.drawerItem} onPress={() => navigate(path)}>
          {icon}
          <Text style={[styles.drawerItemText, { color: palette.text }]}>{label}</Text>
        </Pressable>
      ))}
    </View>
  );

  const renderRightDrawer = () => (
    <View style={{ flex: 1, backgroundColor: drawerBg, paddingTop: insets.top + 16, paddingBottom: Math.max(insets.bottom, 24), paddingHorizontal: 16 }}>
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
      <Pressable style={[styles.drawerItem, { marginTop: 12 }]} onPress={() => { closeNotiDrawer(); router.push('/(main)/notifications' as never); }}>
        <Bell size={20} color={palette.primary} />
        <Text style={[styles.drawerItemText, { color: palette.text }]}>
          {t('mainNav.drawer.viewAllNotifications')}
        </Text>
      </Pressable>
    </View>
  );

  // ── Tab shared header options ─────────────────────────────────────────────

  const defaultHeaderLeft = () => (
    <Pressable style={styles.headerIconButton} onPress={openMoreDrawer}>
      <Menu size={20} color={palette.primary} />
    </Pressable>
  );

  const defaultHeaderRight = () => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const { data: stateData } = useNotificationState();
    const unreadCount = stateData?.data?.unreadCount ?? 0;
    return (
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
    );
  };

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
    headerLeft: defaultHeaderLeft,
    headerLeftContainerStyle: { paddingLeft: 16 },
    headerRight: defaultHeaderRight,
    headerRightContainerStyle: { paddingRight: 16 },
    animation: 'shift' as const,
    transitionSpec: { animation: 'timing' as const, config: { duration: 220 } },
  };

  return (
    <Drawer
      open={moreDrawerVisible}
      onOpen={() => setMoreDrawerVisible(true)}
      onClose={() => setMoreDrawerVisible(false)}
      drawerPosition="left"
      drawerType="front"
      drawerStyle={{ backgroundColor: drawerBg, width: DRAWER_WIDTH }}
      renderDrawerContent={renderLeftDrawer}
      swipeEdgeWidth={40}
    >
      <Drawer
        open={notiDrawerVisible}
        onOpen={() => setNotiDrawerVisible(true)}
        onClose={() => setNotiDrawerVisible(false)}
        drawerPosition="right"
        drawerType="front"
        drawerStyle={{ backgroundColor: drawerBg, width: DRAWER_WIDTH }}
        renderDrawerContent={renderRightDrawer}
        swipeEdgeWidth={40}
      >
        <Tabs screenOptions={sharedTabScreenOptions}>
          {/* ── Visible tabs ─────────────────────────────────────────────── */}
          <Tabs.Screen
            name="index"
            options={{
              title: t('mainNav.tabs.overview'),
              headerTitle: t('mainNav.headers.overview'),
              tabBarIcon: ({ color }) => <Home color={color} size={24} />,
            }}
          />
          <Tabs.Screen
            name="iot"
            options={{
              title: 'IoT',
              headerTitle: 'IoT Dashboard',
              tabBarIcon: ({ color }) => <RadioTower color={color} size={24} />,
            }}
          />
          <Tabs.Screen
            name="diagnosis"
            options={{
              title: '',
              headerTitle: t('mainNav.headers.diagnosis'),
              tabBarButton: (props) => (
                <CenterActionButton
                  {...props}
                  borderColor={palette.background}
                  labelColor={palette.primary}
                  label={t('mainNav.tabs.diagnosis')}
                />
              ),
            }}
          />
          <Tabs.Screen
            name="community"
            options={{
              title: t('mainNav.tabs.community'),
              headerTitle: t('mainNav.headers.community'),
              headerLeft: () => null,
              headerRight: () => null,
              tabBarIcon: ({ color }) => <Users color={color} size={24} />,
            }}
          />
          <Tabs.Screen
            name="profile"
            options={{
              title: t('mainNav.tabs.profile'),
              headerTitle: t('mainNav.headers.myAccount'),
              headerLeft: () => null,
              headerRight: () => null,
              tabBarIcon: ({ color }) => <User color={color} size={24} />,
            }}
          />

          {/* ── Hidden feature stacks (href:null) ────────────────────────── */}
          <Tabs.Screen name="farm"          options={{ href: null, headerShown: false, tabBarStyle: { display: 'none' } }} />
          <Tabs.Screen name="plants"        options={{ href: null, headerShown: false, tabBarStyle: { display: 'none' } }} />
          <Tabs.Screen name="plans"         options={{ href: null, headerShown: false, tabBarStyle: { display: 'none' } }} />
          <Tabs.Screen name="plant-events"  options={{ href: null, headerShown: false, tabBarStyle: { display: 'none' } }} />
          <Tabs.Screen name="sync"          options={{ href: null, title: t('offline.sync.title', 'Sync Data'), headerTitle: t('offline.sync.title', 'Sync Data'), headerLeft: () => <BackButton />, tabBarStyle: { display: 'none' } }} />
          <Tabs.Screen name="predict"       options={{ href: null, headerShown: false, tabBarStyle: { display: 'none' } }} />
          <Tabs.Screen name="ai-chat"       options={{ href: null, headerShown: false, tabBarStyle: { display: 'none' } }} />
          <Tabs.Screen name="notifications" options={{ href: null, headerShown: false, tabBarStyle: { display: 'none' } }} />
          <Tabs.Screen name="chat"          options={{ href: null, headerShown: false, tabBarStyle: { display: 'none' } }} />
        </Tabs>
      </Drawer>
    </Drawer>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  headerIconButton: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: 'rgba(47,127,52,0.1)',
    alignItems: 'center', justifyContent: 'center',
  },
  headerRightWrapper: { position: 'relative', width: 36, height: 36 },
  notificationBadge: {
    position: 'absolute', top: -4, right: -6,
    minWidth: 16, height: 16, borderRadius: 8,
    backgroundColor: '#EF4444',
    alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 3, borderWidth: 1.5, borderColor: '#FFFFFF',
  },
  notificationBadgeText: { fontSize: 9, fontWeight: '800', color: '#FFFFFF', lineHeight: 12 },
  drawerTitle: { fontSize: 18, fontWeight: '700', marginBottom: 16 },
  drawerItem: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 12, paddingHorizontal: 10,
    borderRadius: 10, backgroundColor: 'rgba(47,127,52,0.08)', marginBottom: 10,
  },
  drawerItemText: { fontSize: 15, fontWeight: '600' },
  centerButtonWrapper: { top: -26, alignItems: 'center', justifyContent: 'center', width: 88 },
  centerButton: {
    width: 74, height: 74, borderRadius: 37,
    backgroundColor: '#2F7F34', justifyContent: 'center', alignItems: 'center',
    borderWidth: 6, borderColor: '#F6F8F6',
    shadowColor: '#2F7F34', shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35, shadowRadius: 12, elevation: 10,
  },
  centerButtonLabel: { marginTop: 4, fontWeight: '700', fontSize: 11 },
});
