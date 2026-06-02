import type { BottomTabBarButtonProps } from '@react-navigation/bottom-tabs';
import { Activity } from 'lucide-react-native';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useColorScheme } from '@/src/hooks/useColorScheme';
import Colors from '@/src/constants/Colors';

const DRAWER_WIDTH = 280;

// ── Center Action Tab Button ──────────────────────────────────────────────────

type CenterActionButtonProps = {
  onPress?: BottomTabBarButtonProps['onPress'];
  borderColor: string;
  labelColor: string;
  label: string;
};

export function CenterActionButton({
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

// ── Notification Deep-link Map ───────────────────────────────────────────────

export type NotificationRouteHandler = (referenceId: string) => string | null;

export const NOTIFICATION_ROUTES: Record<string, NotificationRouteHandler> = {
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

// ── Drawer Menu Items ────────────────────────────────────────────────────────

export type DrawerMenuItem = {
  labelKey: string;
  label?: string;
  path: string;
  icon: React.ReactNode;
};

export const DRAWER_MENU_ITEMS: DrawerMenuItem[] = [
  { labelKey: 'mainNav.drawer.manageFarm', path: '/(main)/farm', icon: null },
  { labelKey: 'mainNav.drawer.managePlants', path: '/(main)/plants', icon: null },
  { labelKey: 'mainNav.drawer.managePlans', path: '/(main)/plans', icon: null },
  { labelKey: 'mainNav.drawer.manageEvents', path: '/(main)/plant-events', icon: null },
  { labelKey: 'mainNav.drawer.eventCalendar', path: '/(main)/plant-events/calendar', icon: null },
  { labelKey: 'mainNav.drawer.iotDevices', path: '/(main)/iot', icon: null },
  { labelKey: 'mainNav.drawer.iotAlerts', path: '/(main)/iot/alerts', icon: null },
  { labelKey: 'mainNav.drawer.experts', path: '/(main)/experts', icon: null },
  { labelKey: 'offline.sync.title', path: '/(main)/sync', icon: null },
  { labelKey: 'mainNav.drawer.predict', path: '/(main)/predict', icon: null },
  { labelKey: 'mainNav.drawer.more', path: '/(main)/community', icon: null },
];

// ── Constants ─────────────────────────────────────────────────────────────────

export { DRAWER_WIDTH };

// ── Colors Hook ──────────────────────────────────────────────────────────────

export function useAppColors() {
  const colorScheme = useColorScheme();
  const scheme = colorScheme ?? 'light';
  const palette = Colors[scheme];
  return { scheme, palette };
}

// ── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  headerIconButton: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(47,127,52,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerRightWrapper: {
    position: 'relative',
    width: 36,
    height: 36,
  },
  notificationBadge: {
    position: 'absolute',
    top: -4,
    right: -6,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  notificationBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#FFFFFF',
    lineHeight: 12,
  },
  drawerTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },
  drawerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: 10,
    backgroundColor: 'rgba(47,127,52,0.08)',
    marginBottom: 10,
  },
  drawerItemText: {
    fontSize: 15,
    fontWeight: '600',
  },
  centerButtonWrapper: {
    top: -26,
    alignItems: 'center',
    justifyContent: 'center',
    width: 88,
  },
  centerButton: {
    width: 74,
    height: 74,
    borderRadius: 37,
    backgroundColor: '#2F7F34',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 6,
    borderColor: '#F6F8F6',
    shadowColor: '#2F7F34',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 10,
  },
  centerButtonLabel: {
    marginTop: 4,
    fontWeight: '700',
    fontSize: 11,
  },
});

export { styles };
