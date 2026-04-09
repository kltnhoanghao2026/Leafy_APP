import React, { useLayoutEffect } from "react";
import { View, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "expo-router";
import { useTranslation } from "react-i18next";

import Colors from "@/src/constants/Colors";
import { useColorScheme } from "@/src/hooks/useColorScheme";
import { CommunityMessagesPanel } from "@/src/features/community/components/CommunityMessagesPanel";
import BackButton from "@/src/components/ui/BackButton";

export default function CommunityMessagesScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const colorScheme = useColorScheme() === "dark" ? "dark" : "light";
  const palette = Colors[colorScheme];

  const cardBg = colorScheme === "dark" ? "#1F2A20" : "#FFFFFF";
  const lineColor =
    colorScheme === "dark" ? "rgba(148,163,184,0.18)" : "rgba(47,127,52,0.12)";
  const mutedText = palette.textGray;

  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: t("community.tabs.messages", "Messages"),
      headerLeft: () => <BackButton fallback="/(main)/community" />,
      headerShown: true,
      headerStyle: {
        backgroundColor: palette.background,
      },
      headerTitleStyle: {
        color: palette.text,
        fontWeight: "600",
      },
      headerShadowVisible: false,
    });
  }, [navigation, t, palette]);

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: palette.background }}
      edges={["bottom", "left", "right"]}
    >
      <ScrollView
        className="flex-1"
        style={{ backgroundColor: palette.background }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 16, paddingBottom: 28, gap: 16 }}
      >
        <CommunityMessagesPanel
          palette={palette}
          cardBg={cardBg}
          lineColor={lineColor}
          mutedText={mutedText}
        />
      </ScrollView>
    </SafeAreaView>
  );
}
