import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Image, Text, View } from "react-native";
import { apiClient } from "@/src/lib/axios";
import { API_ENDPOINTS } from "@/src/lib/routes";

export type AvatarSize = "xs" | "sm" | "md" | "lg" | "xl";

export interface AvatarProps {
  /** The URL or S3 key of the avatar image */
  src?: string | null;
  /** The name of the user/entity, used for generating initials */
  name?: string | null;
  /** Alt text for accessibility */
  alt?: string;
  /** The size of the avatar */
  size?: AvatarSize;
  /** Additional className for the container */
  className?: string;
  /** Show verified badge */
  showVerifiedBadge?: boolean;
  /** Border color for verified badge */
  verifiedBorderColor?: string;
}

const SIZE_STYLES: Record<AvatarSize, { container: string; text: number }> = {
  xs: { container: "w-6 h-6", text: 10 },
  sm: { container: "w-8 h-8", text: 12 },
  md: { container: "w-10 h-10", text: 14 },
  lg: { container: "w-12 h-12", text: 16 },
  xl: { container: "w-16 h-16", text: 20 },
};

const FALLBACK_COLORS = [
  "#2F7F34", // Primary green
  "#059669", // Emerald
  "#0891B2", // Cyan
  "#7C3AED", // Violet
  "#DB2777", // Pink
  "#EA580C", // Orange
];

const getInitials = (name?: string | null): string => {
  if (!name) return "U";
  const first = name.trim().charAt(0).toUpperCase();
  return first || "U";
};

const getBackgroundColor = (name?: string | null): string => {
  if (!name) return FALLBACK_COLORS[0];
  const charCode = name.charCodeAt(0) || 0;
  return FALLBACK_COLORS[charCode % FALLBACK_COLORS.length];
};

export function Avatar({
  src,
  name,
  alt,
  size = "md",
  className = "",
  showVerifiedBadge = false,
  verifiedBorderColor,
}: AvatarProps) {
  const [imageError, setImageError] = useState(false);

  // Normalize the src - trim whitespace
  const srcKey = src?.trim();

  // Fetch presigned URL for avatar if src is an s3Key
  const { data: presignedUrl } = useQuery({
    queryKey: ["avatar", "presigned", srcKey],
    queryFn: async () => {
      if (!srcKey) return null;
      const response = await apiClient.get<{ data: string }>(
        API_ENDPOINTS.FILES.PRESIGNED_URL(srcKey),
        { params: { expirationMinutes: 60 * 24 * 7 } }
      );
      return response.data.data;
    },
    enabled: !!srcKey,
    staleTime: 60 * 60 * 1000, // Cache for 1 hour
  });

  const initials = getInitials(name);
  const fallbackBg = getBackgroundColor(name);
  const altText = alt || name || "Avatar";
  const sizeStyle = SIZE_STYLES[size];

  // Use presigned URL if available, otherwise fallback to direct URI
  const avatarUri = presignedUrl || srcKey || "";
  const shouldShowLetterAvatar = !avatarUri || imageError;

  const containerClass = `rounded-full overflow-hidden items-center justify-center ${sizeStyle.container} ${className}`;

  return (
    <View className={containerClass}>
      {shouldShowLetterAvatar ? (
        <View
          className="absolute h-full w-full items-center justify-center"
          style={{ backgroundColor: fallbackBg }}
        >
          <Text
            className="font-extrabold text-white"
            style={{ fontSize: sizeStyle.text }}
          >
            {initials}
          </Text>
        </View>
      ) : (
        <Image
          source={{ uri: avatarUri }}
          className="h-full w-full"
          resizeMode="cover"
          onError={() => setImageError(true)}
          accessibilityLabel={altText}
        />
      )}

      {showVerifiedBadge && (
        <View
          className="absolute bottom-0 right-0 rounded-full p-0.5"
          style={{
            backgroundColor: verifiedBorderColor || "#FFFFFF",
          }}
        >
          <View
            className="w-3 h-3 rounded-full items-center justify-center"
            style={{ backgroundColor: "#10B981" }}
          >
            <Text className="text-white text-[8px] font-bold">✓</Text>
          </View>
        </View>
      )}
    </View>
  );
}

export { getInitials, getBackgroundColor };
