import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { ChevronDown, MapPin } from "lucide-react-native";

import Colors from "@/src/constants/Colors";
import { useUploadAvatarMutation } from "@/src/features/common";
import { FarmAdministrativePickerModal } from "@/src/features/farm/components/FarmAdministrativePickerModal";
import { useColorScheme } from "@/src/hooks/useColorScheme";
import { parseApiError } from "@/src/lib/error-handler";

import { profileApi } from "../api/profile-api";
import {
  useProfileAddressFields,
  type ActivePicker,
} from "../hooks/useProfileAddressFields";
import { getMyProfileQueryOptions, profileKeys } from "../queries/options";
import type { ProfileUpdateRequest } from "../schema/user.schema";

export function UpdateProfileScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const queryClient = useQueryClient();
  const colorScheme = useColorScheme();
  const scheme = colorScheme ?? "light";
  const palette = Colors[scheme];
  const uploadAvatarMutation = useUploadAvatarMutation();

  const {
    data: profile,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery(getMyProfileQueryOptions());

  const [avatar, setAvatar] = useState("");
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [fullName, setFullName] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [bio, setBio] = useState("");
  const [activePicker, setActivePicker] = useState<ActivePicker>(null);

  const {
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
  } = useProfileAddressFields(profile);

  useEffect(() => {
    if (!profile) return;
    setAvatar(profile.avatar ?? profile.profilePicture ?? "");
    setFullName(profile.fullName ?? "");
    setSpecialty(profile.specialty ?? "");
    setBio(profile.bio ?? "");
  }, [profile]);

  const mutation = useMutation({
    mutationFn: (payload: { profileId: string; body: ProfileUpdateRequest }) =>
      profileApi.updateProfile(payload.profileId, payload.body),
    onSuccess: (updated) => {
      queryClient.setQueryData(profileKeys.me(), updated);
      queryClient.setQueryData(profileKeys.detail(updated.id), updated);
      queryClient.setQueryData(profileKeys.byUser(updated.userId), updated);
      Alert.alert(
        t("screens.profileEdit.successTitle"),
        t("screens.profileEdit.successMessage"),
      );
      if (router.canGoBack()) {
        router.back();
        return;
      }

      router.replace("/(main)/profile");
    },
    onError: (mutationError) => {
      const parsed = parseApiError(mutationError);
      Alert.alert(t("screens.profileEdit.errorTitle"), parsed.message);
    },
  });

  const isDirty = useMemo(() => {
    if (!profile) return false;
    return (
      (profile.avatar ?? profile.profilePicture ?? "") !== avatar ||
      (profile.fullName ?? "") !== fullName ||
      (profile.specialty ?? "") !== specialty ||
      (profile.bio ?? "") !== bio ||
      (profile.addressLine ?? "") !== addressLine ||
      (profile.provinceCode ?? "") !== provinceCode ||
      (profile.districtCode ?? "") !== districtCode ||
      (profile.wardCode ?? "") !== wardCode ||
      (profile.latitude ?? undefined) !== latitude ||
      (profile.longitude ?? undefined) !== longitude
    );
  }, [
    addressLine,
    avatar,
    bio,
    districtCode,
    fullName,
    latitude,
    longitude,
    profile,
    provinceCode,
    specialty,
    wardCode,
  ]);

  const handlePickOption = async (code: string) => {
    if (activePicker === "province") await handleSelectProvinceCode(code);
    if (activePicker === "district") await handleSelectDistrictCode(code);
    if (activePicker === "ward") handleSelectWardCode(code);
    setActivePicker(null);
  };

  const onSave = () => {
    if (!profile) return;

    const body: ProfileUpdateRequest = {
      avatar: avatar.trim() || undefined,
      fullName: fullName.trim() || undefined,
      specialty: specialty.trim() || undefined,
      bio: bio.trim() || undefined,
      addressLine: addressLine.trim() || undefined,
      provinceCode: provinceCode || undefined,
      districtCode: districtCode || undefined,
      wardCode: wardCode || undefined,
      latitude: latitude ?? undefined,
      longitude: longitude ?? undefined,
    };

    mutation.mutate({ profileId: profile.id, body });
  };

  const onPickAvatar = async () => {
    try {
      const permission =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert(
          t("screens.profileEdit.errorTitle"),
          t("screens.profileEdit.avatarPermissionDenied"),
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.85,
      });

      if (result.canceled || !result.assets[0]) {
        return;
      }

      setIsUploadingAvatar(true);
      const uploadedAvatarUrl = await uploadAvatarMutation.mutateAsync(
        result.assets[0],
      );
      setAvatar(uploadedAvatarUrl);
      Alert.alert(
        t("screens.profileEdit.successTitle"),
        t("screens.profileEdit.avatarUploaded"),
      );
    } catch (uploadError) {
      const parsed = parseApiError(uploadError);
      Alert.alert(t("screens.profileEdit.errorTitle"), parsed.message);
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-background-light px-6 dark:bg-background-dark">
        <ActivityIndicator color={palette.primary} size="large" />
      </View>
    );
  }

  if (isError || !profile) {
    const parsed = parseApiError(error);
    return (
      <View className="flex-1 items-center justify-center bg-background-light px-6 dark:bg-background-dark">
        <Text className="text-center text-base font-semibold text-slate-900 dark:text-slate-100">
          {t("screens.profileEdit.loadErrorTitle")}
        </Text>
        <Text className="mt-2 text-center text-sm text-slate-500">
          {parsed.message}
        </Text>
        <Pressable
          className="mt-4 rounded-xl bg-primary px-4 py-2"
          onPress={() => void refetch()}
        >
          <Text className="font-semibold text-white">
            {t("screens.profileEdit.retry")}
          </Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background-light dark:bg-background-dark">
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 16, paddingBottom: 120 }}
      >
        <View className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-background-dark">
          <Text className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            {t("screens.profileEdit.accountInfo")}
          </Text>
          <Text className="mt-3 text-sm text-slate-900 dark:text-slate-100">
            {profile.fullName || t("screens.profile.profileUser")}
          </Text>
          <Text className="mt-1 text-sm text-slate-500">
            {profile.email || t("common.notSet")}
          </Text>
          <Text className="mt-1 text-sm text-slate-500">
            {profile.phoneNumber || t("common.notSet")}
          </Text>
        </View>

        <View className="mt-4 rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-background-dark">
          <Text className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            {t("screens.profileEdit.avatarLabel")}
          </Text>
          <View className="mt-2 flex-row items-center gap-3">
            <View className="h-24 w-24 overflow-hidden rounded-full border border-gray-300 dark:border-gray-700">
              {avatar ? (
                <Image source={{ uri: avatar }} className="h-full w-full" />
              ) : (
                <View className="h-full w-full items-center justify-center bg-primary/15">
                  <Text className="text-xl font-bold text-primary">
                    {(profile.fullName || t("screens.profile.profileUser"))
                      .charAt(0)
                      .toUpperCase()}
                  </Text>
                </View>
              )}
            </View>
            <Pressable
              className={`rounded-xl px-4 py-2 ${
                isUploadingAvatar ? "bg-gray-400" : "bg-primary"
              }`}
              onPress={() => void onPickAvatar()}
              disabled={isUploadingAvatar}
            >
              <Text className="font-semibold text-white">
                {isUploadingAvatar
                  ? t("screens.profileEdit.uploadingAvatar")
                  : t("screens.profileEdit.changeAvatar")}
              </Text>
            </Pressable>
          </View>

          <Text className="mt-4 text-sm font-semibold text-slate-900 dark:text-slate-100">
            {t("screens.profileEdit.roleLabel")}
          </Text>
          <View className="mt-2 self-start rounded-xl border border-gray-300 px-4 py-2 dark:border-gray-700">
            <Text className="font-semibold text-slate-700 dark:text-slate-300">
              {t(
                `screens.profile.roles.${(profile.role || "user").toLowerCase()}`,
                {
                  defaultValue: t("screens.profile.roles.user"),
                },
              )}
            </Text>
          </View>

          <Pressable
            className="mt-4 rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-3 dark:border-emerald-700/40 dark:bg-emerald-900/20"
            onPress={() => router.push("/(main)/profile/certificate")}
          >
            <Text className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">
              {t("screens.profileEdit.expertCertificate")}
            </Text>
          </Pressable>

          <Text className="mt-4 text-sm font-semibold text-slate-900 dark:text-slate-100">
            {t("screens.profileEdit.fullNameLabel")}
          </Text>
          <TextInput
            value={fullName}
            onChangeText={setFullName}
            placeholder={t("screens.profileEdit.fullNamePlaceholder")}
            placeholderTextColor="#94A3B8"
            className="mt-2 rounded-xl border border-gray-300 px-3 py-3 text-slate-900 dark:border-gray-700 dark:text-slate-100"
          />

          <Text className="mt-4 text-sm font-semibold text-slate-900 dark:text-slate-100">
            {t("screens.profileEdit.specialtyLabel")}
          </Text>
          <TextInput
            value={specialty}
            onChangeText={setSpecialty}
            placeholder={t("screens.profileEdit.specialtyPlaceholder")}
            placeholderTextColor="#94A3B8"
            className="mt-2 rounded-xl border border-gray-300 px-3 py-3 text-slate-900 dark:border-gray-700 dark:text-slate-100"
          />

          <Text className="mt-4 text-sm font-semibold text-slate-900 dark:text-slate-100">
            {t("screens.profileEdit.bioLabel")}
          </Text>
          <TextInput
            value={bio}
            onChangeText={setBio}
            placeholder={t("screens.profileEdit.bioPlaceholder")}
            placeholderTextColor="#94A3B8"
            className="mt-2 rounded-xl border border-gray-300 px-3 py-3 text-slate-900 dark:border-gray-700 dark:text-slate-100"
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        {/* Location section */}
        <View className="mt-4 rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-background-dark">
          <View className="flex-row items-center justify-between mb-1">
            <Text className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              {t("farm.form.location")}
            </Text>
            <TouchableOpacity
              className="flex-row items-center gap-1.5 rounded-full border border-green-800/10 bg-green-800/10 px-3 py-1.5 dark:border-green-400/10 dark:bg-green-400/10"
              onPress={() => void handleUseMyLocation()}
              disabled={isLocating}
            >
              {isLocating ? (
                <ActivityIndicator size="small" color="#16a34a" />
              ) : (
                <MapPin size={14} color="#16a34a" />
              )}
              <Text className="text-xs font-bold text-green-700 dark:text-green-400">
                {t("farm.form.useMyLocation")}
              </Text>
            </TouchableOpacity>
          </View>

          {!!locationError && (
            <Text className="mb-2 text-xs font-medium text-red-600">
              {locationError}
            </Text>
          )}

          <Text className="mt-3 text-sm font-semibold text-slate-900 dark:text-slate-100">
            {t("screens.profileEdit.addressLineLabel")}
          </Text>
          <TextInput
            value={addressLine}
            onChangeText={setAddressLine}
            placeholder={t("screens.profileEdit.addressLinePlaceholder")}
            placeholderTextColor="#94A3B8"
            className="mt-2 rounded-xl border border-gray-300 px-3 py-3 text-slate-900 dark:border-gray-700 dark:text-slate-100"
          />

          {/* Province picker */}
          <Text className="mt-4 text-sm font-semibold text-slate-900 dark:text-slate-100">
            {t("farm.form.province")}
          </Text>
          <TouchableOpacity
            className="mt-2 h-12 flex-row items-center gap-2 rounded-xl border border-gray-300 px-3 dark:border-gray-700"
            onPress={() => setActivePicker("province")}
          >
            <Text
              numberOfLines={1}
              className={`flex-1 ${provinceCode ? "text-slate-900 dark:text-slate-100" : "text-slate-400"}`}
            >
              {resolveLabelByCode(
                provinceCode,
                provinceOptions,
                t("farm.form.selectProvince"),
              )}
            </Text>
            {isProvinceOptionsLoading ? (
              <ActivityIndicator size="small" color="#94A3B8" />
            ) : (
              <ChevronDown size={18} color="#94A3B8" />
            )}
          </TouchableOpacity>

          {/* District picker */}
          <Text className="mt-4 text-sm font-semibold text-slate-900 dark:text-slate-100">
            {t("farm.form.district")}
          </Text>
          <TouchableOpacity
            className={`mt-2 h-12 flex-row items-center gap-2 rounded-xl border px-3 ${
              !provinceCode
                ? "border-gray-200 opacity-50 dark:border-gray-800"
                : "border-gray-300 dark:border-gray-700"
            }`}
            onPress={() => setActivePicker("district")}
            disabled={!provinceCode}
          >
            <Text
              numberOfLines={1}
              className={`flex-1 ${districtCode ? "text-slate-900 dark:text-slate-100" : "text-slate-400"}`}
            >
              {resolveLabelByCode(
                districtCode,
                districtOptions,
                provinceCode
                  ? t("farm.form.selectDistrict")
                  : t("farm.form.selectProvinceFirst"),
              )}
            </Text>
            {isDistrictOptionsLoading ? (
              <ActivityIndicator size="small" color="#94A3B8" />
            ) : (
              <ChevronDown size={18} color="#94A3B8" />
            )}
          </TouchableOpacity>

          {/* Ward picker */}
          <Text className="mt-4 text-sm font-semibold text-slate-900 dark:text-slate-100">
            {t("farm.form.ward")}
          </Text>
          <TouchableOpacity
            className={`mt-2 h-12 flex-row items-center gap-2 rounded-xl border px-3 ${
              !districtCode
                ? "border-gray-200 opacity-50 dark:border-gray-800"
                : "border-gray-300 dark:border-gray-700"
            }`}
            onPress={() => setActivePicker("ward")}
            disabled={!districtCode}
          >
            <Text
              numberOfLines={1}
              className={`flex-1 ${wardCode ? "text-slate-900 dark:text-slate-100" : "text-slate-400"}`}
            >
              {resolveLabelByCode(
                wardCode,
                wardOptions,
                districtCode
                  ? t("farm.form.selectWard")
                  : t("farm.form.selectDistrictFirst"),
              )}
            </Text>
            {isWardOptionsLoading ? (
              <ActivityIndicator size="small" color="#94A3B8" />
            ) : (
              <ChevronDown size={18} color="#94A3B8" />
            )}
          </TouchableOpacity>

          {/* Lat / Lng (read-only display when set) */}
          {(latitude !== undefined || longitude !== undefined) && (
            <View className="mt-4 flex-row gap-3">
              <View className="flex-1">
                <Text className="text-xs font-semibold text-slate-500">
                  {t("farm.form.latitude")}
                </Text>
                <Text className="mt-1 text-sm text-slate-700 dark:text-slate-300">
                  {latitude?.toFixed(6) ?? "--"}
                </Text>
              </View>
              <View className="flex-1">
                <Text className="text-xs font-semibold text-slate-500">
                  {t("farm.form.longitude")}
                </Text>
                <Text className="mt-1 text-sm text-slate-700 dark:text-slate-300">
                  {longitude?.toFixed(6) ?? "--"}
                </Text>
              </View>
            </View>
          )}
        </View>

        <Pressable
          className={`mt-5 items-center rounded-xl px-4 py-3 ${
            mutation.isPending || isUploadingAvatar || !isDirty
              ? "bg-gray-400"
              : "bg-primary"
          }`}
          onPress={onSave}
          disabled={mutation.isPending || isUploadingAvatar || !isDirty}
        >
          <Text className="text-base font-semibold text-white">
            {mutation.isPending
              ? t("screens.profileEdit.saving")
              : t("screens.profileEdit.save")}
          </Text>
        </Pressable>
      </ScrollView>

      <FarmAdministrativePickerModal
        visible={activePicker !== null}
        activePicker={activePicker}
        provinceOptions={provinceOptions}
        districtOptions={districtOptions}
        wardOptions={wardOptions}
        isProvinceOptionsLoading={isProvinceOptionsLoading}
        isDistrictOptionsLoading={isDistrictOptionsLoading}
        isWardOptionsLoading={isWardOptionsLoading}
        onClose={() => setActivePicker(null)}
        onSelect={(code) => void handlePickOption(code)}
      />
    </View>
  );
}

/* ── Helpers ── */

function resolveLabelByCode(
  code: string,
  options: { code: string; name: string }[],
  fallback: string,
) {
  if (!code) return fallback;
  const found = options.find((o) => o.code === code);
  if (!found) return code;
  return `${found.name} (${found.code})`;
}
