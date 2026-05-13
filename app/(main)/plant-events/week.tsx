import { PlantEventHubScreen } from '@/src/features/plant-event/components/PlantEventHubScreen';

import { SafeAreaView } from "react-native-safe-area-context";

export default function SafePlantEventWeekRoute() {
  return (
    <SafeAreaView style={{ flex: 1 }} edges={['bottom', 'left', 'right']}>
      <PlantEventWeekRoute />
    </SafeAreaView>
  );
}

function PlantEventWeekRoute() {
  return <PlantEventHubScreen defaultView="week" />;
}
