import { Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';
import Colors from '@/src/constants/Colors';
import { useColorScheme } from '@/src/hooks/useColorScheme';
import BackButton from '@/src/components/ui/BackButton';

export default function PlansLayout() {
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
          headerTitle: t('mainNav.headers.managePlans', 'Quản lý kế hoạch'),
          headerLeft: () => <BackButton fallback="/" />,
        }}
      />
      <Stack.Screen
        name="[id]"
        options={{
          headerTitle: t('plan.detail.unnamed', 'Kế hoạch'),
          headerLeft: () => <BackButton fallback="/(main)/plans" />,
        }}
      />
      <Stack.Screen
        name="apply/[applyId]"
        options={{
          headerShown: false,
        }}
      />
    </Stack>
  );
}
