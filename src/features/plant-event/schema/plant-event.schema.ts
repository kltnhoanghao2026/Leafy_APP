import { z } from "zod";
import type { TFunction } from "i18next";

const optionalString = z.string().optional();

const isEmptyOrDate = (value?: string) => {
  if (!value?.trim()) return true;
  return /^\d{4}-\d{2}-\d{2}$/.test(value.trim());
};

const isEmptyOrInteger = (value?: string) => {
  if (!value?.trim()) return true;
  const n = Number(value);
  return Number.isInteger(n);
};

const isEmptyOrNonNegativeInt = (value?: string) => {
  if (!value?.trim()) return true;
  const n = Number(value);
  return Number.isInteger(n) && n >= 0;
};

export const createPlantEventSchema = (t: TFunction) =>
  z.object({
    plantId: z.string().trim().optional(),

    farmPlotId: z.string().trim().optional(),

    farmZoneId: z.string().trim().optional(),

    targetType: z.enum(["FARM", "FARM_ZONE", "PLANT"]).optional(),

    eventType: z
      .string()
      .trim()
      .min(1, t("plantEvent.validation.eventTypeRequired")),

    note: z.string().trim().min(1, t("plantEvent.validation.noteRequired")),

    description: optionalString,
    isPlanned: z.boolean(),

    calculatedStartDate: optionalString.refine(
      isEmptyOrDate,
      t("plantEvent.validation.dateFormatInvalid"),
    ),
    calculatedEndDate: optionalString.refine(
      isEmptyOrDate,
      t("plantEvent.validation.dateFormatInvalid"),
    ),

    daysFromStart: optionalString.refine(
      isEmptyOrInteger,
      t("plantEvent.validation.daysFromStartInvalid"),
    ),
    durationDays: optionalString.refine(
      isEmptyOrNonNegativeInt,
      t("plantEvent.validation.durationDaysInvalid"),
    ),

    // Chemical safety fields (for TREATMENT_APPLICATION)
    phiDays: optionalString.refine(
      isEmptyOrNonNegativeInt,
      t("plantEvent.validation.phiDaysInvalid"),
    ),
    ppeRequired: optionalString,
    mrlNote: optionalString,
    estimatedCost: optionalString,

    sourcePlanId: optionalString,

    trackingGranularity: z
      .enum(["NONE", "ZONE", "PLANT"])
      .optional(),
    excludedPlantIds: z.array(z.string()).optional(),
    excludedFarmZoneIds: z.array(z.string()).optional(),
  });

export type PlantEventFormValues = z.infer<
  ReturnType<typeof createPlantEventSchema>
>;
