import { Stack, useGlobalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import Colors from '@/src/constants/Colors';
import { useColorScheme } from '@/src/hooks/useColorScheme';
import BackButton from '@/src/components/ui/BackButton';

export default function PlantEventsLayout() {
  const { t } = useTranslation();
  const scheme = useColorScheme() ?? 'light';
  const palette = Colors[scheme];
  const router = useRouter();
  const routeParams = useGlobalSearchParams<{ returnTo?: string | string[] }>();

  const returnToParam = Array.isArray(routeParams.returnTo)
    ? routeParams.returnTo[0]
    : routeParams.returnTo;

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
          headerTitle: t('mainNav.headers.manageEvents'),
          headerLeft: () => <BackButton fallback="/" />,
        }}
      />
      <Stack.Screen
        name="[id]"
        options={{
          headerTitle: t('plantEvent.detail.title'),
          headerLeft: () => (
            <BackButton
              onPress={() => {
                if (returnToParam) {
                  router.replace(returnToParam as never);
                  return;
                }
                if (router.canGoBack()) {
                  router.back();
                } else {
                  router.replace('/(main)/plant-events');
                }
              }}
            />
          ),
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
