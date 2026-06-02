import { useCallback, useEffect, useMemo, useState } from "react";
import { Alert } from "react-native";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import * as ImagePicker from "expo-image-picker";
import type { ImagePickerAsset } from "expo-image-picker";

import { parseApiError } from "@/src/lib/error-handler";
import { plantEventApi } from "../api/plant-event.api";
import type {
  EventType,
  PlantEventCreateRequest,
  PlantEventUpdateRequest,
} from "../components/plant-event.types";
import type { PendingAttachment } from "../components/AttachmentGrid";
import {
  useCreatePlantEventMutation,
  usePlantEventById,
  useUpdatePlantEventMutation,
  useUploadPlantEventAttachmentsMutation,
} from "../queries";
import {
  createPlantEventSchema,
  type PlantEventFormValues,
} from "../schema/plant-event.schema";

const toSingleParam = (value?: string | string[]) =>
  Array.isArray(value) ? value[0] : value;

const toOptionalText = (value?: string) => {
  const trimmed = value?.trim();
  return trimmed || undefined;
};

const toOptionalInt = (value?: string) => {
  if (!value?.trim()) return undefined;
  const n = Number(value);
  return Number.isFinite(n) ? Math.round(n) : undefined;
};

const formFieldNames: (keyof PlantEventFormValues)[] = [
  "plantId",
  "farmPlotId",
  "farmZoneId",
  "targetType",
  "eventType",
  "note",
  "description",
  "isPlanned",
  "calculatedStartDate",
  "calculatedEndDate",
  "daysFromStart",
  "durationDays",
  "phiDays",
  "ppeRequired",
  "mrlNote",
  "estimatedCost",
  "sourcePlanId",
  "trackingGranularity",
  "excludedPlantIds",
  "excludedFarmZoneIds",
];

const defaultValues: PlantEventFormValues = {
  plantId: "",
  farmPlotId: "",
  farmZoneId: "",
  targetType: undefined,
  eventType: "",
  note: "",
  description: "",
  isPlanned: false,
  calculatedStartDate: "",
  calculatedEndDate: "",
  daysFromStart: "",
  durationDays: "",
  phiDays: "",
  ppeRequired: "",
  mrlNote: "",
  estimatedCost: "",
  sourcePlanId: "",
  trackingGranularity: "NONE",
  excludedPlantIds: [],
  excludedFarmZoneIds: [],
};

const buildCreatePayload = (
  values: PlantEventFormValues,
): PlantEventCreateRequest => ({
  plantId: toOptionalText(values.plantId),
  farmPlotId: toOptionalText(values.farmPlotId),
  farmZoneId: toOptionalText(values.farmZoneId),
  targetType: values.targetType,
  eventType: values.eventType.trim() as EventType,
  note: values.note.trim(),
  description: toOptionalText(values.description),
  isPlanned: values.isPlanned,
  calculatedStartDate: toOptionalText(values.calculatedStartDate),
  calculatedEndDate: toOptionalText(values.calculatedEndDate),
  daysFromStart: toOptionalInt(values.daysFromStart),
  durationDays: toOptionalInt(values.durationDays),
  phiDays: toOptionalInt(values.phiDays),
  ppeRequired: toOptionalText(values.ppeRequired),
  mrlNote: toOptionalText(values.mrlNote),
  estimatedCost: toOptionalText(values.estimatedCost),
  sourcePlanId: toOptionalText(values.sourcePlanId),
  trackingGranularity: values.trackingGranularity,
  excludedPlantIds: values.excludedPlantIds,
  excludedFarmZoneIds: values.excludedFarmZoneIds,
});

let attachmentIdCounter = 0;
const generateAttachmentId = () => `local-${++attachmentIdCounter}-${Date.now()}`;

export function usePlantEventFormScreen() {
  console.info("[PlantEventFormScreen] Hook mounted/updated");
  
  const { t } = useTranslation();
  const router = useRouter();

  const params = useLocalSearchParams<{
    id?: string | string[];
    plantId?: string | string[];
    plantName?: string | string[];
    farmPlotId?: string | string[];
    farmPlotName?: string | string[];
    farmZoneId?: string | string[];
    farmZoneName?: string | string[];
    targetType?: string | string[];
  }>();

  const eventId = toSingleParam(params.id);
  const routePlantId = toSingleParam(params.plantId) ?? "";
  const routePlantName = toSingleParam(params.plantName);
  const routeFarmPlotId = toSingleParam(params.farmPlotId) ?? "";
  const routeFarmPlotName = toSingleParam(params.farmPlotName);
  const routeFarmZoneId = toSingleParam(params.farmZoneId) ?? "";
  const routeFarmZoneName = toSingleParam(params.farmZoneName);
  const routeTargetType = toSingleParam(params.targetType) ?? "PLANT";
  const isEditMode = Boolean(eventId);

  const targetLabel =
    routeTargetType === "FARM_PLOT" && routeFarmPlotName
      ? routeFarmPlotName
      : routeTargetType === "FARM_ZONE" && routeFarmZoneName
        ? routeFarmZoneName
        : (routePlantName ?? undefined);

  const createEvent = useCreatePlantEventMutation();
  const updateEvent = useUpdatePlantEventMutation();
  const uploadAttachmentsMutation = useUploadPlantEventAttachmentsMutation();
  const {
    data: editingEvent,
    isLoading: isEditingEventLoading,
    isError: isEditingEventError,
    refetch: refetchEditingEvent,
  } = usePlantEventById(eventId ?? "");

  // Existing attachments (loaded from the event in edit mode)
  const [existingAttachments, setExistingAttachments] = useState<
    { fileId: string; url: string; isVideo?: boolean }[]
  >([]);

  // Pending attachments (newly selected, awaiting upload)
  const [pendingAttachments, setPendingAttachments] = useState<PendingAttachment[]>([]);

  // IDs of existing attachments that have been removed by the user
  const [_removedAttachmentIds, setRemovedAttachmentIds] = useState<string[]>([]);

  // Request gallery permissions
  const requestGalleryPermissions = async (): Promise<boolean> => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        t("plantEvent.attachments.permissionRequired"),
        t("plantEvent.attachments.galleryPermissionMessage"),
      );
      return false;
    }
    return true;
  };

  // Request camera permissions
  const requestCameraPermissions = async (): Promise<boolean> => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        t("plantEvent.attachments.permissionRequired"),
        t("plantEvent.attachments.cameraPermissionMessage"),
      );
      return false;
    }
    return true;
  };

  // Pick images/videos from gallery
  const handlePickAttachments = useCallback(async () => {
    const hasPermission = await requestGalleryPermissions();
    if (!hasPermission) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images", "videos"],
      allowsMultipleSelection: true,
      quality: 0.8,
      selectionLimit: 10,
    });

    if (!result.canceled && result.assets.length > 0) {
      const newPending = result.assets.map((asset) => ({
        id: generateAttachmentId(),
        uri: asset.uri,
        fileName: asset.fileName,
        mimeType: asset.mimeType,
        uploading: false,
        error: false,
      }));
      setPendingAttachments((prev) => [...prev, ...newPending]);
    }
  }, [t]);

  // Capture image/video from camera
  const handleCaptureAttachment = useCallback(async () => {
    const hasPermission = await requestCameraPermissions();
    if (!hasPermission) return;

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ["images", "videos"],
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets.length > 0) {
      const newPending = result.assets.map((asset) => ({
        id: generateAttachmentId(),
        uri: asset.uri,
        fileName: asset.fileName,
        mimeType: asset.mimeType,
        uploading: false,
        error: false,
      }));
      setPendingAttachments((prev) => [...prev, ...newPending]);
    }
  }, [t]);

  // Remove a pending (new) attachment
  const handleRemovePendingAttachment = useCallback((id: string) => {
    setPendingAttachments((prev) => prev.filter((a) => a.id !== id));
  }, []);

  // Remove an existing attachment
  const handleRemoveExistingAttachment = useCallback((fileId: string) => {
    setRemovedAttachmentIds((prev) => [...prev, fileId]);
    setExistingAttachments((prev) => prev.filter((a) => a.fileId !== fileId));
  }, []);

  // Check if any attachments are currently uploading
  const isUploadingAttachments = useMemo(() => {
    return pendingAttachments.some((a) => a.uploading);
  }, [pendingAttachments]);

  // Check if any attachments have failed to upload
  const hasUploadErrors = useMemo(() => {
    return pendingAttachments.some((a) => a.error);
  }, [pendingAttachments]);

  // Upload pending assets and return new attachment IDs
  const uploadPendingAssets = useCallback(async (): Promise<string[]> => {
    if (pendingAttachments.length === 0) return [];

    console.info("[AttachmentGrid] Starting upload for", pendingAttachments.length, "files");

    // Mark all as uploading
    setPendingAttachments((prev) =>
      prev.map((a) => ({ ...a, uploading: true })),
    );

    try {
      const assetsToUpload = pendingAttachments.map((a) => ({
        uri: a.uri,
        fileName: a.fileName,
        mimeType: a.mimeType,
      } as ImagePickerAsset));

      console.info("[AttachmentGrid] Uploading assets:", assetsToUpload);

      const results = await uploadAttachmentsMutation.mutateAsync(assetsToUpload);

      console.info("[AttachmentGrid] Upload results:", results);

      // Mark all as successfully uploaded
      setPendingAttachments((prev) =>
        prev.map((a) => ({ ...a, uploading: false })),
      );

      // Return the file IDs
      const fileIds = results.map((r) => r.fileId);
      console.info("[AttachmentGrid] Returning file IDs:", fileIds);
      return fileIds;
    } catch (error) {
      console.error("[AttachmentGrid] Upload failed:", error);
      // Mark all as failed
      setPendingAttachments((prev) =>
        prev.map((a) => ({ ...a, uploading: false, error: true })),
      );
      throw error;
    }
  }, [pendingAttachments, uploadAttachmentsMutation]);

  // Retry upload for a specific failed attachment
  const retryUploadAttachment = useCallback(
    async (id: string) => {
      const attachment = pendingAttachments.find((a) => a.id === id);
      if (!attachment) return;

      // Mark as uploading
      setPendingAttachments((prev) =>
        prev.map((a) => (a.id === id ? { ...a, uploading: true, error: false } : a)),
      );

      try {
        const results = await uploadAttachmentsMutation.mutateAsync([
          {
            uri: attachment.uri,
            fileName: attachment.fileName,
            mimeType: attachment.mimeType,
          } as ImagePickerAsset,
        ]);

        // Mark as uploaded successfully
        setPendingAttachments((prev) =>
          prev.map((a) => (a.id === id ? { ...a, uploading: false } : a)),
        );

        return results[0]?.fileId;
      } catch (error) {
        // Mark as failed
        setPendingAttachments((prev) =>
          prev.map((a) => (a.id === id ? { ...a, uploading: false, error: true } : a)),
        );
        throw error;
      }
    },
    [pendingAttachments, uploadAttachmentsMutation],
  );

  const eventSchema = useMemo(() => createPlantEventSchema(t), [t]);

  const {
    control,
    handleSubmit,
    setError,
    clearErrors,
    setValue,
    watch,
    reset,
    formState: { errors, isDirty, isSubmitting, isValid },
  } = useForm<PlantEventFormValues>({
    resolver: zodResolver(eventSchema),
    mode: "onChange",
    defaultValues,
  });

  // Pre-fill target IDs from route params
  useEffect(() => {
    if (isEditMode) return;
    if (routePlantId) {
      setValue("plantId", routePlantId, {
        shouldValidate: true,
        shouldDirty: false,
      });
    }
    if (routeFarmPlotId) {
      setValue("farmPlotId", routeFarmPlotId, {
        shouldValidate: true,
        shouldDirty: false,
      });
    }
    if (routeFarmZoneId) {
      setValue("farmZoneId", routeFarmZoneId, {
        shouldValidate: true,
        shouldDirty: false,
      });
    }

    // Explicit target mapping for new tracking logic
    let targetType: any = undefined;
    if (routeTargetType === "FARM_PLOT") targetType = "FARM";
    else if (routeTargetType === "FARM_ZONE") targetType = "FARM_ZONE";
    else if (routeTargetType === "PLANT") targetType = "PLANT";

    if (targetType) {
      setValue("targetType", targetType, { shouldDirty: false });
    }
  }, [isEditMode, routePlantId, routeFarmPlotId, routeFarmZoneId, routeTargetType, setValue]);

  // Populate form in edit mode
  useEffect(() => {
    if (!isEditMode || !editingEvent) return;

    reset({
      plantId: editingEvent.plantId ?? "",
      farmPlotId: editingEvent.farmPlotId ?? "",
      farmZoneId: editingEvent.farmZoneId ?? "",
      targetType: editingEvent.targetType ?? undefined,
      eventType: editingEvent.eventType ?? "",
      note: editingEvent.note ?? "",
      description: editingEvent.description ?? "",
      isPlanned: editingEvent.planned ?? false,
      calculatedStartDate: editingEvent.calculatedStartDate ?? "",
      calculatedEndDate: editingEvent.calculatedEndDate ?? "",
      daysFromStart:
        editingEvent.daysFromStart != null
          ? String(editingEvent.daysFromStart)
          : "",
      durationDays:
        editingEvent.durationDays != null
          ? String(editingEvent.durationDays)
          : "",
      phiDays: editingEvent.phiDays != null ? String(editingEvent.phiDays) : "",
      ppeRequired: editingEvent.ppeRequired ?? "",
      mrlNote: editingEvent.mrlNote ?? "",
      estimatedCost: editingEvent.estimatedCost ?? "",
      sourcePlanId: editingEvent.sourcePlanId ?? "",
      trackingGranularity: editingEvent.trackingGranularity ?? "NONE",
      excludedPlantIds: editingEvent.excludedPlantIds ?? [],
      excludedFarmZoneIds: editingEvent.excludedFarmZoneIds ?? [],
    });
  }, [editingEvent, isEditMode, reset]);

  // Load existing attachments when editing
  useEffect(() => {
    if (!isEditMode || !editingEvent?.attachmentIds?.length) {
      setExistingAttachments([]);
      return;
    }

    // Initialize with placeholder URLs
    const initialAttachments = editingEvent.attachmentIds.map((fileId) => ({
      fileId,
      url: "",
      isVideo: false,
    }));
    setExistingAttachments(initialAttachments);

    // Fetch presigned URLs for each attachment (same logic as PlantEventDetailScreen)
    const attachmentIds = editingEvent.attachmentIds ?? [];
    const fetchUrls = async () => {
      const urls: Record<string, string> = {};
      await Promise.all(
        attachmentIds.map(async (fileId) => {
          try {
            const url = await plantEventApi.getPresignedUrl(fileId);
            urls[fileId] = url;
          } catch {
            // Keep empty URL for failed fetches
          }
        }),
      );
      // Update attachments with resolved URLs
      setExistingAttachments((prev) =>
        prev.map((att) => ({
          ...att,
          url: urls[att.fileId] || "",
        })),
      );
    };
    fetchUrls();
  }, [editingEvent?.attachmentIds, isEditMode]);

  const selectedEventType = watch("eventType");
  const calculatedStartDateValue = watch("calculatedStartDate");

  // Auto-compute daysFromStart from calculatedStartDate
  const daysFromStartValue = useMemo(() => {
    const trimmed = calculatedStartDateValue?.trim();
    if (!trimmed) return null;
    const start = new Date(trimmed);
    if (isNaN(start.getTime())) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    start.setHours(0, 0, 0, 0);
    return Math.round((start.getTime() - today.getTime()) / 86_400_000);
  }, [calculatedStartDateValue]);

  useEffect(() => {
    setValue(
      "daysFromStart",
      daysFromStartValue !== null ? String(daysFromStartValue) : "",
      { shouldDirty: false },
    );
  }, [daysFromStartValue, setValue]);

  const handleSelectEventType = useCallback(
    (eventType: string) => {
      setValue("eventType", eventType, {
        shouldDirty: true,
        shouldValidate: true,
      });
    },
    [setValue],
  );

  const onSubmit = async (values: PlantEventFormValues) => {
    console.info("[PlantEventForm] onSubmit called", {
      pendingAttachmentsCount: pendingAttachments.length,
      existingAttachmentsCount: existingAttachments.length,
      hasUploadErrors,
    });
    clearErrors("root");

    // Check if there are any failed uploads that haven't been retried
    if (hasUploadErrors) {
      setError("root", {
        type: "manual",
        message: t("plantEvent.form.errors.hasFailedUploads"),
      });
      return;
    }

    try {
      let newAttachmentIds: string[] = [];

      // Upload any pending (new) attachments first
      if (pendingAttachments.length > 0) {
        console.info("[PlantEventForm] Starting upload of pending attachments");
        newAttachmentIds = await uploadPendingAssets();
        console.info("[PlantEventForm] Upload complete, got IDs:", newAttachmentIds);
      }

      const createPayload = buildCreatePayload(values);

      // Build final attachment list
      if (isEditMode) {
        if (!eventId) {
          setError("root", {
            type: "manual",
            message: t("plantEvent.form.errors.notFoundForUpdate"),
          });
          return;
        }

        const {
          plantId: _,
          farmPlotId: _fp,
          farmZoneId: _fz,
          ...updatePayload
        }: PlantEventUpdateRequest & {
          plantId?: string;
          farmPlotId?: string;
          farmZoneId?: string;
        } = createPayload;

        // For edit mode: merge existing attachments (that weren't removed) with new ones
        const finalAttachmentIds = [
          ...existingAttachments.map((a) => a.fileId),
          ...newAttachmentIds,
        ];

        await updateEvent.mutateAsync({
          eventId,
          body: {
            ...updatePayload,
            attachmentIds: finalAttachmentIds,
          },
        });

        // Clear pending attachments after successful update
        setPendingAttachments([]);
        setRemovedAttachmentIds([]);
      } else {
        // For create mode: include only new attachment IDs
        if (newAttachmentIds.length > 0) {
          (createPayload as PlantEventCreateRequest & { attachmentIds?: string[] }).attachmentIds = newAttachmentIds;
        }

        await createEvent.mutateAsync(createPayload);
      }

      if (router.canGoBack()) {
        router.back();
        return;
      }

      const nextParams: Record<string, string> = {};
      if (routePlantId) nextParams.plantId = routePlantId;
      if (routePlantName) nextParams.plantName = routePlantName;
      if (routeFarmPlotId) nextParams.farmPlotId = routeFarmPlotId;
      if (routeFarmPlotName) nextParams.farmPlotName = routeFarmPlotName;
      if (routeFarmZoneId) nextParams.farmZoneId = routeFarmZoneId;
      if (routeFarmZoneName) nextParams.farmZoneName = routeFarmZoneName;
      if (routeTargetType) nextParams.targetType = routeTargetType;

      router.replace({
        pathname: "/(main)/plant-events",
        params: nextParams,
      });
    } catch (error) {
      const parsed = parseApiError(error);
      const fieldErrors = parsed.fieldErrors ?? {};

      for (const [field, message] of Object.entries(fieldErrors)) {
        if (formFieldNames.includes(field as keyof PlantEventFormValues)) {
          setError(field as keyof PlantEventFormValues, {
            type: "server",
            message,
          });
        }
      }

      setError("root", {
        type: "server",
        message: parsed.message || t("plantEvent.form.errors.submitFailed"),
      });
    }
  };

  const handleCancel = () => {
    const fallbackToEventHub = () => {
      const nextParams: Record<string, string> = {};
      if (routePlantId) nextParams.plantId = routePlantId;
      if (routePlantName) nextParams.plantName = routePlantName;
      if (routeFarmPlotId) nextParams.farmPlotId = routeFarmPlotId;
      if (routeFarmPlotName) nextParams.farmPlotName = routeFarmPlotName;
      if (routeFarmZoneId) nextParams.farmZoneId = routeFarmZoneId;
      if (routeFarmZoneName) nextParams.farmZoneName = routeFarmZoneName;
      if (routeTargetType) nextParams.targetType = routeTargetType;

      router.replace({
        pathname: "/(main)/plant-events",
        params: nextParams,
      });
    };

    if (!isDirty) {
      if (router.canGoBack()) {
        router.back();
        return;
      }

      fallbackToEventHub();
      return;
    }

    Alert.alert(
      t("plantEvent.form.cancelConfirmTitle"),
      t("plantEvent.form.cancelConfirmMessage"),
      [
        { text: t("plantEvent.form.continueEditing"), style: "cancel" },
        {
          text: t("plantEvent.form.leave"),
          style: "destructive",
          onPress: () => {
            if (router.canGoBack()) {
              router.back();
              return;
            }

            fallbackToEventHub();
          },
        },
      ],
    );
  };

  const isLoading =
    isSubmitting || createEvent.isPending || updateEvent.isPending;
  const canSubmit =
    isValid && !isLoading && !(isEditMode && isEditingEventLoading);

  const formTitle = isEditMode
    ? t("plantEvent.form.titleEdit")
    : t("plantEvent.form.titleCreate");

  const submitButtonLabel = isEditMode
    ? t("plantEvent.form.submitEdit")
    : t("plantEvent.form.submitCreate");

  return {
    control,
    errors,
    isLoading,
    canSubmit,
    isEditMode,
    isEditingEventLoading,
    isEditingEventError,
    refetchEditingEvent,
    formTitle,
    submitButtonLabel,
    handleSubmit,
    onSubmit,
    handleCancel,
    selectedEventType,
    handleSelectEventType,
    routeTargetType,
    targetLabel,
    daysFromStartValue,
    setValue,
    watch,
    // Attachment state and handlers
    existingAttachments,
    pendingAttachments,
    handlePickAttachments,
    handleCaptureAttachment,
    handleRemovePendingAttachment,
    handleRemoveExistingAttachment,
    retryUploadAttachment,
    uploadAttachmentsMutation,
    isUploadingAttachments,
    hasUploadErrors,
  };
}
