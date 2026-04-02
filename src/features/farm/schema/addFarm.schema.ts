import { z } from "zod";
import type { TFunction } from "i18next";

const optionalString = z.string().optional();

const isEmptyOrNumber = (value?: string) => {
  if (!value?.trim()) return true;
  return Number.isFinite(Number(value));
};

export const createAddFarmSchema = (t: TFunction) =>
  z.object({
    name: z.string().trim().min(1, t("farm.validation.farmNameRequired")),
    description: optionalString,
    areaM2: optionalString
      .refine(isEmptyOrNumber, t("farm.validation.areaInvalid"))
      .refine((value) => {
        if (!value?.trim()) return true;
        return Number(value) >= 0;
      }, t("farm.validation.areaMin")),
    addressLine: optionalString,
    provinceCode: optionalString,
    districtCode: optionalString,
    wardCode: optionalString,
    latitude: optionalString
      .refine(isEmptyOrNumber, t("farm.validation.latitudeInvalid"))
      .refine((value) => {
        if (!value?.trim()) return true;
        const numeric = Number(value);
        return numeric >= -90 && numeric <= 90;
      }, t("farm.validation.latitudeRange")),
    longitude: optionalString
      .refine(isEmptyOrNumber, t("farm.validation.longitudeInvalid"))
      .refine((value) => {
        if (!value?.trim()) return true;
        const numeric = Number(value);
        return numeric >= -180 && numeric <= 180;
      }, t("farm.validation.longitudeRange")),
  });

export type AddFarmFormValues = z.infer<ReturnType<typeof createAddFarmSchema>>;
