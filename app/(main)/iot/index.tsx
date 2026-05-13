import { SafeAreaView } from "react-native-safe-area-context";
import { DeviceListScreen } from "@/src/features/iot";

export default function SafeDeviceListScreen() {
  return (
    <SafeAreaView style={{ flex: 1 }} edges={['left', 'right']}>
      <DeviceListScreen />
    </SafeAreaView>
  );
}
