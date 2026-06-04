import { Tabs } from 'expo-router';
import { Pressable, Text, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Home, Sprout, Map, Settings, Activity, ClipboardList } from 'lucide-react-native';
import { useColorScheme } from '@/src/hooks/useColorScheme';
import Colors from '@/src/constants/Colors';
import { useNetworkContext } from '@/src/providers/NetworkProvider';

import type { BottomTabBarButtonProps } from '@react-navigation/bottom-tabs';

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

export default function OfflineLayout() {
  const { t } = useTranslation();
  const colorScheme = useColorScheme();
  const palette = Colors[colorScheme ?? 'light'];
  const { toggleForceOffline } = useNetworkContext();

  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        tabBarActiveTintColor: palette.primary,
        tabBarStyle: {
          backgroundColor: palette.background,
          borderTopColor: colorScheme === 'dark' ? '#333' : '#eee',
        },
        headerStyle: {
            backgroundColor: colorScheme === 'dark' ? 'rgba(20,30,21,0.85)' : '#FFFFFF',
            borderBottomColor: colorScheme === 'dark' ? 'rgba(47,127,52,0.2)' : 'rgba(47,127,52,0.12)',
            borderBottomWidth: 1,
            shadowColor: 'transparent',
            elevation: 0,
          },
          headerTitleStyle: {
            color: palette.text,
            fontWeight: '700',
          },
          headerTintColor: palette.text,
          headerRight: () => (
            <Pressable 
              onPress={() => toggleForceOffline()}
              className="mr-4 rounded-full bg-primary/10 px-4 py-2 active:bg-primary/20"
            >
              <Text className="text-xs font-bold text-primary">
                {t('offline.goOnline', 'Go Online')}
              </Text>
            </Pressable>
          ),
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: t('offline.dashboard', 'Overview'),
            tabBarIcon: ({ color }) => <Home color={color} size={24} />,
          }}
        />
        <Tabs.Screen
          name="plants"
          options={{
            title: t('offline.plants', 'Plants'),
            tabBarIcon: ({ color }) => <Sprout color={color} size={24} />,
          }}
        />
        <Tabs.Screen
          name="plans"
          options={{
            title: t('offline.plans', 'Plans'),
            tabBarIcon: ({ color }) => <ClipboardList color={color} size={24} />,
          }}
        />
        <Tabs.Screen
          name="plant-events"
          options={{
            headerShown: false,
            title: '',
            tabBarButton: (props) => (
              <CenterActionButton
                {...props}
                borderColor={palette.background}
                labelColor={palette.primary}
                label={t('offline.tracking', 'Theo dõi')}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="farm"
          options={{
            title: t('offline.farmTab', 'Farm'),
            tabBarIcon: ({ color }) => <Map color={color} size={24} />,
          }}
        />
        <Tabs.Screen
          name="settings"
          options={{
            title: t('offline.settings', 'Cài đặt'),
            tabBarIcon: ({ color }) => <Settings color={color} size={24} />,
          }}
        />
        {/* Hidden predict tab */}
        <Tabs.Screen
          name="predict"
          options={{
            href: null,
            headerShown: false,
            tabBarStyle: { display: 'none' }
          }}
        />
        {/* Hidden sync tab for debug */}
        <Tabs.Screen 
          name="sync" 
          options={{ 
            href: null, 
            title: 'Debug SQLite',
            headerShown: true,
            tabBarStyle: { display: 'none' }
          }} 
        />
      </Tabs>
  );
}

const styles = StyleSheet.create({
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
