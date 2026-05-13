import { SafeAreaView } from "react-native-safe-area-context";
import { IoTDashboardScreen } from "@/src/features/iot";

export default function SafeIoTDashboardScreen() {
  return (
    <SafeAreaView style={{ flex: 1 }} edges={['left', 'right']}>
      <IoTDashboardScreen />
    </SafeAreaView>
  );
}
