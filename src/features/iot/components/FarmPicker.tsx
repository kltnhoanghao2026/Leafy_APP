import { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { useTranslation } from "react-i18next";

export type FarmPickerOption = {
  id?: string;
  name?: string | null;
  title?: string | null;
  address?: string | null;
  addressLine?: string | null;
  location?: string | null;
};

type FarmPickerProps = {
  label?: string;
  value?: string | null;
  farms: FarmPickerOption[];
  onChange: (farm: { id?: string; label: string } | null) => void;
  placeholder?: string;
  allowClear?: boolean;
};

const getFarmLabel = (farm: FarmPickerOption, fallback: string) =>
  farm.name ?? farm.title ?? fallback;

const getFarmMeta = (farm: FarmPickerOption, fallback: string) =>
  farm.addressLine ?? farm.address ?? farm.location ?? fallback;

export function FarmPicker({
  label,
  value,
  farms,
  onChange,
  placeholder,
  allowClear = true,
}: FarmPickerProps) {
  const { t } = useTranslation();
  const [query, setQuery] = useState("");
  const fallbackLabel = t("iot.common.unknownFarm");
  const metaFallback = t("iot.common.noFarmMetadata");
  const normalizedQuery = query.trim().toLowerCase();
  const selectedFarm = farms.find((farm) => farm.id === value);
  const filteredFarms = useMemo(() => {
    if (!normalizedQuery) return farms;

    return farms.filter((farm) =>
      [getFarmLabel(farm, fallbackLabel), getFarmMeta(farm, metaFallback)]
        .join(" ")
        .toLowerCase()
        .includes(normalizedQuery),
    );
  }, [fallbackLabel, farms, metaFallback, normalizedQuery]);

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label ?? t("iot.common.selectFarm")}</Text>
      <TextInput
        autoCapitalize="none"
        onChangeText={setQuery}
        placeholder={placeholder ?? t("iot.common.searchFarm")}
        placeholderTextColor="#94a3b8"
        style={styles.input}
        value={query}
      />
      {selectedFarm ? (
        <View style={styles.selectedRow}>
          <View style={styles.selectedTextWrap}>
            <Text style={styles.selectedLabel}>{getFarmLabel(selectedFarm, fallbackLabel)}</Text>
            <Text style={styles.secondaryText}>{getFarmMeta(selectedFarm, metaFallback)}</Text>
          </View>
          {allowClear ? (
            <Pressable style={styles.clearButton} onPress={() => onChange(null)}>
              <Text style={styles.clearText}>{t("iot.common.clearSelection")}</Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}
      <View style={styles.optionList}>
        {filteredFarms.length === 0 ? (
          <Text style={styles.emptyText}>{t("iot.common.noFarmsFound")}</Text>
        ) : (
          filteredFarms.slice(0, 8).map((farm) => {
            const farmLabel = getFarmLabel(farm, fallbackLabel);
            const selected = farm.id === value;

            return (
              <Pressable
                key={farm.id ?? farmLabel}
                onPress={() => onChange({ id: farm.id, label: farmLabel })}
                style={[styles.option, selected && styles.optionSelected]}
              >
                <Text style={[styles.optionLabel, selected && styles.optionLabelSelected]}>
                  {farmLabel}
                </Text>
                <Text style={styles.secondaryText}>{getFarmMeta(farm, metaFallback)}</Text>
              </Pressable>
            );
          })
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  clearButton: {
    backgroundColor: "#f1f5f9",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  clearText: {
    color: "#334155",
    fontSize: 12,
    fontWeight: "900",
  },
  container: {
    gap: 8,
  },
  emptyText: {
    color: "#64748b",
    fontSize: 13,
  },
  input: {
    backgroundColor: "#f8fafc",
    borderColor: "#cbd5e1",
    borderRadius: 14,
    borderWidth: 1,
    color: "#0f172a",
    fontSize: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  label: {
    color: "#334155",
    fontSize: 13,
    fontWeight: "900",
  },
  option: {
    backgroundColor: "#ffffff",
    borderColor: "#e2e8f0",
    borderRadius: 14,
    borderWidth: 1,
    padding: 10,
  },
  optionLabel: {
    color: "#0f172a",
    fontSize: 13,
    fontWeight: "900",
  },
  optionLabelSelected: {
    color: "#166534",
  },
  optionList: {
    gap: 8,
  },
  optionSelected: {
    backgroundColor: "#dcfce7",
    borderColor: "#86efac",
  },
  secondaryText: {
    color: "#64748b",
    fontSize: 12,
    marginTop: 2,
  },
  selectedLabel: {
    color: "#166534",
    fontSize: 13,
    fontWeight: "900",
  },
  selectedRow: {
    alignItems: "center",
    backgroundColor: "#f0fdf4",
    borderColor: "#bbf7d0",
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: "row",
    gap: 10,
    justifyContent: "space-between",
    padding: 10,
  },
  selectedTextWrap: {
    flex: 1,
  },
});
