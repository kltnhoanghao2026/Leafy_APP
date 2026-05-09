import React from "react";
import { StyleSheet, Text, TouchableOpacity, ActivityIndicator, TouchableOpacityProps } from "react-native";

interface AuthSubmitButtonProps extends TouchableOpacityProps {
  title: string;
  isLoading?: boolean;
  palette: any;
}

export function AuthSubmitButton({
  title,
  isLoading,
  disabled,
  palette,
  style,
  ...props
}: AuthSubmitButtonProps) {
  const isDisabled = disabled || isLoading;

  return (
    <TouchableOpacity
      style={[
        styles.submitButton,
        {
          backgroundColor: palette.green,
          opacity: isDisabled ? 0.6 : 1,
        },
        style,
      ]}
      disabled={isDisabled}
      activeOpacity={0.9}
      {...props}
    >
      {isLoading ? (
        <ActivityIndicator color="white" />
      ) : (
        <Text style={styles.submitButtonText}>{title}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  submitButton: {
    height: 52,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  submitButtonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "600",
  },
});
