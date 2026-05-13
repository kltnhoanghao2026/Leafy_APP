import { SafeAreaView } from "react-native-safe-area-context";
import { AlertEventDetailScreen } from "@/src/features/iot";

export default function SafeAlertEventDetailScreen() {
  return (
    <SafeAreaView style={{ flex: 1 }} edges={['left', 'right']}>
      <AlertEventDetailScreen />
    </SafeAreaView>
  );
}
