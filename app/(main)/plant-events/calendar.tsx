import { PlantEventHubScreen } from '@/src/features/plant-event/components/PlantEventHubScreen';

import { SafeAreaView } from "react-native-safe-area-context";

export default function SafePlantEventCalendarRoute() {
  return (
    <SafeAreaView style={{ flex: 1 }} edges={['bottom', 'left', 'right']}>
      <PlantEventCalendarRoute />
    </SafeAreaView>
  );
}

function PlantEventCalendarRoute() {
  return <PlantEventHubScreen defaultView="month" />;
}
