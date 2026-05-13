import { SafeAreaView } from "react-native-safe-area-context";
import { ZoneMetricsScreen } from "@/src/features/iot";

export default function SafeZoneMetricsScreen() {
  return (
    <SafeAreaView style={{ flex: 1 }} edges={['left', 'right']}>
      <ZoneMetricsScreen />
    </SafeAreaView>
  );
}
