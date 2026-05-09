import React from "react";
import { StyleSheet, Text, View } from "react-native";

interface AuthDividerProps {
  palette: any;
  text: string;
}

export function AuthDivider({ palette, text }: AuthDividerProps) {
  return (
    <View style={styles.dividerRow}>
      <View
        style={[
          styles.dividerLine,
          { backgroundColor: palette.textInputPlaceholder },
        ]}
      />
      <Text
        style={[
          styles.dividerText,
          { color: palette.textInputPlaceholder },
        ]}
      >
        {text}
      </Text>
      <View
        style={[
          styles.dividerLine,
          { backgroundColor: palette.textInputPlaceholder },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    fontSize: 12,
    letterSpacing: 0.5,
    fontWeight: "600",
  },
});
