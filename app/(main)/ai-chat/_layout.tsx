import { Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';
import Colors from '@/src/constants/Colors';
import { useColorScheme } from '@/src/hooks/useColorScheme';
import BackButton from '@/src/components/ui/BackButton';

export default function AiChatLayout() {
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
          headerTitle: t('ragChat.title', 'AI Assistant'),
          headerLeft: () => <BackButton fallback="/(main)/ai-chat" />,
          headerRight: () => null,
        }}
      />
      <Stack.Screen
        name="plan-review"
        options={{
          headerTitle: t('ragChat.reviewer.title', 'Treatment Plan Reviewer'),
          headerLeft: () => <BackButton />,
          headerRight: () => null,
        }}
      />
    </Stack>
  );
}
