import { PlantEventHubScreen } from '@/src/features/plant-event/components/PlantEventHubScreen';

import { SafeAreaView } from "react-native-safe-area-context";

export default function SafePlantEventTimelineRoute() {
  return (
    <SafeAreaView style={{ flex: 1 }} edges={['bottom', 'left', 'right']}>
      <PlantEventTimelineRoute />
    </SafeAreaView>
  );
}

function PlantEventTimelineRoute() {
  return <PlantEventHubScreen defaultView="timeline" />;
}
