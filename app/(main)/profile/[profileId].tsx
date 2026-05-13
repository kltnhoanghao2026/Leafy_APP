import { useLocalSearchParams } from "expo-router";
import { ProfileDetailScreen } from "@/src/features/user-profile/components/ProfileDetailScreen";

import { SafeAreaView } from "react-native-safe-area-context";

export default function SafeProfileDetailRoute() {
  return (
    <SafeAreaView style={{ flex: 1 }} edges={['left', 'right']}>
      <ProfileDetailRoute />
    </SafeAreaView>
  );
}

function ProfileDetailRoute() {
  const { profileId } = useLocalSearchParams<{ profileId: string }>();
  return <ProfileDetailScreen profileId={profileId ?? ""} />;
}
