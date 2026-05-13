import { SafeAreaView } from "react-native-safe-area-context";
import { CertificateScreen } from "@/src/features/user-profile";

export default function SafeCertificateScreen() {
  return (
    <SafeAreaView style={{ flex: 1 }} edges={['left', 'right']}>
      <CertificateScreen />
    </SafeAreaView>
  );
}
