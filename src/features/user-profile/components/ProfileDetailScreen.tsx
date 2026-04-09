import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import {
  Award,
  BadgeCheck,
  Briefcase,
  Calendar,
  Mail,
  MapPin,
  MessageCircle,
  MoreHorizontal,
  Phone,
  ShieldCheck,
  UserPlus,
} from "lucide-react-native";
import { format } from "date-fns";

import Colors from "@/src/constants/Colors";
import { useColorScheme } from "@/src/hooks/useColorScheme";
import { parseApiError } from "@/src/lib/error-handler";
import {
  PostCard,
  Post,
  getUserPostsQueryOptions,
  ComposerCard,
} from "@/src/features/community";

import { getProfileByIdQueryOptions } from "../queries/options";

type ProfileDetailScreenProps = {
  profileId: string;
};

export function ProfileDetailScreen({ profileId }: ProfileDetailScreenProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const scheme = colorScheme ?? "light";
  const palette = Colors[scheme];
  const [isAvatarError, setIsAvatarError] = useState(false);

  const {
    data: profile,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery(getProfileByIdQueryOptions(profileId));

  const {
    data: postsData,
    isLoading: isLoadingPosts,
    refetch: refetchPosts,
  } = useQuery(getUserPostsQueryOptions(profileId));

  const posts = postsData?.content || [];

  const parsedError = isError ? parseApiError(error) : null;

  const displayName =
    profile?.fullName?.trim() || t("screens.profile.profileUser");

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

  const isExpert = profile?.role === "EXPERT";
  const isVerified = profile?.isVerified === true;

  const joinedDate = profile?.createdAt
    ? format(new Date(profile.createdAt), "MMM d, yyyy")
    : null;

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-background-light dark:bg-background-dark">
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
    <View className="flex-1 bg-gray-200 dark:bg-slate-900">
      <ScrollView
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Cover Photo & Profile Info Section (FB Style) */}
        <View className="bg-white dark:bg-slate-800 pb-4">
          {/* Cover Photo */}
          <View className="h-44 w-full bg-slate-300 dark:bg-slate-700">
            <Image
              source={{
                uri: "https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?q=80&w=1000&auto=format&fit=crop",
              }}
              className="h-full w-full"
              resizeMode="cover"
            />
          </View>

          <View className="px-4">
            {/* Avatar Row */}
            <View className="flex-row justify-between items-end -mt-16 mb-3">
              <View className="h-32 w-32 overflow-hidden rounded-full border-4 border-white dark:border-slate-800 bg-white dark:bg-slate-800 shadow-sm">
                {shouldShowLetterAvatar ? (
                  <View className="h-full w-full items-center justify-center bg-primary/20">
                    <Text className="text-6xl font-extrabold uppercase text-primary">
                      {avatarLetter}
                    </Text>
                  </View>
                ) : (
                  <Image
                    source={{ uri: avatarUri }}
                    className="h-full w-full rounded-full"
                    onError={() => setIsAvatarError(true)}
                  />
                )}
              </View>
            </View>

            {/* Name + verified badge */}
            <View className="flex-row items-center justify-start gap-2 mb-1">
              <Text className="text-3xl font-bold text-slate-900 dark:text-slate-100">
                {displayName}
              </Text>
              {isVerified && (
                <BadgeCheck color="#3B82F6" fill="#10B981" size={24} />
              )}
            </View>

            {/* Role badge */}
            <Text
              className={`text-base tracking-wide font-medium mb-2 ${isExpert ? "text-emerald-600 dark:text-emerald-400" : "text-primary"}`}
            >
              {displayRole}
            </Text>

            {/* Bio */}
            {!!profile.bio?.trim() && (
              <Text className="text-base text-slate-800 dark:text-slate-300 mb-4">
                {profile.bio}
              </Text>
            )}

            {/* Action Buttons */}
            <View className="flex-row items-center gap-2 mt-2">
              <Pressable className="flex-1 bg-blue-600 rounded-lg py-2.5 flex-row items-center justify-center gap-2">
                <UserPlus color="#FFFFFF" size={18} />
                <Text className="text-white font-semibold text-[15px]">
                  Follow
                </Text>
              </Pressable>

              <Pressable className="flex-1 bg-gray-200 dark:bg-slate-700/80 rounded-lg py-2.5 flex-row items-center justify-center gap-2">
                <MessageCircle
                  color={scheme === "dark" ? "#E2E8F0" : "#1E293B"}
                  size={18}
                />
                <Text className="text-slate-900 dark:text-slate-200 font-semibold text-[15px]">
                  Message
                </Text>
              </Pressable>

              <Pressable className="bg-gray-200 dark:bg-slate-700/80 rounded-lg py-2.5 px-4 flex-row items-center justify-center">
                <MoreHorizontal
                  color={scheme === "dark" ? "#E2E8F0" : "#1E293B"}
                  size={18}
                />
              </Pressable>
            </View>
          </View>
        </View>

        {/* Info section (FB "About" style) */}
        <View className="mt-2 bg-white dark:bg-slate-800 px-4 py-4">
          <Text className="mb-4 text-xl flex-row items-center font-bold text-slate-900 dark:text-slate-100">
            {t("profileDetail.infoSection", { defaultValue: "Details" })}
          </Text>
          <View className="gap-y-4">
            {/* Specialty */}
            {!!profile.specialty?.trim() && (
              <InfoRow
                icon={<Briefcase color="#64748B" size={20} />}
                label="Specialty"
                value={profile.specialty}
              />
            )}

            {/* Email */}
            {!!profile.email?.trim() && (
              <InfoRow
                icon={<Mail color="#64748B" size={20} />}
                label="Email"
                value={profile.email}
              />
            )}

            {/* Phone */}
            {!!profile.phoneNumber?.trim() && (
              <InfoRow
                icon={<Phone color="#64748B" size={20} />}
                label="Phone"
                value={profile.phoneNumber}
              />
            )}

            {/* Joined date */}
            {!!joinedDate && (
              <InfoRow
                icon={<Calendar color="#64748B" size={20} />}
                label="Joined"
                value={`Joined on ${joinedDate}`}
              />
            )}

            {/* Address */}
            {!!profile.addressLine?.trim() && (
              <InfoRow
                icon={<MapPin color="#64748B" size={20} />}
                label={t("profileDetail.address", { defaultValue: "Address" })}
                value={profile.addressLine}
              />
            )}
          </View>
        </View>

        {/* Expert verification */}
        {isExpert && (
          <View className="mt-2 bg-white dark:bg-slate-800 px-4 py-4">
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-xl font-bold tracking-wide text-slate-900 dark:text-slate-100">
                {t("profile.expertApplication.sectionTitle", {
                  defaultValue: "Expert Verification",
                })}
              </Text>
            </View>
            <View className="flex-row items-start gap-3">
              <ShieldCheck color="#10B981" size={28} />
              <View className="flex-1">
                <Text className="text-[15px] font-semibold text-emerald-700 dark:text-emerald-400">
                  {t("profile.expertApplication.alreadyExpertTitle")}
                </Text>
                <Text className="mt-0.5 text-sm text-slate-600 dark:text-slate-400">
                  {t("profile.expertApplication.alreadyExpertDescription")}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Certificates */}
        {isExpert &&
          Array.isArray(profile.certificates) &&
          profile.certificates.length > 0 && (
            <View className="mt-2 bg-white dark:bg-slate-800 px-4 py-4">
              <Text className="mb-4 text-xl font-bold tracking-wide text-slate-900 dark:text-slate-100">
                {t("profile.expertApplication.approvedCertificates", {
                  defaultValue: "Certificates",
                })}
              </Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                className="-mx-4 px-4 overflow-visible pb-2 gap-x-3"
              >
                {profile.certificates.map((cert, index) => (
                  <View
                    key={cert.id ?? index}
                    className="w-64 overflow-hidden rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900"
                  >
                    <View className="flex-row items-start gap-3 mb-2">
                      <Award color="#F59E0B" size={24} />
                      <View className="flex-1">
                        <Text className="text-base font-bold text-slate-900 dark:text-slate-100 mt-0.5">
                          {cert.title}
                        </Text>
                      </View>
                    </View>
                    <Text className="text-[13px] font-medium text-slate-500 mb-1">
                      {cert.issuedBy}
                    </Text>
                    {!!cert.issueDate && (
                      <Text className="text-xs text-slate-400">
                        Issued {cert.issueDate}
                      </Text>
                    )}
                  </View>
                ))}
              </ScrollView>
            </View>
          )}

        {/* Posts Tab */}
        <View className="mt-2 bg-white dark:bg-slate-800 pt-4 pb-0">
          <View className="px-4 mb-3">
            <Text className="text-xl font-bold text-slate-900 dark:text-slate-100">
              Posts
            </Text>
          </View>

          <View className="px-4 pb-4">
            <ComposerCard
              palette={{
                background: scheme === "dark" ? "#1E293B" : "#FFFFFF",
                text: scheme === "dark" ? "#F1F5F9" : "#0F172A",
                textGray: scheme === "dark" ? "#94A3B8" : "#64748B",
                textInputPlaceholder: scheme === "dark" ? "#64748B" : "#94A3B8",
                primary: palette.primary,
              }}
              cardBg={scheme === "dark" ? "#1E293B" : "#FFFFFF"}
              lineColor={
                scheme === "dark"
                  ? "rgba(255,255,255,0.05)"
                  : "rgba(0,0,0,0.05)"
              }
            />
          </View>
        </View>

        <View className="bg-gray-200 dark:bg-slate-900">
          {isLoadingPosts ? (
            <View className="py-8 items-center justify-center bg-white dark:bg-slate-800">
              <ActivityIndicator color={palette.primary} />
            </View>
          ) : posts.length === 0 ? (
            <View className="py-10 items-center justify-center bg-white dark:bg-slate-800">
              <Text className="text-center text-sm font-medium text-slate-500">
                {t("profileDetail.noPosts", { defaultValue: "No posts yet." })}
              </Text>
            </View>
          ) : (
            posts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                palette={{
                  background: scheme === "dark" ? "#1E293B" : "#FFFFFF",
                  text: scheme === "dark" ? "#F1F5F9" : "#0F172A",
                  textGray: scheme === "dark" ? "#94A3B8" : "#64748B",
                  textInputPlaceholder:
                    scheme === "dark" ? "#64748B" : "#94A3B8",
                  primary: palette.primary,
                }}
                mutedText={scheme === "dark" ? "#94A3B8" : "#64748B"}
                onOpenComments={(postId) =>
                  router.push(`/(main)/conversation/${postId}` as any)
                }
              />
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
}

/* ── Helpers ── */

type InfoRowProps = {
  icon: React.ReactNode;
  label: string;
  value: string;
};

function InfoRow({ icon, label, value }: InfoRowProps) {
  return (
    <View className="flex-row items-center gap-3">
      {icon}
      <Text className="text-[15px] text-slate-900 dark:text-slate-100 font-medium">
        {value}
      </Text>
    </View>
  );
}
