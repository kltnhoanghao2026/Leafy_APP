import { SafeAreaView } from "react-native-safe-area-context";
import { OfflinePlantList } from '@/src/features/offline';

export default function SafeOfflinePlantList() {
  return (
    <SafeAreaView style={{ flex: 1 }} edges={['left', 'right']}>
      <OfflinePlantList />
    </SafeAreaView>
  );
}
