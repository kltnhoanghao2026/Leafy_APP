import React from "react";
import { View, Text } from "react-native";

interface CircleProgressProps {
  pct: number;
  size?: number;
  strokeWidth?: number;
  color: string;
}

export function CircleProgress({
  pct,
  size = 56,
  strokeWidth = 6,
  color,
}: CircleProgressProps) {
  return (
    <View style={{ width: size, height: size, position: "relative" }}>
      {/* Background ring */}
      <View
        style={{
          position: "absolute",
          top: strokeWidth / 2,
          left: strokeWidth / 2,
          width: size - strokeWidth,
          height: size - strokeWidth,
          borderRadius: (size - strokeWidth) / 2,
          borderWidth: strokeWidth,
          borderColor: "#e2e8f0",
        }}
      />
      {/* Progress ring — approximated with View-based approach for React Native */}
      <View
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: size,
          height: size,
          transform: [{ rotate: `${(pct / 100) * 360 - 90}deg` }],
        }}
      >
        <View
          style={{
            position: "absolute",
            top: strokeWidth / 2,
            left: strokeWidth / 2,
            width: size - strokeWidth,
            height: size - strokeWidth,
            borderRadius: (size - strokeWidth) / 2,
            borderWidth: strokeWidth,
            borderColor: color,
            borderTopColor: "transparent",
            borderRightColor: pct > 25 ? color : "transparent",
            borderBottomColor: pct > 50 ? color : "transparent",
            borderLeftColor: pct > 75 ? color : "transparent",
          }}
        />
      </View>
      {/* Center label */}
      <View
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <Text
          style={{
            fontSize: size * 0.22,
            fontWeight: "800",
            color: color,
          }}
        >
          {pct}%
        </Text>
      </View>
    </View>
  );
}
