import { View, Text, TouchableOpacity } from "react-native";
import { useTranslation } from "react-i18next";
import { useRouter } from "expo-router";
import { BotMessageSquare } from "lucide-react-native";
import { PlantEventHubScreen } from "@/src/features/plant-event/components/PlantEventHubScreen";
import { SafeAreaView } from "react-native-safe-area-context";

export default function SafeMonitorScreen() {
  return (
    <SafeAreaView style={{ flex: 1 }} edges={['left', 'right']}>
      <MonitorScreen />
    </SafeAreaView>
  );
}

function MonitorScreen() {
  const { t } = useTranslation();
  const router = useRouter();

  return (
    <View className="flex-1">
      <PlantEventHubScreen
        defaultView="timeline"
        detailReturnTo="/(main)/calendar"
      />
      <TouchableOpacity
        className="absolute bottom-[96px] right-5 flex-row items-center justify-center bg-[#00895c] px-4 py-3 rounded-full shadow-lg h-14"
        style={{ elevation: 5 }}
        onPress={() => router.push("/(main)/ai-chat")}
        activeOpacity={0.8}
      >
        <BotMessageSquare color="#FFFFFF" size={24} className="mr-2" />
        <Text className="text-white font-bold text-base">
          {t("ragChat.askAI", "Hỏi AI")}
        </Text>
      </TouchableOpacity>
    </View>
  );
}
