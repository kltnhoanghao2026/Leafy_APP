import { SafeAreaView } from "react-native-safe-area-context";
import { OfflinePlanList } from '@/src/features/offline';

export default function SafeOfflinePlanList() {
  return (
    <SafeAreaView style={{ flex: 1 }} edges={['left', 'right']}>
      <OfflinePlanList />
    </SafeAreaView>
  );
}
