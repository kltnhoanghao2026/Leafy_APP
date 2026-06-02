import { useCallback, useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Alert } from "react-native";
import * as Location from "expo-location";
import { useTranslation } from "react-i18next";

import Colors from "@/src/constants/Colors";
import { useColorScheme } from "@/src/hooks/useColorScheme";
import { parseApiError } from "@/src/lib/error-handler";
import { useAuthContext } from "@/src/features/auth/context/AuthContext";
import {
  useCreatePlotMutation,
  useFarmPlotById,
  useUpdatePlotMutation,
} from "@/src/features/farm/queries";
import {
  type CreateFarmPlotRequest,
  type UpdateFarmPlotRequest,
} from "@/src/features/farm/components/farm.types";
import {
  createAddFarmSchema,
  type AddFarmFormValues,
} from "../schema/addFarm.schema";

const toOptionalText = (value?: string) => {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
};

const toOptionalNumber = (value?: string) => {
  if (!value?.trim()) return undefined;
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : undefined;
};

const formFieldNames: (keyof AddFarmFormValues)[] = [
  "name",
  "description",
  "areaM2",
  "addressLine",
  "provinceCode",
  "districtCode",
  "wardCode",
  "latitude",
  "longitude",
];

type ProvinceItem = {
  code: number;
  name: string;
};

type DistrictItem = {
  code: number;
  name: string;
};

type WardItem = {
  code: number;
  name: string;
};

type ProvinceDetail = ProvinceItem & {
  districts?: DistrictItem[];
};

type DistrictDetail = DistrictItem & {
  wards?: WardItem[];
};

export type AdministrativeOption = {
  code: string;
  name: string;
};

const ADMIN_API_BASE = "https://provinces.open-api.vn/api";

const defaultFormValues: AddFarmFormValues = {
  name: "",
  description: "",
  areaM2: "",
  addressLine: "",
  provinceCode: "",
  districtCode: "",
  wardCode: "",
  latitude: "",
  longitude: "",
};

const normalizeText = (value?: string | null) =>
  (value ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(
      /\b(tp\.?|tinh|thanh pho|quan|huyen|thi xa|thi tran|phuong|xa)\b/g,
      "",
    )
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const isNameMatch = (source?: string | null, target?: string | null) => {
  const sourceNorm = normalizeText(source);
  const targetNorm = normalizeText(target);
  if (!sourceNorm || !targetNorm) return false;
  return (
    sourceNorm === targetNorm ||
    sourceNorm.includes(targetNorm) ||
    targetNorm.includes(sourceNorm)
  );
};

const fetchJson = async <T>(url: string): Promise<T> => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }
  return (await response.json()) as T;
};

const toOption = (item: {
  code: number;
  name: string;
}): AdministrativeOption => ({
  code: String(item.code),
  name: item.name,
});

const resolveAdministrativeCodes = async (
  place: Location.LocationGeocodedAddress,
) => {
  const provinces = await fetchJson<ProvinceItem[]>(`${ADMIN_API_BASE}/p/`);

  const provinceNameCandidates = [place.region, place.city, place.district];
  const province = provinces.find((p) =>
    provinceNameCandidates.some((candidate) => isNameMatch(candidate, p.name)),
  );

  if (!province) {
    return {
      provinceCode: undefined,
      districtCode: undefined,
      wardCode: undefined,
    };
  }

  const provinceDetail = await fetchJson<ProvinceDetail>(
    `${ADMIN_API_BASE}/p/${province.code}?depth=2`,
  );
  const districts = provinceDetail.districts ?? [];

  const districtNameCandidates = [place.district, place.subregion, place.city];
  const district = districts.find((d) =>
    districtNameCandidates.some((candidate) => isNameMatch(candidate, d.name)),
  );

  if (!district) {
    return {
      provinceCode: String(province.code),
      districtCode: undefined,
      wardCode: undefined,
    };
  }

  const districtDetail = await fetchJson<DistrictDetail>(
    `${ADMIN_API_BASE}/d/${district.code}?depth=2`,
  );
  const wards = districtDetail.wards ?? [];

  const wardNameCandidates = [place.subregion, place.name, place.street];
  const ward = wards.find((w) =>
    wardNameCandidates.some((candidate) => isNameMatch(candidate, w.name)),
  );

  return {
    provinceCode: String(province.code),
    districtCode: String(district.code),
    wardCode: ward ? String(ward.code) : undefined,
  };
};

export function useFarmFormScreen() {
  const { t } = useTranslation();
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const idParam = params.id;
  const farmId = Array.isArray(idParam) ? idParam[0] : idParam;
  const isEditMode = Boolean(farmId);

  const router = useRouter();
  const colorScheme = useColorScheme() ?? "light";
  const palette = Colors[colorScheme];
  const { profileId } = useAuthContext();
  const createPlotMutation = useCreatePlotMutation();
  const updatePlotMutation = useUpdatePlotMutation();
  const [isLocating, setIsLocating] = useState(false);
  const [provinceOptions, setProvinceOptions] = useState<
    AdministrativeOption[]
  >([]);
  const [districtOptions, setDistrictOptions] = useState<
    AdministrativeOption[]
  >([]);
  const [wardOptions, setWardOptions] = useState<AdministrativeOption[]>([]);
  const [isProvinceOptionsLoading, setIsProvinceOptionsLoading] =
    useState(false);
  const [isDistrictOptionsLoading, setIsDistrictOptionsLoading] =
    useState(false);
  const [isWardOptionsLoading, setIsWardOptionsLoading] = useState(false);
  const addFarmSchema = useMemo(() => createAddFarmSchema(t), [t]);

  const {
    control,
    handleSubmit,
    setError,
    clearErrors,
    setValue,
    reset,
    watch,
    formState: { errors, isDirty, isSubmitting, isValid },
  } = useForm<AddFarmFormValues>({
    resolver: zodResolver(addFarmSchema),
    mode: "onChange",
    defaultValues: defaultFormValues,
  });

  const {
    data: editingPlot,
    isLoading: isEditingPlotLoading,
    isError: isEditingPlotError,
    refetch: refetchEditingPlot,
  } = useFarmPlotById(farmId ?? "");

  const provinceCode = watch("provinceCode") || "";
  const districtCode = watch("districtCode") || "";
  const wardCode = watch("wardCode") || "";

  const loadProvinceOptions = useCallback(async () => {
    if (provinceOptions.length > 0 || isProvinceOptionsLoading) return;

    setIsProvinceOptionsLoading(true);
    try {
      const provinces = await fetchJson<ProvinceItem[]>(`${ADMIN_API_BASE}/p/`);
      setProvinceOptions(provinces.map(toOption));
    } finally {
      setIsProvinceOptionsLoading(false);
    }
  }, [provinceOptions.length, isProvinceOptionsLoading]);

  const loadDistrictOptions = useCallback(async (nextProvinceCode: string) => {
    if (!nextProvinceCode) {
      setDistrictOptions([]);
      return;
    }

    setIsDistrictOptionsLoading(true);
    try {
      const provinceDetail = await fetchJson<ProvinceDetail>(
        `${ADMIN_API_BASE}/p/${nextProvinceCode}?depth=2`,
      );
      setDistrictOptions((provinceDetail.districts ?? []).map(toOption));
    } finally {
      setIsDistrictOptionsLoading(false);
    }
  }, []);

  const loadWardOptions = useCallback(async (nextDistrictCode: string) => {
    if (!nextDistrictCode) {
      setWardOptions([]);
      return;
    }

    setIsWardOptionsLoading(true);
    try {
      const districtDetail = await fetchJson<DistrictDetail>(
        `${ADMIN_API_BASE}/d/${nextDistrictCode}?depth=2`,
      );
      setWardOptions((districtDetail.wards ?? []).map(toOption));
    } finally {
      setIsWardOptionsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadProvinceOptions();
  }, [loadProvinceOptions]);

  useEffect(() => {
    if (!provinceCode) {
      setDistrictOptions([]);
      return;
    }

    void loadDistrictOptions(provinceCode);
  }, [provinceCode, loadDistrictOptions]);

  useEffect(() => {
    if (!districtCode) {
      setWardOptions([]);
      return;
    }

    void loadWardOptions(districtCode);
  }, [districtCode, loadWardOptions]);

  useEffect(() => {
    if (!isEditMode || !editingPlot) return;

    reset({
      name: editingPlot.name ?? "",
      description: editingPlot.description ?? "",
      areaM2:
        editingPlot.areaM2 !== null && editingPlot.areaM2 !== undefined
          ? String(editingPlot.areaM2)
          : "",
      addressLine: editingPlot.addressLine ?? "",
      provinceCode: editingPlot.provinceCode ?? "",
      districtCode: editingPlot.districtCode ?? "",
      wardCode: editingPlot.wardCode ?? "",
      latitude:
        editingPlot.latitude !== null && editingPlot.latitude !== undefined
          ? String(editingPlot.latitude)
          : "",
      longitude:
        editingPlot.longitude !== null && editingPlot.longitude !== undefined
          ? String(editingPlot.longitude)
          : "",
    });
  }, [editingPlot, isEditMode, reset]);

  const handleSelectProvinceCode = useCallback(
    (nextProvinceCode: string) => {
      setValue("provinceCode", nextProvinceCode, {
        shouldDirty: true,
        shouldValidate: true,
      });

      setValue("districtCode", "", {
        shouldDirty: true,
        shouldValidate: true,
      });

      setValue("wardCode", "", {
        shouldDirty: true,
        shouldValidate: true,
      });
    },
    [setValue],
  );

  const handleSelectDistrictCode = useCallback(
    (nextDistrictCode: string) => {
      setValue("districtCode", nextDistrictCode, {
        shouldDirty: true,
        shouldValidate: true,
      });

      setValue("wardCode", "", {
        shouldDirty: true,
        shouldValidate: true,
      });
    },
    [setValue],
  );

  const handleSelectWardCode = useCallback(
    (nextWardCode: string) => {
      setValue("wardCode", nextWardCode, {
        shouldDirty: true,
        shouldValidate: true,
      });
    },
    [setValue],
  );

  const onSubmit = async (values: AddFarmFormValues) => {
    try {
      if (isEditMode) {
        if (!farmId) {
          setError("root", {
            type: "manual",
            message: t("farm.form.errors.notFoundForUpdate"),
          });
          return;
        }

        const payload: UpdateFarmPlotRequest = {
          name: values.name.trim(),
          description: toOptionalText(values.description),
          areaM2: toOptionalNumber(values.areaM2),
          addressLine: toOptionalText(values.addressLine),
          provinceCode: toOptionalText(values.provinceCode),
          districtCode: toOptionalText(values.districtCode),
          wardCode: toOptionalText(values.wardCode),
          latitude: toOptionalNumber(values.latitude),
          longitude: toOptionalNumber(values.longitude),
        };

        await updatePlotMutation.mutateAsync({ id: farmId, body: payload });
      } else {
        if (!profileId) {
          setError("root", {
            type: "manual",
            message: t("farm.form.errors.userNotFound"),
          });
          return;
        }

        const payload: CreateFarmPlotRequest = {
          ownerProfileId: profileId,
          name: values.name.trim(),
          description: toOptionalText(values.description),
          areaM2: toOptionalNumber(values.areaM2),
          addressLine: toOptionalText(values.addressLine),
          provinceCode: toOptionalText(values.provinceCode),
          districtCode: toOptionalText(values.districtCode),
          wardCode: toOptionalText(values.wardCode),
          latitude: toOptionalNumber(values.latitude),
          longitude: toOptionalNumber(values.longitude),
        };

        await createPlotMutation.mutateAsync(payload);
      }

      if (router.canGoBack()) {
        router.navigate("/(main)/farm");
        return;
      }

      router.replace("/(main)/farm");
    } catch (error) {
      const parsed = parseApiError(error);
      const fieldErrors = parsed.fieldErrors ?? {};

      for (const [field, message] of Object.entries(fieldErrors)) {
        if (formFieldNames.includes(field as keyof AddFarmFormValues)) {
          setError(field as keyof AddFarmFormValues, {
            type: "server",
            message,
          });
        }
      }

      setError("root", {
        type: "server",
        message: parsed.message || t("farm.form.errors.submitFailed"),
      });
    }
  };

  const handleCancel = () => {
    if (!isDirty) {
      router.navigate("/(main)/farm");
      return;
    }

    Alert.alert(
      t("farm.form.cancelConfirmTitle"),
      t("farm.form.cancelConfirmMessage"),
      [
        {
          text: t("farm.form.continueEditing"),
          style: "cancel",
        },
        {
          text: t("farm.form.leave"),
          style: "destructive",
          onPress: () => router.navigate("/(main)/farm"),
        },
      ],
    );
  };

  const handleUseMyLocation = async () => {
    clearErrors("root");
    setIsLocating(true);

    try {
      const serviceEnabled = await Location.hasServicesEnabledAsync();
      if (!serviceEnabled) {
        setError("root", {
          type: "manual",
          message: t("farm.form.errors.locationDisabled"),
        });
        return;
      }

      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setError("root", {
          type: "manual",
          message: t("farm.form.errors.locationPermissionDenied"),
        });
        return;
      }

      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const latitude = position.coords.latitude;
      const longitude = position.coords.longitude;

      setValue("latitude", latitude.toFixed(6), {
        shouldDirty: true,
        shouldValidate: true,
      });
      setValue("longitude", longitude.toFixed(6), {
        shouldDirty: true,
        shouldValidate: true,
      });

      const geocoded = await Location.reverseGeocodeAsync({
        latitude,
        longitude,
      });

      const place = geocoded[0];
      if (place) {
        const addressLine = [
          place.name,
          place.street,
          place.district,
          place.city,
          place.region,
        ]
          .filter(Boolean)
          .join(", ");

        if (addressLine) {
          setValue("addressLine", addressLine, {
            shouldDirty: true,
            shouldValidate: true,
          });
        }

        try {
          const { provinceCode, districtCode, wardCode } =
            await resolveAdministrativeCodes(place);

          if (provinceCode) {
            handleSelectProvinceCode(provinceCode);
          }

          if (districtCode) {
            handleSelectDistrictCode(districtCode);
          }

          if (wardCode) {
            handleSelectWardCode(wardCode);
          }
        } catch {
          // Keep lat/lng and address even if administrative code lookup fails.
        }
      }
    } catch {
      setError("root", {
        type: "manual",
        message: t("farm.form.errors.locationFetchFailed"),
      });
    } finally {
      setIsLocating(false);
    }
  };

  const isLoading =
    isSubmitting ||
    createPlotMutation.isPending ||
    updatePlotMutation.isPending;
  const canSubmit =
    isValid && !isLoading && !(isEditMode && isEditingPlotLoading);
  const formTitle = isEditMode
    ? t("farm.form.titleEdit")
    : t("farm.form.titleCreate");
  const submitButtonLabel = isEditMode
    ? t("farm.form.submitEdit")
    : t("farm.form.submitCreate");

  return {
    palette,
    control,
    errors,
    isLoading,
    isEditMode,
    isEditingPlotLoading,
    isEditingPlotError,
    refetchEditingPlot,
    canSubmit,
    formTitle,
    submitButtonLabel,
    handleSubmit,
    onSubmit,
    handleCancel,
    isLocating,
    handleUseMyLocation,
    provinceCode,
    districtCode,
    wardCode,
    provinceOptions,
    districtOptions,
    wardOptions,
    isProvinceOptionsLoading,
    isDistrictOptionsLoading,
    isWardOptionsLoading,
    handleSelectProvinceCode,
    handleSelectDistrictCode,
    handleSelectWardCode,
  };
}

export type UseFarmFormScreenResult = ReturnType<typeof useFarmFormScreen>;
