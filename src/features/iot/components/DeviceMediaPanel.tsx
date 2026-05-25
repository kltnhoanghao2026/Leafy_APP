import DateTimePicker from "@react-native-community/datetimepicker";
import { Camera, Clock, Eye, Pencil, Play, ShieldAlert, Trash2, Wand2, X } from "lucide-react-native";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import {
  useCreateDeviceCameraScheduleMutation,
  useCaptureDeviceImageMutation,
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
import type { DisplayDeviceCameraSchedule, DisplayDeviceMediaEvent } from "../utils/iotDisplay";

const RECURRENCE_OPTIONS: CameraScheduleRecurrence[] = ["DAILY", "WEEKLY", "MONTHLY"];
const RESOLUTION_OPTIONS: CameraCaptureResolution[] = ["QVGA", "VGA", "HD"];
const QUALITY_OPTIONS: CameraCaptureQuality[] = ["LOW", "MEDIUM", "HIGH"];
const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d:[0-5]\d$/;
const toTimeDate = (value: string) => {
  const [hour = "8", minute = "0", second = "0"] = value.split(":");
  const date = new Date();
  date.setHours(Number(hour), Number(minute), Number(second), 0);
  return date;
};

const formatTimeOfDay = (date: Date) => {
  const hour = date.getHours().toString().padStart(2, "0");
  const minute = date.getMinutes().toString().padStart(2, "0");
  return `${hour}:${minute}:00`;
};

const isHttpUrl = (value: string) => {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
};

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

type DisplayableSchedule = DeviceCameraSchedule & Partial<DisplayDeviceCameraSchedule>;
type DisplayableMedia = DeviceMediaEvent & Partial<DisplayDeviceMediaEvent>;

const isDiseaseDetected = (media?: DeviceMediaEvent | null) =>
  media?.analysis?.analysisStatus === "DISEASE_DETECTED" ||
  media?.analysis?.status === "DISEASE_DETECTED" ||
  media?.analysis?.diseaseDetected === true;

const normalizeSchedules = (value: unknown): DisplayableSchedule[] => {
  if (Array.isArray(value)) {
    return value as DisplayableSchedule[];
  }

  if (value && typeof value === "object" && "data" in value) {
    const response = value as { data?: unknown };
    if (Array.isArray(response.data)) {
      return response.data as DisplayableSchedule[];
    }
    if (response.data && typeof response.data === "object" && "data" in response.data) {
      const envelope = response.data as { data?: unknown };
      if (Array.isArray(envelope.data)) {
        return envelope.data as DisplayableSchedule[];
      }
    }
  }

  return [];
};

export function DeviceMediaPanel({ deviceId, deviceUid }: DeviceMediaPanelProps) {
  const { t } = useTranslation();
  const mediaQuery = useDeviceMedia(deviceId);
  const schedulesQuery = useDeviceCameraSchedules(deviceUid ?? undefined);
  const captureMutation = useCaptureDeviceImageMutation(deviceId);
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
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState<DisplayableMedia | null>(null);

  const mediaEvents = (mediaQuery.data ?? []) as DisplayableMedia[];
  const schedules = useMemo(
    () => normalizeSchedules(schedulesQuery.data),
    [schedulesQuery.data],
  );
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

    if (uploadEndpoint.trim() && !isHttpUrl(uploadEndpoint.trim())) {
      return t("iot.cameraSchedules.validation.uploadEndpoint");
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
        updates: {
          enabled: !schedule.enabled,
          timeOfDay: schedule.timeOfDay,
          recurrence: schedule.recurrence,
          resolution: (schedule.resolution ?? "VGA") as CameraCaptureResolution,
          quality: (schedule.quality ?? "MEDIUM") as CameraCaptureQuality,
          uploadEndpoint: schedule.uploadEndpoint ?? undefined,
        },
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

  const captureAndAnalyze = async () => {
    if (!deviceUid) {
      showError(t("iot.devices.media.requiresDeviceUid"));
      return;
    }

    try {
      const capture = await captureMutation.mutateAsync({ quality, resolution });
      await detectMutation.mutateAsync({
        deviceUid,
        force: true,
      });
      Alert.alert(
        t("iot.devices.media.captureAnalyzeSuccessTitle"),
        t("iot.devices.media.captureAnalyzeSuccess", {
          requestId: capture.requestId ?? t("iot.common.unknown"),
        }),
      );
    } catch {
      showError(t("iot.devices.media.captureAnalyzeFailed"));
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

      <View style={styles.quickActions}>
        <Pressable
          disabled={!deviceUid || captureMutation.isPending || detectMutation.isPending}
          onPress={captureAndAnalyze}
          style={({ pressed }) => [
            styles.primaryButton,
            (!deviceUid || captureMutation.isPending || detectMutation.isPending) && styles.disabledButton,
            pressed && styles.pressedButton,
          ]}
        >
          {captureMutation.isPending || detectMutation.isPending ? (
            <ActivityIndicator color="#ffffff" size="small" />
          ) : (
            <Camera color="#ffffff" size={16} />
          )}
          <Text style={styles.primaryButtonText}>
            {captureMutation.isPending || detectMutation.isPending
              ? t("iot.devices.media.capturingAnalyzing")
              : t("iot.devices.media.captureAndAnalyze")}
          </Text>
        </Pressable>
      </View>

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
                  <View>
                    <Text style={styles.scheduleTime}>{schedule.display?.timeLabel ?? t("iot.common.noData")}</Text>
                    <Text style={styles.scheduleSummary}>
                      {schedule.display?.recurrenceLabel ?? t("iot.common.unknown")} ·{" "}
                      {schedule.display?.resolutionLabel ?? t("iot.common.unknown")} ·{" "}
                      {schedule.display?.qualityLabel ?? t("iot.common.unknown")}
                    </Text>
                  </View>
                  <ScheduleStatusButton schedule={schedule} onPress={() => toggleSchedule(schedule)} />
                </View>
                <View style={styles.scheduleMediaRow}>
                  <MediaThumbnail media={schedule.lastMediaEvent} compact />
                  <View style={styles.scheduleMediaText}>
                    <Text style={styles.metaText}>
                      {t("iot.cameraSchedules.status")}:{" "}
                      {schedule.display?.lastMediaStatusLabel ??
                        schedule.lastMediaEvent?.display?.statusLabel ??
                        t("iot.common.unknownStatus")}
                    </Text>
                    <Text style={styles.metaText}>
                      {t("iot.devices.media.analysisStatus")}:{" "}
                      {schedule.lastMediaEvent?.display?.analysis.statusLabel ?? t("iot.common.unknownStatus")}
                    </Text>
                  </View>
                </View>
                <View style={styles.scheduleStats}>
                  <ScheduleStat label={t("iot.cameraSchedules.nextRunAt")} value={schedule.display?.nextRunLabel ?? t("iot.common.noData")} />
                  <ScheduleStat label={t("iot.cameraSchedules.lastRunAt")} value={schedule.display?.lastRunLabel ?? t("iot.common.noData")} />
                </View>
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
                ? t("iot.cameraSchedules.saveSchedule")
                : t("iot.cameraSchedules.addSchedule")}
          </Text>
        </Pressable>

        <View style={styles.optionGroup}>
          <Text style={styles.inputLabel}>{t("iot.cameraSchedules.timeOfDay")}</Text>
          <Pressable style={styles.timePickerButton} onPress={() => setShowTimePicker(true)}>
            <Clock color="#166534" size={18} />
            <Text style={styles.timePickerText}>{timeOfDay.slice(0, 5)}</Text>
          </Pressable>
          {showTimePicker ? (
            <DateTimePicker
              mode="time"
              display="spinner"
              value={toTimeDate(timeOfDay)}
              onChange={(_event, selectedDate) => {
                setShowTimePicker(false);
                if (selectedDate) setTimeOfDay(formatTimeOfDay(selectedDate));
              }}
            />
          ) : null}
        </View>

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
        <Text style={styles.helperText}>{t("iot.cameraSchedules.customUploadHelp")}</Text>

        {formError ? <Text style={styles.errorText}>{formError}</Text> : null}

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
              <Pressable
                key={media.id}
                onPress={() => setSelectedMedia(media)}
                style={({ pressed }) => [styles.historyItem, pressed && styles.pressedButton]}
              >
                <MediaThumbnail media={media} compact />
                <View style={styles.historyContent}>
                  <View style={styles.rowBetween}>
                    <Text style={styles.historyTitle}>
                      {media.display?.triggerTypeLabel ?? t("iot.common.unknown")}
                    </Text>
                    <Text style={styles.badge}>
                      {media.display?.statusLabel ?? t("iot.common.unknownStatus")}
                    </Text>
                  </View>
                  <Text style={styles.metaText}>{media.display?.timestampLabel ?? t("iot.common.noData")}</Text>
                  <MediaAnalysis media={media} compact />
                  <View style={styles.viewDetailRow}>
                    <Eye color="#166534" size={14} />
                    <Text style={styles.inlineActionText}>{t("iot.devices.media.viewDetail")}</Text>
                  </View>
                </View>
              </Pressable>
            ))}
          </View>
        )}
      </View>

      <MediaDetailModal
        media={selectedMedia}
        analyzing={detectMutation.isPending}
        onAnalyze={triggerAnalysis}
        onClose={() => setSelectedMedia(null)}
      />
    </View>
  );
}

function LatestMediaCard({ media }: { media?: DisplayableMedia | null }) {
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
              {media.display?.statusLabel ?? t("iot.common.unknownStatus")}
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
  large = false,
}: {
  media?: DisplayableMedia | null;
  compact?: boolean;
  large?: boolean;
}) {
  const { t } = useTranslation();
  const directUrl = media?.fileUrl ?? media?.analysis?.fileUrl ?? null;
  const imageUrlQuery = useMediaImageUrl(directUrl ? undefined : media?.fileId);
  const uri = directUrl ?? imageUrlQuery.data;

  if (!uri) {
    return (
      <View
        style={
          large
            ? styles.thumbnailPlaceholderLarge
            : compact
              ? styles.thumbnailPlaceholderSmall
              : styles.thumbnailPlaceholder
        }
      >
        {imageUrlQuery.isLoading ? (
          <ActivityIndicator color="#15803d" size="small" />
        ) : (
          <Camera color="#94a3b8" size={24} />
        )}
        <Text style={styles.thumbnailText}>{t("iot.devices.media.placeholderImage")}</Text>
      </View>
    );
  }

  return (
    <Image
      resizeMode={large ? "contain" : "cover"}
      source={{ uri }}
      style={large ? styles.thumbnailLarge : compact ? styles.thumbnailSmall : styles.thumbnail}
    />
  );
}

function MediaAnalysis({ media, compact = false }: { media: DisplayableMedia; compact?: boolean }) {
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
        {media.display?.analysis.statusLabel ?? t("iot.common.unknownStatus")}
      </Text>
      {!compact && (analysis?.diseaseType || analysis?.diseaseName) ? (
        <Text style={styles.metaText}>
          {t("iot.devices.media.diseaseType")}:{" "}
          {media.display?.analysis.diseaseLabel ?? t("iot.common.unknownValue")}
        </Text>
      ) : null}
      {!compact && analysis?.severity ? (
        <Text style={styles.metaText}>
          {t("iot.devices.media.severity")}:{" "}
          {media.display?.analysis.severityLabel ?? t("iot.common.unknownStatus")}
        </Text>
      ) : null}
    </View>
  );
}

function ScheduleStatusButton({
  schedule,
  onPress,
}: {
  schedule: DisplayableSchedule;
  onPress: () => void;
}) {
  const { t } = useTranslation();
  return (
    <Pressable
      onPress={onPress}
      style={[styles.statusPill, schedule.enabled ? styles.statusPillOn : styles.statusPillOff]}
    >
      <Text style={schedule.enabled ? styles.statusPillOnText : styles.statusPillOffText}>
        {schedule.display?.enabledLabel ??
          (schedule.enabled ? t("iot.cameraSchedules.enabled") : t("iot.cameraSchedules.disabled"))}
      </Text>
    </Pressable>
  );
}

function ScheduleStat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.scheduleStat}>
      <Text style={styles.scheduleStatLabel}>{label}</Text>
      <Text style={styles.scheduleStatValue}>{value}</Text>
    </View>
  );
}

function MediaDetailModal({
  media,
  analyzing,
  onAnalyze,
  onClose,
}: {
  media: DisplayableMedia | null;
  analyzing: boolean;
  onAnalyze: (media: DeviceMediaEvent) => void;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  if (!media) return null;

  return (
    <Modal animationType="slide" visible={Boolean(media)} onRequestClose={onClose}>
      <ScrollView style={styles.modalScreen} contentContainerStyle={styles.modalContent}>
        <View style={styles.modalHeader}>
          <View>
            <Text style={styles.title}>{t("iot.devices.media.detailTitle")}</Text>
            <Text style={styles.subtitle}>{media.display?.timestampLabel ?? t("iot.common.noData")}</Text>
          </View>
          <Pressable style={styles.closeButton} onPress={onClose}>
            <X color="#0f172a" size={20} />
          </Pressable>
        </View>

        <MediaThumbnail media={media} large />

        <View style={styles.detailCard}>
          <InfoLine label={t("iot.devices.media.captureTime")} value={media.display?.capturedAt ?? media.display?.timestampLabel ?? t("iot.common.noData")} />
          <InfoLine label={t("iot.devices.media.uploadStatus")} value={media.display?.statusLabel ?? t("iot.common.unknownStatus")} />
          <InfoLine label={t("iot.devices.media.analysisStatus")} value={media.display?.analysis.statusLabel ?? t("iot.common.unknownStatus")} />
          <InfoLine label={t("iot.devices.media.diseaseType")} value={media.display?.analysis.diseaseLabel ?? t("iot.common.unknownValue")} />
          <InfoLine label={t("iot.devices.media.severity")} value={media.display?.analysis.severityLabel ?? t("iot.common.unknownStatus")} />
          <InfoLine label={t("iot.devices.media.fileSize")} value={media.display?.sizeLabel ?? t("iot.common.noData")} />
        </View>

        <Pressable
          disabled={analyzing || (!media.fileId && !media.fileUrl)}
          onPress={() => onAnalyze(media)}
          style={({ pressed }) => [
            styles.primaryButton,
            (analyzing || (!media.fileId && !media.fileUrl)) && styles.disabledButton,
            pressed && styles.pressedButton,
          ]}
        >
          <Wand2 color="#ffffff" size={16} />
          <Text style={styles.primaryButtonText}>
            {analyzing ? t("iot.devices.media.analyzing") : t("iot.devices.media.triggerAnalysis")}
          </Text>
        </Pressable>
      </ScrollView>
    </Modal>
  );
}

function InfoLine({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoLine}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
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
  helperText: {
    color: "#64748b",
    fontSize: 12,
    lineHeight: 18,
  },
  historyItem: {
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderColor: "#e2e8f0",
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: "row",
    gap: 10,
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
  infoLabel: {
    color: "#64748b",
    flex: 1,
    fontSize: 12,
    fontWeight: "800",
  },
  infoLine: {
    alignItems: "flex-start",
    borderBottomColor: "rgba(148, 163, 184, 0.16)",
    borderBottomWidth: 1,
    flexDirection: "row",
    gap: 12,
    paddingVertical: 9,
  },
  infoValue: {
    color: "#0f172a",
    flex: 1.2,
    fontSize: 12,
    fontWeight: "900",
    textAlign: "right",
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
  modalContent: {
    gap: 14,
    padding: 18,
    paddingTop: 54,
  },
  modalHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  modalScreen: {
    backgroundColor: "#f8fafc",
    flex: 1,
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
  quickActions: {
    marginTop: 12,
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
  scheduleStat: {
    backgroundColor: "#f8fafc",
    borderRadius: 12,
    flex: 1,
    padding: 10,
  },
  scheduleStatLabel: {
    color: "#64748b",
    fontSize: 10,
    fontWeight: "900",
  },
  scheduleStats: {
    flexDirection: "row",
    gap: 8,
    marginTop: 6,
  },
  scheduleStatValue: {
    color: "#0f172a",
    fontSize: 11,
    fontWeight: "900",
    marginTop: 4,
  },
  scheduleSummary: {
    color: "#64748b",
    fontSize: 12,
    fontWeight: "800",
    marginTop: 2,
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
  closeButton: {
    backgroundColor: "#f1f5f9",
    borderRadius: 999,
    padding: 10,
  },
  detailCard: {
    backgroundColor: "#ffffff",
    borderColor: "#e2e8f0",
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 12,
  },
  historyContent: {
    flex: 1,
  },
  thumbnail: {
    backgroundColor: "#e2e8f0",
    borderRadius: 14,
    height: 116,
    width: 116,
  },
  thumbnailLarge: {
    alignSelf: "stretch",
    backgroundColor: "#e2e8f0",
    borderRadius: 18,
    height: 260,
    width: "100%",
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
  thumbnailPlaceholderLarge: {
    alignItems: "center",
    alignSelf: "stretch",
    backgroundColor: "#f1f5f9",
    borderColor: "#e2e8f0",
    borderRadius: 18,
    borderWidth: 1,
    height: 260,
    justifyContent: "center",
    padding: 16,
    width: "100%",
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
  timePickerButton: {
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderColor: "#bbf7d0",
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  timePickerText: {
    color: "#0f172a",
    fontSize: 16,
    fontWeight: "900",
  },
  title: {
    color: "#0f172a",
    fontSize: 18,
    fontWeight: "900",
  },
  statusPill: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  statusPillOff: {
    backgroundColor: "#f1f5f9",
  },
  statusPillOffText: {
    color: "#64748b",
    fontSize: 11,
    fontWeight: "900",
  },
  statusPillOn: {
    backgroundColor: "#dcfce7",
  },
  statusPillOnText: {
    color: "#166534",
    fontSize: 11,
    fontWeight: "900",
  },
  viewDetailRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 6,
    marginTop: 6,
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
