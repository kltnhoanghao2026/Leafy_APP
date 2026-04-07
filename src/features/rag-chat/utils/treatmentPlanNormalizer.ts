import {
  EVENT_TYPE_VALUES,
  type EventType,
} from "@/src/features/plant-event/components/plant-event.types";

export type NormalizedScheduleEvent = {
  eventType?: EventType;
  daysFromNow?: number;
  durationDays?: number;
  note?: string;
  description?: string;
  isPlanned?: boolean;
  phiDays?: number;
  ppeRequired?: string;
  mrlNote?: string;
  estimatedCost?: string;
  farmPlotId?: string;
  farmZoneId?: string;
  sourcePlanId?: string;
  calculatedStartDate?: string;
  calculatedEndDate?: string;
};

export type TreatmentPlanSource = "websearch" | "documents";

export type NormalizedTreatmentPlan = {
  plantId?: string;
  diseaseName?: string;
  confidenceScore?: number;
  severityLevel?: string;
  urgency?: string;
  source?: TreatmentPlanSource;
  estimatedCost?: string;
  successIndicators?: string;
  requiredInputs: string[];
  safetyWarnings: string[];
  schedule: NormalizedScheduleEvent[];
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const getValue = (obj: Record<string, unknown>, keys: string[]): unknown => {
  for (const key of keys) {
    if (key in obj) {
      return obj[key];
    }
  }
  return undefined;
};

const asString = (value: unknown): string | undefined => {
  if (typeof value !== "string") {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
};

const asTreatmentPlanSource = (
  value: unknown,
): TreatmentPlanSource | undefined => {
  if (typeof value !== "string") {
    return undefined;
  }

  const normalized = value
    .trim()
    .toLowerCase()
    .replace(/[\s_-]+/g, "");
  if (normalized === "websearch") {
    return "websearch";
  }

  if (normalized === "document" || normalized === "documents") {
    return "documents";
  }

  return undefined;
};

const asNumber = (value: unknown): number | undefined => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return undefined;
};

const asBoolean = (value: unknown): boolean | undefined => {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (normalized === "true") {
      return true;
    }
    if (normalized === "false") {
      return false;
    }
  }

  return undefined;
};

const asStringArray = (value: unknown): string[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => asString(item))
    .filter((item): item is string => Boolean(item));
};

const isEventType = (value: unknown): value is EventType =>
  typeof value === "string" && EVENT_TYPE_VALUES.includes(value as EventType);

const normalizeScheduleEvent = (
  value: unknown,
): NormalizedScheduleEvent | null => {
  if (!isRecord(value)) {
    return null;
  }

  const rawEventType = getValue(value, ["eventType", "event_type"]);

  return {
    eventType: isEventType(rawEventType) ? rawEventType : undefined,
    daysFromNow: asNumber(getValue(value, ["daysFromNow", "days_from_now"])),
    durationDays: asNumber(getValue(value, ["durationDays", "duration_days"])),
    note: asString(getValue(value, ["note"])),
    description: asString(getValue(value, ["description"])),
    isPlanned:
      asBoolean(getValue(value, ["isPlanned", "is_planned"])) ??
      asBoolean(getValue(value, ["planned"])),
    phiDays: asNumber(getValue(value, ["phiDays", "phi_days"])),
    ppeRequired: asString(getValue(value, ["ppeRequired", "ppe_required"])),
    mrlNote: asString(getValue(value, ["mrlNote", "mrl_note"])),
    estimatedCost: asString(
      getValue(value, ["estimatedCost", "estimated_cost"]),
    ),
    farmPlotId: asString(getValue(value, ["farmPlotId", "farm_plot_id"])),
    farmZoneId: asString(getValue(value, ["farmZoneId", "farm_zone_id"])),
    sourcePlanId: asString(getValue(value, ["sourcePlanId", "source_plan_id"])),
    calculatedStartDate: asString(
      getValue(value, ["calculatedStartDate", "calculated_start_date"]),
    ),
    calculatedEndDate: asString(
      getValue(value, ["calculatedEndDate", "calculated_end_date"]),
    ),
  };
};

export const normalizeTreatmentPlan = (
  treatmentPlan: unknown,
  fallbackPlantId?: string,
): NormalizedTreatmentPlan | null => {
  if (!isRecord(treatmentPlan)) {
    return null;
  }

  const rawPlan = isRecord(treatmentPlan.plan)
    ? treatmentPlan.plan
    : treatmentPlan;

  const schedule = Array.isArray(rawPlan.schedule)
    ? rawPlan.schedule
        .map((item) => normalizeScheduleEvent(item))
        .filter((item): item is NormalizedScheduleEvent => item !== null)
    : [];

  return {
    plantId:
      asString(getValue(rawPlan, ["plantId", "plant_id"])) ??
      asString(getValue(treatmentPlan, ["plantId", "plant_id"])) ??
      fallbackPlantId,
    diseaseName:
      asString(getValue(rawPlan, ["diseaseName", "disease_name"])) ??
      asString(getValue(treatmentPlan, ["diseaseName", "disease_name"])),
    confidenceScore:
      asNumber(getValue(rawPlan, ["confidenceScore", "confidence_score"])) ??
      asNumber(
        getValue(treatmentPlan, ["confidenceScore", "confidence_score"]),
      ),
    severityLevel:
      asString(getValue(rawPlan, ["severityLevel", "severity_level"])) ??
      asString(getValue(treatmentPlan, ["severityLevel", "severity_level"])),
    urgency:
      asString(getValue(rawPlan, ["urgency"])) ??
      asString(getValue(treatmentPlan, ["urgency"])),
    source:
      asTreatmentPlanSource(
        getValue(rawPlan, ["source", "sourceType", "source_type"]),
      ) ??
      asTreatmentPlanSource(
        getValue(treatmentPlan, ["source", "sourceType", "source_type"]),
      ),
    estimatedCost:
      asString(getValue(rawPlan, ["estimatedCost", "estimated_cost"])) ??
      asString(getValue(treatmentPlan, ["estimatedCost", "estimated_cost"])),
    successIndicators:
      asString(
        getValue(rawPlan, ["successIndicators", "success_indicators"]),
      ) ??
      asString(
        getValue(treatmentPlan, ["successIndicators", "success_indicators"]),
      ),
    requiredInputs: asStringArray(
      getValue(rawPlan, ["requiredInputs", "required_inputs"]),
    ),
    safetyWarnings: asStringArray(
      getValue(rawPlan, ["safetyWarnings", "safety_warnings"]),
    ),
    schedule,
  };
};

export const formatConfidence = (value?: number): string | undefined => {
  if (value === undefined) {
    return undefined;
  }

  if (value >= 0 && value <= 1) {
    return `${Math.round(value * 100)}%`;
  }

  return `${Math.round(value)}%`;
};

export const toEventTypeLabel = (value: string): string =>
  value
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());
