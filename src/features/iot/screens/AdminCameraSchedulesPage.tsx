import { Camera, Play } from "lucide-react-native";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import {
  useCreateDeviceCameraScheduleMutation,
  useAllDeviceCameraSchedules,
  useRunCameraScheduleNowMutation,
} from "../hooks/useDeviceMedia";
import { useMyDevices } from "../hooks/useDevices";
import { useMediaImageUrl } from "../hooks/useMediaImageUrl";
import { DevicePicker } from "../components/DevicePicker";
import { IoTEmptyCard, IoTStatusBadge, mediaStatusTone, useIotTheme } from "../components/IoTUi";
import type { DeviceCameraSchedule } from "../types";
import type { DisplayDeviceCameraSchedule } from "../utils/iotDisplay";

type EnabledFilter = "all" | "enabled" | "disabled";
type RecurrenceOption = "DAILY" | "WEEKLY" | "MONTHLY";
type ResolutionOption = "QVGA" | "VGA" | "HD";
type QualityOption = "LOW" | "MEDIUM" | "HIGH";

const RECURRENCE_OPTIONS: RecurrenceOption[] = ["DAILY", "WEEKLY", "MONTHLY"];
const RESOLUTION_OPTIONS: ResolutionOption[] = ["QVGA", "VGA", "HD"];
const QUALITY_OPTIONS: QualityOption[] = ["LOW", "MEDIUM", "HIGH"];
const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d:[0-5]\d$/;

export function AdminCameraSchedulesPage() {
  const { t } = useTranslation();
  const theme = useIotTheme();
  const schedulesQuery = useAllDeviceCameraSchedules();
  const devicesQuery = useMyDevices({ page: 0, size: 100 });
  const createScheduleMutation = useCreateDeviceCameraScheduleMutation();
  const runScheduledMutation = useRunCameraScheduleNowMutation();
  const [deviceUidFilter, setDeviceUidFilter] = useState("");
  const [enabledFilter, setEnabledFilter] = useState<EnabledFilter>("all");
  const [deviceUid, setDeviceUid] = useState("");
  const [timeOfDay, setTimeOfDay] = useState("08:00:00");
  const [recurrence, setRecurrence] = useState<RecurrenceOption>("DAILY");
  const [resolution, setResolution] = useState<ResolutionOption>("VGA");
  const [quality, setQuality] = useState<QualityOption>("MEDIUM");
  const [uploadEndpoint, setUploadEndpoint] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  const schedules = (schedulesQuery.data ?? []) as (DeviceCameraSchedule & Partial<DisplayDeviceCameraSchedule>)[];
  const filteredSchedules = useMemo(() => {
    const normalizedDeviceQuery = deviceUidFilter.trim().toLowerCase();
    return schedules.filter((schedule) => {
      const deviceSearchValue = [
        schedule.display?.deviceLabel,
        schedule.display?.technical?.deviceUid,
        schedule.deviceUid,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      const matchesDevice =
        !normalizedDeviceQuery || deviceSearchValue.includes(normalizedDeviceQuery);
      const matchesEnabled =
        enabledFilter === "all" ||
        (enabledFilter === "enabled" && schedule.enabled) ||
        (enabledFilter === "disabled" && !schedule.enabled);

      return matchesDevice && matchesEnabled;
    });
  }, [deviceUidFilter, enabledFilter, schedules]);

  const createSchedule = async () => {
    if (!deviceUid.trim()) {
      setFormError(t("iot.cameraSchedules.validation.deviceUid"));
      return;
    }
    if (!TIME_PATTERN.test(timeOfDay.trim())) {
      setFormError(t("iot.cameraSchedules.validation.timeOfDay"));
      return;
    }

    setFormError(null);
    try {
      await createScheduleMutation.mutateAsync({
        deviceUid: deviceUid.trim(),
        enabled: true,
        timeOfDay: timeOfDay.trim(),
        recurrence,
        resolution,
        quality,
        uploadEndpoint: uploadEndpoint.trim() || undefined,
      });
      setTimeOfDay("08:00:00");
      setRecurrence("DAILY");
      setResolution("VGA");
      setQuality("MEDIUM");
      setUploadEndpoint("");
      setDeviceUid("");
      Alert.alert(
        t("iot.cameraSchedules.createdTitle"),
        t("iot.cameraSchedules.created"),
      );
    } catch {
      Alert.alert(
        t("iot.cameraSchedules.errorTitle"),
        t("iot.cameraSchedules.createFailed"),
      );
    }
  };

  const runNow = async (schedule: DeviceCameraSchedule) => {
    const scheduleId = schedule.scheduleId ?? schedule.id;
    if (!scheduleId) return;
    try {
      await runScheduledMutation.mutateAsync({
        scheduleId,
        deviceUid: schedule.deviceUid,
      });
      Alert.alert(
        t("iot.cameraSchedules.runSuccessTitle"),
        t("iot.cameraSchedules.runSuccess"),
      );
    } catch {
      Alert.alert(
        t("iot.cameraSchedules.errorTitle"),
        t("iot.cameraSchedules.runFailed"),
      );
    }
  };

  const pendingDeviceUid =
    runScheduledMutation.isPending && typeof runScheduledMutation.variables !== "string"
      ? runScheduledMutation.variables?.deviceUid
      : undefined;

  return (
    <ScrollView
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          onRefresh={schedulesQuery.refetch}
          refreshing={schedulesQuery.isRefetching}
          tintColor={theme.primary}
        />
      }
      style={[styles.screen, { backgroundColor: theme.background }]}
    >
      <View style={[styles.hero, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <View style={[styles.heroIcon, { backgroundColor: theme.primarySoft }]}>
          <Camera color={theme.primary} size={24} />
        </View>
        <View style={styles.heroText}>
          <Text style={[styles.kicker, { color: theme.primary }]}>{t("iot.cameraSchedules.adminKicker")}</Text>
          <Text style={[styles.title, { color: theme.text }]}>{t("iot.cameraSchedules.adminTitle")}</Text>
          <Text style={[styles.description, { color: theme.subtle }]}>
            {t("iot.cameraSchedules.adminDescription")}
          </Text>
        </View>
      </View>

      <View style={[styles.filters, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>{t("iot.cameraSchedules.filters")}</Text>
        <TextInput
          autoCapitalize="none"
          placeholder={t("iot.cameraSchedules.filterByDevice")}
          placeholderTextColor="#94a3b8"
          style={[styles.input, { backgroundColor: theme.cardAlt, borderColor: theme.border, color: theme.text }]}
          value={deviceUidFilter}
          onChangeText={setDeviceUidFilter}
        />
        <View style={styles.chipRow}>
          {(["all", "enabled", "disabled"] as EnabledFilter[]).map((filter) => {
            const selected = filter === enabledFilter;
            return (
              <Pressable
                key={filter}
                onPress={() => setEnabledFilter(filter)}
                style={[
                  styles.chip,
                  { backgroundColor: theme.cardAlt, borderColor: theme.border },
                  selected && { backgroundColor: theme.primarySoft, borderColor: theme.tone("primary").border },
                ]}
              >
                <Text style={[styles.chipText, { color: selected ? theme.primary : theme.subtle }]}>
                  {t(`iot.cameraSchedules.filter.${filter}`)}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={[styles.form, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>{t("iot.cameraSchedules.createSchedule")}</Text>
        <DevicePicker
          devices={devicesQuery.data?.items ?? []}
          label={t("iot.cameraSchedules.selectDeviceForSchedule")}
          manualValue={deviceUid}
          mode="deviceUid"
          placeholder={t("iot.common.searchDevice")}
          showAdvancedManualInput
          value={deviceUid}
          onChange={(device) => setDeviceUid(device?.deviceUid ?? "")}
          onManualChange={setDeviceUid}
        />
        <TextInput
          autoCapitalize="none"
          placeholder={t("iot.cameraSchedules.timePlaceholder")}
          placeholderTextColor="#94a3b8"
          style={[styles.input, { backgroundColor: theme.cardAlt, borderColor: theme.border, color: theme.text }]}
          value={timeOfDay}
          onChangeText={setTimeOfDay}
        />
        <OptionGroup
          label={t("iot.cameraSchedules.recurrenceLabel")}
          options={RECURRENCE_OPTIONS}
          value={recurrence}
          keyPrefix="iot.cameraSchedules.recurrence"
          onChange={setRecurrence}
        />
        <OptionGroup
          label={t("iot.cameraSchedules.resolution")}
          options={RESOLUTION_OPTIONS}
          value={resolution}
          keyPrefix="iot.cameraSchedules.resolutionOptions"
          onChange={setResolution}
        />
        <OptionGroup
          label={t("iot.cameraSchedules.quality")}
          options={QUALITY_OPTIONS}
          value={quality}
          keyPrefix="iot.cameraSchedules.qualityOptions"
          onChange={setQuality}
        />
        <TextInput
          autoCapitalize="none"
          placeholder={t("iot.cameraSchedules.uploadEndpointPlaceholder")}
          placeholderTextColor="#94a3b8"
          style={[styles.input, { backgroundColor: theme.cardAlt, borderColor: theme.border, color: theme.text }]}
          value={uploadEndpoint}
          onChangeText={setUploadEndpoint}
        />
        <Text style={[styles.helperText, { color: theme.subtle }]}>{t("iot.cameraSchedules.customUploadHelp")}</Text>
        {formError ? <Text style={[styles.errorText, { color: theme.danger }]}>{formError}</Text> : null}
        <Pressable
          disabled={createScheduleMutation.isPending}
          onPress={createSchedule}
          style={({ pressed }) => [
            styles.primaryButton,
            { backgroundColor: theme.primary },
            createScheduleMutation.isPending && styles.disabledButton,
            pressed && styles.pressedButton,
          ]}
        >
          {createScheduleMutation.isPending ? (
            <ActivityIndicator color={theme.primaryText} size="small" />
          ) : null}
          <Text style={[styles.primaryButtonText, { color: theme.primaryText }]}>
            {t("iot.cameraSchedules.createSchedule")}
          </Text>
        </Pressable>
      </View>

      {schedulesQuery.isLoading ? (
        <View style={styles.centerBox}>
          <ActivityIndicator color={theme.primary} size="large" />
          <Text style={[styles.muted, { color: theme.subtle }]}>{t("iot.cameraSchedules.loading")}</Text>
        </View>
      ) : null}

      {schedulesQuery.isError ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorTitle}>{t("iot.cameraSchedules.loadFailed")}</Text>
          <Pressable style={styles.retryButton} onPress={() => schedulesQuery.refetch()}>
            <Text style={styles.retryButtonText}>{t("iot.common.retry")}</Text>
          </Pressable>
        </View>
      ) : null}

      {!schedulesQuery.isLoading && !schedulesQuery.isError ? (
        filteredSchedules.length === 0 ? (
          <IoTEmptyCard title={t("iot.cameraSchedules.empty")} />
        ) : (
          <View style={styles.list}>
            {filteredSchedules.map((schedule) => (
              <ScheduleCard
                key={schedule.id}
                pendingDeviceUid={
                  pendingDeviceUid
                }
                schedule={schedule}
                onRunNow={runNow}
              />
            ))}
          </View>
        )
      ) : null}
    </ScrollView>
  );
}

const translateEnum = (
  t: ReturnType<typeof useTranslation>["t"],
  keyPrefix: string,
  value: string,
) => {
  const key = `${keyPrefix}.${value}`;
  const label = t(key);
  return label === key ? value : label;
};

function OptionGroup<T extends string>({
  label,
  options,
  value,
  keyPrefix,
  onChange,
}: {
  label: string;
  options: T[];
  value: T;
  keyPrefix: string;
  onChange: (nextValue: T) => void;
}) {
  const { t } = useTranslation();
  const theme = useIotTheme();

  return (
    <View style={styles.optionGroup}>
      <Text style={[styles.inputLabel, { color: theme.subtle }]}>{label}</Text>
      <View style={styles.chipRow}>
        {options.map((option) => {
          const selected = option === value;
          return (
            <Pressable
              key={option}
              onPress={() => onChange(option)}
              style={[
                styles.chip,
                { backgroundColor: theme.cardAlt, borderColor: theme.border },
                selected && { backgroundColor: theme.primarySoft, borderColor: theme.tone("primary").border },
              ]}
            >
              <Text style={[styles.chipText, { color: selected ? theme.primary : theme.subtle }]}>
                {translateEnum(t, keyPrefix, option)}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function ScheduleCard({
  schedule,
  pendingDeviceUid,
  onRunNow,
}: {
  schedule: DeviceCameraSchedule & Partial<DisplayDeviceCameraSchedule>;
  pendingDeviceUid?: string;
  onRunNow: (schedule: DeviceCameraSchedule) => void;
}) {
  const { t } = useTranslation();
  const theme = useIotTheme();
  const media = schedule.lastMediaEvent;
  const directUrl = media?.fileUrl ?? media?.analysis?.fileUrl ?? null;
  const imageUrlQuery = useMediaImageUrl(directUrl ?? media?.fileId);
  const uri = imageUrlQuery.data;
  const isRunning = pendingDeviceUid === schedule.deviceUid;
  const mediaStatus = schedule.display?.lastMediaStatusLabel ?? media?.display?.analysis.statusLabel ?? media?.display?.statusLabel;

  return (
    <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
      {uri ? (
        <Image source={{ uri }} style={styles.thumbnail} />
      ) : (
        <View style={[styles.thumbnailPlaceholder, { backgroundColor: theme.cardAlt, borderColor: theme.border }]}>
          {imageUrlQuery.isLoading ? (
            <ActivityIndicator color={theme.primary} size="small" />
          ) : (
            <Camera color={theme.muted} size={22} />
          )}
        </View>
      )}
      <View style={styles.cardBody}>
        <View style={styles.rowBetween}>
          <Text style={[styles.deviceUid, { color: theme.text }]}>{schedule.display?.deviceLabel ?? t("iot.common.unknownDevice")}</Text>
          <IoTStatusBadge
            label={schedule.enabled ? t("iot.cameraSchedules.enabled") : t("iot.cameraSchedules.disabled")}
            tone={schedule.enabled ? "success" : "neutral"}
          />
        </View>
        <Text style={[styles.metaText, { color: theme.subtle }]}>
          {schedule.display?.timeLabel ?? t("iot.common.noData")} |{" "}
          {schedule.display?.recurrenceLabel ?? t("iot.common.unknown")} |{" "}
          {schedule.display?.resolutionLabel ?? t("iot.common.unknown")} |{" "}
          {schedule.display?.qualityLabel ?? t("iot.common.unknown")}
        </Text>
        <Text style={[styles.metaText, { color: theme.subtle }]}>
          {t("iot.cameraSchedules.nextRunAt")}: {schedule.display?.nextRunLabel ?? t("iot.common.noData")}
        </Text>
        <Text style={[styles.metaText, { color: theme.subtle }]}>
          {t("iot.cameraSchedules.lastRunAt")}: {schedule.display?.lastRunLabel ?? t("iot.common.noData")}
        </Text>
        <Text style={[styles.metaText, { color: theme.subtle }]}>
          {t("iot.cameraSchedules.uploadEndpoint")}:{" "}
          {schedule.display?.endpointLabel ?? t("iot.cameraSchedules.defaultUpload")}
        </Text>
        <IoTStatusBadge
          label={mediaStatus ?? t("iot.common.unknownStatus")}
          tone={mediaStatusTone(media?.analysis?.analysisStatus ?? media?.analysis?.status ?? media?.status)}
        />
        <Pressable
          disabled={isRunning}
          onPress={() => onRunNow(schedule)}
          style={({ pressed }) => [
            styles.runButton,
            { backgroundColor: theme.primarySoft },
            isRunning && styles.disabledButton,
            pressed && styles.pressedButton,
          ]}
        >
          {isRunning ? (
            <ActivityIndicator color={theme.primary} size="small" />
          ) : (
            <Play color={theme.primary} size={14} />
          )}
          <Text style={[styles.runButtonText, { color: theme.primary }]}>
            {t("iot.cameraSchedules.runScheduledCaptureNow")}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  backButton: {
    alignItems: "center",
    alignSelf: "flex-start",
    flexDirection: "row",
    gap: 8,
    marginBottom: 18,
  },
  backText: {
    color: "#0f172a",
    fontSize: 14,
    fontWeight: "800",
  },
  badge: {
    borderRadius: 999,
    fontSize: 11,
    fontWeight: "900",
    overflow: "hidden",
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  badgeMuted: {
    backgroundColor: "#f1f5f9",
    color: "#64748b",
  },
  badgeSuccess: {
    backgroundColor: "#dcfce7",
    color: "#166534",
  },
  card: {
    backgroundColor: "#ffffff",
    borderColor: "#e2e8f0",
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: "row",
    gap: 12,
    padding: 12,
  },
  cardBody: {
    flex: 1,
    gap: 4,
  },
  centerBox: {
    alignItems: "center",
    gap: 10,
    marginTop: 28,
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
    padding: 18,
    paddingBottom: 34,
  },
  description: {
    color: "#64748b",
    fontSize: 14,
    lineHeight: 20,
    marginTop: 6,
  },
  deviceUid: {
    color: "#0f172a",
    flex: 1,
    fontSize: 15,
    fontWeight: "900",
  },
  disabledButton: {
    opacity: 0.55,
  },
  errorText: {
    color: "#b91c1c",
    fontSize: 13,
    fontWeight: "800",
  },
  form: {
    backgroundColor: "#ffffff",
    borderColor: "#dcfce7",
    borderRadius: 18,
    borderWidth: 1,
    gap: 12,
    marginTop: 18,
    padding: 14,
  },
  emptyBox: {
    backgroundColor: "#ffffff",
    borderColor: "#e2e8f0",
    borderRadius: 18,
    borderWidth: 1,
    marginTop: 16,
    padding: 18,
  },
  emptyTitle: {
    color: "#475569",
    fontSize: 14,
    fontWeight: "800",
  },
  errorBox: {
    backgroundColor: "#fff1f2",
    borderColor: "#fecdd3",
    borderRadius: 18,
    borderWidth: 1,
    marginTop: 18,
    padding: 16,
  },
  errorTitle: {
    color: "#881337",
    fontSize: 16,
    fontWeight: "900",
  },
  filters: {
    backgroundColor: "#ffffff",
    borderColor: "#dcfce7",
    borderRadius: 18,
    borderWidth: 1,
    gap: 12,
    marginTop: 18,
    padding: 14,
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
  helperText: {
    color: "#64748b",
    fontSize: 12,
    lineHeight: 18,
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
  inputLabel: {
    color: "#334155",
    fontSize: 12,
    fontWeight: "900",
  },
  kicker: {
    color: "#15803d",
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  list: {
    gap: 12,
    marginTop: 16,
  },
  metaText: {
    color: "#64748b",
    fontSize: 12,
    lineHeight: 18,
  },
  muted: {
    color: "#64748b",
    fontSize: 13,
  },
  optionGroup: {
    gap: 8,
  },
  pressedButton: {
    opacity: 0.82,
  },
  primaryButton: {
    alignItems: "center",
    backgroundColor: "#15803d",
    borderRadius: 999,
    flexDirection: "row",
    gap: 8,
    justifyContent: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  primaryButtonText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "900",
  },
  retryButton: {
    alignSelf: "flex-start",
    backgroundColor: "#be123c",
    borderRadius: 999,
    marginTop: 12,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  retryButtonText: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "900",
  },
  rowBetween: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
    justifyContent: "space-between",
  },
  runButton: {
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: "#f0fdf4",
    borderRadius: 999,
    flexDirection: "row",
    gap: 6,
    marginTop: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  runButtonText: {
    color: "#166534",
    fontSize: 12,
    fontWeight: "900",
  },
  screen: {
    backgroundColor: "#f8fafc",
    flex: 1,
  },
  sectionTitle: {
    color: "#0f172a",
    fontSize: 15,
    fontWeight: "900",
  },
  thumbnail: {
    backgroundColor: "#e2e8f0",
    borderRadius: 14,
    height: 96,
    width: 96,
  },
  thumbnailPlaceholder: {
    alignItems: "center",
    backgroundColor: "#f1f5f9",
    borderColor: "#e2e8f0",
    borderRadius: 14,
    borderWidth: 1,
    height: 96,
    justifyContent: "center",
    width: 96,
  },
  title: {
    color: "#0f172a",
    fontSize: 24,
    fontWeight: "900",
  },
});
