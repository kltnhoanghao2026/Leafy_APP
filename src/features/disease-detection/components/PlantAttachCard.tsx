import React, { useMemo } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { ChevronDown, X, Leaf, Check, MapPin, Layers, Sprout } from "lucide-react-native";
import { useTranslation } from "react-i18next";

import Colors from "@/src/constants/Colors";
import { useColorScheme } from "@/src/hooks/useColorScheme";
import { useAuthContext } from "@/src/features/auth";
import { useFarmPlotsByOwner, useFarmZonesByPlot, FarmPlotResponse, FarmZoneResponse } from "@/src/features/farm";
import { usePlants } from "@/src/features/plant";
import type { PlantResponse } from "@/src/features/plant";
import { useOfflineFarms, useOfflineFarmZones, useOfflinePlants } from "@/src/features/offline/hooks/useOfflineQueries";

export interface DiagnosisPlantContext {
  farmPlotId?: string;
  farmPlotName?: string;
  farmZoneId?: string;
  farmZoneName?: string;
  plantId?: string;
  plantName?: string;
}

type Option = { value: string; label: string; sublabel?: string };

function PickerField({
  label,
  value,
  options,
  placeholder,
  disabled,
  isLoading,
  onChange,
  IconComponent,
}: {
  label: string;
  value?: string;
  options: Option[];
  placeholder: string;
  disabled?: boolean;
  isLoading?: boolean;
  onChange: (next: string) => void;
  IconComponent?: React.ComponentType<{ size: number; color: string }>;
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
          borderWidth: 1,
          borderColor: value && value !== ""
            ? `${palette.primary}40`
            : scheme === "dark" ? "rgba(71,85,105,0.5)" : "rgba(226,232,240,1)",
          backgroundColor: value && value !== ""
            ? scheme === "dark" ? "rgba(47,127,52,0.08)" : "rgba(47,127,52,0.03)"
            : scheme === "dark" ? "rgba(30,41,59,0.7)" : "#FFFFFF",
          borderRadius: 14,
          paddingHorizontal: 14,
          paddingVertical: 12,
          opacity: disabled ? 0.55 : pressed ? 0.9 : 1,
        })}
      >
        {IconComponent && (
          <View style={{ marginRight: 8 }}>
            <IconComponent size={18} color={value && value !== "" ? palette.primary : palette.tabIconDefault} />
          </View>
        )}

        <Text
          numberOfLines={1}
          style={{
            flex: 1,
            fontSize: 14,
            fontWeight: "600",
            color: display && value !== "" ? palette.text : palette.tabIconDefault,
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
        animationType="slide"
        onRequestClose={() => setOpen(false)}
        statusBarTranslucent
      >
        <Pressable
          onPress={() => setOpen(false)}
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.5)",
            justifyContent: "flex-end",
          }}
        >
          <Pressable
            onPress={(e) => e.stopPropagation()}
            style={{
              backgroundColor:
                scheme === "dark" ? "rgba(15,23,42,1)" : "#FFFFFF",
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              borderWidth: 1,
              borderColor:
                scheme === "dark" ? "rgba(71,85,105,0.45)" : "rgba(226,232,240,1)",
              overflow: "hidden",
              maxHeight: "80%",
              paddingBottom: 24,
            }}
          >
            {/* Sheet Handle */}
            <View style={{ alignItems: "center", paddingTop: 10, paddingBottom: 4 }}>
              <View
                style={{
                  width: 38,
                  height: 4,
                  borderRadius: 2,
                  backgroundColor: scheme === "dark" ? "rgba(71,85,105,0.5)" : "rgba(15,23,42,0.12)",
                }}
              />
            </View>

            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                paddingHorizontal: 20,
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
                      ? "rgba(71, 85, 105, 0.35)"
                      : "rgba(15, 23, 42, 0.06)",
                }}
              >
                <X size={18} color={palette.tabIconDefault} />
              </Pressable>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 12 }}
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
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                    backgroundColor: pressed
                      ? scheme === "dark"
                        ? "rgba(47,127,52,0.22)"
                        : "rgba(47,127,52,0.10)"
                      : opt.value === (value ?? "")
                      ? scheme === "dark"
                        ? "rgba(47,127,52,0.15)"
                        : "rgba(47,127,52,0.06)"
                      : "transparent",
                    borderWidth: 1,
                    borderColor: opt.value === (value ?? "")
                      ? `${palette.primary}40`
                      : "transparent",
                    marginBottom: 6,
                  })}
                >
                  <View style={{ flexDirection: "row", alignItems: "center", flex: 1, gap: 10 }}>
                    {IconComponent && opt.value !== "" && (
                      <View
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: 8,
                          backgroundColor: opt.value === (value ?? "")
                            ? `${palette.primary}18`
                            : scheme === "dark" ? "rgba(71,85,105,0.2)" : "rgba(15,23,42,0.04)",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <IconComponent
                          size={16}
                          color={opt.value === (value ?? "") ? palette.primary : palette.tabIconDefault}
                        />
                      </View>
                    )}
                    <View style={{ flex: 1, gap: 2 }}>
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
                      {opt.sublabel ? (
                        <Text
                          style={{
                            fontSize: 11,
                            fontWeight: "500",
                            color: palette.tabIconDefault,
                          }}
                        >
                          {opt.sublabel}
                        </Text>
                      ) : null}
                    </View>
                  </View>
                  {opt.value === (value ?? "") && (
                    <Check size={16} color={palette.primary} />
                  )}
                </Pressable>
              ))}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const getPlantName = (plant: PlantResponse) =>
  plant.nickName || plant.plantNumber || plant.tagCode || plant.id;

export default function PlantAttachCard({
  value,
  onChange,
  cardBg,
  borderColor,
  offlineMode = false,
}: {
  value: DiagnosisPlantContext;
  onChange: (next: DiagnosisPlantContext) => void;
  cardBg: string;
  borderColor: string;
  offlineMode?: boolean;
}) {
  const { t } = useTranslation();
  const scheme = useColorScheme() ?? "light";
  const palette = Colors[scheme];

  const { profileId } = useAuthContext();

  const onlinePlotsQuery = useFarmPlotsByOwner(profileId ?? "");
  const offlinePlotsQuery = useOfflineFarms(profileId ?? "");
  const plotsQuery = offlineMode ? offlinePlotsQuery : onlinePlotsQuery;

  const onlineZonesQuery = useFarmZonesByPlot(value.farmPlotId ?? "");
  const offlineZonesQuery = useOfflineFarmZones(value.farmPlotId ?? "");
  const zonesQuery = offlineMode ? offlineZonesQuery : onlineZonesQuery;

  const onlinePlantsQuery = usePlants(
    { page: 0, size: 100, sortBy: "createdAt", sortDir: "DESC" },
    true,
  );
  const offlinePlantsQuery = useOfflinePlants({
    farmPlotId: value.farmPlotId,
    page: 0,
    size: 100,
  });
  const plantsQuery = offlineMode ? offlinePlantsQuery : onlinePlantsQuery;

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
      ...plots.map((p: FarmPlotResponse) => ({
        value: p.id,
        label: p.name,
        sublabel: p.code ? `Mã: ${p.code}` : undefined,
      })),
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
      ...zones.map((z: FarmZoneResponse) => ({
        value: z.id,
        label: z.zoneName,
        sublabel: z.zoneCode ? `Mã: ${z.zoneCode}${z.cropType ? ` · Cây: ${z.cropType}` : ""}` : undefined,
      })),
    ],
    [zones, t, value.farmPlotId],
  );

  const plantOptions: Option[] = useMemo(
    () => [
      { value: "", label: t("common.none", { defaultValue: "Không chọn" }) },
      ...filteredPlants.map((p: PlantResponse) => ({
        value: p.id,
        label: getPlantName(p),
        sublabel: p.plantNumber ? `Mã số: ${p.plantNumber}` : undefined,
      })),
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
          IconComponent={MapPin}
          onChange={(id) => {
            const plot = plots.find((p: FarmPlotResponse) => p.id === id);
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
          IconComponent={Layers}
          onChange={(id) => {
            const zone = zones.find((z: FarmZoneResponse) => z.id === id);
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
          IconComponent={Sprout}
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
