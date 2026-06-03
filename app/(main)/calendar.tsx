import { View } from "react-native";
import { PlantEventHubScreen } from "@/src/features/plant-event/components/PlantEventHubScreen";
import { SafeAreaView } from "react-native-safe-area-context";

export default function SafeMonitorScreen() {
  return (
    <SafeAreaView style={{ flex: 1 }} edges={['left', 'right']}>
      <MonitorScreen />
    </SafeAreaView>
  );
}

function MonitorScreen() {
  return (
    <View className="flex-1">
      <PlantEventHubScreen
        defaultView="timeline"
        detailReturnTo="/(main)/calendar"
      />
    </View>
  );
}
