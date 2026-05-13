import { SafeAreaView } from "react-native-safe-area-context";
import { UpdateProfileScreen } from "@/src/features/user-profile";

export default function SafeUpdateProfileScreen() {
  return (
    <SafeAreaView style={{ flex: 1 }} edges={['left', 'right']}>
      <UpdateProfileScreen />
    </SafeAreaView>
  );
}
