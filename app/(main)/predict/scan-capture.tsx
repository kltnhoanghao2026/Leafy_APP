import LocalCaptureScreen from '@/src/features/disease-detection/components/LocalCaptureScreen';

import { SafeAreaView } from "react-native-safe-area-context";

export default function SafeScanCaptureRoute() {
  return (
    <SafeAreaView style={{ flex: 1 }} edges={['bottom', 'left', 'right']}>
      <ScanCaptureRoute />
    </SafeAreaView>
  );
}

function ScanCaptureRoute() {
  return <LocalCaptureScreen />;
}
