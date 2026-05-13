import { Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';
import Colors from '@/src/constants/Colors';
import { useColorScheme } from '@/src/hooks/useColorScheme';
import BackButton from '@/src/components/ui/BackButton';

export default function FarmLayout() {
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
          headerTitle: t('mainNav.headers.manageFarm'),
          headerLeft: () => <BackButton fallback="/" />,
        }}
      />
      <Stack.Screen
        name="add"
        options={{
          headerTitle: t('farm.form.titleCreate'),
          headerLeft: () => <BackButton />,
          headerRight: () => null,
        }}
      />
      <Stack.Screen
        name="edit/[id]"
        options={{
          headerTitle: t('farm.form.titleEdit'),
          headerLeft: () => <BackButton />,
          headerRight: () => null,
        }}
      />
    </Stack>
  );
}
