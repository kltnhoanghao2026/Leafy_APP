import { SafeAreaView } from "react-native-safe-area-context";
import { PlantScreen } from '@/src/features/plant';

export default function SafePlantScreen() {
  return (
    <SafeAreaView style={{ flex: 1 }} edges={['left', 'right']} className="bg-slate-50 dark:bg-slate-950">
      <PlantScreen />
    </SafeAreaView>
  );
}
