import { BellRing, Gauge, Pencil, Plus, SlidersHorizontal, Trash2 } from "lucide-react-native";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";

import {
  useAlertRules,
  useCreateAlertRuleMutation,
  useDeleteAlertRuleMutation,
  useUpdateAlertRuleMutation,
} from "../hooks/useAlerts";
import { SensorTypePicker } from "../components/SensorTypePicker";
import type { AlertRuleResponse, AlertRuleRequest, AlertSeverity } from "../types";
import type { DisplayAlertRule } from "../utils/iotDisplay";

const SEVERITY_OPTIONS: AlertSeverity[] = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];

type FormState = {
  name: string;
  sensorType: string;
  thresholdMin: string;
  thresholdMax: string;
  severity: AlertSeverity;
  enabled: boolean;
};

const emptyForm: FormState = {
  name: "",
  sensorType: "AIR_TEMP",
  thresholdMin: "",
  thresholdMax: "",
  severity: "MEDIUM",
  enabled: true,
};

const getRuleId = (rule: AlertRuleResponse) => rule.ruleId ?? rule.id ?? "";

const getThresholdMin = (rule: AlertRuleResponse) =>
  rule.thresholdMin ?? rule.minThreshold ?? null;

const getThresholdMax = (rule: AlertRuleResponse) =>
  rule.thresholdMax ?? rule.maxThreshold ?? null;

const TECHNICAL_IDENTIFIER_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const isTechnicalIdentifier = (value?: string | null) => {
  if (!value) return false;
  const trimmed = value.trim();
  return (
    TECHNICAL_IDENTIFIER_PATTERN.test(trimmed) ||
    (trimmed.length >= 24 && /^[0-9a-f-]+$/i.test(trimmed))
  );
};

const asSensorTypeId = (value?: string | null) => {
  const trimmed = value?.trim();
  return trimmed && UUID_PATTERN.test(trimmed) ? trimmed : undefined;
};

const toFormState = (rule: AlertRuleResponse): FormState => ({
  name: rule.name ?? "",
  sensorType: rule.sensorTypeCode ?? rule.sensorType ?? rule.sensorTypeId ?? "",
  thresholdMin: getThresholdMin(rule)?.toString() ?? "",
  thresholdMax: getThresholdMax(rule)?.toString() ?? "",
  severity: rule.severity,
  enabled: rule.enabled,
});

export function AlertRulesScreen() {
  const { t } = useTranslation();
  const rulesQuery = useAlertRules();
  const createRule = useCreateAlertRuleMutation();
  const updateRule = useUpdateAlertRuleMutation();
  const deleteRule = useDeleteAlertRuleMutation();
  const [search, setSearch] = useState("");
  const [enabledFilter, setEnabledFilter] = useState<"all" | "enabled" | "disabled">("all");
  const [form, setForm] = useState<FormState>(emptyForm);
  const [editingRuleId, setEditingRuleId] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const rules = rulesQuery.data ?? [];
  const filteredRules = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    return rules.filter((rule) => {
      const name = rule.name ?? "";
      const sensor = rule.display?.sensorLabel ?? "";
      const matchesKeyword =
        !keyword ||
        name.toLowerCase().includes(keyword) ||
        sensor.toLowerCase().includes(keyword);
      const matchesEnabled =
        enabledFilter === "all" ||
        (enabledFilter === "enabled" && rule.enabled) ||
        (enabledFilter === "disabled" && !rule.enabled);

      return matchesKeyword && matchesEnabled;
    });
  }, [enabledFilter, rules, search]);

  const resetForm = () => {
    setForm(emptyForm);
    setEditingRuleId(null);
    setFormError(null);
  };

  const validate = () => {
    if (!form.name.trim()) {
      return t("iot.alertRules.validation.nameRequired");
    }

    if (!form.sensorType.trim()) {
      return t("iot.rules.sensorRequired");
    }

    if (!SEVERITY_OPTIONS.includes(form.severity)) {
      return t("iot.alertRules.validation.severityInvalid");
    }

    const min = form.thresholdMin.trim() ? Number(form.thresholdMin) : null;
    const max = form.thresholdMax.trim() ? Number(form.thresholdMax) : null;
    if (
      (min !== null && Number.isNaN(min)) ||
      (max !== null && Number.isNaN(max))
    ) {
      return t("iot.alertRules.validation.thresholdNumber");
    }

    if (min !== null && max !== null && min > max) {
      return t("iot.alertRules.validation.minLessThanMax");
    }

    return null;
  };

  const buildPayload = (): AlertRuleRequest => {
    const min = form.thresholdMin.trim() ? Number(form.thresholdMin) : null;
    const max = form.thresholdMax.trim() ? Number(form.thresholdMax) : null;
    const sensorType = form.sensorType.trim();

    return {
      name: form.name.trim(),
      sensorType,
      sensorTypeId: asSensorTypeId(sensorType),
      thresholdMin: min,
      thresholdMax: max,
      minThreshold: min,
      maxThreshold: max,
      severity: form.severity,
      enabled: form.enabled,
      notifyMobile: true,
      notifyWeb: true,
    };
  };

  const submit = async () => {
    const validationError = validate();
    if (validationError) {
      setFormError(validationError);
      return;
    }

    setFormError(null);
    try {
      if (editingRuleId) {
        await updateRule.mutateAsync({ ruleId: editingRuleId, payload: buildPayload() });
      } else {
        await createRule.mutateAsync(buildPayload());
      }
      resetForm();
      setFormOpen(false);
    } catch {
      Alert.alert(t("iot.alertRules.errorTitle"), t("iot.alertRules.saveFailed"));
    }
  };

  const edit = (rule: AlertRuleResponse) => {
    setEditingRuleId(getRuleId(rule));
    setForm(toFormState(rule));
    setFormError(null);
    setFormOpen(true);
  };

  const toggle = async (rule: AlertRuleResponse) => {
    const ruleId = getRuleId(rule);
    if (!ruleId) return;

    try {
      const sensorType = rule.sensorType ?? rule.sensorTypeCode ?? rule.sensorTypeId ?? "";
      await updateRule.mutateAsync({
        ruleId,
        payload: {
          name: rule.name,
          sensorType,
          sensorTypeId: asSensorTypeId(rule.sensorTypeId ?? rule.sensorType),
          thresholdMin: getThresholdMin(rule),
          thresholdMax: getThresholdMax(rule),
          minThreshold: getThresholdMin(rule),
          maxThreshold: getThresholdMax(rule),
          severity: rule.severity,
          enabled: !rule.enabled,
        },
      });
    } catch {
      Alert.alert(t("iot.alertRules.errorTitle"), t("iot.alertRules.toggleFailed"));
    }
  };

  const confirmDelete = (rule: AlertRuleResponse) => {
    const ruleId = getRuleId(rule);
    if (!ruleId) return;

    Alert.alert(t("iot.alertRules.deleteButton"), t("iot.alertRules.deleteConfirm"), [
      { text: t("common.cancel"), style: "cancel" },
      {
        text: t("iot.alertRules.deleteButton"),
        style: "destructive",
        onPress: async () => {
          try {
            await deleteRule.mutateAsync(ruleId);
          } catch {
            Alert.alert(
              t("iot.alertRules.errorTitle"),
              t("iot.alertRules.deleteFailed"),
            );
          }
        },
      },
    ]);
  };

  return (
    <FlatList
      contentContainerStyle={styles.content}
      data={filteredRules}
      keyExtractor={(item) => getRuleId(item)}
      ListEmptyComponent={
        rulesQuery.isLoading ? null : (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyTitle}>{t("iot.alertRules.emptyTitle")}</Text>
            <Text style={styles.emptyText}>{t("iot.alertRules.emptyDescription")}</Text>
          </View>
        )
      }
      ListHeaderComponent={
        <View style={styles.headerWrap}>
          <View style={styles.hero}>
            <View style={styles.heroIcon}>
              <BellRing color="#166534" size={22} />
            </View>
            <View style={styles.heroText}>
              <Text style={styles.kicker}>{t("iot.alertRules.kicker")}</Text>
              <Text style={styles.title}>{t("iot.alertRules.listTitle")}</Text>
              <Text style={styles.subtitle}>{t("iot.alertRules.description")}</Text>
            </View>
          </View>

          <View style={styles.toolbar}>
            <TextInput
              autoCapitalize="none"
              placeholder={t("iot.alertRules.searchPlaceholder")}
              placeholderTextColor="#94a3b8"
              style={styles.input}
              value={search}
              onChangeText={setSearch}
            />
            <View style={styles.chipRow}>
              {(["all", "enabled", "disabled"] as const).map((filter) => (
                <Pressable
                  key={filter}
                  onPress={() => setEnabledFilter(filter)}
                  style={[styles.chip, enabledFilter === filter && styles.chipSelected]}
                >
                  <Text
                    style={[
                      styles.chipText,
                      enabledFilter === filter && styles.chipTextSelected,
                    ]}
                  >
                    {t(`iot.alertRules.filters.${filter}`)}
                  </Text>
                </Pressable>
              ))}
            </View>
            <Pressable
              style={styles.primaryButton}
              onPress={() => {
                if (formOpen && !editingRuleId) {
                  setFormOpen(false);
                  resetForm();
                } else {
                  resetForm();
                  setFormOpen(true);
                }
              }}
            >
              <Plus color="#ffffff" size={16} />
              <Text style={styles.primaryButtonText}>
                {t("iot.alertRules.createButton")}
              </Text>
            </Pressable>
          </View>

          {formOpen ? (
            <AlertRuleForm
              editing={Boolean(editingRuleId)}
              form={form}
              formError={formError}
              pending={createRule.isPending || updateRule.isPending}
              setForm={setForm}
              onCancel={() => {
                resetForm();
                setFormOpen(false);
              }}
              onSubmit={submit}
            />
          ) : null}

          {rulesQuery.isLoading ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator color="#15803d" />
              <Text style={styles.hint}>{t("iot.alertRules.loading")}</Text>
            </View>
          ) : null}

          {rulesQuery.isError && !rules.length ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{t("iot.alertRules.loadFailed")}</Text>
              <Pressable style={styles.retryButton} onPress={() => rulesQuery.refetch()}>
                <Text style={styles.retryText}>{t("iot.common.retry")}</Text>
              </Pressable>
            </View>
          ) : null}
        </View>
      }
      refreshControl={
        <RefreshControl
          onRefresh={rulesQuery.refetch}
          refreshing={rulesQuery.isRefetching}
          tintColor="#15803d"
        />
      }
      renderItem={({ item }) => (
        <AlertRuleItem
          pending={updateRule.isPending || deleteRule.isPending}
          rule={item}
          onDelete={confirmDelete}
          onEdit={edit}
          onToggle={toggle}
        />
      )}
      style={styles.screen}
    />
  );
}

function AlertRuleForm({
  editing,
  form,
  formError,
  pending,
  setForm,
  onCancel,
  onSubmit,
}: {
  editing: boolean;
  form: FormState;
  formError: string | null;
  pending: boolean;
  setForm: (next: FormState) => void;
  onCancel: () => void;
  onSubmit: () => void;
}) {
  const { t } = useTranslation();

  return (
    <View style={styles.form}>
      <Text style={styles.sectionTitle}>
        {editing ? t("iot.alertRules.editButton") : t("iot.alertRules.createButton")}
      </Text>
      <TextInput
        placeholder={t("iot.alertRules.name")}
        placeholderTextColor="#94a3b8"
        style={styles.input}
        value={form.name}
        onChangeText={(name) => setForm({ ...form, name })}
      />
      <SensorTypePicker
        label={t("iot.rules.selectSensor")}
        value={form.sensorType}
        onChange={(sensorType) => setForm({ ...form, sensorType: sensorType ?? "" })}
      />
      <View style={styles.formGrid}>
        <TextInput
          keyboardType="numeric"
          placeholder={t("iot.alertRules.thresholdMin")}
          placeholderTextColor="#94a3b8"
          style={[styles.input, styles.halfInput]}
          value={form.thresholdMin}
          onChangeText={(thresholdMin) => setForm({ ...form, thresholdMin })}
        />
        <TextInput
          keyboardType="numeric"
          placeholder={t("iot.alertRules.thresholdMax")}
          placeholderTextColor="#94a3b8"
          style={[styles.input, styles.halfInput]}
          value={form.thresholdMax}
          onChangeText={(thresholdMax) => setForm({ ...form, thresholdMax })}
        />
      </View>
      <View style={styles.chipRow}>
        {SEVERITY_OPTIONS.map((severity) => (
          <Pressable
            key={severity}
            onPress={() => setForm({ ...form, severity })}
            style={[styles.chip, form.severity === severity && styles.chipSelected]}
          >
            <Text
              style={[
                styles.chipText,
                form.severity === severity && styles.chipTextSelected,
              ]}
            >
              {t(`iot.alerts.severity.${severity}`)}
            </Text>
          </Pressable>
        ))}
      </View>
      <View style={styles.switchRow}>
        <Text style={styles.switchLabel}>{t("iot.alertRules.enabled")}</Text>
        <Switch
          value={form.enabled}
          onValueChange={(enabled) => setForm({ ...form, enabled })}
        />
      </View>
      {formError ? <Text style={styles.errorText}>{formError}</Text> : null}
      <View style={styles.formActions}>
        <Pressable style={styles.secondaryButton} onPress={onCancel}>
          <Text style={styles.secondaryButtonText}>{t("common.cancel")}</Text>
        </Pressable>
        <Pressable
          disabled={pending}
          style={[styles.primaryButton, pending && styles.disabledButton]}
          onPress={onSubmit}
        >
          {pending ? <ActivityIndicator color="#ffffff" size="small" /> : null}
          <Text style={styles.primaryButtonText}>
            {editing ? t("iot.alertRules.editButton") : t("iot.alertRules.createButton")}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

function AlertRuleItem({
  rule,
  pending,
  onToggle,
  onEdit,
  onDelete,
}: {
  rule: AlertRuleResponse & Partial<DisplayAlertRule>;
  pending: boolean;
  onToggle: (rule: AlertRuleResponse) => void;
  onEdit: (rule: AlertRuleResponse) => void;
  onDelete: (rule: AlertRuleResponse) => void;
}) {
  const { t } = useTranslation();
  const sensor = rule.display?.sensorLabel ?? t("iot.common.unknown");
  const min = getThresholdMin(rule);
  const max = getThresholdMax(rule);
  const userName = rule.name?.trim();
  const title =
    userName && !isTechnicalIdentifier(userName)
      ? userName
      : t("iot.alertRules.ruleTitle", {
          sensor,
          defaultValue: `Cảnh báo ${sensor}`,
        });
  const condition =
    min != null && max != null
      ? t("iot.alertRules.conditionRange", {
          sensor,
          threshold: rule.display?.thresholdLabel ?? `${min} - ${max}`,
          defaultValue: `Cảnh báo khi ${sensor} nằm ngoài khoảng ${rule.display?.thresholdLabel ?? `${min} - ${max}`}`,
        })
      : max != null
        ? t("iot.alertRules.conditionMax", {
            sensor,
            threshold: rule.display?.thresholdLabel ?? String(max),
            defaultValue: `Cảnh báo khi ${sensor} vượt ${rule.display?.thresholdLabel ?? max}`,
          })
        : min != null
          ? t("iot.alertRules.conditionMin", {
              sensor,
              threshold: rule.display?.thresholdLabel ?? String(min),
              defaultValue: `Cảnh báo khi ${sensor} thấp hơn ${rule.display?.thresholdLabel ?? min}`,
            })
          : t("iot.alertRules.conditionAny", {
              sensor,
              defaultValue: `Theo dõi bất thường của ${sensor}`,
            });
  const scope = rule.deviceId
    ? t("iot.alertRules.scopeDevice", "Áp dụng cho thiết bị đã chọn")
    : rule.zoneId
      ? t("iot.alertRules.scopeZone", "Áp dụng cho khu vực đã chọn")
      : rule.farmPlotId
        ? t("iot.alertRules.scopeFarm", "Áp dụng cho vườn đã chọn")
        : t("iot.alertRules.scopeAll", "Áp dụng cho tất cả thiết bị phù hợp");

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.cardTitleWrap}>
          <Text style={styles.ruleName}>{title}</Text>
          <Text style={styles.ruleSensor}>{condition}</Text>
        </View>
        <Switch
          disabled={pending}
          value={rule.enabled}
          onValueChange={() => onToggle(rule)}
        />
      </View>
      <View style={styles.ruleSummary}>
        <View style={styles.ruleSummaryIcon}>
          <Gauge color="#166534" size={16} />
        </View>
        <View style={styles.ruleSummaryText}>
          <Text style={styles.ruleSummaryLabel}>{t("iot.alertRules.thresholdRange", "Ngưỡng cảnh báo")}</Text>
          <Text style={styles.ruleSummaryValue}>
            {rule.display?.thresholdLabel ?? t("iot.common.unknownValue")}
          </Text>
        </View>
      </View>
      <View style={styles.infoGrid}>
        <View style={styles.infoPill}>
          <Text style={styles.infoLabel}>{t("iot.alertRules.severity")}</Text>
          <Text style={styles.infoValue}>
            {rule.display?.severityLabel ?? t("iot.common.unknownStatus")}
          </Text>
        </View>
        <View style={styles.infoPill}>
          <Text style={styles.infoLabel}>{t("iot.alertRules.statusLabel", "Trạng thái")}</Text>
          <Text style={styles.infoValue}>{rule.display?.enabledLabel}</Text>
        </View>
      </View>
      <View style={styles.scopeRow}>
        <SlidersHorizontal color="#64748b" size={14} />
        <Text style={styles.scopeText}>{scope}</Text>
      </View>
      <Text style={styles.metaText}>
        {t("iot.alertRules.lastTriggered")}: {rule.display?.lastTriggeredLabel ?? t("iot.common.noData")}
      </Text>
      <View style={styles.actionRow}>
        <Pressable style={styles.inlineAction} onPress={() => onEdit(rule)}>
          <Pencil color="#166534" size={14} />
          <Text style={styles.inlineActionText}>{t("iot.alertRules.editButton")}</Text>
        </Pressable>
        <Pressable style={styles.dangerAction} onPress={() => onDelete(rule)}>
          <Trash2 color="#991b1b" size={14} />
          <Text style={styles.dangerActionText}>{t("iot.alertRules.deleteButton")}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  actionRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 12,
  },
  backButton: {
    alignItems: "center",
    alignSelf: "flex-start",
    flexDirection: "row",
    gap: 8,
  },
  backText: {
    color: "#0f172a",
    fontSize: 14,
    fontWeight: "800",
  },
  card: {
    backgroundColor: "#ffffff",
    borderColor: "#e2e8f0",
    borderRadius: 18,
    borderWidth: 1,
    marginBottom: 12,
    padding: 16,
  },
  cardHeader: {
    alignItems: "center",
    flexDirection: "row",
    gap: 12,
    justifyContent: "space-between",
  },
  cardTitleWrap: {
    flex: 1,
  },
  chip: {
    backgroundColor: "#f8fafc",
    borderColor: "#e2e8f0",
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  chipSelected: {
    backgroundColor: "#dcfce7",
    borderColor: "#86efac",
  },
  chipText: {
    color: "#475569",
    fontSize: 12,
    fontWeight: "800",
  },
  chipTextSelected: {
    color: "#166534",
  },
  content: {
    backgroundColor: "#f8fafc",
    flexGrow: 1,
    padding: 18,
    paddingBottom: 34,
  },
  dangerAction: {
    alignItems: "center",
    backgroundColor: "#fee2e2",
    borderRadius: 999,
    flexDirection: "row",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  dangerActionText: {
    color: "#991b1b",
    fontSize: 12,
    fontWeight: "900",
  },
  disabledButton: {
    opacity: 0.55,
  },
  emptyBox: {
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderColor: "#e2e8f0",
    borderRadius: 20,
    borderWidth: 1,
    padding: 24,
  },
  emptyText: {
    color: "#64748b",
    fontSize: 14,
    lineHeight: 20,
    marginTop: 6,
    textAlign: "center",
  },
  emptyTitle: {
    color: "#0f172a",
    fontSize: 17,
    fontWeight: "900",
  },
  errorBox: {
    backgroundColor: "#fff1f2",
    borderColor: "#fecdd3",
    borderRadius: 18,
    borderWidth: 1,
    gap: 10,
    marginTop: 14,
    padding: 16,
  },
  errorText: {
    color: "#be123c",
    fontSize: 13,
    fontWeight: "800",
  },
  form: {
    backgroundColor: "#ffffff",
    borderColor: "#dcfce7",
    borderRadius: 18,
    borderWidth: 1,
    gap: 12,
    padding: 14,
  },
  formActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    justifyContent: "flex-end",
  },
  formGrid: {
    flexDirection: "row",
    gap: 10,
  },
  halfInput: {
    flex: 1,
  },
  headerWrap: {
    gap: 16,
    marginBottom: 16,
  },
  hero: {
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderColor: "#dcfce7",
    borderRadius: 24,
    borderWidth: 1,
    flexDirection: "row",
    gap: 12,
    padding: 18,
  },
  heroIcon: {
    alignItems: "center",
    backgroundColor: "#dcfce7",
    borderRadius: 16,
    height: 48,
    justifyContent: "center",
    width: 48,
  },
  heroText: {
    flex: 1,
  },
  hint: {
    color: "#64748b",
    fontSize: 13,
  },
  inlineAction: {
    alignItems: "center",
    backgroundColor: "#f0fdf4",
    borderRadius: 999,
    flexDirection: "row",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  inlineActionText: {
    color: "#166534",
    fontSize: 12,
    fontWeight: "900",
  },
  infoGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 10,
  },
  infoLabel: {
    color: "#64748b",
    fontSize: 11,
    fontWeight: "800",
  },
  infoPill: {
    backgroundColor: "#f8fafc",
    borderColor: "#e2e8f0",
    borderRadius: 14,
    borderWidth: 1,
    flexGrow: 1,
    minWidth: 120,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  infoValue: {
    color: "#0f172a",
    fontSize: 13,
    fontWeight: "900",
    marginTop: 3,
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
  kicker: {
    color: "#15803d",
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  loadingBox: {
    alignItems: "center",
    flexDirection: "row",
    gap: 10,
    paddingVertical: 6,
  },
  metaText: {
    color: "#64748b",
    fontSize: 13,
    lineHeight: 19,
    marginTop: 6,
  },
  primaryButton: {
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: "#15803d",
    borderRadius: 999,
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  primaryButtonText: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "900",
  },
  retryButton: {
    alignSelf: "flex-start",
    backgroundColor: "#be123c",
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  retryText: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "900",
  },
  ruleName: {
    color: "#0f172a",
    fontSize: 16,
    fontWeight: "900",
    lineHeight: 22,
  },
  ruleSensor: {
    color: "#64748b",
    fontSize: 13,
    fontWeight: "800",
    lineHeight: 19,
    marginTop: 3,
  },
  ruleSummary: {
    alignItems: "center",
    backgroundColor: "#f0fdf4",
    borderColor: "#bbf7d0",
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: "row",
    gap: 10,
    marginTop: 14,
    padding: 12,
  },
  ruleSummaryIcon: {
    alignItems: "center",
    backgroundColor: "#dcfce7",
    borderRadius: 12,
    height: 36,
    justifyContent: "center",
    width: 36,
  },
  ruleSummaryLabel: {
    color: "#166534",
    fontSize: 11,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  ruleSummaryText: {
    flex: 1,
  },
  ruleSummaryValue: {
    color: "#0f172a",
    fontSize: 15,
    fontWeight: "900",
    marginTop: 3,
  },
  screen: {
    backgroundColor: "#f8fafc",
    flex: 1,
  },
  secondaryButton: {
    alignItems: "center",
    backgroundColor: "#f1f5f9",
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  secondaryButtonText: {
    color: "#334155",
    fontSize: 13,
    fontWeight: "900",
  },
  scopeRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 6,
    marginTop: 10,
  },
  scopeText: {
    color: "#64748b",
    flex: 1,
    fontSize: 12,
    fontWeight: "800",
    lineHeight: 17,
  },
  sectionTitle: {
    color: "#0f172a",
    fontSize: 16,
    fontWeight: "900",
  },
  subtitle: {
    color: "#64748b",
    fontSize: 14,
    lineHeight: 20,
    marginTop: 6,
  },
  switchLabel: {
    color: "#334155",
    fontSize: 14,
    fontWeight: "900",
  },
  switchRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  title: {
    color: "#0f172a",
    fontSize: 28,
    fontWeight: "900",
  },
  toolbar: {
    backgroundColor: "#ffffff",
    borderColor: "#dcfce7",
    borderRadius: 18,
    borderWidth: 1,
    gap: 12,
    padding: 14,
  },
});
