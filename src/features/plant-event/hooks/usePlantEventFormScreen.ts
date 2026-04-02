import { useCallback, useEffect, useMemo } from "react";
import { Alert } from "react-native";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useTranslation } from "react-i18next";

import { parseApiError } from "@/src/lib/error-handler";
import type {
  EventType,
  PlantEventCreateRequest,
  PlantEventUpdateRequest,
} from "../components/plant-event.types";
import {
  useCreatePlantEventMutation,
  usePlantEventById,
  useUpdatePlantEventMutation,
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

const formFieldNames: Array<keyof PlantEventFormValues> = [
  "plantId",
  "farmPlotId",
  "farmZoneId",
  "eventType",
  "note",
  "description",
  "isPlanned",
  "calculatedStartDate",
  "calculatedEndDate",
  "daysFromNow",
  "durationDays",
  "phiDays",
  "ppeRequired",
  "mrlNote",
  "estimatedCost",
  "sourcePlanId",
];

const defaultValues: PlantEventFormValues = {
  plantId: "",
  farmPlotId: "",
  farmZoneId: "",
  eventType: "",
  note: "",
  description: "",
  isPlanned: false,
  calculatedStartDate: "",
  calculatedEndDate: "",
  daysFromNow: "",
  durationDays: "",
  phiDays: "",
  ppeRequired: "",
  mrlNote: "",
  estimatedCost: "",
  sourcePlanId: "",
};

const buildCreatePayload = (
  values: PlantEventFormValues,
): PlantEventCreateRequest => ({
  plantId: toOptionalText(values.plantId),
  farmPlotId: toOptionalText(values.farmPlotId),
  farmZoneId: toOptionalText(values.farmZoneId),
  eventType: values.eventType.trim() as EventType,
  note: values.note.trim(),
  description: toOptionalText(values.description),
  isPlanned: values.isPlanned,
  calculatedStartDate: toOptionalText(values.calculatedStartDate),
  calculatedEndDate: toOptionalText(values.calculatedEndDate),
  daysFromNow: toOptionalInt(values.daysFromNow),
  durationDays: toOptionalInt(values.durationDays),
  phiDays: toOptionalInt(values.phiDays),
  ppeRequired: toOptionalText(values.ppeRequired),
  mrlNote: toOptionalText(values.mrlNote),
  estimatedCost: toOptionalText(values.estimatedCost),
  sourcePlanId: toOptionalText(values.sourcePlanId),
});

export function usePlantEventFormScreen() {
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
  const {
    data: editingEvent,
    isLoading: isEditingEventLoading,
    isError: isEditingEventError,
    refetch: refetchEditingEvent,
  } = usePlantEventById(eventId ?? "");

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
  }, [isEditMode, routePlantId, routeFarmPlotId, routeFarmZoneId, setValue]);

  // Populate form in edit mode
  useEffect(() => {
    if (!isEditMode || !editingEvent) return;

    reset({
      plantId: editingEvent.plantId ?? "",
      farmPlotId: editingEvent.farmPlotId ?? "",
      farmZoneId: editingEvent.farmZoneId ?? "",
      eventType: editingEvent.eventType ?? "",
      note: editingEvent.note ?? "",
      description: editingEvent.description ?? "",
      isPlanned: editingEvent.planned ?? false,
      calculatedStartDate: editingEvent.calculatedStartDate ?? "",
      calculatedEndDate: editingEvent.calculatedEndDate ?? "",
      daysFromNow:
        editingEvent.daysFromNow != null
          ? String(editingEvent.daysFromNow)
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
    });
  }, [editingEvent, isEditMode, reset]);

  const selectedEventType = watch("eventType");

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
    clearErrors("root");

    try {
      const createPayload = buildCreatePayload(values);

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

        await updateEvent.mutateAsync({
          eventId,
          body: updatePayload,
        });
      } else {
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
    if (!isDirty) {
      router.back();
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
          onPress: () => router.back(),
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
  };
}
