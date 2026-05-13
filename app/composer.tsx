import { ComposerScreen } from "@/src/features/community/community-feed/components/ComposerScreen";
import { SafeAreaView } from "react-native-safe-area-context";

export default function SafeComposerScreen() {
  return (
    <SafeAreaView style={{ flex: 1 }} edges={['bottom', 'left', 'right']}>
      <ComposerScreen />
    </SafeAreaView>
  );
}
