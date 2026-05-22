import { SafeAreaView } from "react-native-safe-area-context";
import { OfflinePlantEventDetailScreen } from "@/src/features/offline/components/OfflinePlantEventDetailScreen";

export default function SafeOfflinePlantEventDetailScreen() {
  return (
    <SafeAreaView style={{ flex: 1 }} edges={['bottom', 'left', 'right']}>
      <OfflinePlantEventDetailScreen />
    </SafeAreaView>
  );
}
