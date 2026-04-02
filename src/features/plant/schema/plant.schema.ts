import { z } from "zod";
import type { TFunction } from "i18next";
import {
  PLANT_STATUS_VALUES,
  type PlantStatus,
} from "../components/plant.types";

const optionalString = z.string().optional();

const isEmptyOrNumber = (value?: string) => {
  if (!value?.trim()) return true;
  return Number.isFinite(Number(value));
};

const isEmptyOrLocalDateTime = (value?: string) => {
  if (!value?.trim()) return true;
  const normalized = value.trim().replace(" ", "T");

  return (
    /^\d{4}-\d{2}-\d{2}$/.test(normalized) ||
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(normalized) ||
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/.test(normalized)
  );
};

const isPlantStatus = (value: string) =>
  PLANT_STATUS_VALUES.includes(value as PlantStatus);

export const createPlantSchema = (t: TFunction) =>
  z.object({
    plantNumber: z
      .string()
      .trim()
      .min(1, t("plant.validation.plantNumberRequired")),
    plantStatus: z
      .string()
      .trim()
      .min(1, t("plant.validation.plantStatusRequired"))
      .refine(isPlantStatus, t("plant.validation.plantStatusInvalid")),
    speciesId: z.string().trim().min(1, t("plant.validation.speciesRequired")),
    farmPlotId: z
      .string()
      .trim()
      .min(1, t("plant.validation.farmPlotRequired")),

    nickName: optionalString,
    tagCode: optionalString,
    batchNumber: optionalString,
    sourceType: optionalString,
    motherPlantId: optionalString,

    plantingDate: optionalString.refine(
      isEmptyOrLocalDateTime,
      t("plant.validation.dateFormatInvalid"),
    ),
    germinationDate: optionalString.refine(
      isEmptyOrLocalDateTime,
      t("plant.validation.dateFormatInvalid"),
    ),
    actualHarvestDate: optionalString.refine(
      isEmptyOrLocalDateTime,
      t("plant.validation.dateFormatInvalid"),
    ),

    totalYieldKg: optionalString
      .refine(isEmptyOrNumber, t("plant.validation.totalYieldInvalid"))
      .refine((value) => {
        if (!value?.trim()) return true;
        return Number(value) >= 0;
      }, t("plant.validation.totalYieldMin")),
  });

export type PlantFormValues = z.infer<ReturnType<typeof createPlantSchema>>;
