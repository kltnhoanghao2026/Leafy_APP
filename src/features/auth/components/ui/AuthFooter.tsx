import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface AuthFooterProps {
  palette: any;
  message: string;
  linkText: string;
  onPressLink: () => void;
}

export function AuthFooter({
  palette,
  message,
  linkText,
  onPressLink,
}: AuthFooterProps) {
  return (
    <View style={styles.signupRow}>
      <Text style={[styles.mutedText, { color: palette.textGray }]}>
        {message}
      </Text>
      <TouchableOpacity onPress={onPressLink}>
        <Text style={[styles.linkText, { color: palette.green }]}>
          {linkText}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  signupRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 4,
  },
  mutedText: {
    fontSize: 14,
  },
  linkText: {
    fontSize: 14,
    fontWeight: "600",
  },
});
