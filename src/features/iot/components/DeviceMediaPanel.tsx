import { Camera, Pencil, Play, ShieldAlert, Trash2, Wand2 } from "lucide-react-native";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import {
  useCreateDeviceCameraScheduleMutation,
  useDeleteDeviceCameraScheduleMutation,
  useDetectCameraDiseaseMutation,
  useDeviceCameraSchedules,
  useDeviceMedia,
  useRunCameraScheduleNowMutation,
  useUpdateDeviceCameraScheduleMutation,
} from "../hooks/useDeviceMedia";
import { useMediaImageUrl } from "../hooks/useMediaImageUrl";
import type {
  CameraCaptureQuality,
  CameraCaptureResolution,
  CameraScheduleRecurrence,
  DeviceCameraSchedule,
  DeviceMediaEvent,
} from "../types";
import { formatDateTime } from "../utils/deviceLabels";

const RECURRENCE_OPTIONS: CameraScheduleRecurrence[] = ["DAILY", "WEEKLY", "MONTHLY"];
const RESOLUTION_OPTIONS: CameraCaptureResolution[] = ["QVGA", "VGA", "HD"];
const QUALITY_OPTIONS: CameraCaptureQuality[] = ["LOW", "MEDIUM", "HIGH"];
const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d:[0-5]\d$/;

type DeviceMediaPanelProps = {
  deviceId: string;
  deviceUid?: string | null;
};

const translateEnum = (
  t: ReturnType<typeof useTranslation>["t"],
  keyPrefix: string,
  value?: string | null,
) => {
  if (!value) {
    return t("iot.common.unknown");
  }

  const key = `${keyPrefix}.${value}`;
  const label = t(key);
  return label === key ? value : label;
};

const getMediaTimestamp = (media: DeviceMediaEvent) =>
  media.uploadedAt ?? media.capturedAt ?? media.timestamp ?? media.requestedAt;

const isDiseaseDetected = (media?: DeviceMediaEvent | null) =>
  media?.analysis?.analysisStatus === "DISEASE_DETECTED" ||
  media?.analysis?.status === "DISEASE_DETECTED" ||
  media?.analysis?.diseaseDetected === true;

export function DeviceMediaPanel({ deviceId, deviceUid }: DeviceMediaPanelProps) {
  const { t } = useTranslation();
  const mediaQuery = useDeviceMedia(deviceId);
  const schedulesQuery = useDeviceCameraSchedules(deviceUid ?? undefined);
  const createScheduleMutation = useCreateDeviceCameraScheduleMutation(
    deviceUid ?? undefined,
  );
  const updateScheduleMutation = useUpdateDeviceCameraScheduleMutation(deviceUid ?? undefined);
  const deleteScheduleMutation = useDeleteDeviceCameraScheduleMutation(deviceUid ?? undefined);
  const runScheduleMutation = useRunCameraScheduleNowMutation(deviceUid ?? undefined);
  const detectMutation = useDetectCameraDiseaseMutation(deviceUid ?? undefined);
  const [timeOfDay, setTimeOfDay] = useState("08:00:00");
  const [recurrence, setRecurrence] =
    useState<CameraScheduleRecurrence>("DAILY");
  const [resolution, setResolution] = useState<CameraCaptureResolution>("VGA");
  const [quality, setQuality] = useState<CameraCaptureQuality>("MEDIUM");
  const [uploadEndpoint, setUploadEndpoint] = useState("");
  const [editingScheduleId, setEditingScheduleId] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const mediaEvents = mediaQuery.data ?? [];
  const schedules = schedulesQuery.data ?? [];
  const latestUploaded = useMemo(
    () =>
      mediaEvents.find((event) => event.status === "UPLOADED") ??
      mediaEvents[0] ??
      null,
    [mediaEvents],
  );

  const showError = (message: string) => {
    Alert.alert(t("iot.cameraSchedules.errorTitle"), message);
  };

  const validateSchedule = () => {
    if (!TIME_PATTERN.test(timeOfDay.trim())) {
      return t("iot.cameraSchedules.validation.timeOfDay");
    }

    if (!RECURRENCE_OPTIONS.includes(recurrence)) {
      return t("iot.cameraSchedules.validation.recurrence");
    }

    if (!RESOLUTION_OPTIONS.includes(resolution)) {
      return t("iot.cameraSchedules.validation.resolution");
    }

    if (!QUALITY_OPTIONS.includes(quality)) {
      return t("iot.cameraSchedules.validation.quality");
    }

    return null;
  };

  const resetForm = () => {
    setTimeOfDay("08:00:00");
    setRecurrence("DAILY");
    setResolution("VGA");
    setQuality("MEDIUM");
    setUploadEndpoint("");
    setEditingScheduleId(null);
  };

  const submitSchedule = async () => {
    if (!deviceUid) {
      showError(t("iot.devices.media.requiresDeviceUid"));
      return;
    }

    const validationError = validateSchedule();
    if (validationError) {
      setFormError(validationError);
      return;
    }

    setFormError(null);
    try {
      const payload = {
        enabled: true,
        timeOfDay: timeOfDay.trim(),
        recurrence,
        resolution,
        quality,
        uploadEndpoint: uploadEndpoint.trim() || undefined,
      };

      if (editingScheduleId) {
        await updateScheduleMutation.mutateAsync({
          scheduleId: editingScheduleId,
          updates: payload,
        });
      } else {
        await createScheduleMutation.mutateAsync(payload);
      }
      resetForm();
      Alert.alert(
        t(editingScheduleId ? "iot.cameraSchedules.updatedTitle" : "iot.cameraSchedules.createdTitle"),
        t(editingScheduleId ? "iot.cameraSchedules.updated" : "iot.cameraSchedules.created"),
      );
    } catch {
      showError(
        t(editingScheduleId ? "iot.cameraSchedules.updateFailed" : "iot.cameraSchedules.createFailed"),
      );
    }
  };

  const editSchedule = (schedule: DeviceCameraSchedule) => {
    setEditingScheduleId(schedule.scheduleId ?? schedule.id ?? null);
    setTimeOfDay(schedule.timeOfDay);
    setRecurrence(schedule.recurrence);
    setResolution((schedule.resolution ?? "VGA") as CameraCaptureResolution);
    setQuality((schedule.quality ?? "MEDIUM") as CameraCaptureQuality);
    setUploadEndpoint(schedule.uploadEndpoint ?? "");
  };

  const toggleSchedule = async (schedule: DeviceCameraSchedule) => {
    const scheduleId = schedule.scheduleId ?? schedule.id;
    if (!scheduleId) return;
    try {
      await updateScheduleMutation.mutateAsync({
        scheduleId,
        updates: { enabled: !schedule.enabled },
      });
    } catch {
      showError(t("iot.cameraSchedules.updateFailed"));
    }
  };

  const deleteSchedule = (schedule: DeviceCameraSchedule) => {
    const scheduleId = schedule.scheduleId ?? schedule.id;
    if (!scheduleId) return;
    Alert.alert(
      t("iot.cameraSchedules.deleteSchedule"),
      t("iot.cameraSchedules.deleteConfirm"),
      [
        { text: t("iot.common.back"), style: "cancel" },
        {
          text: t("iot.cameraSchedules.deleteSchedule"),
          style: "destructive",
          onPress: async () => {
            try {
              await deleteScheduleMutation.mutateAsync(scheduleId);
            } catch {
              showError(t("iot.cameraSchedules.deleteFailed"));
            }
          },
        },
      ],
    );
  };

  const runScheduleNow = async (schedule: DeviceCameraSchedule) => {
    const scheduleId = schedule.scheduleId ?? schedule.id;
    if (!deviceUid) {
      showError(t("iot.devices.media.requiresDeviceUid"));
      return;
    }
    if (!scheduleId) return;

    try {
      await runScheduleMutation.mutateAsync(scheduleId);
      Alert.alert(
        t("iot.cameraSchedules.runSuccessTitle"),
        t("iot.cameraSchedules.runSuccess"),
      );
    } catch {
      showError(t("iot.cameraSchedules.runFailed"));
    }
  };

  const triggerAnalysis = async (media: DeviceMediaEvent) => {
    if (!deviceUid) {
      showError(t("iot.devices.media.requiresDeviceUid"));
      return;
    }

    try {
      await detectMutation.mutateAsync({
        mediaEventId: media.id,
        fileId: media.fileId ?? undefined,
        fileUrl: media.fileUrl ?? media.analysis?.fileUrl ?? undefined,
        deviceUid,
        force: true,
      });
      Alert.alert(
        t("iot.devices.media.analysisSuccessTitle"),
        t("iot.devices.media.analysisSuccess"),
      );
    } catch {
      showError(t("iot.devices.media.analysisFailed"));
    }
  };

  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <View style={styles.headerIcon}>
          <Camera color="#166534" size={20} />
        </View>
        <View style={styles.headerText}>
          <Text style={styles.title}>{t("iot.devices.media.title")}</Text>
          <Text style={styles.subtitle}>{t("iot.devices.media.description")}</Text>
        </View>
      </View>

      {mediaQuery.isLoading ? (
        <View style={styles.loadingRow}>
          <ActivityIndicator color="#15803d" size="small" />
          <Text style={styles.muted}>{t("iot.devices.media.loading")}</Text>
        </View>
      ) : null}

      {mediaQuery.isError ? (
        <View style={styles.warningBox}>
          <Text style={styles.warningText}>{t("iot.devices.media.loadFailed")}</Text>
          <Pressable style={styles.inlineButton} onPress={() => mediaQuery.refetch()}>
            <Text style={styles.inlineButtonText}>{t("iot.common.retry")}</Text>
          </Pressable>
        </View>
      ) : (
        <LatestMediaCard media={latestUploaded} />
      )}

      <View style={styles.subsection}>
        <View style={styles.rowBetween}>
          <Text style={styles.subsectionTitle}>{t("iot.cameraSchedules.title")}</Text>
          {schedulesQuery.isFetching ? (
            <ActivityIndicator color="#15803d" size="small" />
          ) : null}
        </View>

        {schedulesQuery.isError ? (
          <Text style={styles.errorText}>{t("iot.cameraSchedules.loadFailed")}</Text>
        ) : schedules.length === 0 ? (
          <Text style={styles.muted}>{t("iot.cameraSchedules.empty")}</Text>
        ) : (
          <View style={styles.list}>
            {schedules.map((schedule) => (
              <View key={schedule.scheduleId ?? schedule.id} style={styles.scheduleItem}>
                <View style={styles.rowBetween}>
                  <Text style={styles.scheduleTime}>{schedule.timeOfDay}</Text>
                  <Pressable
                    onPress={() => toggleSchedule(schedule)}
                    style={[
                      styles.badge,
                      schedule.enabled ? styles.badgeSuccess : styles.badgeMuted,
                    ]}
                  >
                    <Text style={schedule.enabled ? styles.badgeSuccessText : styles.badgeMutedText}>
                      {schedule.enabled
                        ? t("iot.cameraSchedules.enabled")
                        : t("iot.cameraSchedules.disabled")}
                    </Text>
                  </Pressable>
                </View>
                <View style={styles.scheduleMediaRow}>
                  <MediaThumbnail media={schedule.lastMediaEvent} compact />
                  <View style={styles.scheduleMediaText}>
                    <Text style={styles.metaText}>
                      {t("iot.cameraSchedules.status")}:{" "}
                      {schedule.status ?? schedule.lastMediaEvent?.status ?? t("iot.common.unknown")}
                    </Text>
                    <Text style={styles.metaText}>
                      {t("iot.devices.media.analysisStatus")}:{" "}
                      {schedule.lastMediaEvent?.analysis?.analysisStatus ??
                        t("iot.common.unknown")}
                    </Text>
                  </View>
                </View>
                <Text style={styles.metaText}>
                  {translateEnum(t, "iot.cameraSchedules.recurrence", schedule.recurrence)}
                  {" | "}
                  {translateEnum(t, "iot.cameraSchedules.resolutionOptions", schedule.resolution)}
                  {" | "}
                  {translateEnum(t, "iot.cameraSchedules.qualityOptions", schedule.quality)}
                </Text>
                <Text style={styles.metaText}>
                  {t("iot.cameraSchedules.nextRunAt")}: {formatDateTime(schedule.nextRunAt)}
                </Text>
                <Text style={styles.metaText}>
                  {t("iot.cameraSchedules.lastRunAt")}: {formatDateTime(schedule.lastRunAt)}
                </Text>
                {schedule.uploadEndpoint ? (
                  <Text style={styles.metaText}>
                    {t("iot.cameraSchedules.uploadEndpoint")}: {schedule.uploadEndpoint}
                  </Text>
                ) : null}
                <View style={styles.actionRow}>
                  <Pressable style={styles.inlineAction} onPress={() => runScheduleNow(schedule)}>
                    <Play color="#166534" size={14} />
                    <Text style={styles.inlineActionText}>
                      {t("iot.cameraSchedules.runNow")}
                    </Text>
                  </Pressable>
                  <Pressable style={styles.inlineAction} onPress={() => editSchedule(schedule)}>
                    <Pencil color="#166534" size={14} />
                    <Text style={styles.inlineActionText}>
                      {t("iot.cameraSchedules.editSchedule")}
                    </Text>
                  </Pressable>
                  <Pressable style={styles.dangerAction} onPress={() => deleteSchedule(schedule)}>
                    <Trash2 color="#991b1b" size={14} />
                    <Text style={styles.dangerActionText}>
                      {t("iot.cameraSchedules.deleteSchedule")}
                    </Text>
                  </Pressable>
                </View>
              </View>
            ))}
          </View>
        )}
      </View>

      <View style={styles.form}>
        <Text style={styles.subsectionTitle}>
          {editingScheduleId
            ? t("iot.cameraSchedules.editSchedule")
            : t("iot.cameraSchedules.create")}
        </Text>
        <TextInput
          autoCapitalize="none"
          placeholder="08:00:00"
          placeholderTextColor="#94a3b8"
          style={styles.input}
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
          style={styles.input}
          value={uploadEndpoint}
          onChangeText={setUploadEndpoint}
        />

        {formError ? <Text style={styles.errorText}>{formError}</Text> : null}

        <Pressable
          disabled={!deviceUid || createScheduleMutation.isPending || updateScheduleMutation.isPending}
          onPress={submitSchedule}
          style={({ pressed }) => [
            styles.primaryButton,
            (!deviceUid || createScheduleMutation.isPending || updateScheduleMutation.isPending) &&
              styles.disabledButton,
            pressed && styles.pressedButton,
          ]}
        >
          {createScheduleMutation.isPending || updateScheduleMutation.isPending ? (
            <ActivityIndicator color="#ffffff" size="small" />
          ) : null}
          <Text style={styles.primaryButtonText}>
            {createScheduleMutation.isPending || updateScheduleMutation.isPending
              ? t("iot.cameraSchedules.creating")
              : editingScheduleId
                ? t("iot.cameraSchedules.editSchedule")
                : t("iot.cameraSchedules.createSchedule")}
          </Text>
        </Pressable>
        {editingScheduleId ? (
          <Pressable style={styles.inlineButton} onPress={resetForm}>
            <Text style={styles.inlineButtonText}>{t("common.cancel")}</Text>
          </Pressable>
        ) : null}
      </View>

      <View style={styles.subsection}>
        <Text style={styles.subsectionTitle}>{t("iot.devices.media.mediaHistory")}</Text>
        {mediaEvents.length === 0 ? (
          <Text style={styles.muted}>{t("iot.devices.media.noEvents")}</Text>
        ) : (
          <View style={styles.list}>
            {mediaEvents.map((media) => (
              <View key={media.id} style={styles.historyItem}>
                <View style={styles.rowBetween}>
                  <Text style={styles.historyTitle}>
                    {translateEnum(t, "iot.devices.media.triggerType", media.triggerType)}
                  </Text>
                  <Text style={styles.badge}>
                    {translateEnum(t, "iot.devices.media.status", media.status)}
                  </Text>
                </View>
                <Text style={styles.metaText}>{formatDateTime(getMediaTimestamp(media))}</Text>
                <MediaAnalysis media={media} />
                <Pressable
                  disabled={detectMutation.isPending || (!media.fileId && !media.fileUrl)}
                  onPress={() => triggerAnalysis(media)}
                  style={({ pressed }) => [
                    styles.inlineAction,
                    (detectMutation.isPending || (!media.fileId && !media.fileUrl)) &&
                      styles.disabledButton,
                    pressed && styles.pressedButton,
                  ]}
                >
                  <Wand2 color="#166534" size={14} />
                  <Text style={styles.inlineActionText}>
                    {detectMutation.isPending
                      ? t("iot.devices.media.analyzing")
                      : t("iot.devices.media.triggerAnalysis")}
                  </Text>
                </Pressable>
              </View>
            ))}
          </View>
        )}
      </View>
    </View>
  );
}

function LatestMediaCard({ media }: { media?: DeviceMediaEvent | null }) {
  const { t } = useTranslation();

  return (
    <View style={styles.latestCard}>
      <MediaThumbnail media={media} />
      <View style={styles.latestInfo}>
        <View style={styles.rowBetween}>
          <Text style={styles.latestTitle}>{t("iot.devices.media.latestImage")}</Text>
          {isDiseaseDetected(media) ? (
            <View style={styles.alertBadge}>
              <ShieldAlert color="#991b1b" size={14} />
              <Text style={styles.alertBadgeText}>
                {t("iot.devices.media.alertBadge")}
              </Text>
            </View>
          ) : null}
        </View>
        {media ? (
          <>
            <Text style={styles.metaText}>
              {t("iot.cameraSchedules.status")}:{" "}
              {translateEnum(t, "iot.devices.media.status", media.status)}
            </Text>
            <MediaAnalysis media={media} />
          </>
        ) : (
          <Text style={styles.muted}>{t("iot.devices.media.noImage")}</Text>
        )}
      </View>
    </View>
  );
}

function MediaThumbnail({
  media,
  compact = false,
}: {
  media?: DeviceMediaEvent | null;
  compact?: boolean;
}) {
  const { t } = useTranslation();
  const directUrl = media?.fileUrl ?? media?.analysis?.fileUrl ?? null;
  const imageUrlQuery = useMediaImageUrl(directUrl ? undefined : media?.fileId);
  const uri = directUrl ?? imageUrlQuery.data;

  if (!uri) {
    return (
      <View style={compact ? styles.thumbnailPlaceholderSmall : styles.thumbnailPlaceholder}>
        {imageUrlQuery.isLoading ? (
          <ActivityIndicator color="#15803d" size="small" />
        ) : (
          <Camera color="#94a3b8" size={24} />
        )}
        <Text style={styles.thumbnailText}>{t("iot.devices.media.placeholderImage")}</Text>
      </View>
    );
  }

  return <Image source={{ uri }} style={compact ? styles.thumbnailSmall : styles.thumbnail} />;
}

function MediaAnalysis({ media }: { media: DeviceMediaEvent }) {
  const { t } = useTranslation();
  const analysis = media.analysis;
  const status = analysis?.analysisStatus ?? analysis?.status;

  if (!analysis && !status) {
    return <Text style={styles.metaText}>{t("iot.devices.media.noAnalysis")}</Text>;
  }

  return (
    <View style={styles.analysisBox}>
      <Text style={styles.metaText}>
        {t("iot.devices.media.analysisStatus")}:{" "}
        {translateEnum(t, "iot.devices.media.analysisStatusOptions", status)}
      </Text>
      {analysis?.diseaseType || analysis?.diseaseName ? (
        <Text style={styles.metaText}>
          {t("iot.devices.media.diseaseType")}:{" "}
          {analysis.diseaseType ?? analysis.diseaseName}
        </Text>
      ) : null}
      {analysis?.severity ? (
        <Text style={styles.metaText}>
          {t("iot.devices.media.severity")}:{" "}
          {translateEnum(t, "iot.alerts.severity", analysis.severity)}
        </Text>
      ) : null}
    </View>
  );
}

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

  return (
    <View style={styles.optionGroup}>
      <Text style={styles.inputLabel}>{label}</Text>
      <View style={styles.chipRow}>
        {options.map((option) => {
          const selected = option === value;
          return (
            <Pressable
              key={option}
              onPress={() => onChange(option)}
              style={[styles.chip, selected && styles.chipSelected]}
            >
              <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
                {translateEnum(t, keyPrefix, option)}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  alertBadge: {
    alignItems: "center",
    backgroundColor: "#fee2e2",
    borderRadius: 999,
    flexDirection: "row",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  alertBadgeText: {
    color: "#991b1b",
    fontSize: 11,
    fontWeight: "900",
  },
  analysisBox: {
    gap: 3,
    marginTop: 6,
  },
  actionRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 8,
  },
  badge: {
    backgroundColor: "#f1f5f9",
    borderRadius: 999,
    color: "#334155",
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
  badgeMutedText: {
    color: "#64748b",
    fontSize: 11,
    fontWeight: "900",
  },
  badgeSuccess: {
    backgroundColor: "#dcfce7",
    color: "#166534",
  },
  badgeSuccessText: {
    color: "#166534",
    fontSize: 11,
    fontWeight: "900",
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
  disabledButton: {
    opacity: 0.55,
  },
  dangerAction: {
    alignItems: "center",
    alignSelf: "flex-start",
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
  errorText: {
    color: "#b91c1c",
    fontSize: 13,
    fontWeight: "700",
  },
  form: {
    backgroundColor: "#ffffff",
    borderColor: "#dcfce7",
    borderRadius: 18,
    borderWidth: 1,
    gap: 12,
    marginTop: 16,
    padding: 14,
  },
  header: {
    alignItems: "center",
    flexDirection: "row",
    gap: 10,
    marginBottom: 14,
  },
  headerIcon: {
    alignItems: "center",
    backgroundColor: "#dcfce7",
    borderRadius: 12,
    height: 40,
    justifyContent: "center",
    width: 40,
  },
  headerText: {
    flex: 1,
  },
  historyItem: {
    backgroundColor: "#ffffff",
    borderColor: "#e2e8f0",
    borderRadius: 16,
    borderWidth: 1,
    padding: 12,
  },
  historyTitle: {
    color: "#0f172a",
    fontSize: 14,
    fontWeight: "900",
  },
  inlineAction: {
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: "#f0fdf4",
    borderRadius: 999,
    flexDirection: "row",
    gap: 6,
    marginTop: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  inlineActionText: {
    color: "#166534",
    fontSize: 12,
    fontWeight: "900",
  },
  inlineButton: {
    alignSelf: "flex-start",
    marginTop: 8,
  },
  inlineButtonText: {
    color: "#166534",
    fontSize: 13,
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
  inputLabel: {
    color: "#334155",
    fontSize: 12,
    fontWeight: "900",
  },
  latestCard: {
    backgroundColor: "#ffffff",
    borderColor: "#dcfce7",
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: "row",
    gap: 12,
    padding: 12,
  },
  latestInfo: {
    flex: 1,
    gap: 4,
  },
  latestTitle: {
    color: "#0f172a",
    fontSize: 14,
    fontWeight: "900",
  },
  list: {
    gap: 10,
  },
  loadingRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
    marginBottom: 10,
  },
  metaText: {
    color: "#64748b",
    fontSize: 12,
    lineHeight: 18,
  },
  muted: {
    color: "#64748b",
    fontSize: 13,
    lineHeight: 19,
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
  rowBetween: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
    justifyContent: "space-between",
  },
  scheduleItem: {
    backgroundColor: "#ffffff",
    borderColor: "#e2e8f0",
    borderRadius: 16,
    borderWidth: 1,
    gap: 4,
    padding: 12,
  },
  scheduleTime: {
    color: "#0f172a",
    fontSize: 16,
    fontWeight: "900",
  },
  scheduleMediaRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 10,
    marginVertical: 6,
  },
  scheduleMediaText: {
    flex: 1,
  },
  secondaryButton: {
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: "#f0fdf4",
    borderRadius: 999,
    flexDirection: "row",
    gap: 8,
    marginTop: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  secondaryButtonText: {
    color: "#166534",
    fontSize: 13,
    fontWeight: "900",
  },
  section: {
    marginTop: 22,
  },
  subsection: {
    marginTop: 16,
  },
  subsectionTitle: {
    color: "#0f172a",
    fontSize: 15,
    fontWeight: "900",
    marginBottom: 10,
  },
  subtitle: {
    color: "#64748b",
    fontSize: 13,
    lineHeight: 18,
  },
  thumbnail: {
    backgroundColor: "#e2e8f0",
    borderRadius: 14,
    height: 116,
    width: 116,
  },
  thumbnailSmall: {
    backgroundColor: "#e2e8f0",
    borderRadius: 10,
    height: 56,
    width: 56,
  },
  thumbnailPlaceholder: {
    alignItems: "center",
    backgroundColor: "#f1f5f9",
    borderColor: "#e2e8f0",
    borderRadius: 14,
    borderWidth: 1,
    height: 116,
    justifyContent: "center",
    padding: 10,
    width: 116,
  },
  thumbnailPlaceholderSmall: {
    alignItems: "center",
    backgroundColor: "#f1f5f9",
    borderColor: "#e2e8f0",
    borderRadius: 10,
    borderWidth: 1,
    height: 56,
    justifyContent: "center",
    width: 56,
  },
  thumbnailText: {
    color: "#64748b",
    fontSize: 11,
    fontWeight: "800",
    marginTop: 6,
    textAlign: "center",
  },
  title: {
    color: "#0f172a",
    fontSize: 18,
    fontWeight: "900",
  },
  warningBox: {
    backgroundColor: "#fff7ed",
    borderColor: "#fed7aa",
    borderRadius: 16,
    borderWidth: 1,
    padding: 12,
  },
  warningText: {
    color: "#9a3412",
    fontSize: 13,
    fontWeight: "700",
  },
});
