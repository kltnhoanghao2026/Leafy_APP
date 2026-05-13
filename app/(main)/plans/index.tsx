import { PlanScreen } from '@/src/features/plan/components/PlanScreen';

import { SafeAreaView } from "react-native-safe-area-context";

export default function SafePlans() {
  return (
    <SafeAreaView style={{ flex: 1 }} edges={['bottom', 'left', 'right']}>
      <Plans />
    </SafeAreaView>
  );
}

function Plans() {
  return <PlanScreen />;
}
