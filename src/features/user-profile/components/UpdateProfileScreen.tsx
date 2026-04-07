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
  View,
} from "react-native";

import Colors from "@/src/constants/Colors";
import { useUploadAvatarMutation } from "@/src/features/common";
import { useColorScheme } from "@/src/hooks/useColorScheme";
import { parseApiError } from "@/src/lib/error-handler";

import { profileApi } from "../api/profile-api";
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
      (profile.bio ?? "") !== bio
    );
  }, [avatar, bio, fullName, profile, specialty]);

  const onSave = () => {
    if (!profile) return;

    const body: ProfileUpdateRequest = {
      avatar: avatar.trim() || undefined,
      fullName: fullName.trim() || undefined,
      specialty: specialty.trim() || undefined,
      bio: bio.trim() || undefined,
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
    </View>
  );
}
