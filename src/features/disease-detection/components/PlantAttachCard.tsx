import React, { useMemo } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { ChevronDown, X, Leaf } from "lucide-react-native";
import { useTranslation } from "react-i18next";

import Colors from "@/src/constants/Colors";
import { useColorScheme } from "@/src/hooks/useColorScheme";
import { useAuthContext } from "@/src/features/auth";
import { useFarmPlotsByOwner, useFarmZonesByPlot } from "@/src/features/farm";
import { usePlants } from "@/src/features/plant";
import type { PlantResponse } from "@/src/features/plant";

export interface DiagnosisPlantContext {
  farmPlotId?: string;
  farmPlotName?: string;
  farmZoneId?: string;
  farmZoneName?: string;
  plantId?: string;
  plantName?: string;
}

const getPlantName = (plant: PlantResponse) =>
  plant.nickName || plant.plantNumber || plant.tagCode || plant.id;

type Option = { value: string; label: string };

function PickerField({
  label,
  value,
  options,
  placeholder,
  disabled,
  isLoading,
  onChange,
}: {
  label: string;
  value?: string;
  options: Option[];
  placeholder: string;
  disabled?: boolean;
  isLoading?: boolean;
  onChange: (next: string) => void;
}) {
  const scheme = useColorScheme() ?? "light";
  const palette = Colors[scheme];

  const display = options.find((o) => o.value === (value ?? ""))?.label;

  const [open, setOpen] = React.useState(false);

  return (
    <View style={{ flex: 1 }}>
      <Text
        style={{
          fontSize: 12,
          fontWeight: "800",
          letterSpacing: 1.2,
          textTransform: "uppercase",
          color: palette.tabIconDefault,
          marginBottom: 6,
        }}
      >
        {label}
      </Text>

      <Pressable
        onPress={() => setOpen(true)}
        disabled={disabled}
        style={({ pressed }) => ({
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          borderWidth: 1,
          borderColor:
            scheme === "dark" ? "rgba(71,85,105,0.5)" : "rgba(226,232,240,1)",
          backgroundColor:
            scheme === "dark" ? "rgba(30,41,59,0.7)" : "#FFFFFF",
          borderRadius: 14,
          paddingHorizontal: 14,
          paddingVertical: 12,
          opacity: disabled ? 0.55 : pressed ? 0.9 : 1,
        })}
      >
        <Text
          numberOfLines={1}
          style={{
            flex: 1,
            fontSize: 14,
            fontWeight: "600",
            color: display ? palette.text : palette.tabIconDefault,
            marginRight: 10,
          }}
        >
          {display ?? placeholder}
        </Text>

        {isLoading ? (
          <ActivityIndicator size="small" color={palette.primary} />
        ) : (
          <ChevronDown size={18} color={palette.tabIconDefault} />
        )}
      </Pressable>

      <Modal
        visible={open}
        transparent
        animationType="fade"
        onRequestClose={() => setOpen(false)}
        statusBarTranslucent
      >
        <Pressable
          onPress={() => setOpen(false)}
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.45)",
            padding: 16,
            justifyContent: "center",
          }}
        >
          <Pressable
            onPress={(e) => e.stopPropagation()}
            style={{
              backgroundColor:
                scheme === "dark" ? "rgba(15,23,42,1)" : "#FFFFFF",
              borderRadius: 18,
              borderWidth: 1,
              borderColor:
                scheme === "dark" ? "rgba(71,85,105,0.45)" : "rgba(226,232,240,1)",
              overflow: "hidden",
              maxHeight: "70%",
            }}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                paddingHorizontal: 16,
                paddingVertical: 14,
                borderBottomWidth: 1,
                borderBottomColor:
                  scheme === "dark"
                    ? "rgba(71,85,105,0.45)"
                    : "rgba(226,232,240,1)",
              }}
            >
              <Text style={{ fontSize: 16, fontWeight: "800", color: palette.text }}>
                {label}
              </Text>
              <Pressable
                onPress={() => setOpen(false)}
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 10,
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor:
                    scheme === "dark"
                      ? "rgba(71,85,105,0.35)"
                      : "rgba(15,23,42,0.06)",
                }}
              >
                <X size={18} color={palette.tabIconDefault} />
              </Pressable>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ padding: 8 }}
            >
              {options.map((opt) => (
                <Pressable
                  key={opt.value}
                  onPress={() => {
                    onChange(opt.value);
                    setOpen(false);
                  }}
                  style={({ pressed }) => ({
                    paddingHorizontal: 14,
                    paddingVertical: 12,
                    borderRadius: 14,
                    backgroundColor: pressed
                      ? scheme === "dark"
                        ? "rgba(47,127,52,0.22)"
                        : "rgba(47,127,52,0.10)"
                      : "transparent",
                  })}
                >
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: "600",
                      color:
                        opt.value === (value ?? "")
                          ? palette.primary
                          : palette.text,
                    }}
                  >
                    {opt.label}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

export default function PlantAttachCard({
  value,
  onChange,
  cardBg,
  borderColor,
}: {
  value: DiagnosisPlantContext;
  onChange: (next: DiagnosisPlantContext) => void;
  cardBg: string;
  borderColor: string;
}) {
  const { t } = useTranslation();
  const scheme = useColorScheme() ?? "light";
  const palette = Colors[scheme];

  const { profileId } = useAuthContext();

  const plotsQuery = useFarmPlotsByOwner(profileId ?? "");
  const zonesQuery = useFarmZonesByPlot(value.farmPlotId ?? "");
  const plantsQuery = usePlants(
    { page: 0, size: 100, sortBy: "createdAt", sortDir: "DESC" },
    true,
  );

  const plots = useMemo(() => plotsQuery.data ?? [], [plotsQuery.data]);
  const zones = useMemo(() => zonesQuery.data ?? [], [zonesQuery.data]);
  const plantsPage = plantsQuery.data;
  const plants = useMemo(() => plantsPage?.content ?? [], [plantsPage?.content]);

  const filteredPlants = useMemo(() => {
    if (!value.farmPlotId) return plants;
    return plants.filter((p: PlantResponse) => p.farmPlotId === value.farmPlotId);
  }, [plants, value.farmPlotId]);

  const plotOptions: Option[] = useMemo(
    () => [
      { value: "", label: t("common.none", { defaultValue: "Không chọn" }) },
      ...plots.map((p: { id: string; name: string }) => ({ value: p.id, label: p.name })),
    ],
    [plots, t],
  );

  const zoneOptions: Option[] = useMemo(
    () => [
      {
        value: "",
        label: value.farmPlotId
          ? t("common.none", { defaultValue: "Không chọn" })
          : t("diseaseDetection.choosePlotFirst", { defaultValue: "Chọn vườn trước" }),
      },
      ...zones.map((z: { id: string; zoneName: string }) => ({ value: z.id, label: z.zoneName })),
    ],
    [zones, t, value.farmPlotId],
  );

  const plantOptions: Option[] = useMemo(
    () => [
      { value: "", label: t("common.none", { defaultValue: "Không chọn" }) },
      ...filteredPlants.map((p: PlantResponse) => ({ value: p.id, label: getPlantName(p) })),
    ],
    [filteredPlants, t],
  );

  return (
    <View
      style={{
        backgroundColor: cardBg,
        borderColor,
        borderWidth: 1,
        borderRadius: 18,
        padding: 14,
        marginTop: 12,
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
        <View
          style={{
            width: 36,
            height: 36,
            borderRadius: 12,
            backgroundColor: `${palette.primary}18`,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Leaf size={18} color={palette.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 14, fontWeight: "800", color: palette.text }}>
            {t("diseaseDetection.attachPlantTitle", { defaultValue: "Gắn với cây" })}
          </Text>
          <Text
            style={{
              marginTop: 2,
              fontSize: 12,
              fontWeight: "600",
              color: palette.tabIconDefault,
            }}
          >
            {t("diseaseDetection.attachPlantDesc", {
              defaultValue:
                "Không bắt buộc. Giúp lưu lịch sử chẩn đoán theo cây/vườn/khu vực.",
            })}
          </Text>
        </View>
      </View>

      <View style={{ flexDirection: "row", gap: 10, marginTop: 12 }}>
        <PickerField
          label={t("diseaseDetection.farmPlot", { defaultValue: "Vườn" })}
          value={value.farmPlotId}
          options={plotOptions}
          placeholder={t("common.none", { defaultValue: "Không chọn" })}
          isLoading={plotsQuery.isLoading}
          onChange={(id) => {
            const plot = plots.find((p: { id: string; name: string }) => p.id === id);
            onChange({
              farmPlotId: plot?.id || undefined,
              farmPlotName: plot?.name,
              farmZoneId: undefined,
              farmZoneName: undefined,
              plantId: undefined,
              plantName: undefined,
            });
          }}
        />

        <PickerField
          label={t("diseaseDetection.farmZone", { defaultValue: "Khu" })}
          value={value.farmZoneId}
          options={zoneOptions}
          placeholder={
            value.farmPlotId
              ? t("common.none", { defaultValue: "Không chọn" })
              : t("diseaseDetection.choosePlotFirst", {
                  defaultValue: "Chọn vườn trước",
                })
          }
          disabled={!value.farmPlotId}
          isLoading={zonesQuery.isLoading}
          onChange={(id) => {
            const zone = zones.find((z: { id: string; zoneName: string }) => z.id === id);
            onChange({
              ...value,
              farmZoneId: zone?.id || undefined,
              farmZoneName: zone?.zoneName,
              plantId: undefined,
              plantName: undefined,
            });
          }}
        />
      </View>

      <View style={{ marginTop: 12 }}>
        <PickerField
          label={t("diseaseDetection.plant", { defaultValue: "Cây" })}
          value={value.plantId}
          options={plantOptions}
          placeholder={t("common.none", { defaultValue: "Không chọn" })}
          isLoading={plantsQuery.isLoading}
          onChange={(id) => {
            const plant = filteredPlants.find((p: PlantResponse) => p.id === id);
            onChange({
              ...value,
              plantId: plant?.id || undefined,
              plantName: plant ? getPlantName(plant) : undefined,
              farmPlotId: plant?.farmPlotId ?? value.farmPlotId,
            });
          }}
        />
      </View>

      {plotsQuery.isError || zonesQuery.isError || plantsQuery.isError ? (
        <Text
          style={{
            marginTop: 10,
            padding: 10,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: "rgba(245,158,11,0.35)",
            backgroundColor:
              scheme === "dark" ? "rgba(245,158,11,0.12)" : "rgba(245,158,11,0.10)",
            color: scheme === "dark" ? "#FBBF24" : "#B45309",
            fontSize: 12,
            fontWeight: "700",
          }}
        >
          {t("diseaseDetection.attachPlantLoadWarn", {
            defaultValue:
              "Không tải được một phần dữ liệu cây/vườn/khu vực. Bạn vẫn có thể chẩn đoán bình thường.",
          })}
        </Text>
      ) : null}
    </View>
  );
}
