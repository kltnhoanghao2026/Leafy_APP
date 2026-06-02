import { useQuery } from "@tanstack/react-query";
import { useRouter, Stack } from "expo-router";
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
      <Stack.Screen
        options={{
          headerRight: () => (
            <Pressable className="active:opacity-70">
              <MoreHorizontal
                color={scheme === "dark" ? "#F1F5F9" : "#334155"}
                size={24}
              />
            </Pressable>
          ),
        }}
      />
      <ScrollView
        showsVerticalScrollIndicator={false}
      >
        {/* Cover Photo & Profile Info Section */}
        <View className="bg-white dark:bg-slate-800 pb-5 rounded-b-3xl shadow-sm z-10">
          {/* Cover Photo */}
          <View className="h-48 w-full bg-slate-300 dark:bg-slate-700 relative">
            <Image
              source={{
                uri: "https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?q=80&w=1000&auto=format&fit=crop",
              }}
              className="h-full w-full"
              resizeMode="cover"
            />
            {/* Gradient Overlay for a smoother transition to content (simulated with opacity) */}
            <View className="absolute inset-0 bg-black/20" />
          </View>

          <View className="px-5">
            {/* Avatar Row */}
            <View className="flex-row justify-between items-end -mt-16 mb-4">
              <View className="h-32 w-32 overflow-hidden rounded-full border-4 border-white dark:border-slate-800 bg-white dark:bg-slate-800 shadow-md">
                {shouldShowLetterAvatar ? (
                  <View className="h-full w-full items-center justify-center bg-primary/10">
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
              <Text className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
                {displayName}
              </Text>
              {isVerified && (
                <BadgeCheck color="#3B82F6" fill="#10B981" size={26} />
              )}
            </View>

            {/* Role badge */}
            <Text
              className={`text-[15px] font-semibold tracking-wide uppercase mb-3 ${isExpert ? "text-emerald-600 dark:text-emerald-400" : "text-primary"}`}
            >
              {displayRole}
            </Text>

            {/* Bio */}
            {!!profile.bio?.trim() && (
              <Text className="text-[15px] leading-6 text-slate-700 dark:text-slate-300 mb-5">
                {profile.bio}
              </Text>
            )}

            {/* Action Buttons */}
            <View className="flex-row items-center gap-3 mt-1">
              <Pressable
                className={`flex-1 rounded-xl py-3 flex-row items-center justify-center gap-2 shadow-sm ${isExpert ? "bg-emerald-600" : "bg-primary"}`}
                style={({ pressed }) => ({ opacity: pressed ? 0.9 : 1 })}
              >
                <UserPlus color="#FFFFFF" size={20} />
                <Text className="text-white font-bold text-[15px]">Follow</Text>
              </Pressable>

              <Pressable
                className="flex-1 bg-slate-100 dark:bg-slate-700 rounded-xl py-3 flex-row items-center justify-center gap-2"
                style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}
              >
                <MessageCircle
                  color={scheme === "dark" ? "#F1F5F9" : "#334155"}
                  size={20}
                />
                <Text className="text-slate-800 dark:text-slate-200 font-bold text-[15px]">
                  Message
                </Text>
              </Pressable>
            </View>
          </View>
        </View>

        {/* Info section */}
        <View className="mt-3 bg-white dark:bg-slate-800 px-5 py-5 rounded-3xl shadow-sm mx-0">
          <Text className="mb-5 text-[18px] font-extrabold text-slate-900 dark:text-slate-100">
            {t("profileDetail.infoSection", { defaultValue: "About" })}
          </Text>
          <View className="gap-y-5">
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
                value={joinedDate}
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
          <View className="mt-3 bg-white dark:bg-slate-800 px-5 py-5 rounded-3xl shadow-sm mx-0">
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-[18px] font-extrabold text-slate-900 dark:text-slate-100">
                {t("profile.expertApplication.sectionTitle", {
                  defaultValue: "Expert Verification",
                })}
              </Text>
            </View>
            <View className="flex-row items-start gap-4 rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 p-4 border border-emerald-100 dark:border-emerald-800/30">
              <View className="h-12 w-12 rounded-full bg-emerald-100 dark:bg-emerald-800/50 items-center justify-center">
                <ShieldCheck color="#10B981" size={24} />
              </View>
              <View className="flex-1">
                <Text className="text-[15px] font-bold text-emerald-800 dark:text-emerald-400">
                  {t("profile.expertApplication.alreadyExpertTitle")}
                </Text>
                <Text className="mt-1 text-[13px] text-emerald-600 dark:text-emerald-500 leading-5">
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
            <View className="mt-3 bg-white dark:bg-slate-800 py-5 rounded-3xl shadow-sm mx-0">
              <View className="px-5 mb-4 flex-row items-center justify-between">
                <Text className="text-[18px] font-extrabold text-slate-900 dark:text-slate-100">
                  {t("profile.expertApplication.approvedCertificates", {
                    defaultValue: "Certificates & Awards",
                  })}
                </Text>
              </View>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: 20, gap: 12 }}
                className="overflow-visible pb-2"
              >
                {profile.certificates.map((cert, index) => (
                  <View
                    key={cert.id ?? index}
                    className="w-64 overflow-hidden rounded-2xl border border-slate-200/60 bg-white p-4 shadow-sm dark:border-slate-700/60 dark:bg-slate-800/80"
                  >
                    <View className="flex-row items-start gap-3 mb-3">
                      <View className="h-10 w-10 rounded-full bg-amber-50 dark:bg-amber-900/20 items-center justify-center">
                        <Award color="#F59E0B" size={20} />
                      </View>
                      <View className="flex-1">
                        <Text className="text-[15px] font-bold text-slate-900 dark:text-slate-100 mt-0.5" numberOfLines={2}>
                          {cert.title}
                        </Text>
                      </View>
                    </View>
                    <Text className="text-[13px] font-medium text-slate-600 dark:text-slate-300 mb-1" numberOfLines={1}>
                      {cert.issuedBy}
                    </Text>
                    {!!cert.issueDate && (
                      <Text className="text-xs text-slate-500 dark:text-slate-400">
                        Issued {cert.issueDate}
                      </Text>
                    )}
                  </View>
                ))}
              </ScrollView>
            </View>
          )}

        {/* Posts Tab */}
        <View className="mt-3 bg-white dark:bg-slate-800 pt-5 pb-2 rounded-t-3xl shadow-sm mx-0">
          <View className="px-5 mb-4">
            <Text className="text-[18px] font-extrabold text-slate-900 dark:text-slate-100">
              Recent Posts
            </Text>
          </View>

          <View className="px-5 pb-2">
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

        <View className="bg-gray-100 dark:bg-slate-900">
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
    <View className="flex-row items-center gap-4">
      <View className="h-11 w-11 rounded-full bg-slate-100 dark:bg-slate-700/80 items-center justify-center">
        {icon}
      </View>
      <View className="flex-1 justify-center">
        <Text className="text-[11px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider mb-0.5">
          {label}
        </Text>
        <Text className="text-[15px] text-slate-900 dark:text-slate-100 font-semibold">
          {value}
        </Text>
      </View>
    </View>
  );
}
