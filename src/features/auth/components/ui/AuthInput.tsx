import React from "react";
import { StyleSheet, Text, TextInput, View, TextInputProps, TouchableOpacity } from "react-native";

interface AuthInputProps extends TextInputProps {
  label: string;
  error?: string;
  palette: any;
  rightElement?: React.ReactNode;
  headerRightElement?: React.ReactNode;
}

export function AuthInput({
  label,
  error,
  palette,
  rightElement,
  headerRightElement,
  style,
  ...props
}: AuthInputProps) {
  const hasError = !!error;

  return (
    <View style={styles.fieldGroup}>
      <View style={styles.labelRow}>
        <Text style={[styles.fieldLabel, { color: palette.text }]}>
          {label}
        </Text>
        {headerRightElement}
      </View>

      <View
        style={[
          styles.inputRow,
          {
            backgroundColor: palette.textInputBackground,
            borderColor: hasError ? "#ef4444" : palette.textInputPlaceholder,
          },
        ]}
      >
        <TextInput
          style={[styles.textInput, { color: palette.text }, style]}
          placeholderTextColor={palette.textInputPlaceholder}
          {...props}
        />
        {rightElement}
      </View>

      {hasError && (
        <Text style={styles.errorText}>
          {error}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  fieldGroup: {
    gap: 8,
  },
  labelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  fieldLabel: {
    fontSize: 16,
    fontWeight: "600",
  },
  inputRow: {
    flexDirection: "row",
    borderRadius: 48,
    borderWidth: 1,
    paddingHorizontal: 16,
    alignItems: "center",
    gap: 8,
    height: 48,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    borderWidth: 0,
    backgroundColor: "transparent",
    paddingVertical: 0,
  },
  errorText: {
    color: "#dc2626",
    fontSize: 13,
  },
});
