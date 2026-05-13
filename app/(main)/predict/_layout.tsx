import { Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';
import Colors from '@/src/constants/Colors';
import { useColorScheme } from '@/src/hooks/useColorScheme';
import BackButton from '@/src/components/ui/BackButton';

export default function PredictLayout() {
  const { t } = useTranslation();
  const scheme = useColorScheme() ?? 'light';
  const palette = Colors[scheme];

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: palette.background },
        headerTitleStyle: { color: palette.text, fontWeight: '700' },
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          headerTitle: t('diseaseDetection.title', 'Disease Detection'),
          headerLeft: () => <BackButton fallback="/" />,
          headerRight: () => null,
        }}
      />
      <Stack.Screen
        name="scan-capture"
        options={{
          headerTitle: t('diseaseDetection.localCapture', 'Local Scan'),
          headerLeft: () => <BackButton />,
          headerRight: () => null,
        }}
      />
      <Stack.Screen
        name="scan-realtime"
        options={{
          headerShown: false,
        }}
      />
    </Stack>
  );
}
