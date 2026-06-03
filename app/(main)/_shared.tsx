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
  drawerItemBadge: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
    marginLeft: 'auto',
  },
  drawerItemBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
    lineHeight: 14,
  },
  drawerTabBar: {
    flexDirection: 'row',
    gap: 8,
    padding: 4,
    borderRadius: 12,
    backgroundColor: 'rgba(47,127,52,0.08)',
    marginBottom: 14,
  },
  drawerTab: {
    flex: 1,
    minHeight: 36,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 8,
  },
  drawerTabActive: {
    backgroundColor: '#2F7F34',
  },
  drawerTabText: {
    color: '#64748B',
    fontSize: 13,
    fontWeight: '700',
  },
  drawerTabTextActive: {
    color: '#FFFFFF',
  },
  drawerTabBadge: {
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
  },
  drawerTabBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
    lineHeight: 12,
  },
  drawerAlertList: {
    gap: 10,
    marginHorizontal: -4,
  },
  drawerAlertItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 10,
    backgroundColor: '#FEF2F2',
  },
  drawerAlertIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEE2E2',
  },
  drawerAlertTextWrap: {
    flex: 1,
    minWidth: 0,
  },
  drawerAlertTitle: {
    color: '#7F1D1D',
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 17,
  },
  drawerAlertMeta: {
    color: '#991B1B',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 3,
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
