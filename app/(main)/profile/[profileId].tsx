import { useLocalSearchParams } from "expo-router";
import { ProfileDetailScreen } from "@/src/features/user-profile/components/ProfileDetailScreen";

export default function ProfileDetailRoute() {
  const { profileId } = useLocalSearchParams<{ profileId: string }>();
  return <ProfileDetailScreen profileId={profileId ?? ""} />;
}
