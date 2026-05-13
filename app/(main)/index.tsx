import { HomeScreen } from "@/src/features/home";
import { SafeAreaView } from "react-native-safe-area-context";

export default function SafeHomeScreen() {
  return (
    <SafeAreaView style={{ flex: 1 }} edges={['left', 'right']}>
      <HomeScreen />
    </SafeAreaView>
  );
}
