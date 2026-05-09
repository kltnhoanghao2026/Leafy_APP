import React from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import {
  FileText,
  AlertTriangle,
  ShieldAlert,
  CheckCircle2,
  ChevronRight,
} from "lucide-react-native";

import { useTreatmentPlanReviewContext } from "../context/TreatmentPlanReviewContext";
import {
  formatConfidence,
  normalizeTreatmentPlan,
} from "../utils/treatmentPlanNormalizer";

interface RagTreatmentPlanCardProps {
  treatmentPlan: unknown;
  plantId?: string;
  savedPlanId?: string;
  sourceQuestion?: string;
}

const renderKeyValue = (
  label: string,
  value?: string,
  customClass: string = "text-gray-800",
) => {
  if (!value) {
    return null;
  }

  return (
    <View className="mr-4 mb-2.5">
      <Text className="text-[10px] uppercase text-gray-500 tracking-wider font-semibold mb-0.5">
        {label}
      </Text>
      <Text className={`text-[13px] font-medium leading-5 ${customClass}`}>
        {value}
      </Text>
    </View>
  );
};

export function RagTreatmentPlanCard({
  treatmentPlan,
  plantId,
  savedPlanId,
  sourceQuestion,
}: RagTreatmentPlanCardProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const { draft, setDraft } = useTreatmentPlanReviewContext();
  const normalizedPlan = normalizeTreatmentPlan(treatmentPlan, plantId);

  if (!normalizedPlan) {
    return null;
  }

  const confidence = formatConfidence(normalizedPlan.confidenceScore);

  return (
    <View className="mt-3 rounded-2xl border border-green-200 bg-green-50 overflow-hidden shadow-sm">
      {/* Header */}
      <View className="flex-row items-center px-4 py-3 bg-green-100/50 border-b border-green-200/50">
        <FileText size={16} color="#065F46" className="mr-2" />
        <Text className="text-[14px] font-bold text-green-900 flex-1 uppercase tracking-wide">
          {t("ragChat.reviewer.cardTitle", "Phác đồ điều trị")}
        </Text>
      </View>

      <View className="p-4">
        {/* Core Attributes */}
        <View className="flex-row flex-wrap mb-1">
          {renderKeyValue(
            t("ragChat.reviewer.summary.disease", "Loại bệnh"),
            normalizedPlan.diseaseName,
            "text-green-800",
          )}
          {renderKeyValue(
            t("ragChat.reviewer.summary.severity", "Mức độ"),
            normalizedPlan.severityLevel,
            normalizedPlan.severityLevel?.toLowerCase().includes("high") ||
              normalizedPlan.severityLevel?.toLowerCase().includes("cao") ||
              normalizedPlan.severityLevel?.toLowerCase().includes("nặng")
              ? "text-red-600"
              : "text-amber-600",
          )}
          {renderKeyValue(
            t("ragChat.reviewer.summary.urgency", "Độ khẩn cấp"),
            normalizedPlan.urgency,
            "text-orange-600",
          )}
          {renderKeyValue(
            t("ragChat.reviewer.summary.confidence", "Độ tin cậy"),
            confidence,
            "text-emerald-700",
          )}
          {renderKeyValue(
            t("ragChat.reviewer.summary.cost", "Chi phí (Ước tính)"),
            normalizedPlan.estimatedCost,
          )}
        </View>

        {/* Requirements */}
        {normalizedPlan.requiredInputs.length > 0 && (
          <View className="mt-2 bg-white/60 p-3 rounded-xl border border-green-100">
            <View className="flex-row items-center mb-2">
              <AlertTriangle size={14} color="#047857" className="mr-1.5" />
              <Text className="text-[12.5px] font-bold text-green-900">
                {t(
                  "ragChat.reviewer.requiredInputsTitle",
                  "Thông tin cần thiết",
                )}
              </Text>
            </View>
            {normalizedPlan.requiredInputs.map((item, index) => (
              <View
                key={`input-${index}`}
                className="flex-row items-start mb-1.5 pr-2"
              >
                <View className="w-1.5 h-1.5 rounded-full bg-green-400 mt-1.5 mr-2" />
                <Text className="text-[12.5px] text-gray-700 leading-5">
                  {item}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Safety Warnings */}
        {normalizedPlan.safetyWarnings.length > 0 && (
          <View className="mt-2 bg-red-50/50 p-3 rounded-xl border border-red-100">
            <View className="flex-row items-center mb-2">
              <ShieldAlert size={14} color="#B91C1C" className="mr-1.5" />
              <Text className="text-[12.5px] font-bold text-red-800">
                {t("ragChat.reviewer.safetyTitle", "Cảnh báo an toàn")}
              </Text>
            </View>
            {normalizedPlan.safetyWarnings.map((warning, index) => (
              <View
                key={`warning-${index}`}
                className="flex-row items-start mb-1.5 pr-2"
              >
                <View className="w-1.5 h-1.5 rounded-full bg-red-400 mt-1.5 mr-2" />
                <Text className="text-[12.5px] text-red-900 leading-5">
                  {warning}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Success Indicators */}
        {!!normalizedPlan.successIndicators && (
          <View className="mt-2 bg-emerald-50/50 p-3 rounded-xl border border-emerald-100">
            <View className="flex-row items-center mb-1.5">
              <CheckCircle2 size={14} color="#059669" className="mr-1.5" />
              <Text className="text-[12.5px] font-bold text-emerald-900">
                {t(
                  "ragChat.reviewer.successIndicatorsTitle",
                  "Dấu hiệu thành công",
                )}
              </Text>
            </View>
            <Text className="text-[12.5px] leading-5 text-gray-700 ml-[22px]">
              {normalizedPlan.successIndicators}
            </Text>
          </View>
        )}

        {/* Primary Action Button */}
        <TouchableOpacity
          className="mt-4 flex-row items-center justify-center rounded-xl bg-emerald-700 px-4 py-3 shadow-sm"
          activeOpacity={0.85}
          onPress={() => {
            setDraft({
              plan: normalizedPlan,
              savedPlanId,
              sourceQuestion: sourceQuestion ?? "",
            });
            router.push("/(main)/treatment-plan-review");
          }}
        >
          <Text className="text-[13px] font-bold text-white tracking-wide mr-1.5">
            {t("ragChat.reviewer.openAction", "Xem chi tiết và Áp dụng")}
          </Text>
          <ChevronRight size={16} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </View>
  );
}
