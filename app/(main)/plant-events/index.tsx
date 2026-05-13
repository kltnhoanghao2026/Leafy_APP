import { SafeAreaView } from "react-native-safe-area-context";
import { PlantEventScreen } from '@/src/features/plant-event';

export default function SafePlantEventScreen() {
  return (
    <SafeAreaView style={{ flex: 1 }} edges={['bottom', 'left', 'right']}>
      <PlantEventScreen />
    </SafeAreaView>
  );
}
