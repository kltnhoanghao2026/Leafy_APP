import React from "react";
import { View, Text, Image, Pressable, StyleSheet } from "react-native";
import { Sprout, GraduationCap, Leaf, MapPin, BadgeCheck } from "lucide-react-native";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";

import type { ProfileSearchResult } from "@/src/features/community/community-feed/api/search.api";

const FALLBACK_AVATAR = "https://ui-avatars.com/api/?background=E5E7EB&color=334155&name=L";

type SearchResultProfileCardProps = {
  item: ProfileSearchResult;
  cardBg: string;
  borderCol: string;
  textCol: string;
  mutedText: string;
  primaryColor: string;
  isDark: boolean;
};

export function SearchResultProfileCard({
  item,
  cardBg,
  borderCol,
  textCol,
  mutedText,
  primaryColor,
  isDark,
}: SearchResultProfileCardProps) {
  const router = useRouter();
  const { t } = useTranslation();

  const getRoleInfo = (role: string) => {
    const r = role?.toUpperCase();
    if (r === "EXPERT") {
      return {
        label: t("profile.roles.expert", "Expert"),
        icon: GraduationCap,
        color: "#7C3AED",
        bg: isDark ? "#2E1065" : "#F3E8FF",
      };
    }
    return {
      label: t("profile.roles.farmer", "Farmer"),
      icon: Sprout,
      color: primaryColor,
      bg: isDark ? "#052E16" : "#ECFDF5",
    };
  };

  const roleInfo = getRoleInfo(item.role);
  const RoleIcon = roleInfo.icon;

  return (
    <Pressable
      onPress={() =>
        router.push({
          pathname: "/(main)/profile/[profileId]",
          params: { profileId: item.id },
        })
      }
      style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}
    >
      <View style={[styles.card, { backgroundColor: cardBg, borderColor: borderCol }]}>
        <View style={styles.profileRow}>
          <Image
            source={{
              uri: item.avatar || item.profilePicture || FALLBACK_AVATAR,
            }}
            style={styles.profileAvatar}
          />
          <View style={{ flex: 1 }}>
            <View style={styles.authorRow}>
              <Text style={[styles.profileName, { color: textCol }]} numberOfLines={1}>
                {item.fullName}
              </Text>
              {item.isVerified && (
                <BadgeCheck size={15} color={primaryColor} />
              )}
            </View>

            <View style={styles.profileTagsRow}>
              <View style={[styles.roleBadge, { backgroundColor: roleInfo.bg }]}>
                <RoleIcon size={12} color={roleInfo.color} />
                <Text style={[styles.roleBadgeText, { color: roleInfo.color }]}>
                  {roleInfo.label}
                </Text>
              </View>
              {item.specialty ? (
                <View
                  style={[
                    styles.roleBadge,
                    { backgroundColor: isDark ? "#1E293B" : "#F1F5F9" },
                  ]}
                >
                  <Leaf size={12} color={mutedText} />
                  <Text style={[styles.roleBadgeText, { color: mutedText }]}>
                    {item.specialty}
                  </Text>
                </View>
              ) : null}
            </View>

            {item.bio ? (
              <Text style={[styles.bio, { color: mutedText }]} numberOfLines={2}>
                {item.bio}
              </Text>
            ) : null}

            {item.addressLine ? (
              <View style={styles.locationRow}>
                <MapPin size={12} color={mutedText} />
                <Text style={[styles.locationText, { color: mutedText }]} numberOfLines={1}>
                  {item.addressLine}
                </Text>
              </View>
            ) : null}
          </View>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    marginBottom: 12,
  },
  authorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  profileRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  profileAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#E5E7EB",
  },
  profileName: {
    fontSize: 15,
    fontWeight: "600",
  },
  profileTagsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 5,
  },
  roleBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  roleBadgeText: {
    fontSize: 12,
    fontWeight: "500",
  },
  bio: {
    fontSize: 13,
    lineHeight: 18,
    marginTop: 6,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 4,
  },
  locationText: {
    fontSize: 12,
  },
});
