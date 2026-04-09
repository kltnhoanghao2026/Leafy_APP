import { useCallback, useEffect, useState } from "react";
import * as Location from "expo-location";
import { useTranslation } from "react-i18next";

import type { ProfileResponse } from "../schema/user.schema";

/* ── Types ── */

type ProvinceItem = { code: number; name: string };
type DistrictItem = { code: number; name: string };
type WardItem = { code: number; name: string };
type ProvinceDetail = ProvinceItem & { districts?: DistrictItem[] };
type DistrictDetail = DistrictItem & { wards?: WardItem[] };

export type AdministrativeOption = { code: string; name: string };
export type ActivePicker = "province" | "district" | "ward" | null;

/* ── Constants ── */

const ADMIN_API_BASE = "https://provinces.open-api.vn/api";

/* ── Utilities ── */

const fetchJson = async <T>(url: string): Promise<T> => {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Request failed: ${response.status}`);
  return (await response.json()) as T;
};

const toOption = (item: {
  code: number;
  name: string;
}): AdministrativeOption => ({
  code: String(item.code),
  name: item.name,
});

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
  const s = normalizeText(source);
  const t = normalizeText(target);
  if (!s || !t) return false;
  return s === t || s.includes(t) || t.includes(s);
};

const resolveAdministrativeCodes = async (
  place: Location.LocationGeocodedAddress,
) => {
  const provinces = await fetchJson<ProvinceItem[]>(`${ADMIN_API_BASE}/p/`);
  const provinceNameCandidates = [place.region, place.city, place.district];
  const province = provinces.find((p) =>
    provinceNameCandidates.some((c) => isNameMatch(c, p.name)),
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
    districtNameCandidates.some((c) => isNameMatch(c, d.name)),
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
    wardNameCandidates.some((c) => isNameMatch(c, w.name)),
  );

  return {
    provinceCode: String(province.code),
    districtCode: String(district.code),
    wardCode: ward ? String(ward.code) : undefined,
  };
};

/* ── Hook ── */

export function useProfileAddressFields(profile: ProfileResponse | undefined) {
  const { t } = useTranslation();

  const [provinceCode, setProvinceCode] = useState("");
  const [districtCode, setDistrictCode] = useState("");
  const [wardCode, setWardCode] = useState("");
  const [addressLine, setAddressLine] = useState("");
  const [latitude, setLatitude] = useState<number | undefined>();
  const [longitude, setLongitude] = useState<number | undefined>();

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
  const [isLocating, setIsLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  /* Initialise from profile */
  useEffect(() => {
    if (!profile) return;
    setProvinceCode(profile.provinceCode ?? "");
    setDistrictCode(profile.districtCode ?? "");
    setWardCode(profile.wardCode ?? "");
    setAddressLine(profile.addressLine ?? "");
    setLatitude(profile.latitude ?? undefined);
    setLongitude(profile.longitude ?? undefined);
  }, [profile]);

  /* Load province options once */
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

  const loadDistrictOptions = useCallback(async (code: string) => {
    if (!code) {
      setDistrictOptions([]);
      return;
    }
    setIsDistrictOptionsLoading(true);
    try {
      const detail = await fetchJson<ProvinceDetail>(
        `${ADMIN_API_BASE}/p/${code}?depth=2`,
      );
      setDistrictOptions((detail.districts ?? []).map(toOption));
    } finally {
      setIsDistrictOptionsLoading(false);
    }
  }, []);

  const loadWardOptions = useCallback(async (code: string) => {
    if (!code) {
      setWardOptions([]);
      return;
    }
    setIsWardOptionsLoading(true);
    try {
      const detail = await fetchJson<DistrictDetail>(
        `${ADMIN_API_BASE}/d/${code}?depth=2`,
      );
      setWardOptions((detail.wards ?? []).map(toOption));
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

  /* Handlers */

  const handleSelectProvinceCode = useCallback((code: string) => {
    setProvinceCode(code);
    setDistrictCode("");
    setWardCode("");
  }, []);

  const handleSelectDistrictCode = useCallback((code: string) => {
    setDistrictCode(code);
    setWardCode("");
  }, []);

  const handleSelectWardCode = useCallback((code: string) => {
    setWardCode(code);
  }, []);

  const handleUseMyLocation = async () => {
    setLocationError(null);
    setIsLocating(true);
    try {
      const serviceEnabled = await Location.hasServicesEnabledAsync();
      if (!serviceEnabled) {
        setLocationError(t("farm.form.errors.locationDisabled"));
        return;
      }

      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setLocationError(t("farm.form.errors.locationPermissionDenied"));
        return;
      }

      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const lat = position.coords.latitude;
      const lng = position.coords.longitude;
      setLatitude(lat);
      setLongitude(lng);

      const geocoded = await Location.reverseGeocodeAsync({
        latitude: lat,
        longitude: lng,
      });

      const place = geocoded[0];
      if (place) {
        const line = [
          place.name,
          place.street,
          place.district,
          place.city,
          place.region,
        ]
          .filter(Boolean)
          .join(", ");

        if (line) setAddressLine(line);

        try {
          const codes = await resolveAdministrativeCodes(place);
          if (codes.provinceCode) handleSelectProvinceCode(codes.provinceCode);
          if (codes.districtCode) handleSelectDistrictCode(codes.districtCode);
          if (codes.wardCode) handleSelectWardCode(codes.wardCode);
        } catch {
          // Keep lat/lng and address even if admin code lookup fails.
        }
      }
    } catch {
      setLocationError(t("farm.form.errors.locationFetchFailed"));
    } finally {
      setIsLocating(false);
    }
  };

  return {
    provinceCode,
    districtCode,
    wardCode,
    addressLine,
    setAddressLine,
    latitude,
    longitude,
    provinceOptions,
    districtOptions,
    wardOptions,
    isProvinceOptionsLoading,
    isDistrictOptionsLoading,
    isWardOptionsLoading,
    isLocating,
    locationError,
    setLocationError,
    handleSelectProvinceCode,
    handleSelectDistrictCode,
    handleSelectWardCode,
    handleUseMyLocation,
  };
}
