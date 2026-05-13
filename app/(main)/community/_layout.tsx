import { Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';
import Colors from '@/src/constants/Colors';
import { useColorScheme } from '@/src/hooks/useColorScheme';
import BackButton from '@/src/components/ui/BackButton';

export default function CommunityLayout() {
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
      {/* index is the community feed tab — header handled by the Tabs screen options */}
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen
        name="search"
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="post/[postId]"
        options={{
          headerTitle: t('community.postDetail.title'),
          headerLeft: () => <BackButton />,
          headerRight: () => null,
        }}
      />
    </Stack>
  );
}
