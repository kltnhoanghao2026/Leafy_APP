import { SafeAreaView } from "react-native-safe-area-context";
import { AlertEventsScreen } from "@/src/features/iot";

export default function SafeAlertEventsScreen() {
  return (
    <SafeAreaView style={{ flex: 1 }} edges={['left', 'right']}>
      <AlertEventsScreen />
    </SafeAreaView>
  );
}
