import { useState } from "react";
import {
  ClipboardList,
  Droplets,
  Sun,
  CalendarDays,
  Wheat,
  ChevronDown,
  Globe,
  Lock,
} from "lucide-react-native";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { useTranslation } from "react-i18next";
import { useSpecies } from "@/src/features/plant/queries/queries";
import type { PlantEventCreateRequest } from "@/src/features/plant-event/components/plant-event.types";
import type { PlanFormState, PlanInfoErrors } from "./create-plan.types";

interface PlanInfoSectionProps {
  form: PlanFormState;
  updateForm: (field: keyof PlanFormState, value: string | boolean) => void;
  farmPlotOptions: { value: string; label: string }[];
  errors?: PlanInfoErrors;
}

const SEVERITY_OPTIONS = [
  { value: "", label: "-- Không xác định --" },
  { value: "LOW", label: "Thấp" },
  { value: "MEDIUM", label: "Trung bình" },
  { value: "HIGH", label: "Cao" },
];

function InfoChip({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <View className="flex-row items-center gap-1.5 rounded-md bg-white/80 px-2 py-1 ring-1 ring-slate-100">
      <View className="shrink-0 text-slate-400">{icon}</View>
      <View className="min-w-0">
        <Text className="text-[9px] font-black uppercase tracking-wide text-slate-400 leading-none">
          {label}
        </Text>
        <Text
          className="mt-0.5 text-[10px] font-bold text-slate-700 leading-tight truncate"
          numberOfLines={1}
        >
          {value}
        </Text>
      </View>
    </View>
  );
}

export function PlanInfoSection({
  form,
  updateForm,
  farmPlotOptions,
  errors,
}: PlanInfoSectionProps) {
  const { t } = useTranslation();
  const speciesQuery = useSpecies();
  const speciesData = speciesQuery.data;
  const speciesList = speciesData?.content ?? [];

  const speciesOptions = speciesQuery.isLoading
    ? [{ value: "", label: "Đang tải..." }]
    : [
        { value: "", label: "-- Không chọn giống --" },
        ...speciesList.map((s) => ({
          value: s.id,
          label: [s.commonName, s.cultivarName].filter(Boolean).join(" - "),
        })),
      ];

  const selectedSpecies = speciesList.find((s) => s.id === form.speciesId);

  const [showSpeciesDropdown, setShowSpeciesDropdown] = useState(false);
  const [showSeverityDropdown, setShowSeverityDropdown] = useState(false);

  return (
    <View className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
      <View className="mb-3 flex-row items-center gap-2">
        <ClipboardList
          size={16}
          color="#245A34"
          strokeWidth={2.5}
        />
        <Text className="text-sm font-black text-slate-900">
          Thông tin kế hoạch
        </Text>
      </View>

      <View className="flex flex-col gap-4">
        {/* Disease Name */}
        <View>
          <Text className="mb-1.5 text-xs font-bold text-slate-700">
            Tên bệnh / vấn đề <Text className="text-red-500">*</Text>
          </Text>
          <TextInput
            className={`rounded-xl border bg-white px-3 py-2.5 text-sm ${
              errors?.diseaseName
                ? "border-red-300 bg-red-50"
                : "border-slate-200"
            }`}
            value={form.diseaseName}
            onChangeText={(text) => updateForm("diseaseName", text)}
            placeholder="VD: Bệnh gỉ sắt cà phê..."
            placeholderTextColor="#94a3b8"
          />
          {errors?.diseaseName && (
            <Text className="mt-1 text-xs text-red-500">{errors.diseaseName}</Text>
          )}
        </View>

        {/* Plan Name */}
        <View>
          <Text className="mb-1.5 text-xs font-bold text-slate-700">
            Tên kế hoạch (tuỳ chọn)
          </Text>
          <TextInput
            className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm"
            value={form.planName}
            onChangeText={(text) => updateForm("planName", text)}
            placeholder="VD: Kế hoạch xử lý tháng 5..."
            placeholderTextColor="#94a3b8"
          />
        </View>

        {/* Farm Plot */}
        {farmPlotOptions.length > 1 && (
          <View>
            <Text className="mb-1.5 text-xs font-bold text-slate-700">
              Trang trại (tuỳ chọn)
            </Text>
            <TouchableOpacity
              className="flex-row items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-2.5"
              onPress={() => {}}
            >
              <Text className="text-sm text-slate-700">
                {farmPlotOptions.find((p) => p.value === form.farmPlotId)?.label ||
                  "-- Chọn trang trại --"}
              </Text>
              <ChevronDown size={16} color="#64748b" />
            </TouchableOpacity>
          </View>
        )}

        {/* Species */}
        <View>
          <Text className="mb-1.5 text-xs font-bold text-slate-700">
            Giống/Loài cây (tuỳ chọn)
          </Text>
          <TouchableOpacity
            className="flex-row items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-2.5"
            onPress={() => setShowSpeciesDropdown(!showSpeciesDropdown)}
          >
            <Text
              className={`text-sm ${
                form.speciesId ? "text-slate-700" : "text-slate-400"
              }`}
            >
              {speciesOptions.find((s) => s.value === form.speciesId)?.label ||
                "-- Chọn giống --"}
            </Text>
            <ChevronDown size={16} color="#64748b" />
          </TouchableOpacity>

          {showSpeciesDropdown && (
            <View className="mt-1 max-h-48 rounded-xl border border-slate-200 bg-white">
              <ScrollView style={{ maxHeight: 192 }}>
                {speciesOptions.map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    className="border-b border-slate-100 px-3 py-2.5 last:border-b-0"
                    onPress={() => {
                      const found = speciesList.find((s) => s.id === option.value);
                      updateForm("speciesId", option.value);
                      updateForm("speciesName", found?.commonName ?? "");
                      setShowSpeciesDropdown(false);
                    }}
                  >
                    <Text
                      className={`text-sm ${
                        form.speciesId === option.value
                          ? "font-bold text-[#245A34]"
                          : "text-slate-700"
                      }`}
                    >
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}
        </View>

        {/* Species info summary */}
        {selectedSpecies && (
          <View className="grid grid-cols-2 gap-2 rounded-xl border border-[#245A34]/15 bg-[#245A34]/5 p-3">
            <InfoChip
              icon={<Droplets size={14} color="#64748b" />}
              label="Tưới nước"
              value={
                selectedSpecies.waterFrequencyDays
                  ? `${selectedSpecies.waterFrequencyDays} ngày`
                  : "—"
              }
            />
            <InfoChip
              icon={<Sun size={14} color="#64748b" />}
              label="Ánh sáng"
              value={selectedSpecies.lightRequirements ?? "—"}
            />
            <InfoChip
              icon={<CalendarDays size={14} color="#64748b" />}
              label="Đến thu hoạch"
              value={
                selectedSpecies.daysToMaturity
                  ? `${selectedSpecies.daysToMaturity} ngày`
                  : "—"
              }
            />
            <InfoChip
              icon={<Wheat size={14} color="#64748b" />}
              label="Sản lượng dự kiến"
              value={
                selectedSpecies.expectedYieldKg
                  ? `${selectedSpecies.expectedYieldKg} kg`
                  : "—"
              }
            />
          </View>
        )}

        {/* Severity Level */}
        <View>
          <Text className="mb-1.5 text-xs font-bold text-slate-700">
            Mức độ nghiêm trọng
          </Text>
          <TouchableOpacity
            className="flex-row items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-2.5"
            onPress={() => setShowSeverityDropdown(!showSeverityDropdown)}
          >
            <Text
              className={`text-sm ${
                form.severityLevel ? "text-slate-700" : "text-slate-400"
              }`}
            >
              {SEVERITY_OPTIONS.find((s) => s.value === form.severityLevel)
                ?.label || "-- Chọn mức độ --"}
            </Text>
            <ChevronDown size={16} color="#64748b" />
          </TouchableOpacity>

          {showSeverityDropdown && (
            <View className="mt-1 rounded-xl border border-slate-200 bg-white">
              {SEVERITY_OPTIONS.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  className="border-b border-slate-100 px-3 py-2.5 last:border-b-0"
                  onPress={() => {
                    updateForm("severityLevel", option.value);
                    setShowSeverityDropdown(false);
                  }}
                >
                  <Text
                    className={`text-sm ${
                      form.severityLevel === option.value
                        ? "font-bold text-[#245A34]"
                        : "text-slate-700"
                    }`}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Success Indicators */}
        <View>
          <Text className="mb-1.5 text-xs font-bold text-slate-700">
            Chỉ số thành công (tuỳ chọn)
          </Text>
          <TextInput
            className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm"
            value={form.successIndicators}
            onChangeText={(text) => updateForm("successIndicators", text)}
            placeholder="VD: Cây hồi phục sau 2 tuần, không còn dấu hiệu bệnh..."
            placeholderTextColor="#94a3b8"
            multiline
          />
        </View>

        {/* Estimated Cost */}
        <View>
          <Text className="mb-1.5 text-xs font-bold text-slate-700">
            Chi phí ước tính tổng (tuỳ chọn)
          </Text>
          <TextInput
            className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm"
            value={form.estimatedCost}
            onChangeText={(text) => updateForm("estimatedCost", text)}
            placeholder="VD: 500.000 VNĐ"
            placeholderTextColor="#94a3b8"
          />
        </View>

        {/* Required Inputs */}
        <View>
          <Text className="mb-1.5 text-xs font-bold text-slate-700">
            Vật tư / công cụ cần thiết (tuỳ chọn)
          </Text>
          <TextInput
            className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm"
            value={form.requiredInputs}
            onChangeText={(text) => updateForm("requiredInputs", text)}
            placeholder="VD: Thuốc trừ sâu, bình xịt, găng tay..."
            placeholderTextColor="#94a3b8"
          />
        </View>

        {/* Safety Warnings */}
        <View>
          <Text className="mb-1.5 text-xs font-bold text-slate-700">
            Cảnh báo an toàn (tuỳ chọn)
          </Text>
          <TextInput
            className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm"
            value={form.safetyWarnings}
            onChangeText={(text) => updateForm("safetyWarnings", text)}
            placeholder="VD: Đeo khẩu trang, mắt kính khi phun thuốc..."
            placeholderTextColor="#94a3b8"
          />
        </View>

        {/* Public toggle */}
        <View className="flex-row items-center gap-3 rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
          <TouchableOpacity
            className="flex-row items-center gap-2"
            onPress={() => updateForm("isPublic", !form.isPublic)}
          >
            <View
              className={`h-5 w-5 items-center justify-center rounded border-2 ${
                form.isPublic
                  ? "border-[#245A34] bg-[#245A34]"
                  : "border-slate-300 bg-white"
              }`}
            >
              {form.isPublic && <Text className="text-white">✓</Text>}
            </View>
            <View className="flex-row items-center gap-1.5">
              {form.isPublic ? (
                <Globe size={14} color="#245A34" />
              ) : (
                <Lock size={14} color="#64748b" />
              )}
              <Text className="text-sm font-semibold text-slate-700">
                Công khai kế hoạch
              </Text>
            </View>
          </TouchableOpacity>
          <Text className="text-xs text-slate-400">(Ai cũng có thể xem)</Text>
        </View>
      </View>
    </View>
  );
}
