import React, { useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Modal,
  Pressable,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
  ActivityIndicator,
} from "react-native";
import { Trophy, XCircle } from "lucide-react-native";
import { useTranslation } from "react-i18next";

import { useCompleteApplyMutation } from "../../plan/queries/plan.queries";
import { useColorScheme } from "@/src/hooks/useColorScheme";
import Colors from "@/src/constants/Colors";

interface SuccessPromptModalProps {
  visible: boolean;
  applyId: string;
  planName?: string;
  onClose: () => void;
  onComplete: () => void;
}

export function SuccessPromptModal({
  visible,
  applyId,
  planName,
  onClose,
  onComplete,
}: SuccessPromptModalProps) {
  const { t } = useTranslation();
  const { height: viewportHeight } = useWindowDimensions();
  const scheme = useColorScheme() ?? "light";
  const palette = Colors[scheme];
  const completeMutation = useCompleteApplyMutation();

  const [result, setResult] = useState<"success" | "failure" | null>(null);

  const handleChoice = async (success: boolean) => {
    if (result !== null) return;
    setResult(success ? "success" : "failure");

    try {
      await completeMutation.mutateAsync({ applyId, success });
      onComplete();
    } catch {
      setResult(null);
    }
  };

  const isLoading = result !== null && completeMutation.isPending;

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View
        style={{
          flex: 1,
          backgroundColor: "rgba(0,0,0,0.5)",
          justifyContent: "center",
          alignItems: "center",
          padding: 24,
        }}
      >
        <View
          className="w-full max-w-sm rounded-3xl bg-white px-6 py-8 dark:bg-slate-900"
          style={{ maxHeight: viewportHeight * 0.7 }}
        >
          {/* Icon */}
          <View className="mb-5 items-center">
            <View className="mb-4 rounded-full bg-emerald-100 p-4 dark:bg-emerald-900/30">
              <Trophy size={40} color="#10B981" />
            </View>
            <Text className="text-lg font-bold text-slate-800 dark:text-slate-100 text-center">
              {t("plan.successPrompt.title")}
            </Text>
          </View>

          {/* Message */}
          <Text className="mb-8 text-center text-sm leading-relaxed text-slate-500 dark:text-slate-400 px-2">
            {planName
              ? t("plan.successPrompt.message", { planName })
              : t("plan.successPrompt.messageDefault")}
          </Text>

          {/* Buttons */}
          <View className="flex-row gap-3">
            {/* Failure button */}
            <TouchableOpacity
              className="flex-1 flex-row items-center justify-center gap-2 rounded-2xl border-2 border-red-200 bg-red-50 py-4 dark:border-red-800 dark:bg-red-900/20"
              onPress={() => handleChoice(false)}
              disabled={isLoading}
              activeOpacity={0.7}
            >
              {result === "failure" && isLoading ? (
                <ActivityIndicator size="small" color="#EF4444" />
              ) : (
                <XCircle size={22} color="#EF4444" />
              )}
              <Text className="text-sm font-bold text-red-600 dark:text-red-400">
                {t("plan.successPrompt.failure")}
              </Text>
            </TouchableOpacity>

            {/* Success button */}
            <TouchableOpacity
              className="flex-1 flex-row items-center justify-center gap-2 rounded-2xl border-2 border-emerald-200 bg-emerald-50 py-4 dark:border-emerald-800 dark:bg-emerald-900/20"
              onPress={() => handleChoice(true)}
              disabled={isLoading}
              activeOpacity={0.7}
            >
              {result === "success" && isLoading ? (
                <ActivityIndicator size="small" color="#10B981" />
              ) : (
                <CheckCircle2 size={22} color="#10B981" />
              )}
              <Text className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                {t("plan.successPrompt.success")}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Cancel link */}
          <TouchableOpacity
            className="mt-4 items-center py-2"
            onPress={onClose}
            disabled={isLoading}
            activeOpacity={0.7}
          >
            <Text className="text-xs font-medium text-slate-400 dark:text-slate-500">
              {t("common.cancel")}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}
