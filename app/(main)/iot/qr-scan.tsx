import { SafeAreaView } from "react-native-safe-area-context";
import { DeviceQrScanScreen } from "@/src/features/iot";

export default function SafeDeviceQrScanScreen() {
  return (
    <SafeAreaView style={{ flex: 1 }} edges={['left', 'right']}>
      <DeviceQrScanScreen />
    </SafeAreaView>
  );
}
