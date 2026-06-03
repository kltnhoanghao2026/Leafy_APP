import { TouchableOpacity } from "react-native";
import { Check } from "lucide-react-native";

type Props = {
  checked: boolean;
  onClick: () => void;
};

export function SelectCheckbox({ checked, onClick }: Props) {
  return (
    <TouchableOpacity
      onPress={onClick}
      className={`h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 transition-all ${
        checked
          ? "border-emerald-600 bg-emerald-600"
          : "border-slate-300 bg-white dark:border-slate-600 dark:bg-slate-800"
      }`}
    >
      {checked && <Check size={12} color="#ffffff" strokeWidth={3} />}
    </TouchableOpacity>
  );
}
