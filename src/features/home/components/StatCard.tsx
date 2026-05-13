import React from "react";
import { View, Text } from "react-native";
import { homeStyles as styles } from "./home.styles";

export type StatCardProps = {
  icon: React.ReactNode;
  iconBg: string;
  label: string;
  value: string;
  badge?: string;
  badgeColor?: string;
  bg: string;
  borderColor: string;
  textColor: string;
  subTextColor: string;
};

export function StatCard({
  icon,
  iconBg,
  label,
  value,
  badge,
  badgeColor,
  bg,
  borderColor,
  textColor,
  subTextColor,
}: StatCardProps) {
  return (
    <View style={[styles.statCard, { backgroundColor: bg, borderColor }]}>
      <View style={styles.statCardHeader}>
        <View style={[styles.statIcon, { backgroundColor: iconBg }]}>
          {icon}
        </View>
        <Text style={[styles.statBadge, { color: badgeColor }]}>{badge}</Text>
      </View>
      <Text style={[styles.statLabel, { color: subTextColor }]}>{label}</Text>
      <Text style={[styles.statValue, { color: textColor }]}>{value}</Text>
    </View>
  );
}
