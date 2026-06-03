import { Text, TouchableOpacity, View } from "react-native";
import { AlertTriangle } from "lucide-react-native";
import { useTranslation } from "react-i18next";

interface ConfirmDeleteDialogProps {
  visible: boolean;
  title: string;
  description: string;
  isDeleting: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export function ConfirmDeleteDialog({
  visible,
  title,
  description,
  isDeleting,
  onCancel,
  onConfirm,
}: ConfirmDeleteDialogProps) {
  const { t } = useTranslation();

  if (!visible) return null;

  return (
    <View className="absolute inset-0 z-50 items-center justify-center bg-black/50 p-6">
      <View className="w-full max-w-sm rounded-3xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-700 dark:bg-slate-900">
        <View className="mb-4 flex-row items-center gap-3">
          <View className="flex h-10 w-10 items-center justify-center rounded-full bg-red-50">
            <AlertTriangle size={20} color="#dc2626" strokeWidth={2.5} />
          </View>
          <Text className="text-lg font-black text-slate-900 dark:text-white">
            {title}
          </Text>
        </View>

        <Text className="text-sm font-semibold text-slate-500">{description}</Text>

        <View className="mt-5 flex-row justify-end gap-3">
          <TouchableOpacity
            onPress={onCancel}
            disabled={isDeleting}
            className="rounded-xl border border-slate-200 px-4 py-2.5 dark:border-slate-700"
          >
            <Text className="text-sm font-bold text-slate-700 dark:text-slate-300">
              {t("common.cancel")}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={onConfirm}
            disabled={isDeleting}
            className="rounded-xl bg-red-600 px-4 py-2.5 disabled:opacity-50"
          >
            <Text className="text-sm font-bold text-white">
              {isDeleting ? t("common.delete") + "..." : t("common.delete")}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}
