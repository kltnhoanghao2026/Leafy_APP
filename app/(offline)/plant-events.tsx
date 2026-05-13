import { SafeAreaView } from "react-native-safe-area-context";
import { OfflinePlantEventList } from '@/src/features/offline';

export default function SafeOfflinePlantEventList() {
  return (
    <SafeAreaView style={{ flex: 1 }} edges={['left', 'right']}>
      <OfflinePlantEventList />
    </SafeAreaView>
  );
}
