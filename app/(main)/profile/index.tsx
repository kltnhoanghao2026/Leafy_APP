import { SafeAreaView } from "react-native-safe-area-context";
import { ProfileScreen } from "@/src/features/user-profile";

export default function SafeProfileScreen() {
  return (
    <SafeAreaView style={{ flex: 1 }} edges={['left', 'right']}>
      <ProfileScreen />
    </SafeAreaView>
  );
}
