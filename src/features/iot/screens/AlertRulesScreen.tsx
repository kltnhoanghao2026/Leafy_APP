import { useRouter } from "expo-router";
import { ArrowLeft, BellRing, Pencil, Plus, Trash2 } from "lucide-react-native";
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
import type { AlertRuleResponse, AlertRuleRequest, AlertSeverity } from "../types";
import { formatDateTime } from "../utils/deviceLabels";

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

const toFormState = (rule: AlertRuleResponse): FormState => ({
  name: rule.name ?? "",
  sensorType: rule.sensorType ?? rule.sensorTypeId ?? "",
  thresholdMin: getThresholdMin(rule)?.toString() ?? "",
  thresholdMax: getThresholdMax(rule)?.toString() ?? "",
  severity: rule.severity,
  enabled: rule.enabled,
});

export function AlertRulesScreen() {
  const { t } = useTranslation();
  const router = useRouter();
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
      const sensor = rule.sensorType ?? rule.sensorTypeId ?? "";
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
      return t("iot.alertRules.validation.sensorTypeRequired");
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

    return {
      name: form.name.trim(),
      sensorType: form.sensorType.trim(),
      sensorTypeId: form.sensorType.trim(),
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
      await updateRule.mutateAsync({
        ruleId,
        payload: {
          name: rule.name,
          sensorType: rule.sensorType ?? rule.sensorTypeId ?? "",
          sensorTypeId: rule.sensorTypeId ?? rule.sensorType,
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
          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <ArrowLeft color="#0f172a" size={20} />
            <Text style={styles.backText}>{t("iot.common.back")}</Text>
          </Pressable>

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

          {rulesQuery.isError ? (
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
      <TextInput
        autoCapitalize="characters"
        placeholder={t("iot.alertRules.sensorType")}
        placeholderTextColor="#94a3b8"
        style={styles.input}
        value={form.sensorType}
        onChangeText={(sensorType) => setForm({ ...form, sensorType })}
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
  rule: AlertRuleResponse;
  pending: boolean;
  onToggle: (rule: AlertRuleResponse) => void;
  onEdit: (rule: AlertRuleResponse) => void;
  onDelete: (rule: AlertRuleResponse) => void;
}) {
  const { t } = useTranslation();
  const min = getThresholdMin(rule);
  const max = getThresholdMax(rule);
  const sensor = rule.sensorType ?? rule.sensorTypeId ?? t("iot.common.unknown");

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.cardTitleWrap}>
          <Text style={styles.ruleName}>{rule.name || sensor}</Text>
          <Text style={styles.ruleSensor}>{sensor}</Text>
        </View>
        <Switch
          disabled={pending}
          value={rule.enabled}
          onValueChange={() => onToggle(rule)}
        />
      </View>
      <Text style={styles.metaText}>
        {t("iot.alertRules.thresholdMin")}: {min ?? t("iot.common.none")} |{" "}
        {t("iot.alertRules.thresholdMax")}: {max ?? t("iot.common.none")}
      </Text>
      <Text style={styles.metaText}>
        {t("iot.alertRules.severity")}: {t(`iot.alerts.severity.${rule.severity}`)}
      </Text>
      <Text style={styles.metaText}>
        {t("iot.alertRules.lastTriggered")}: {formatDateTime(rule.lastTriggeredAt)}
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
  },
  ruleSensor: {
    color: "#64748b",
    fontSize: 12,
    fontWeight: "800",
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
