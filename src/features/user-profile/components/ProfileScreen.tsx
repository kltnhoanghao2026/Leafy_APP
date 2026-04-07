import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  Text,
  View,
  Switch,
} from "react-native";
import {
  Bell,
  Globe,
  Info,
  Key,
  LogOut,
  User,
  Moon,
} from "lucide-react-native";
import { useColorScheme as useNativeWindColorScheme } from "nativewind";
import { changeAppLanguage, getCurrentLanguage } from "@/src/i18n";

import Colors from "@/src/constants/Colors";
import { useColorScheme } from "@/src/hooks/useColorScheme";
import { parseApiError } from "@/src/lib/error-handler";
import { useAuthContext } from "@/src/features/auth";

import { getMyProfileQueryOptions } from "../queries/options";

import { ProfileRow } from "./ProfileRow";

export function ProfileScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const { colorScheme: nativeWindColorScheme, setColorScheme } =
    useNativeWindColorScheme();
  const { logoutLocal } = useAuthContext();
  const scheme = colorScheme ?? "light";
  const palette = Colors[scheme];
  const [isAvatarError, setIsAvatarError] = useState(false);
  const {
    data: profile,
    error,
    isError,
    isLoading,
    refetch,
  } = useQuery(getMyProfileQueryOptions());
  const parsedError = isError ? parseApiError(error) : null;
  const currentLanguage = getCurrentLanguage();

  const displayName =
    profile?.fullName?.trim() || t("screens.profile.profileUser");
  const displayEmail = profile?.email?.trim() || "--";

  const roleKeyRaw = profile?.role?.toLowerCase();
  const roleKey = roleKeyRaw === "use" ? "user" : roleKeyRaw;
  const displayRole = roleKey
    ? t(`screens.profile.roles.${roleKey}`, {
        defaultValue: t("screens.profile.roles.user"),
      })
    : t("screens.profile.roles.user");

  const avatarUri =
    profile?.profilePicture?.trim() || profile?.avatar?.trim() || "";
  const avatarLetter = displayName.charAt(0).toUpperCase();
  const shouldShowLetterAvatar = !avatarUri || isAvatarError;

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-background-light px-6 dark:bg-background-dark">
        <ActivityIndicator color={palette.primary} size="large" />
        <Text className="mt-3 text-sm text-slate-500">
          {t("profile.loading")}
        </Text>
      </View>
    );
  }

  if (isError || !profile) {
    return (
      <View className="flex-1 items-center justify-center bg-background-light px-6 dark:bg-background-dark">
        <Text className="text-center text-base font-semibold text-slate-900 dark:text-slate-100">
          {t("profile.loadErrorTitle")}
        </Text>
        <Text className="mt-2 text-center text-sm text-slate-500">
          {parsedError?.message || t("profile.loadErrorMessage")}
        </Text>
        <Pressable
          className="mt-4 rounded-xl bg-primary px-4 py-2"
          onPress={() => void refetch()}
        >
          <Text className="font-semibold text-white">{t("common.retry")}</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background-light dark:bg-background-dark">
      <ScrollView
        contentContainerStyle={{ paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
      >
        <Pressable
          className="mx-4 mt-5 items-center rounded-[20px] border border-gray-200 bg-white px-6 py-8 shadow-sm active:opacity-80 dark:border-slate-800 dark:bg-slate-800/80"
          onPress={() =>
            profile.id
              ? router.push(`/(main)/profile/${profile.id}` as any)
              : undefined
          }
        >
          <View className="mb-3 h-28 w-28 overflow-hidden rounded-full border-4 border-gray-100 dark:border-slate-700">
            {shouldShowLetterAvatar ? (
              <View className="h-full w-full items-center justify-center bg-primary/20">
                <Text className="text-5xl font-extrabold uppercase text-primary">
                  {avatarLetter}
                </Text>
              </View>
            ) : (
              <Image
                source={{ uri: avatarUri }}
                className="h-full w-full"
                onError={() => setIsAvatarError(true)}
              />
            )}
          </View>
          <Text className="mb-1 text-2xl font-bold text-slate-900 dark:text-slate-100">
            {displayName}
          </Text>
          <Text className="mt-0.5 text-[13px] text-slate-500">
            {displayEmail}
          </Text>
          <Text className="mt-0.5 text-[13px] text-slate-500">
            {displayRole}
          </Text>
        </Pressable>

        <View className="mx-4 mt-6">
          <Text className="mb-3 ml-1 text-base font-bold tracking-wide text-slate-900 dark:text-slate-100">
            {t("profile.generalSettings")}
          </Text>
          <View className="overflow-hidden rounded-[20px] border border-gray-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-800/80">
            <ProfileRow
              icon={<User color={palette.primary} size={20} />}
              iconBgClass="bg-primary/10"
              title={t("screens.profile.editProfile")}
              onPress={() => router.push("/(main)/profile/edit")}
              divider
              colorClass="text-slate-900 dark:text-slate-100"
            />
            <ProfileRow
              icon={<Key color="#3B82F6" size={20} />}
              iconBgClass="bg-blue-500/10"
              title={t("profile.changePassword")}
              divider
              colorClass="text-slate-900 dark:text-slate-100"
            />
            <ProfileRow
              icon={<Bell color="#F59E0B" size={20} />}
              iconBgClass="bg-amber-500/10"
              title={t("profile.notificationSettings")}
              divider
              colorClass="text-slate-900 dark:text-slate-100"
            />
            <ProfileRow
              icon={<Globe color="#A855F7" size={20} />}
              iconBgClass="bg-purple-500/10"
              title={t("profile.language")}
              divider
              colorClass="text-slate-900 dark:text-slate-100"
              onPress={() => {
                void changeAppLanguage(currentLanguage === "vi" ? "en" : "vi");
              }}
              rightElement={
                <Text className="text-xs font-bold text-slate-500 dark:text-slate-400">
                  {currentLanguage === "vi"
                    ? t("profile.languageVi")
                    : t("profile.languageEn")}
                </Text>
              }
            />
            <ProfileRow
              icon={<Moon color="#10B981" size={20} />}
              iconBgClass="bg-emerald-500/10"
              title={t("profile.darkMode")}
              colorClass="text-slate-900 dark:text-slate-100"
              rightElement={
                <Switch
                  value={nativeWindColorScheme === "dark"}
                  onValueChange={(val) =>
                    setColorScheme(val ? "dark" : "light")
                  }
                  trackColor={{ false: "#CBD5E1", true: "#10B981" }}
                  thumbColor="#FFFFFF"
                />
              }
            />
          </View>
        </View>

        <View className="mx-4 mt-6">
          <Text className="mb-3 ml-1 text-base font-bold tracking-wide text-slate-900 dark:text-slate-100">
            {t("profile.other")}
          </Text>
          <View className="overflow-hidden rounded-[20px] border border-gray-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-800/80">
            <ProfileRow
              icon={<Info color="#64748B" size={20} />}
              iconBgClass="bg-slate-500/10"
              title={t("profile.aboutUs")}
              divider
              colorClass="text-slate-900 dark:text-slate-100"
            />
            <ProfileRow
              icon={<LogOut color="#EF4444" size={20} />}
              iconBgClass="bg-red-500/10"
              title={t("profile.logout")}
              colorClass="text-red-600 dark:text-red-400"
              onPress={() => {
                Alert.alert(
                  t("profile.logoutConfirmTitle"),
                  t("profile.logoutConfirmMessage"),
                  [
                    { text: t("common.cancel"), style: "cancel" },
                    {
                      text: t("profile.logout"),
                      style: "destructive",
                      onPress: () => void logoutLocal(),
                    },
                  ],
                );
              }}
            />
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
