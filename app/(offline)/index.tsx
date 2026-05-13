import { SafeAreaView } from "react-native-safe-area-context";
import { OfflineDashboard } from '@/src/features/offline';

export default function SafeOfflineDashboard() {
  return (
    <SafeAreaView style={{ flex: 1 }} edges={['left', 'right']}>
      <OfflineDashboard />
    </SafeAreaView>
  );
}
