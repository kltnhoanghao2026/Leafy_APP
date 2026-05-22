import { Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';
import Colors from '@/src/constants/Colors';
import { useColorScheme } from '@/src/hooks/useColorScheme';
import BackButton from '@/src/components/ui/BackButton';

// ── Shared Header Options ──────────────────────────────────────────────────────

export function getPlantEventsStackOptions() {
  return {
    headerStyle: { backgroundColor: 'transparent' },
    headerTitleStyle: { fontWeight: '700' as const },
    headerShadowVisible: false,
  };
}

// ── Layout ────────────────────────────────────────────────────────────────────

export default function PlantEventsLayout() {
  const { t } = useTranslation();
  const scheme = useColorScheme() ?? 'light';
  const palette = Colors[scheme];

  const commonOptions = {
    headerStyle: { backgroundColor: palette.background },
    headerTitleStyle: { color: palette.text, fontWeight: '700' as const },
    headerShadowVisible: false,
  };

  return (
    <Stack screenOptions={commonOptions}>
      <Stack.Screen
        name="index"
        options={{
          headerTitle: t('mainNav.headers.manageEvents'),
          headerLeft: () => <BackButton fallback="/(main)/plant-events" />,
        }}
      />
      <Stack.Screen
        name="[id]"
        options={{
          headerTitle: t('plantEvent.detail.title'),
          headerLeft: () => <BackButton fallback="/(main)/plant-events" />,
          headerRight: () => null,
        }}
      />
      <Stack.Screen
        name="add"
        options={{
          headerTitle: t('plantEvent.form.titleCreate'),
          headerLeft: () => <BackButton />,
          headerRight: () => null,
        }}
      />
      <Stack.Screen
        name="edit/[id]"
        options={{
          headerTitle: t('plantEvent.form.titleEdit'),
          headerLeft: () => <BackButton />,
          headerRight: () => null,
        }}
      />
      <Stack.Screen
        name="calendar"
        options={{
          headerTitle: t('calendar.title'),
          headerLeft: () => <BackButton />,
          headerRight: () => null,
        }}
      />
      <Stack.Screen
        name="week"
        options={{
          headerTitle: t('calendar.title'),
          headerLeft: () => <BackButton />,
          headerRight: () => null,
        }}
      />
      <Stack.Screen
        name="timeline"
        options={{
          headerTitle: t('calendar.title'),
          headerLeft: () => <BackButton />,
          headerRight: () => null,
        }}
      />
    </Stack>
  );
}
