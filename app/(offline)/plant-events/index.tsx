import { SafeAreaView } from "react-native-safe-area-context";
import { OfflinePlantEventHubScreen } from '@/src/features/offline/components/OfflinePlantEventHubScreen';

export default function SafeOfflinePlantEventList() {
  return (
    <SafeAreaView style={{ flex: 1 }} edges={['left', 'right']}>
      <OfflinePlantEventHubScreen defaultView="month" />
    </SafeAreaView>
  );
}
