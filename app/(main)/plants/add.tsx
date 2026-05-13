import { SafeAreaView } from "react-native-safe-area-context";
import { PlantFormScreen } from "@/src/features/plant";

export default function SafePlantFormScreen() {
  return (
    <SafeAreaView style={{ flex: 1 }} edges={['bottom', 'left', 'right']}>
      <PlantFormScreen />
    </SafeAreaView>
  );
}
