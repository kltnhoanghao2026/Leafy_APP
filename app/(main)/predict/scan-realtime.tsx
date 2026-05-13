import RealtimeScanScreen from '@/src/features/disease-detection/components/RealtimeScanScreen';

import { SafeAreaView } from "react-native-safe-area-context";

export default function SafeScanRealtimeRoute() {
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <ScanRealtimeRoute />
    </SafeAreaView>
  );
}

function ScanRealtimeRoute() {
  return <RealtimeScanScreen />;
}
