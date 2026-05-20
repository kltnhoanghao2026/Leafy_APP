import { SafeAreaView } from "react-native-safe-area-context";

import { AdminCameraSchedulesPage } from "@/src/features/iot";

export default function SafeAdminCameraSchedulesPage() {
  return (
    <SafeAreaView edges={["left", "right"]} style={{ flex: 1 }}>
      <AdminCameraSchedulesPage />
    </SafeAreaView>
  );
}
