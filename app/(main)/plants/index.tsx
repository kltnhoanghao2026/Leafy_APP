import { SafeAreaView } from "react-native-safe-area-context";
import { PlantScreen } from '@/src/features/plant';

export default function SafePlantScreen() {
  return (
    <SafeAreaView style={{ flex: 1 }} edges={['bottom', 'left', 'right']}>
      <PlantScreen />
    </SafeAreaView>
  );
}
