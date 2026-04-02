import { View } from "react-native";
import { Thermometer, Droplets, Sun, FlaskConical } from "lucide-react-native";
import { useTranslation } from "react-i18next";
import { StatCard } from "./StatCard";
import { homeStyles as styles } from "./home.styles";

type StatsGridProps = {
  primaryColor: string;
  cardBg: string;
  cardBorder: string;
  textColor: string;
  subTextColor: string;
  isDark: boolean;
};

export function StatsGrid({
  primaryColor,
  cardBg,
  cardBorder,
  textColor,
  subTextColor,
  isDark,
}: StatsGridProps) {
  const { t } = useTranslation();

  return (
    <View style={styles.statsGrid}>
      <StatCard
        icon={<Thermometer size={20} color={primaryColor} />}
        iconBg={isDark ? "rgba(74,222,128,0.12)" : "rgba(47,127,52,0.1)"}
        label={t("home.stats.temperature")}
        value="28.5°C"
        badge="+2%"
        badgeColor="#16A34A"
        bg={cardBg}
        borderColor={cardBorder}
        textColor={textColor}
        subTextColor={subTextColor}
      />
      <StatCard
        icon={<Droplets size={20} color="#3B82F6" />}
        iconBg="rgba(59,130,246,0.1)"
        label={t("home.stats.soilMoisture")}
        value="65%"
        badge="-5%"
        badgeColor="#EF4444"
        bg={cardBg}
        borderColor={cardBorder}
        textColor={textColor}
        subTextColor={subTextColor}
      />
      <StatCard
        icon={<Sun size={20} color="#F59E0B" />}
        iconBg="rgba(245,158,11,0.1)"
        label={t("home.stats.light")}
        value="850 lux"
        badge="+10%"
        badgeColor="#16A34A"
        bg={cardBg}
        borderColor={cardBorder}
        textColor={textColor}
        subTextColor={subTextColor}
      />
      <StatCard
        icon={<FlaskConical size={20} color="#6D4C41" />}
        iconBg="rgba(109,76,65,0.1)"
        label={t("home.stats.nutrients")}
        value="1.2 EC"
        badge={t("home.stats.stable")}
        badgeColor="#16A34A"
        bg={cardBg}
        borderColor={cardBorder}
        textColor={textColor}
        subTextColor={subTextColor}
      />
    </View>
  );
}
