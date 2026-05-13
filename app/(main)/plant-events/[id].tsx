import { PlantEventDetailScreen } from "@/src/features/plant-event/components/PlantEventDetailScreen";

import { SafeAreaView } from "react-native-safe-area-context";

export default function SafePlantEventDetailRoute() {
  return (
    <SafeAreaView style={{ flex: 1 }} edges={['bottom', 'left', 'right']}>
      <PlantEventDetailRoute />
    </SafeAreaView>
  );
}

function PlantEventDetailRoute() {
  return <PlantEventDetailScreen />;
}
