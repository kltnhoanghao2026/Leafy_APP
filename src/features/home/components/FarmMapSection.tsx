import { View, Text, Image, Pressable } from "react-native";
import { MapPin } from "lucide-react-native";
import { homeStyles as styles } from "./home.styles";

const FARM_MAP_IMAGE =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuDEpqPAggU6tcfILAb9jFYL92YLSmp7qel1CA14VZp9_oCgiD5498exlPar3eq-70mKzuXfgiR2muCX5FoKK4oDjuJRHLNWP4zQfFuySdtRt3mSGknuIVfkSDAoh1kaVdz9l4i_8el37ivnBV4CiB4UUCj9vomldv1729kMFWi-BIuhToKBIajRZF26BGetOSTsVbD9IQUYTdJ19q74-ror_H8QKhBERgtCMm9vdX2pYxA7nxpNMlLYNWkMp591xTbhjrfYxiTcknYT";

type FarmMapSectionProps = {
  primaryColor: string;
  textColor: string;
  cardBorder: string;
  isDark: boolean;
};

export function FarmMapSection({
  primaryColor,
  textColor,
  cardBorder,
  isDark,
}: FarmMapSectionProps) {
  const badgeBg = isDark ? "rgba(15,23,42,0.92)" : "rgba(255,255,255,0.92)";

  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: textColor }]}>
          Vị trí vườn cà phê
        </Text>
        <Pressable>
          <Text style={[styles.sectionAction, { color: primaryColor }]}>
            Chi tiết
          </Text>
        </Pressable>
      </View>
      <View style={[styles.mapContainer, { borderColor: cardBorder }]}>
        <Image
          source={{ uri: FARM_MAP_IMAGE }}
          style={styles.mapImage}
          resizeMode="cover"
        />
        <View style={[styles.mapBadge, { backgroundColor: badgeBg }]}>
          <MapPin size={14} color={primaryColor} />
          <Text style={[styles.mapBadgeText, { color: textColor }]}>
            Lô A1 - Trạm 04
          </Text>
        </View>
      </View>
    </View>
  );
}
