import { SafeAreaView } from "react-native-safe-area-context";
import { PlantEventFormScreen } from "@/src/features/plant-event";

export default function SafePlantEventFormScreen() {
  return (
    <SafeAreaView style={{ flex: 1 }} edges={['bottom', 'left', 'right']}>
      <PlantEventFormScreen />
    </SafeAreaView>
  );
}
