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
  useDeleteDeviceMediaEventMutation,
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
  DeviceStatus,
} from "../types";
import type { DisplayDeviceCameraSchedule, DisplayDeviceMediaEvent } from "../utils/iotDisplay";
import { IoTButton, IoTEmptyCard, IoTStatusBadge, mediaStatusTone, useIotTheme } from "./IoTUi";

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
  deviceStatus?: DeviceStatus | null;
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

const getMediaEventId = (media?: DeviceMediaEvent | null) =>
  media?.id ?? media?.mediaEventId ?? media?.analysis?.mediaEventId;

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

export function DeviceMediaPanel({ deviceId, deviceUid, deviceStatus }: DeviceMediaPanelProps) {
  const { t } = useTranslation();
  const theme = useIotTheme();
  const mediaQuery = useDeviceMedia(deviceId);
  const schedulesQuery = useDeviceCameraSchedules(deviceUid ?? undefined);
  const captureMutation = useCaptureDeviceImageMutation(deviceId);
  const createScheduleMutation = useCreateDeviceCameraScheduleMutation(
    deviceUid ?? undefined,
  );
  const updateScheduleMutation = useUpdateDeviceCameraScheduleMutation(deviceUid ?? undefined);
  const deleteScheduleMutation = useDeleteDeviceCameraScheduleMutation(deviceUid ?? undefined);
  const deleteMediaMutation = useDeleteDeviceMediaEventMutation(deviceId, deviceUid ?? undefined);
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
  const deviceOnline = deviceStatus?.toUpperCase() === "ONLINE";
  const capturePending = captureMutation.isPending || detectMutation.isPending;

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
    if (!deviceOnline) {
      showError(t("iot.devices.media.captureRequiresOnline", { defaultValue: "Thiết bị đang offline nên chưa thể chụp ảnh." }));
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

  const deleteMedia = (media: DeviceMediaEvent) => {
    const mediaEventId = getMediaEventId(media);
    if (!mediaEventId) {
      showError(t("iot.devices.media.deleteMissingId", { defaultValue: "Không tìm thấy mã ảnh để xóa." }));
      return;
    }

    Alert.alert(
      t("iot.devices.media.deleteTitle", { defaultValue: "Xóa ảnh chụp?" }),
      t("iot.devices.media.deleteConfirm", { defaultValue: "Ảnh này sẽ bị xóa khỏi lịch sử ảnh chụp của thiết bị." }),
      [
        { text: t("common.cancel", { defaultValue: "Hủy" }), style: "cancel" },
        {
          text: t("iot.devices.media.deleteAction", { defaultValue: "Xóa" }),
          style: "destructive",
          onPress: async () => {
            try {
              await deleteMediaMutation.mutateAsync(mediaEventId);
              setSelectedMedia(null);
              Alert.alert(
                t("iot.devices.media.deleteSuccessTitle", { defaultValue: "Đã xóa ảnh" }),
                t("iot.devices.media.deleteSuccess", { defaultValue: "Danh sách ảnh đã được cập nhật." }),
              );
            } catch {
              showError(t("iot.devices.media.deleteFailed", { defaultValue: "Không thể xóa ảnh. Vui lòng thử lại." }));
            }
          },
        },
      ],
    );
  };

  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <View style={[styles.headerIcon, { backgroundColor: theme.primarySoft }]}>
          <Camera color={theme.primary} size={20} />
        </View>
        <View style={styles.headerText}>
          <Text style={[styles.title, { color: theme.text }]}>{t("iot.devices.media.title")}</Text>
          <Text style={[styles.subtitle, { color: theme.subtle }]}>{t("iot.devices.media.description")}</Text>
        </View>
      </View>

      {mediaQuery.isLoading ? (
        <View style={styles.loadingRow}>
          <ActivityIndicator color={theme.primary} size="small" />
          <Text style={[styles.muted, { color: theme.subtle }]}>{t("iot.devices.media.loading")}</Text>
        </View>
      ) : null}

      {mediaQuery.isError ? (
        <View style={[styles.warningBox, { backgroundColor: theme.warningSoft, borderColor: theme.tone("warning").border }]}>
          <Text style={[styles.warningText, { color: theme.warning }]}>{t("iot.devices.media.loadFailed")}</Text>
          <Pressable style={styles.inlineButton} onPress={() => mediaQuery.refetch()}>
            <Text style={styles.inlineButtonText}>{t("iot.common.retry")}</Text>
          </Pressable>
        </View>
      ) : (
        <LatestMediaCard media={latestUploaded} />
      )}

      <View style={styles.quickActions}>
        <Pressable
          accessibilityState={{ disabled: !deviceUid || !deviceOnline || capturePending }}
          onPress={captureAndAnalyze}
          style={({ pressed }) => [
            styles.primaryButton,
            { backgroundColor: theme.primary },
            (!deviceUid || !deviceOnline || capturePending) && styles.disabledButton,
            pressed && !capturePending && styles.pressedButton,
          ]}
        >
          {capturePending ? (
            <ActivityIndicator color={theme.primaryText} size="small" />
          ) : (
            <Camera color={theme.primaryText} size={18} />
          )}
          <Text style={[styles.primaryButtonText, { color: theme.primaryText }]}>
            {capturePending
              ? t("iot.devices.media.capturingAnalyzing")
              : t("iot.devices.media.captureAndAnalyze")}
          </Text>
        </Pressable>
      </View>

      <View style={styles.subsection}>
        <View style={styles.rowBetween}>
          <Text style={[styles.subsectionTitle, { color: theme.text }]}>{t("iot.cameraSchedules.title")}</Text>
          {schedulesQuery.isFetching ? (
            <ActivityIndicator color={theme.primary} size="small" />
          ) : null}
        </View>

        {schedulesQuery.isError ? (
          <Text style={[styles.errorText, { color: theme.danger }]}>{t("iot.cameraSchedules.loadFailed")}</Text>
        ) : schedules.length === 0 ? (
          <IoTEmptyCard title={t("iot.cameraSchedules.empty")} />
        ) : (
          <View style={styles.list}>
            {schedules.map((schedule) => (
              <View
                key={schedule.scheduleId ?? schedule.id}
                style={[styles.scheduleItem, { backgroundColor: theme.card, borderColor: theme.border }]}
              >
                <View style={styles.rowBetween}>
                  <View style={styles.cardTitleWrap}>
                    <Text style={[styles.scheduleTime, { color: theme.text }]}>{schedule.display?.timeLabel ?? t("iot.common.noData")}</Text>
                    <Text style={[styles.scheduleSummary, { color: theme.subtle }]}>
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
                    <Text style={[styles.metaText, { color: theme.subtle }]}>
                      {t("iot.cameraSchedules.status")}:{" "}
                      {schedule.display?.lastMediaStatusLabel ??
                        schedule.lastMediaEvent?.display?.statusLabel ??
                        t("iot.common.unknownStatus")}
                    </Text>
                    <IoTStatusBadge
                      label={schedule.lastMediaEvent?.display?.analysis.statusLabel ?? t("iot.common.unknownStatus")}
                      tone={mediaStatusTone(schedule.lastMediaEvent?.analysis?.analysisStatus ?? schedule.lastMediaEvent?.analysis?.status)}
                    />
                  </View>
                </View>
                <View style={styles.scheduleStats}>
                  <ScheduleStat label={t("iot.cameraSchedules.nextRunAt")} value={schedule.display?.nextRunLabel ?? t("iot.common.noData")} />
                  <ScheduleStat label={t("iot.cameraSchedules.lastRunAt")} value={schedule.display?.lastRunLabel ?? t("iot.common.noData")} />
                </View>
                <View style={styles.actionRow}>
                  <Pressable style={[styles.inlineAction, { backgroundColor: theme.primarySoft }]} onPress={() => runScheduleNow(schedule)}>
                    <Play color={theme.primary} size={14} />
                    <Text style={[styles.inlineActionText, { color: theme.primary }]}>
                      {t("iot.cameraSchedules.runNow")}
                    </Text>
                  </Pressable>
                  <Pressable style={[styles.inlineAction, { backgroundColor: theme.primarySoft }]} onPress={() => editSchedule(schedule)}>
                    <Pencil color={theme.primary} size={14} />
                    <Text style={[styles.inlineActionText, { color: theme.primary }]}>
                      {t("iot.cameraSchedules.editSchedule")}
                    </Text>
                  </Pressable>
                  <Pressable style={[styles.dangerAction, { backgroundColor: theme.dangerSoft }]} onPress={() => deleteSchedule(schedule)}>
                    <Trash2 color={theme.danger} size={14} />
                    <Text style={[styles.dangerActionText, { color: theme.danger }]}>
                      {t("iot.cameraSchedules.deleteSchedule")}
                    </Text>
                  </Pressable>
                </View>
              </View>
            ))}
          </View>
        )}
      </View>

      <View style={[styles.form, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <Text style={[styles.subsectionTitle, { color: theme.text }]}>
          {editingScheduleId
            ? t("iot.cameraSchedules.editSchedule")
            : t("iot.cameraSchedules.create")}
        </Text>
        <Pressable
          disabled={!deviceUid || createScheduleMutation.isPending || updateScheduleMutation.isPending}
          onPress={submitSchedule}
          style={({ pressed }) => [
            styles.primaryButton,
            { backgroundColor: theme.primary },
            (!deviceUid || createScheduleMutation.isPending || updateScheduleMutation.isPending) &&
              styles.disabledButton,
            pressed && styles.pressedButton,
          ]}
        >
          {createScheduleMutation.isPending || updateScheduleMutation.isPending ? (
            <ActivityIndicator color={theme.primaryText} size="small" />
          ) : null}
          <Text style={[styles.primaryButtonText, { color: theme.primaryText }]}>
            {createScheduleMutation.isPending || updateScheduleMutation.isPending
              ? t("iot.cameraSchedules.creating")
              : editingScheduleId
                ? t("iot.cameraSchedules.saveSchedule")
                : t("iot.cameraSchedules.addSchedule")}
          </Text>
        </Pressable>

        <View style={styles.optionGroup}>
          <Text style={[styles.inputLabel, { color: theme.subtle }]}>{t("iot.cameraSchedules.timeOfDay")}</Text>
          <Pressable style={[styles.timePickerButton, { backgroundColor: theme.cardAlt, borderColor: theme.border }]} onPress={() => setShowTimePicker(true)}>
            <Clock color={theme.primary} size={18} />
            <Text style={[styles.timePickerText, { color: theme.text }]}>{timeOfDay.slice(0, 5)}</Text>
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
          style={[styles.input, { backgroundColor: theme.cardAlt, borderColor: theme.border, color: theme.text }]}
          value={uploadEndpoint}
          onChangeText={setUploadEndpoint}
        />
        <Text style={[styles.helperText, { color: theme.subtle }]}>{t("iot.cameraSchedules.customUploadHelp")}</Text>

        {formError ? <Text style={[styles.errorText, { color: theme.danger }]}>{formError}</Text> : null}

        {editingScheduleId ? (
          <Pressable style={styles.inlineButton} onPress={resetForm}>
            <Text style={[styles.inlineButtonText, { color: theme.primary }]}>{t("common.cancel")}</Text>
          </Pressable>
        ) : null}
      </View>

      <View style={styles.subsection}>
        <Text style={[styles.subsectionTitle, { color: theme.text }]}>{t("iot.devices.media.mediaHistory")}</Text>
        {mediaEvents.length === 0 ? (
          <IoTEmptyCard title={t("iot.devices.media.noEvents")} />
        ) : (
          <View style={styles.list}>
            {mediaEvents.map((media) => (
              <Pressable
                key={media.id}
                onPress={() => setSelectedMedia(media)}
                style={({ pressed }) => [
                  styles.historyItem,
                  { backgroundColor: theme.card, borderColor: theme.border },
                  pressed && styles.pressedButton,
                ]}
              >
                <MediaThumbnail media={media} compact />
                <View style={styles.historyContent}>
                  <View style={styles.rowBetween}>
                    <Text style={[styles.historyTitle, { color: theme.text }]}>
                      {media.display?.triggerTypeLabel ?? t("iot.common.unknown")}
                    </Text>
                    <IoTStatusBadge
                      label={media.display?.statusLabel ?? t("iot.common.unknownStatus")}
                      tone={mediaStatusTone(media.status)}
                    />
                  </View>
                  <Text style={[styles.metaText, { color: theme.subtle }]}>{media.display?.timestampLabel ?? t("iot.common.noData")}</Text>
                  <MediaAnalysis media={media} compact />
                  <View style={styles.viewDetailRow}>
                    <Eye color={theme.primary} size={14} />
                    <Text style={[styles.inlineActionText, { color: theme.primary }]}>{t("iot.devices.media.viewDetail")}</Text>
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
        deleting={deleteMediaMutation.isPending}
        onAnalyze={triggerAnalysis}
        onClose={() => setSelectedMedia(null)}
        onDelete={deleteMedia}
      />
    </View>
  );
}

function LatestMediaCard({ media }: { media?: DisplayableMedia | null }) {
  const { t } = useTranslation();
  const theme = useIotTheme();

  return (
    <View style={[styles.latestCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
      <MediaThumbnail media={media} />
      <View style={styles.latestInfo}>
        <View style={styles.rowBetween}>
          <Text style={[styles.latestTitle, { color: theme.text }]}>{t("iot.devices.media.latestImage")}</Text>
          {isDiseaseDetected(media) ? (
            <IoTStatusBadge
              icon={<ShieldAlert color={theme.tone("danger").text} size={14} />}
              label={t("iot.devices.media.alertBadge")}
              tone="danger"
            />
          ) : null}
        </View>
        {media ? (
          <>
            <IoTStatusBadge
              label={media.display?.statusLabel ?? t("iot.common.unknownStatus")}
              tone={mediaStatusTone(media.status)}
            />
            <MediaAnalysis media={media} />
          </>
        ) : (
          <Text style={[styles.muted, { color: theme.subtle }]}>{t("iot.devices.media.noImage")}</Text>
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
  const theme = useIotTheme();
  const directUrl = media?.fileUrl ?? media?.analysis?.fileUrl ?? null;
  const imageUrlQuery = useMediaImageUrl(directUrl ?? media?.fileId);
  const uri = imageUrlQuery.data;

  if (!uri) {
    return (
      <View
        style={[
          large
            ? styles.thumbnailPlaceholderLarge
            : compact
              ? styles.thumbnailPlaceholderSmall
              : styles.thumbnailPlaceholder,
          { backgroundColor: theme.cardAlt, borderColor: theme.border },
        ]}
      >
        {imageUrlQuery.isLoading ? (
          <ActivityIndicator color={theme.primary} size="small" />
        ) : (
          <Camera color={theme.muted} size={24} />
        )}
        <Text style={[styles.thumbnailText, { color: theme.subtle }]}>{t("iot.devices.media.placeholderImage")}</Text>
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
  const theme = useIotTheme();
  const analysis = media.analysis;
  const status = analysis?.analysisStatus ?? analysis?.status;

  if (!analysis && !status) {
    return <IoTStatusBadge label={t("iot.devices.media.noAnalysis")} tone="neutral" />;
  }

  return (
    <View style={styles.analysisBox}>
      <IoTStatusBadge
        label={media.display?.analysis.statusLabel ?? t("iot.common.unknownStatus")}
        tone={mediaStatusTone(status)}
      />
      {!compact && (analysis?.diseaseType || analysis?.diseaseName) ? (
        <Text style={[styles.metaText, { color: theme.subtle }]}>
          {t("iot.devices.media.diseaseType")}:{" "}
          {media.display?.analysis.diseaseLabel ?? t("iot.common.unknownValue")}
        </Text>
      ) : null}
      {!compact && analysis?.severity ? (
        <Text style={[styles.metaText, { color: theme.subtle }]}>
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
  const label =
    schedule.display?.enabledLabel ??
    (schedule.enabled ? t("iot.cameraSchedules.enabled") : t("iot.cameraSchedules.disabled"));

  return (
    <Pressable
      onPress={onPress}
      style={styles.statusPill}
    >
      <IoTStatusBadge label={label} tone={schedule.enabled ? "success" : "neutral"} />
    </Pressable>
  );
}

function ScheduleStat({ label, value }: { label: string; value: string }) {
  const theme = useIotTheme();

  return (
    <View style={[styles.scheduleStat, { backgroundColor: theme.cardAlt }]}>
      <Text style={[styles.scheduleStatLabel, { color: theme.muted }]}>{label}</Text>
      <Text style={[styles.scheduleStatValue, { color: theme.text }]}>{value}</Text>
    </View>
  );
}

function MediaDetailModal({
  media,
  analyzing,
  deleting,
  onAnalyze,
  onClose,
  onDelete,
}: {
  media: DisplayableMedia | null;
  analyzing: boolean;
  deleting: boolean;
  onAnalyze: (media: DeviceMediaEvent) => void;
  onClose: () => void;
  onDelete: (media: DeviceMediaEvent) => void;
}) {
  const { t } = useTranslation();
  const theme = useIotTheme();
  if (!media) return null;

  return (
    <Modal animationType="slide" visible={Boolean(media)} onRequestClose={onClose}>
      <ScrollView style={[styles.modalScreen, { backgroundColor: theme.background }]} contentContainerStyle={styles.modalContent}>
        <View style={styles.modalHeader}>
          <View>
            <Text style={[styles.title, { color: theme.text }]}>{t("iot.devices.media.detailTitle")}</Text>
            <Text style={[styles.subtitle, { color: theme.subtle }]}>{media.display?.timestampLabel ?? t("iot.common.noData")}</Text>
          </View>
          <Pressable style={[styles.closeButton, { backgroundColor: theme.cardAlt }]} onPress={onClose}>
            <X color={theme.text} size={20} />
          </Pressable>
        </View>

        <MediaThumbnail media={media} large />

        <View style={[styles.detailCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <InfoLine label={t("iot.devices.media.captureTime")} value={media.display?.capturedAt ?? media.display?.timestampLabel ?? t("iot.common.noData")} />
          <InfoLine label={t("iot.devices.media.uploadStatus")} value={media.display?.statusLabel ?? t("iot.common.unknownStatus")} />
          <InfoLine label={t("iot.devices.media.analysisStatus")} value={media.display?.analysis.statusLabel ?? t("iot.common.unknownStatus")} />
          <InfoLine label={t("iot.devices.media.diseaseType")} value={media.display?.analysis.diseaseLabel ?? t("iot.common.unknownValue")} />
          <InfoLine label={t("iot.devices.media.severity")} value={media.display?.analysis.severityLabel ?? t("iot.common.unknownStatus")} />
          <InfoLine label={t("iot.devices.media.fileSize")} value={media.display?.sizeLabel ?? t("iot.common.noData")} />
        </View>

        <IoTButton
          disabled={analyzing || deleting || (!media.fileId && !media.fileUrl)}
          icon={<Wand2 color={theme.primaryText} size={18} />}
          label={analyzing ? t("iot.devices.media.analyzing") : t("iot.devices.media.triggerAnalysis")}
          loading={analyzing}
          onPress={() => onAnalyze(media)}
        />
        <IoTButton
          disabled={analyzing || deleting}
          icon={<Trash2 color={theme.danger} size={18} />}
          label={deleting ? t("iot.devices.media.deleting", { defaultValue: "Đang xóa..." }) : t("iot.devices.media.deleteAction", { defaultValue: "Xóa ảnh" })}
          loading={deleting}
          onPress={() => onDelete(media)}
          tone="danger"
        />
      </ScrollView>
    </Modal>
  );
}

function InfoLine({ label, value }: { label: string; value: string }) {
  const theme = useIotTheme();

  return (
    <View style={[styles.infoLine, { borderBottomColor: theme.border }]}>
      <Text style={[styles.infoLabel, { color: theme.muted }]}>{label}</Text>
      <Text style={[styles.infoValue, { color: theme.text }]}>{value}</Text>
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
  cardTitleWrap: {
    flex: 1,
    minWidth: 0,
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
