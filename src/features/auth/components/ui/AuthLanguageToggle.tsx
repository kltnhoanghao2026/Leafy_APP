import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Languages } from "lucide-react-native";
import { changeAppLanguage, getCurrentLanguage } from "@/src/i18n";

interface AuthLanguageToggleProps {
  palette: any;
}

export function AuthLanguageToggle({ palette }: AuthLanguageToggleProps) {
  const currentLanguage = getCurrentLanguage();

  const handleToggleLanguage = async () => {
    await changeAppLanguage(currentLanguage === "vi" ? "en" : "vi");
  };

  return (
    <View style={styles.langToggleWrapper}>
      <TouchableOpacity onPress={handleToggleLanguage} activeOpacity={0.8}>
        <View
          style={[
            styles.langToggle,
            {
              borderColor: palette.textInputPlaceholder,
              backgroundColor: palette.textInputBackground,
            },
          ]}
        >
          <Languages size={16} color={palette.textInputPlaceholder} />
          <Text
            style={[
              styles.langToggleText,
              { color: palette.textInputPlaceholder },
            ]}
          >
            {currentLanguage === "vi" ? "EN" : "VI"}
          </Text>
        </View>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  langToggleWrapper: {
    position: "absolute",
    top: 8,
    right: 24,
    zIndex: 10,
  },
  langToggle: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 32,
    borderWidth: 1,
  },
  langToggleText: {
    fontSize: 12,
    fontWeight: "700",
  },
});
