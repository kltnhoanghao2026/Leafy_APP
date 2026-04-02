import { ScrollView } from "react-native";

import Colors from "@/src/constants/Colors";
import { useColorScheme } from "@/src/hooks/useColorScheme";

import { WeatherStrip } from "./WeatherStrip";
import { StatsGrid } from "./StatsGrid";
import { FarmMapSection } from "./FarmMapSection";
import { AlertsSection } from "./AlertsSection";
import { homeStyles as styles } from "./home.styles";

export function HomeScreen() {
  const colorScheme = useColorScheme() ?? "light";
  const palette = Colors[colorScheme];
  const isDark = colorScheme === "dark";

  const cardBg = isDark ? palette.textInputBackground : "#FFFFFF";
  const cardBorder = isDark ? "rgba(74,222,128,0.12)" : "rgba(47,127,52,0.08)";
  const subText = isDark ? "#94A3B8" : "#64748B";

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: palette.background }}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      <WeatherStrip
        cardBg={cardBg}
        cardBorder={cardBorder}
        textColor={palette.text}
        subTextColor={subText}
      />
      <StatsGrid
        primaryColor={palette.primary}
        cardBg={cardBg}
        cardBorder={cardBorder}
        textColor={palette.text}
        subTextColor={subText}
        isDark={isDark}
      />
      <FarmMapSection
        primaryColor={palette.primary}
        textColor={palette.text}
        cardBorder={isDark ? palette.textInputBackground : "#FFFFFF"}
        isDark={isDark}
      />
      <AlertsSection textColor={palette.text} />
    </ScrollView>
  );
}
