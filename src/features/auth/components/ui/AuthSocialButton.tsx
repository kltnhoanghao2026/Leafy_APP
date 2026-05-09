import React from "react";
import { StyleSheet, Text, TouchableOpacity, View, TouchableOpacityProps } from "react-native";
import Svg, { Path } from "react-native-svg";

function GoogleIcon({ color }: { color: string }) {
  return (
    <Svg width={20} height={20} viewBox="0 0 640 640" fill="none">
      <Path
        fill={color}
        d="M564 325.8C564 467.3 467.1 568 324 568C186.8 568 76 457.2 76 320C76 182.8 186.8 72 324 72C390.8 72 447 96.5 490.3 136.9L422.8 201.8C334.5 116.6 170.3 180.6 170.3 320C170.3 406.5 239.4 476.6 324 476.6C422.2 476.6 459 406.2 464.8 369.7L324 369.7L324 284.4L560.1 284.4C562.4 297.1 564 309.3 564 325.8z"
      />
    </Svg>
  );
}

interface AuthSocialButtonProps extends TouchableOpacityProps {
  palette: any;
  title: string;
}

export function AuthSocialButton({
  palette,
  title,
  ...props
}: AuthSocialButtonProps) {
  return (
    <TouchableOpacity activeOpacity={0.8} {...props}>
      <View
        style={[
          styles.socialButton,
          {
            borderColor: palette.textInputPlaceholder,
            backgroundColor: palette.textInputBackground,
          },
        ]}
      >
        <GoogleIcon color={palette.text} />
        <Text style={[styles.socialButtonText, { color: palette.text }]}>
          {title}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  socialButton: {
    flexDirection: "row",
    borderRadius: 32,
    borderWidth: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  socialButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
});
