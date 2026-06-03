import { useLocalSearchParams, useNavigation } from "expo-router";
import { useEffect } from "react";
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
  const navigation = useNavigation();

  useEffect(() => {
    const parent = navigation.getParent();
    if (parent) {
      parent.setOptions({ tabBarStyle: { display: "none" }, headerShown: false });
    }
    return () => {
      if (parent) {
        parent.setOptions({ tabBarStyle: undefined, headerShown: true });
      }
    };
  }, [navigation]);

  return <ProfileDetailScreen profileId={profileId ?? ""} />;
}
