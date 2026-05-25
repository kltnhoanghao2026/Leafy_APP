import { SafeAreaView } from "react-native-safe-area-context";

import { AlertRulesScreen } from "@/src/features/iot";

export default function SafeAlertRulesScreen() {
  return (
    <SafeAreaView edges={["left", "right"]} style={{ flex: 1 }}>
      <AlertRulesScreen />
    </SafeAreaView>
  );
}
