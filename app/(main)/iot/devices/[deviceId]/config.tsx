import { SafeAreaView } from "react-native-safe-area-context";
import { DeviceConfigScreen } from "@/src/features/iot";

export default function SafeDeviceConfigScreen() {
  return (
    <SafeAreaView style={{ flex: 1 }} edges={['left', 'right']}>
      <DeviceConfigScreen />
    </SafeAreaView>
  );
}
