import { SafeAreaView } from "react-native-safe-area-context";
import { DeviceOnboardingScreen } from "@/src/features/iot";

export default function SafeDeviceOnboardingScreen() {
  return (
    <SafeAreaView style={{ flex: 1 }} edges={['left', 'right']}>
      <DeviceOnboardingScreen />
    </SafeAreaView>
  );
}
