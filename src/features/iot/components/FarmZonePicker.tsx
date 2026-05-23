import { useQuery } from "@tanstack/react-query";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useTranslation } from "react-i18next";

import { getMyProfileQueryOptions } from "@/src/features/user-profile/queries/options";
import { useFarmPlots, useFarmZones } from "@/src/features/farm";
import type { FarmPlotResponse, FarmZoneResponse } from "@/src/features/farm";

export type FarmZoneSelection = {
  farmPlotId?: string;
  farmPlotName?: string;
  zoneId?: string;
  zoneName?: string;
};

type FarmZonePickerProps = {
  value: FarmZoneSelection;
  onChange: (value: FarmZoneSelection) => void;
  title?: string;
};

export function FarmZonePicker({ value, onChange, title }: FarmZonePickerProps) {
  const { t } = useTranslation();
  const profileQuery = useQuery(getMyProfileQueryOptions());
  const plotsQuery = useFarmPlots(profileQuery.data?.id);
  const zonesQuery = useFarmZones(value.farmPlotId);

  const selectPlot = (plot: FarmPlotResponse) => {
    onChange({
      farmPlotId: plot.id,
      farmPlotName: plot.name,
      zoneId: undefined,
      zoneName: undefined,
    });
  };

  const selectZone = (zone: FarmZoneResponse) => {
    onChange({
      ...value,
      zoneId: zone.id,
      zoneName: zone.zoneName,
    });
  };

  return (
    <View style={styles.card}>
      <Text style={styles.title}>{title ?? t("iot.devices.onboarding.locationTitle")}</Text>

      <View style={styles.section}>
        <Text style={styles.label}>{t("iot.devices.onboarding.selectFarm")}</Text>
        {profileQuery.isLoading || plotsQuery.isLoading ? (
          <Text style={styles.hint}>{t("iot.devices.onboarding.loadingFarms")}</Text>
        ) : null}
        {profileQuery.isError || plotsQuery.isError ? (
          <Text style={styles.error}>{t("iot.devices.onboarding.farmsLoadFailed")}</Text>
        ) : null}
        {!plotsQuery.isLoading && !plotsQuery.data?.length ? (
          <Text style={styles.hint}>{t("iot.devices.onboarding.noFarms")}</Text>
        ) : null}
        <View style={styles.optionWrap}>
          {plotsQuery.data?.map((plot) => (
            <OptionButton
              key={plot.id}
              active={value.farmPlotId === plot.id}
              label={plot.name}
              meta={plot.addressLine || t("iot.common.noFarmMetadata")}
              onPress={() => selectPlot(plot)}
            />
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>{t("iot.devices.onboarding.selectZone")}</Text>
        {!value.farmPlotId ? (
          <Text style={styles.hint}>{t("iot.devices.onboarding.selectFarmFirst")}</Text>
        ) : null}
        {value.farmPlotId && zonesQuery.isLoading ? (
          <Text style={styles.hint}>{t("iot.devices.onboarding.loadingZones")}</Text>
        ) : null}
        {value.farmPlotId && zonesQuery.isError ? (
          <Text style={styles.error}>{t("iot.devices.onboarding.zonesLoadFailed")}</Text>
        ) : null}
        {value.farmPlotId && !zonesQuery.isLoading && !zonesQuery.data?.length ? (
          <Text style={styles.hint}>{t("iot.devices.onboarding.noZones")}</Text>
        ) : null}
        <View style={styles.optionWrap}>
          {zonesQuery.data?.map((zone) => (
            <OptionButton
              key={zone.id}
              active={value.zoneId === zone.id}
              label={zone.zoneName}
              meta={zone.cropType || zone.soilType || t("iot.common.noZoneMetadata")}
              onPress={() => selectZone(zone)}
            />
          ))}
        </View>
      </View>
    </View>
  );
}

function OptionButton({
  label,
  meta,
  active,
  onPress,
}: {
  label: string;
  meta?: string | null;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.option,
        active && styles.optionActive,
        pressed && styles.optionPressed,
      ]}
    >
      <Text style={[styles.optionLabel, active && styles.optionLabelActive]}>
        {label}
      </Text>
      {meta ? (
        <Text style={[styles.optionMeta, active && styles.optionMetaActive]}>
          {meta}
        </Text>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#ffffff",
    borderColor: "#e2e8f0",
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
  },
  error: {
    color: "#be123c",
    fontSize: 13,
    lineHeight: 19,
    marginTop: 6,
  },
  hint: {
    color: "#64748b",
    fontSize: 13,
    lineHeight: 19,
    marginTop: 6,
  },
  label: {
    color: "#334155",
    fontSize: 13,
    fontWeight: "900",
  },
  option: {
    backgroundColor: "#f8fafc",
    borderColor: "#e2e8f0",
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
  },
  optionActive: {
    backgroundColor: "#dcfce7",
    borderColor: "#22c55e",
  },
  optionLabel: {
    color: "#0f172a",
    fontSize: 14,
    fontWeight: "800",
  },
  optionLabelActive: {
    color: "#166534",
  },
  optionMeta: {
    color: "#64748b",
    fontSize: 12,
    marginTop: 4,
  },
  optionMetaActive: {
    color: "#15803d",
  },
  optionPressed: {
    opacity: 0.78,
  },
  optionWrap: {
    gap: 8,
    marginTop: 10,
  },
  section: {
    marginTop: 16,
  },
  title: {
    color: "#0f172a",
    fontSize: 16,
    fontWeight: "900",
  },
});
