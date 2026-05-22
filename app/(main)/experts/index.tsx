import { SafeAreaView } from "react-native-safe-area-context";
import { ExpertScreen } from "@/src/features/expert/components/ExpertScreen";

export default function SafeExpertScreen() {
  return (
    <SafeAreaView style={{ flex: 1 }} edges={["left", "right"]}>
      <ExpertScreen />
    </SafeAreaView>
  );
}
