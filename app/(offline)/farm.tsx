import { SafeAreaView } from "react-native-safe-area-context";
import { OfflineFarmList } from '@/src/features/offline';

export default function SafeOfflineFarmList() {
  return (
    <SafeAreaView style={{ flex: 1 }} edges={['left', 'right']}>
      <OfflineFarmList />
    </SafeAreaView>
  );
}
