import { useCallback, useEffect, useMemo } from "react";
import { Alert } from "react-native";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useTranslation } from "react-i18next";

import { useAuthContext } from "@/src/features/auth/context/AuthContext";
import { useFarmPlotsByOwner } from "@/src/features/farm/queries";
import { parseApiError } from "@/src/lib/error-handler";
import {
  type PlantCreateRequest,
  type PlantUpdateRequest,
  fromApiLocalDateTime,
  getSpeciesLabel,
  normalizePlantStatus,
  toApiLocalDateTime,
} from "../components/plant.types";
import {
  useCreatePlantMutation,
  usePlantById,
  useSpecies,
  useUpdatePlantMutation,
} from "../queries";
import {
  createPlantSchema,
  type PlantFormValues,
} from "../schema/plant.schema";

const toSingleParam = (value?: string | string[]) =>
  Array.isArray(value) ? value[0] : value;

const toOptionalText = (value?: string) => {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
};

const toOptionalNumber = (value?: string) => {
  if (!value?.trim()) return undefined;
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : undefined;
};

const formFieldNames: Array<keyof PlantFormValues> = [
  "plantNumber",
  "plantStatus",
  "speciesId",
  "farmPlotId",
  "nickName",
  "tagCode",
  "batchNumber",
  "sourceType",
  "motherPlantId",
  "plantingDate",
  "germinationDate",
  "actualHarvestDate",
  "totalYieldKg",
];

const defaultValues: PlantFormValues = {
  plantNumber: "",
  plantStatus: "ACTIVE",
  speciesId: "",
  farmPlotId: "",
  nickName: "",
  tagCode: "",
  batchNumber: "",
  sourceType: "",
  motherPlantId: "",
  plantingDate: "",
  germinationDate: "",
  actualHarvestDate: "",
  totalYieldKg: "",
};

const buildCreatePayload = (values: PlantFormValues): PlantCreateRequest => ({
  plantNumber: values.plantNumber.trim(),
  plantStatus: normalizePlantStatus(values.plantStatus),
  speciesId: values.speciesId.trim(),
  farmPlotId: values.farmPlotId.trim(),
  nickName: toOptionalText(values.nickName),
  tagCode: toOptionalText(values.tagCode),
  batchNumber: toOptionalText(values.batchNumber),
  sourceType: toOptionalText(values.sourceType),
  motherPlantId: toOptionalText(values.motherPlantId),
  plantingDate: toApiLocalDateTime(values.plantingDate),
  germinationDate: toApiLocalDateTime(values.germinationDate),
  actualHarvestDate: toApiLocalDateTime(values.actualHarvestDate),
  totalYieldKg: toOptionalNumber(values.totalYieldKg),
});

export function usePlantFormScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { profileId } = useAuthContext();

  const params = useLocalSearchParams<{
    id?: string | string[];
    farmPlotId?: string | string[];
    farmName?: string | string[];
  }>();

  const plantId = toSingleParam(params.id);
  const routeFarmPlotId = toSingleParam(params.farmPlotId);
  const routeFarmName = toSingleParam(params.farmName);
  const isEditMode = Boolean(plantId);

  const {
    data: farmPlots,
    isLoading: isFarmPlotsLoading,
    isError: isFarmPlotsError,
    refetch: refetchFarmPlots,
  } = useFarmPlotsByOwner(profileId ?? "");

  const createPlant = useCreatePlantMutation();
  const updatePlant = useUpdatePlantMutation();
  const {
    data: editingPlant,
    isLoading: isEditingPlantLoading,
    isError: isEditingPlantError,
    refetch: refetchEditingPlant,
  } = usePlantById(plantId ?? "");

  const {
    data: speciesPage,
    isLoading: isSpeciesLoading,
    isError: isSpeciesError,
    refetch: refetchSpecies,
  } = useSpecies({
    page: 0,
    size: 100,
    sortBy: "commonName",
    sortDir: "ASC",
  });

  const speciesOptions = useMemo(
    () =>
      (speciesPage?.content ?? []).map((species) => ({
        id: species.id,
        label: getSpeciesLabel(species),
      })),
    [speciesPage?.content],
  );

  const farmPlotOptions = useMemo(
    () =>
      (farmPlots ?? []).map((plot) => ({
        id: plot.id,
        label: `${plot.name} (${plot.code})`,
        address: plot.addressLine?.trim() || undefined,
      })),
    [farmPlots],
  );

  const plantSchema = useMemo(() => createPlantSchema(t), [t]);

  const {
    control,
    handleSubmit,
    setError,
    clearErrors,
    setValue,
    watch,
    reset,
    formState: { errors, isDirty, isSubmitting, isValid },
  } = useForm<PlantFormValues>({
    resolver: zodResolver(plantSchema),
    mode: "onChange",
    defaultValues,
  });

  useEffect(() => {
    if (isEditMode || !routeFarmPlotId) return;

    setValue("farmPlotId", routeFarmPlotId, {
      shouldValidate: true,
      shouldDirty: false,
    });
  }, [isEditMode, routeFarmPlotId, setValue]);

  useEffect(() => {
    if (!isEditMode || !editingPlant) return;

    reset({
      plantNumber: editingPlant.plantNumber ?? "",
      plantStatus: normalizePlantStatus(editingPlant.plantStatus),
      speciesId: editingPlant.speciesId ?? "",
      farmPlotId: editingPlant.farmPlotId ?? "",
      nickName: editingPlant.nickName ?? "",
      tagCode: editingPlant.tagCode ?? "",
      batchNumber: editingPlant.batchNumber ?? "",
      sourceType: editingPlant.sourceType ?? "",
      motherPlantId: editingPlant.motherPlantId ?? "",
      plantingDate: fromApiLocalDateTime(editingPlant.plantingDate),
      germinationDate: fromApiLocalDateTime(editingPlant.germinationDate),
      actualHarvestDate: fromApiLocalDateTime(editingPlant.actualHarvestDate),
      totalYieldKg:
        editingPlant.totalYieldKg !== null &&
        editingPlant.totalYieldKg !== undefined
          ? String(editingPlant.totalYieldKg)
          : "",
    });
  }, [editingPlant, isEditMode, reset]);

  const selectedSpeciesId = watch("speciesId");
  const selectedFarmPlotId = watch("farmPlotId");

  const selectedSpeciesLabel = useMemo(
    () =>
      speciesOptions.find((species) => species.id === selectedSpeciesId)
        ?.label ?? "",
    [selectedSpeciesId, speciesOptions],
  );

  const selectedFarmPlotLabel = useMemo(
    () =>
      farmPlotOptions.find((farmPlot) => farmPlot.id === selectedFarmPlotId)
        ?.label ?? "",
    [selectedFarmPlotId, farmPlotOptions],
  );

  const handleSelectSpecies = useCallback(
    (speciesId: string) => {
      setValue("speciesId", speciesId, {
        shouldDirty: true,
        shouldValidate: true,
      });
    },
    [setValue],
  );

  const handleSelectFarmPlot = useCallback(
    (farmPlotId: string) => {
      setValue("farmPlotId", farmPlotId, {
        shouldDirty: true,
        shouldValidate: true,
      });
    },
    [setValue],
  );

  const onSubmit = async (values: PlantFormValues) => {
    clearErrors("root");

    try {
      const createPayload = buildCreatePayload(values);

      if (isEditMode) {
        if (!plantId) {
          setError("root", {
            type: "manual",
            message: t("plant.form.errors.notFoundForUpdate"),
          });
          return;
        }

        const updatePayload: PlantUpdateRequest = {
          ...createPayload,
        };

        await updatePlant.mutateAsync({ id: plantId, body: updatePayload });
      } else {
        await createPlant.mutateAsync(createPayload);
      }

      if (router.canGoBack()) {
        router.back();
        return;
      }

      const targetFarmPlotId =
        createPayload.farmPlotId || routeFarmPlotId || editingPlant?.farmPlotId;

      if (targetFarmPlotId) {
        const nextParams: Record<string, string> = {
          farmPlotId: targetFarmPlotId,
        };

        if (routeFarmName) {
          nextParams.farmName = routeFarmName;
        }

        router.replace({
          pathname: "/(main)/plants",
          params: nextParams,
        });
        return;
      }

      router.replace("/(main)/plants");
    } catch (error) {
      const parsed = parseApiError(error);
      const fieldErrors = parsed.fieldErrors ?? {};

      for (const [field, message] of Object.entries(fieldErrors)) {
        if (formFieldNames.includes(field as keyof PlantFormValues)) {
          setError(field as keyof PlantFormValues, {
            type: "server",
            message,
          });
        }
      }

      setError("root", {
        type: "server",
        message: parsed.message || t("plant.form.errors.submitFailed"),
      });
    }
  };

  const handleCancel = () => {
    const fallbackToPlants = () => {
      if (routeFarmPlotId) {
        const nextParams: Record<string, string> = {
          farmPlotId: routeFarmPlotId,
        };

        if (routeFarmName) {
          nextParams.farmName = routeFarmName;
        }

        router.replace({
          pathname: "/(main)/plants",
          params: nextParams,
        });
        return;
      }

      router.replace("/(main)/plants");
    };

    if (!isDirty) {
      if (router.canGoBack()) {
        router.back();
        return;
      }

      fallbackToPlants();
      return;
    }

    Alert.alert(
      t("plant.form.cancelConfirmTitle"),
      t("plant.form.cancelConfirmMessage"),
      [
        {
          text: t("plant.form.continueEditing"),
          style: "cancel",
        },
        {
          text: t("plant.form.leave"),
          style: "destructive",
          onPress: () => {
            if (router.canGoBack()) {
              router.back();
              return;
            }

            fallbackToPlants();
          },
        },
      ],
    );
  };

  const isLoading =
    isSubmitting || createPlant.isPending || updatePlant.isPending;
  const canSubmit =
    isValid && !isLoading && !(isEditMode && isEditingPlantLoading);

  const formTitle = isEditMode
    ? t("plant.form.titleEdit")
    : t("plant.form.titleCreate");

  const submitButtonLabel = isEditMode
    ? t("plant.form.submitEdit")
    : t("plant.form.submitCreate");

  return {
    control,
    errors,
    isLoading,
    canSubmit,
    isEditMode,
    isEditingPlantLoading,
    isEditingPlantError,
    refetchEditingPlant,
    formTitle,
    submitButtonLabel,
    handleSubmit,
    onSubmit,
    handleCancel,
    speciesOptions,
    isSpeciesLoading,
    isSpeciesError,
    refetchSpecies,
    selectedSpeciesId,
    selectedSpeciesLabel,
    handleSelectSpecies,
    farmPlotOptions,
    isFarmPlotsLoading,
    isFarmPlotsError,
    refetchFarmPlots,
    selectedFarmPlotId,
    selectedFarmPlotLabel,
    handleSelectFarmPlot,
    routeFarmName,
  };
}

export type UsePlantFormScreenResult = ReturnType<typeof usePlantFormScreen>;
