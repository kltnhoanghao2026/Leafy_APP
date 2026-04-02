import { useEffect, useMemo, useState } from "react";
import { ScrollView, View, Text, Alert, TouchableOpacity } from "react-native";
import { useTranslation } from "react-i18next";
import { useAuthContext } from "@/src/features/auth/context/AuthContext";
import {
  useFarmPlotsByOwner,
  useFarmZonesByPlot,
  useUpdatePlotMutation,
  useCreateZoneMutation,
  useUpdateZoneMutation,
  useDeleteZoneMutation,
} from "@/src/features/farm/queries";
import { FarmInfoSection } from "./FarmInfoSection";
import { ZoneManagerSection } from "./ZoneManagerSection";
import { SensorListSection } from "./SensorListSection";
import type { FarmInfo, Zone, Sensor } from "./sensors.types";
import { INITIAL_SENSORS } from "./sensors.types";

const toHaText = (m2?: number | null) => {
  if (!m2 || Number.isNaN(m2)) return "0 ha";
  return `${(m2 / 10000).toFixed(2)} ha`;
};

const parseAreaToM2 = (raw: string, fallback = 0) => {
  const normalized = raw.trim().toLowerCase().replace(",", ".");
  if (!normalized) return fallback;

  const numberValue = Number.parseFloat(normalized);
  if (!Number.isFinite(numberValue)) return fallback;

  if (normalized.includes("m2") || normalized.includes("m²")) {
    return numberValue;
  }

  return numberValue * 10000;
};

const buildZoneCode = (name: string) => {
  const base = name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toUpperCase();

  const suffix = String(Date.now()).slice(-4);
  return `${base || "ZONE"}-${suffix}`;
};

export function SensorsScreen() {
  const { t } = useTranslation();
  const { profileId } = useAuthContext();

  const [sensors, setSensors] = useState<Sensor[]>(INITIAL_SENSORS);
  const [selectedPlotId, setSelectedPlotId] = useState<string | null>(null);

  const plotsQuery = useFarmPlotsByOwner(profileId ?? "");

  const selectedPlot = useMemo(
    () =>
      (plotsQuery.data ?? []).find((plot) => plot.id === selectedPlotId) ??
      null,
    [plotsQuery.data, selectedPlotId],
  );

  useEffect(() => {
    const plots = plotsQuery.data ?? [];
    if (!plots.length) {
      setSelectedPlotId(null);
      return;
    }

    if (!selectedPlotId || !plots.some((plot) => plot.id === selectedPlotId)) {
      setSelectedPlotId(plots[0].id);
    }
  }, [plotsQuery.data, selectedPlotId]);

  const zonesQuery = useFarmZonesByPlot(selectedPlotId ?? "");

  const updatePlot = useUpdatePlotMutation();
  const createZone = useCreateZoneMutation();
  const updateZoneMutation = useUpdateZoneMutation();
  const deleteZoneMutation = useDeleteZoneMutation();

  const farmInfo: FarmInfo | null = selectedPlot
    ? {
        id: selectedPlot.id,
        name: selectedPlot.name,
        location: selectedPlot.addressLine ?? "",
        area: toHaText(selectedPlot.areaM2),
      }
    : null;

  const zones: Zone[] = (zonesQuery.data ?? []).map((zone) => ({
    id: zone.id,
    code: zone.zoneCode,
    name: zone.zoneName,
    variety: zone.cropType || t("sensors.zoneManager.notSpecified"),
    area: toHaText(zone.areaM2),
    status: zone.status,
  }));

  const handleUpdateFarm = async (info: FarmInfo) => {
    if (!selectedPlot) return;

    try {
      await updatePlot.mutateAsync({
        id: selectedPlot.id,
        body: {
          name: info.name.trim(),
          addressLine: info.location.trim(),
          areaM2: parseAreaToM2(info.area, selectedPlot.areaM2 ?? 0),
        },
      });
    } catch {
      Alert.alert(
        t("sensors.alerts.updateFarmFailedTitle"),
        t("sensors.alerts.tryAgainLater"),
      );
    }
  };

  const addZone = async (
    zone: Pick<Zone, "name" | "variety" | "area" | "status">,
  ) => {
    if (!selectedPlotId) return;

    try {
      const created = await createZone.mutateAsync({
        plotId: selectedPlotId,
        body: {
          zoneName: zone.name.trim(),
          zoneCode: buildZoneCode(zone.name),
          cropType: zone.variety.trim() || undefined,
          areaM2: parseAreaToM2(zone.area, 0),
        },
      });

      if (zone.status !== "ACTIVE") {
        const createdZoneId = created.data.data.id;
        await updateZoneMutation.mutateAsync({
          id: createdZoneId,
          body: { status: zone.status },
        });
      }
    } catch {
      Alert.alert(
        t("sensors.alerts.createZoneFailedTitle"),
        t("sensors.alerts.createZoneFailedMessage"),
      );
    }
  };

  const updateZone = async (id: string, patch: Partial<Zone>) => {
    const current = (zonesQuery.data ?? []).find((item) => item.id === id);
    if (!current) return;

    try {
      await updateZoneMutation.mutateAsync({
        id,
        body: {
          zoneName: patch.name?.trim() || current.zoneName,
          zoneCode: current.zoneCode,
          cropType:
            patch.variety !== undefined
              ? patch.variety.trim() || undefined
              : current.cropType,
          areaM2:
            patch.area !== undefined
              ? parseAreaToM2(patch.area, current.areaM2 ?? 0)
              : current.areaM2,
          status: patch.status ?? current.status,
        },
      });
    } catch {
      Alert.alert(
        t("sensors.alerts.updateZoneFailedTitle"),
        t("sensors.alerts.tryAgainLater"),
      );
    }
  };

  const deleteZone = async (id: string) => {
    try {
      await deleteZoneMutation.mutateAsync(id);
    } catch {
      Alert.alert(
        t("sensors.alerts.deleteZoneFailedTitle"),
        t("sensors.alerts.tryAgainLater"),
      );
    }
  };

  // ── Sensor CRUD ──────────────────────────────────────
  const addSensor = (s: Sensor) => setSensors((prev) => [...prev, s]);
  const updateSensor = (id: string, patch: Partial<Sensor>) =>
    setSensors((prev) =>
      prev.map((s) => (s.id === id ? { ...s, ...patch } : s)),
    );
  const deleteSensor = (id: string) =>
    setSensors((prev) => prev.filter((s) => s.id !== id));

  return (
    <ScrollView
      className="flex-1 bg-white dark:bg-slate-950"
      contentContainerStyle={{
        paddingHorizontal: 16,
        paddingTop: 20,
        paddingBottom: 40,
        gap: 24,
      }}
      showsVerticalScrollIndicator={false}
    >
      {/* Page title */}
      <View className="mb-1">
        <Text className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          {t("sensors.screen.title")}
        </Text>
        <Text className="text-[13px] mt-1 leading-5 text-slate-500 dark:text-slate-400">
          {t("sensors.screen.subtitle")}
        </Text>
      </View>

      {/* Farm Info */}
      <FarmInfoSection
        farmInfo={farmInfo}
        plotOptions={(plotsQuery.data ?? []).map((plot) => ({
          id: plot.id,
          name: plot.name,
        }))}
        selectedPlotId={selectedPlotId}
        onSelectPlot={setSelectedPlotId}
        onUpdate={handleUpdateFarm}
        isLoading={plotsQuery.isLoading}
        isSaving={updatePlot.isPending}
      />

      {/* Zone Manager */}
      <ZoneManagerSection
        hasActivePlot={!!selectedPlotId}
        isLoading={zonesQuery.isLoading}
        isMutating={
          createZone.isPending ||
          updateZoneMutation.isPending ||
          deleteZoneMutation.isPending
        }
        zones={zones}
        onAdd={addZone}
        onUpdate={updateZone}
        onDelete={deleteZone}
      />

      {plotsQuery.isError ? (
        <TouchableOpacity
          onPress={() => {
            void plotsQuery.refetch();
          }}
          className="bg-red-50 dark:bg-red-900/20 rounded-xl px-3 py-2.5 -mt-2"
        >
          <Text className="text-red-700 dark:text-red-400 text-[13px] font-semibold">
            {t("sensors.screen.loadFarmFailed")}
          </Text>
        </TouchableOpacity>
      ) : null}

      {/* Sensor List */}
      <SensorListSection
        sensors={sensors}
        zones={zones}
        onAdd={addSensor}
        onUpdate={updateSensor}
        onDelete={deleteSensor}
      />
    </ScrollView>
  );
}
