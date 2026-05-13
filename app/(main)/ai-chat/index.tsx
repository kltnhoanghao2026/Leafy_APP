import { View, Text } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Info } from 'lucide-react-native';
import { RagChatBox } from '@/src/features/rag-chat/components/RagChatBox';

import { SafeAreaView } from "react-native-safe-area-context";

export default function SafeAiChatScreen() {
  return (
    <SafeAreaView style={{ flex: 1 }} edges={['bottom', 'left', 'right']}>
      <AiChatScreen />
    </SafeAreaView>
  );
}

function AiChatScreen() {
  const { t } = useTranslation();

  return (
    <View className="flex-1 bg-[#FAFAFA]">
      <View className="px-4 py-2.5 bg-amber-50 border-b border-amber-100 flex-row items-center justify-center space-x-2">
        <Info size={14} color="#D97706" />
        <Text className="text-amber-800 text-[12.5px] font-medium text-center pl-1.5 flex-wrap flex-1">
          {t(
            'ragChat.startChatWithAI',
            'AI assistant is experimental. Always verify results in practice.',
          )}
        </Text>
      </View>
      <RagChatBox />
    </View>
  );
}
