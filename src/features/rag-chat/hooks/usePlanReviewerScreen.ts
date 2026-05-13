import { useEffect, useMemo, useState } from "react";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";

import { useAuthContext } from "@/src/features/auth/context/AuthContext";
import { usePlants } from "@/src/features/plant/queries";
import {
  useFarmPlotsByOwner,
  useFarmZonesByPlot,
} from "@/src/features/farm/queries";
import {
  EVENT_TYPE_VALUES,
  type EventTargetType,
  type EventType,
} from "@/src/features/plant-event/components/plant-event.types";
import { parseApiError } from "@/src/lib/error-handler";

import { useCreatePlan } from "../api/useCreatePlan";
import type { PlanCreateRequest } from "../api/plan-review.api";
import { usePlanReviewContext } from "../context/PlanReviewContext";

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export type EditableScheduleEvent = {
  eventType: EventType | "";
  note: string;
  description: string;
  isPlanned: boolean;
  daysFromNow: string;
  durationDays: string;
  calculatedStartDate: string;
  calculatedEndDate: string;
  phiDays: string;
  ppeRequired: string;
  mrlNote: string;
  estimatedCost: string;
  sourcePlanId: string;
};

type ValidationResult = {
  formError?: string;
  eventErrors: Record<number, string[]>;
};

type FarmPlot = { id: string; name: string };
type FarmZone = { id: string; zoneName: string };
type Plant = { id: string; nickName?: string | null; plantNumber: string };

const toOptionalText = (value?: string): string | undefined => {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
};

const toOptionalInt = (value?: string): number | undefined => {
  if (!value?.trim()) return undefined;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 0) return undefined;
  return parsed;
};

const toString = (value?: string | number) =>
  value === undefined || value === null ? "" : String(value);

const isEventType = (value: string): value is EventType =>
  EVENT_TYPE_VALUES.includes(value as EventType);

const toEditableEvent = (
  event: {
    eventType?: EventType;
    note?: string;
    description?: string;
    isPlanned?: boolean;
    daysFromNow?: number;
    durationDays?: number;
    calculatedStartDate?: string;
    calculatedEndDate?: string;
    phiDays?: number;
    ppeRequired?: string;
    mrlNote?: string;
    estimatedCost?: string;
    sourcePlanId?: string;
  },
  fallbackSourcePlanId?: string,
): EditableScheduleEvent => ({
  eventType: event.eventType ?? "",
  note: event.note ?? "",
  description: event.description ?? "",
  isPlanned: event.isPlanned ?? (event.daysFromNow ?? 0) > 0,
  daysFromNow: toString(event.daysFromNow),
  durationDays: toString(event.durationDays),
  calculatedStartDate: event.calculatedStartDate ?? "",
  calculatedEndDate: event.calculatedEndDate ?? "",
  phiDays: toString(event.phiDays),
  ppeRequired: event.ppeRequired ?? "",
  mrlNote: event.mrlNote ?? "",
  estimatedCost: event.estimatedCost ?? "",
  sourcePlanId: event.sourcePlanId ?? fallbackSourcePlanId ?? "",
});

const resolveInitialTargetType = (
  plantId?: string,
  farmPlotId?: string,
  farmZoneId?: string,
): EventTargetType => {
  if (plantId) return "PLANT";
  if (farmZoneId) return "FARM_ZONE";
  if (farmPlotId) return "FARM_PLOT";
  return "FARM_PLOT";
};

export function usePlanReviewerScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { profileId } = useAuthContext();

  const { draft, clearDraft } = usePlanReviewContext();
  const createPlan = useCreatePlan();

  const plan = draft?.plan ?? null;
  const firstScheduledEvent = plan?.schedule[0];

  const [targetType, setTargetTypeState] = useState<EventTargetType>(() =>
    resolveInitialTargetType(
      plan?.plantId,
      firstScheduledEvent?.farmPlotId,
      firstScheduledEvent?.farmZoneId,
    ),
  );
  const [selectedId, setSelectedId] = useState("");
  const [selectedName, setSelectedName] = useState("");
  const [selectedPlotIdForZones, setSelectedPlotIdForZones] = useState("");
  const [activeEventTypePickerIndex, setActiveEventTypePickerIndex] = useState<
    number | null
  >(null);
  const [formError, setFormError] = useState<string | undefined>();
  const [eventErrors, setEventErrors] = useState<Record<number, string[]>>({});

  const [schedule, setSchedule] = useState<EditableScheduleEvent[]>(
    () =>
      plan?.schedule?.map((event) =>
        toEditableEvent(event, draft?.savedPlanId),
      ) ?? [],
  );

  const farmPlotsQuery = useFarmPlotsByOwner(profileId ?? "");
  const plantsQuery = usePlants({ page: 0, size: 100 });
  const farmZonesQuery = useFarmZonesByPlot(selectedPlotIdForZones);

  const farmPlots = (farmPlotsQuery.data ?? []) as FarmPlot[];
  const plants = (plantsQuery.data?.content ?? []) as Plant[];
  const farmZones = (farmZonesQuery.data ?? []) as FarmZone[];

  useEffect(() => {
    if (!plan) {
      return;
    }

    setSchedule(
      plan.schedule.map((event) => toEditableEvent(event, draft?.savedPlanId)),
    );

    const nextTargetType = resolveInitialTargetType(
      plan.plantId,
      firstScheduledEvent?.farmPlotId,
      firstScheduledEvent?.farmZoneId,
    );
    setTargetTypeState(nextTargetType);

    if (nextTargetType === "PLANT") {
      setSelectedId(plan.plantId ?? "");
      setSelectedName(plan.plantId ?? "");
      return;
    }

    if (nextTargetType === "FARM_ZONE") {
      const zoneId = firstScheduledEvent?.farmZoneId ?? "";
      setSelectedId(zoneId);
      setSelectedName(zoneId);
      setSelectedPlotIdForZones(firstScheduledEvent?.farmPlotId ?? "");
      return;
    }

    const plotId = firstScheduledEvent?.farmPlotId ?? "";
    setSelectedId(plotId);
    setSelectedName(plotId);
  }, [
    draft?.savedPlanId,
    firstScheduledEvent?.farmPlotId,
    firstScheduledEvent?.farmZoneId,
    plan,
    plan?.plantId,
  ]);

  useEffect(() => {
    if (plantsQuery.isLoading || !selectedId || targetType !== "PLANT") {
      return;
    }

    const matchedPlant = plants.find((item) => item.id === selectedId);
    if (!matchedPlant) {
      setSelectedId("");
      setSelectedName("");
      return;
    }

    setSelectedName(matchedPlant.nickName ?? matchedPlant.plantNumber);
  }, [plants, plantsQuery.isLoading, selectedId, targetType]);

  useEffect(() => {
    if (targetType !== "FARM_PLOT" || !selectedId || farmPlotsQuery.isLoading) {
      return;
    }

    const matchedPlot = farmPlots.find((item) => item.id === selectedId);
    if (!matchedPlot) {
      setSelectedId("");
      setSelectedName("");
      return;
    }

    setSelectedName(matchedPlot.name);
  }, [farmPlots, farmPlotsQuery.isLoading, selectedId, targetType]);

  useEffect(() => {
    if (targetType !== "FARM_ZONE" || !selectedId || farmZonesQuery.isLoading) {
      return;
    }

    const matchedZone = farmZones.find((item) => item.id === selectedId);
    if (!matchedZone) {
      setSelectedId("");
      setSelectedName("");
      return;
    }

    setSelectedName(matchedZone.zoneName);
  }, [farmZones, farmZonesQuery.isLoading, selectedId, targetType]);

  useEffect(() => {
    if (!selectedId) return;

    if (targetType === "PLANT") {
      const plant = plants.find((item) => item.id === selectedId);
      if (plant) {
        setSelectedName(plant.nickName ?? plant.plantNumber);
      }
      return;
    }

    if (targetType === "FARM_PLOT") {
      const plot = farmPlots.find((item) => item.id === selectedId);
      if (plot) {
        setSelectedName(plot.name);
      }
      return;
    }

    if (targetType === "FARM_ZONE") {
      const zone = farmZones.find((item) => item.id === selectedId);
      if (zone) {
        setSelectedName(zone.zoneName);
      }
    }
  }, [farmPlots, farmZones, plants, selectedId, targetType]);

  useEffect(() => {
    if (!selectedId && targetType === "FARM_PLOT" && farmPlots.length > 0) {
      const firstPlot = farmPlots[0];
      setSelectedId(firstPlot.id);
      setSelectedName(firstPlot.name);
    }
  }, [farmPlots, selectedId, targetType]);

  const updateScheduleEvent = (
    index: number,
    patch: Partial<EditableScheduleEvent>,
  ) => {
    setSchedule((prev) =>
      prev.map((item, itemIndex) =>
        itemIndex === index
          ? {
              ...item,
              ...patch,
            }
          : item,
      ),
    );
  };

  const setTargetType = (nextTargetType: EventTargetType) => {
    setTargetTypeState(nextTargetType);
    setSelectedId("");
    setSelectedName("");
    if (nextTargetType !== "FARM_ZONE") {
      setSelectedPlotIdForZones("");
    }
    setFormError(undefined);
  };

  const handleSelectTarget = (
    id: string,
    name: string,
    type: EventTargetType,
  ) => {
    setTargetTypeState(type);
    setSelectedId(id);
    setSelectedName(name);
    setFormError(undefined);
  };

  const validate = (): ValidationResult => {
    const nextEventErrors: Record<number, string[]> = {};

    if (!plan) {
      return {
        formError: t("ragChat.reviewer.errors.missingDraft"),
        eventErrors: nextEventErrors,
      };
    }

    if (!selectedId) {
      return {
        formError: t("ragChat.reviewer.errors.targetRequired"),
        eventErrors: nextEventErrors,
      };
    }

    const selectedTargetExists =
      targetType === "PLANT"
        ? plants.some((item) => item.id === selectedId)
        : targetType === "FARM_PLOT"
          ? farmPlots.some((item) => item.id === selectedId)
          : farmZonesQuery.isLoading
            ? true
            : farmZones.some((item) => item.id === selectedId);

    if (!selectedTargetExists) {
      return {
        formError: t("ragChat.reviewer.errors.targetRequired"),
        eventErrors: nextEventErrors,
      };
    }

    if (!plan.diseaseName?.trim()) {
      return {
        formError: t("ragChat.reviewer.errors.diseaseRequired"),
        eventErrors: nextEventErrors,
      };
    }

    if (schedule.length === 0) {
      return {
        formError: t("ragChat.reviewer.errors.scheduleRequired"),
        eventErrors: nextEventErrors,
      };
    }

    schedule.forEach((event, index) => {
      const errors: string[] = [];

      if (!event.eventType || !isEventType(event.eventType)) {
        errors.push(t("plantEvent.validation.eventTypeRequired"));
      }

      if (!event.note.trim()) {
        errors.push(t("plantEvent.validation.noteRequired"));
      }

      if (
        event.calculatedStartDate &&
        !DATE_PATTERN.test(event.calculatedStartDate)
      ) {
        errors.push(t("plantEvent.validation.dateFormatInvalid"));
      }

      if (
        event.calculatedEndDate &&
        !DATE_PATTERN.test(event.calculatedEndDate)
      ) {
        errors.push(t("plantEvent.validation.dateFormatInvalid"));
      }

      if (
        event.daysFromNow.trim() &&
        toOptionalInt(event.daysFromNow) === undefined
      ) {
        errors.push(t("plantEvent.validation.daysFromNowInvalid"));
      }

      if (
        event.durationDays.trim() &&
        toOptionalInt(event.durationDays) === undefined
      ) {
        errors.push(t("plantEvent.validation.durationDaysInvalid"));
      }

      if (event.phiDays.trim() && toOptionalInt(event.phiDays) === undefined) {
        errors.push(t("plantEvent.validation.phiDaysInvalid"));
      }

      if (errors.length > 0) {
        nextEventErrors[index] = errors;
      }
    });

    return {
      eventErrors: nextEventErrors,
    };
  };

  const submit = async () => {
    const validation = validate();
    setEventErrors(validation.eventErrors);
    setFormError(validation.formError);

    const hasEventErrors = Object.keys(validation.eventErrors).length > 0;
    if (validation.formError || hasEventErrors || !plan || !draft) {
      return;
    }

    const targetScope = {
      plantId: targetType === "PLANT" ? selectedId : undefined,
      farmPlotId: targetType === "FARM_PLOT" ? selectedId : undefined,
      farmZoneId: targetType === "FARM_ZONE" ? selectedId : undefined,
    };

    const schedulePayload: PlanCreateRequest["schedule"] =
      schedule.map((event) => ({
        eventType: event.eventType as EventType,
        note: event.note.trim(),
        description: toOptionalText(event.description),
        isPlanned: event.isPlanned,
        daysFromNow: toOptionalInt(event.daysFromNow),
        durationDays: toOptionalInt(event.durationDays),
        calculatedStartDate: toOptionalText(event.calculatedStartDate),
        calculatedEndDate: toOptionalText(event.calculatedEndDate),
        phiDays: toOptionalInt(event.phiDays),
        ppeRequired: toOptionalText(event.ppeRequired),
        mrlNote: toOptionalText(event.mrlNote),
        estimatedCost: toOptionalText(event.estimatedCost),
        sourcePlanId: toOptionalText(event.sourcePlanId) ?? draft.savedPlanId,
      }));

    const payload: PlanCreateRequest = {
      ragPlanId: draft.savedPlanId,
      question: draft.sourceQuestion,
      source: plan.source,
      diseaseName: plan.diseaseName?.trim() ?? "",
      confidenceScore: plan.confidenceScore,
      severityLevel: toOptionalText(plan.severityLevel),
      urgency: toOptionalText(plan.urgency),
      requiredInputs: plan.requiredInputs,
      safetyWarnings: plan.safetyWarnings,
      successIndicators: toOptionalText(plan.successIndicators),
      estimatedCost: toOptionalText(plan.estimatedCost),
      ...targetScope,
      schedule: schedulePayload,
    };

    try {
      await createPlan.mutateAsync(payload);
      clearDraft();
      router.push({
        pathname: "/(main)/plant-events/calendar",
        params: {
          targetType,
          selectedId,
          selectedName: selectedName || selectedId,
        },
      });
    } catch (error) {
      const parsed = parseApiError(error);
      setFormError(parsed.message || t("ragChat.reviewer.errors.submitFailed"));
    }
  };

  const isSubmitting = createPlan.isPending;

  return {
    draft,
    plan,
    schedule,
    targetType,
    setTargetType,
    selectedId,
    selectedName,
    selectedPlotIdForZones,
    setSelectedPlotIdForZones,
    farmPlots,
    plants,
    farmZones,
    farmZonesLoading: farmZonesQuery.isLoading,
    updateScheduleEvent,
    handleSelectTarget,
    submit,
    formError,
    eventErrors,
    isSubmitting,
    activeEventTypePickerIndex,
    setActiveEventTypePickerIndex,
    clearDraft,
    router,
    t,
  };
}
