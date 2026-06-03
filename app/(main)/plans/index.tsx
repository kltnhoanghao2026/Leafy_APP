import { PlanScreen } from '@/src/features/plan/components/PlanScreen';
import { SafeAreaView } from "react-native-safe-area-context";

export default function SafePlans() {
  return (
    <SafeAreaView style={{ flex: 1 }} edges={['left', 'right']} className="bg-slate-50 dark:bg-slate-950">
      <PlanScreen />
    </SafeAreaView>
  );
}
