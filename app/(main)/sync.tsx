import { OfflineSyncScreen } from '@/src/features/offline';
import { SafeAreaView } from "react-native-safe-area-context";

export default function SafeOfflineSyncScreen() {
  return (
    <SafeAreaView style={{ flex: 1 }} edges={['bottom', 'left', 'right']}>
      <OfflineSyncScreen />
    </SafeAreaView>
  );
}
