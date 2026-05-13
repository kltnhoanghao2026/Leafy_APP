import { SafeAreaView } from "react-native-safe-area-context";
import { DeviceDetailScreen } from "@/src/features/iot";

export default function SafeDeviceDetailScreen() {
  return (
    <SafeAreaView style={{ flex: 1 }} edges={['left', 'right']}>
      <DeviceDetailScreen />
    </SafeAreaView>
  );
}
