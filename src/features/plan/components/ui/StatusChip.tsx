import { TouchableOpacity, Text } from "react-native";
import { useTranslation } from "react-i18next";

type Props = {
  value: string;
  current: string;
  labelKey: string;
  onPress: () => void;
  activeClass: string;
};

export function StatusChip({
  value,
  current,
  labelKey,
  onPress,
  activeClass,
}: Props) {
  const { t } = useTranslation();
  const isActive = value === current;

  return (
    <TouchableOpacity
      onPress={onPress}
      className={`rounded-full border px-3 py-1.5 text-xs font-bold transition-all ${
        isActive
          ? activeClass
          : "border-slate-200 bg-white text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400"
      }`}
    >
      <Text
        className={`text-xs font-bold ${
          isActive ? "text-white" : "text-slate-600 dark:text-slate-400"
        }`}
      >
        {t(labelKey)}
      </Text>
    </TouchableOpacity>
  );
}
