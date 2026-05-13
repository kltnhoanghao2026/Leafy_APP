import { Tabs } from 'expo-router';
import { Pressable, Text } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Home, Sprout, Map, Calendar } from 'lucide-react-native';
import { useColorScheme } from '@/src/hooks/useColorScheme';
import Colors from '@/src/constants/Colors';
import { useNetworkContext } from '@/src/providers/NetworkProvider';

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
          name="farm"
          options={{
            title: t('offline.farm', 'Farm'),
            tabBarIcon: ({ color }) => <Map color={color} size={24} />,
          }}
        />
        <Tabs.Screen
          name="plant-events"
          options={{
            title: t('offline.events', 'Events'),
            tabBarIcon: ({ color }) => <Calendar color={color} size={24} />,
          }}
        />
      </Tabs>
  );
}
