import { Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';
import Colors from '@/src/constants/Colors';
import { useColorScheme } from '@/src/hooks/useColorScheme';
import BackButton from '@/src/components/ui/BackButton';

export default function ProfileLayout() {
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
      {/* index is the profile tab — header handled by Tabs screen options */}
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen
        name="edit"
        options={{
          headerTitle: t('screens.profileEdit.title'),
          headerLeft: () => <BackButton />,
          headerRight: () => null,
        }}
      />
      <Stack.Screen
        name="certificate"
        options={{
          headerTitle: t('screens.profileCertificate.title'),
          headerLeft: () => <BackButton />,
          headerRight: () => null,
        }}
      />
      <Stack.Screen
        name="[profileId]"
        options={{
          headerTitle: t('profileDetail.infoSection'),
          headerLeft: () => <BackButton />,
          headerRight: () => null,
        }}
      />
    </Stack>
  );
}
