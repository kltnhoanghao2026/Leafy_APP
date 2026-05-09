import React from "react";
import { StyleSheet, Text, View } from "react-native";

interface AuthErrorBannerProps {
  message: string;
}

export function AuthErrorBanner({ message }: AuthErrorBannerProps) {
  return (
    <View
      style={[
        styles.errorBanner,
        { backgroundColor: "#fee2e2", borderLeftColor: "#ef4444" },
      ]}
    >
      <Text style={[styles.errorText, { color: "#dc2626" }]}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  errorBanner: {
    borderLeftWidth: 4,
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  errorText: {
    fontSize: 13,
  },
});
