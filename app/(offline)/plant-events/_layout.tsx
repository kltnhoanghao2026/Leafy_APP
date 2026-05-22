import { Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';
import Colors from '@/src/constants/Colors';
import { useColorScheme } from '@/src/hooks/useColorScheme';
import BackButton from '@/src/components/ui/BackButton';
import { Pressable, Text } from 'react-native';
import { useNetworkContext } from '@/src/providers/NetworkProvider';

export default function OfflinePlantEventsLayout() {
  const { t } = useTranslation();
  const scheme = useColorScheme() ?? 'light';
  const palette = Colors[scheme];
  const { toggleForceOffline } = useNetworkContext();

  return (
    <Stack
      screenOptions={{
        headerStyle: { 
          backgroundColor: scheme === 'dark' ? 'rgba(20,30,21,0.85)' : '#FFFFFF',
        },
        headerTitleStyle: { color: palette.text, fontWeight: '700' },
        headerTintColor: palette.text,
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          headerTitle: t('offline.events', 'Sự kiện'),
          headerRight: () => (
            <Pressable 
              onPress={() => toggleForceOffline()}
              className="rounded-full bg-primary/10 px-4 py-2 active:bg-primary/20"
            >
              <Text className="text-xs font-bold text-primary">
                {t('offline.goOnline', 'Go Online')}
              </Text>
            </Pressable>
          ),
        }}
      />
      <Stack.Screen
        name="[id]"
        options={{
          headerTitle: t('plantEvent.detail.title'),
          headerLeft: () => <BackButton />,
          headerRight: () => null,
        }}
      />
    </Stack>
  );
}
