import React from "react";
import {
  TouchableOpacity,
  StyleSheet,
  Text,
  View,
  ActivityIndicator,
} from "react-native";
import {
  Clock,
  MessageCircle,
  Check,
  UserPlus,
  UserMinus,
  Award,
  MapPin,
} from "lucide-react-native";
import { Avatar } from "@/src/components/ui/Avatar";
import type { ExpertProfile, ExpertPalette } from "../types/expert.types";

type ExpertCardProps = {
  expert: ExpertProfile;
  palette: ExpertPalette;
  cardBg: string;
  lineColor: string;
  mutedText: string;
  onPress?: () => void;
  onConsultPress?: () => void;
  onFollowPress?: () => void;
  isConsulting?: boolean;
  isFollowingLoading?: boolean;
};

export function ExpertCard({
  expert,
  palette,
  cardBg,
  lineColor,
  mutedText,
  onPress,
  onConsultPress,
  onFollowPress,
  isConsulting = false,
  isFollowingLoading = false,
}: ExpertCardProps) {
  const isPending = expert.hasPendingConsultRequest;
  const isFollowing = expert.isFollowing;

  const getConsultButtonText = () => {
    if (isConsulting) return "";
    if (isPending) return "Hủy yêu cầu";
    return "Tư vấn ngay";
  };

  const getConsultButtonIcon = () => {
    if (isConsulting) return null;
    if (isPending) return <Clock size={15} color="#FFFFFF" />;
    return <MessageCircle size={15} color="#FFFFFF" />;
  };

  const getFollowButtonText = () => {
    if (isFollowingLoading) return "";
    if (isFollowing) return "Hủy theo dõi";
    return "Theo dõi";
  };

  const getFollowButtonIcon = () => {
    if (isFollowingLoading) return null;
    if (isFollowing) return <UserMinus size={15} color="#FFFFFF" />;
    return <UserPlus size={15} color="#FFFFFF" />;
  };

  const avatarUri =
    expert.profilePicture?.trim() ||
    expert.avatar?.trim() ||
    null;

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.9}
      style={[
        styles.card,
        {
          backgroundColor: cardBg,
          borderColor: lineColor,
        },
      ]}
    >
      {/* Header: Avatar + Info */}
      <View style={styles.header}>
        <Avatar
          src={avatarUri}
          name={expert.fullName}
          size="md"
          showVerifiedBadge={expert.isVerified}
          verifiedBorderColor={palette.primary}
        />

        <View style={styles.infoContainer}>
          <Text
            style={[styles.name, { color: palette.text }]}
            numberOfLines={1}
          >
            {expert.fullName}
          </Text>

          {expert.specialty && (
            <View style={styles.specialtyRow}>
              <View
                style={[
                  styles.specialtyBadge,
                  { backgroundColor: palette.primary + "15" },
                ]}
              >
                <Text
                  style={[styles.specialtyText, { color: palette.primary }]}
                  numberOfLines={1}
                >
                  {expert.specialty}
                </Text>
              </View>
            </View>
          )}
        </View>
      </View>

      {/* Bio Section */}
      {expert.bio && (
        <View style={styles.bioContainer}>
          <Text
            style={[styles.bio, { color: mutedText }]}
            numberOfLines={2}
          >
            {expert.bio}
          </Text>
        </View>
      )}

      {/* Certificate Badge */}
      {expert.certificates && expert.certificates.length > 0 && (
        <View style={styles.certSection}>
          <View
            style={[
              styles.certBadge,
              { backgroundColor: "rgba(5,150,105,0.08)" },
            ]}
          >
            <Award size={13} color="#059669" />
            <Text style={styles.certText} numberOfLines={1}>
              {expert.certificates[0].name}
              {expert.certificates.length > 1 &&
                ` +${expert.certificates.length - 1}`}
            </Text>
          </View>
        </View>
      )}

      {/* Location */}
      {expert.addressLine && (
        <View style={styles.locationRow}>
          <MapPin size={12} color={mutedText} />
          <Text
            style={[styles.locationText, { color: mutedText }]}
            numberOfLines={1}
          >
            {expert.addressLine}
          </Text>
        </View>
      )}

      {/* CTA Section */}
      <View className="mt-3.5">
        {isPending && (
          <View
            className="flex-row items-center self-start mb-2.5 px-2.5 py-2 rounded-xl gap-1"
            style={{ backgroundColor: "rgba(245,158,11,0.12)" }}
          >
            <Clock size={12} color="#F59E0B" />
            <Text className="text-xs font-semibold" style={{ color: "#F59E0B" }}>
              Chờ phản hồi
            </Text>
          </View>
        )}

        {/* Action Buttons Row */}
        <View className="flex-row gap-2">
          {/* Consult Button */}
          <TouchableOpacity
            onPress={onConsultPress}
            disabled={isConsulting || isPending}
            activeOpacity={0.8}
            className="flex-1 py-3 px-4 rounded-xl items-center justify-center flex-row gap-2"
            style={[
              { backgroundColor: palette.primary },
              (isConsulting || isPending) && { opacity: 0.6 },
            ]}
          >
            {isConsulting ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <View className="flex-row items-center gap-2">
                {getConsultButtonIcon()}
                <Text className="text-sm font-bold text-white">
                  {getConsultButtonText()}
                </Text>
              </View>
            )}
          </TouchableOpacity>

          {/* Follow/Unfollow Button */}
          <TouchableOpacity
            onPress={onFollowPress}
            disabled={isFollowingLoading}
            activeOpacity={0.8}
            className="flex-1 py-3 px-4 rounded-xl items-center justify-center flex-row gap-2"
            style={[
              { backgroundColor: isFollowing ? palette.textGray : palette.primary },
              isFollowingLoading && { opacity: 0.6 },
            ]}
          >
            {isFollowingLoading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <View className="flex-row items-center gap-2">
                {getFollowButtonIcon()}
                <Text className="text-sm font-bold text-white">
                  {getFollowButtonText()}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    marginBottom: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  infoContainer: {
    flex: 1,
    marginLeft: 14,
  },
  name: {
    fontSize: 17,
    fontWeight: "700",
    lineHeight: 22,
  },
  specialtyRow: {
    marginTop: 6,
  },
  specialtyBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  specialtyText: {
    fontSize: 12,
    fontWeight: "600",
    lineHeight: 16,
  },
  bioContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.04)",
  },
  bio: {
    fontSize: 13,
    lineHeight: 18,
  },
  certSection: {
    marginTop: 12,
  },
  certBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 6,
  },
  certText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#059669",
    lineHeight: 16,
    maxWidth: 180,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
    gap: 4,
  },
  locationText: {
    fontSize: 12,
    lineHeight: 16,
    flex: 1,
  },
});
