import { X } from "lucide-react-native";
import React, { useEffect, useRef, type ReactNode } from "react";
import {
  Pressable,
  Text,
  View,
  Animated,
  Dimensions,
  StyleSheet,
  useColorScheme,
  type DimensionValue,
} from "react-native";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

type BottomSheetProps = {
  title: string;
  titleColor: string;
  heightPct?: DimensionValue;
  onClose: () => void;
  children: ReactNode;
};

export function BottomSheet({
  title,
  titleColor,
  heightPct = "82%",
  onClose,
  children,
}: BottomSheetProps) {
  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: 0,
      useNativeDriver: true,
      bounciness: 4,
      speed: 12,
    }).start();
  }, [slideAnim]);

  const handleClose = () => {
    Animated.timing(slideAnim, {
      toValue: SCREEN_HEIGHT,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      onClose();
    });
  };

  return (
    <View style={bsStyles.backdrop}>
      <Pressable style={StyleSheet.absoluteFill} onPress={handleClose} />

      <Animated.View
        style={[
          bsStyles.sheet,
          isDark && bsStyles.sheetDark,
          { height: heightPct, transform: [{ translateY: slideAnim }] },
        ]}
      >
        <View style={bsStyles.handleRow}>
          <View style={[bsStyles.handle, isDark && bsStyles.handleDark]} />
        </View>

        <View style={[bsStyles.headerRow, isDark && bsStyles.headerRowDark]}>
          <Text style={[bsStyles.headerTitle, { color: titleColor }]}>
            {title}
          </Text>
          <Pressable onPress={handleClose} style={bsStyles.closeBtn}>
            <X size={20} color={titleColor} />
          </Pressable>
        </View>

        <View style={bsStyles.body}>{children}</View>
      </Animated.View>
    </View>
  );
}

const bsStyles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(15, 23, 42, 0.45)",
  },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    backgroundColor: "#ffffff",
  },
  sheetDark: {
    borderColor: "#1e293b",
    backgroundColor: "#000000",
  },
  handleRow: {
    alignItems: "center",
    paddingTop: 12,
  },
  handle: {
    height: 6,
    width: 48,
    borderRadius: 3,
    backgroundColor: "#cbd5e1",
  },
  handleDark: {
    backgroundColor: "#334155",
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  headerRowDark: {
    borderBottomColor: "#1e293b",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  closeBtn: {
    borderRadius: 999,
    padding: 4,
  },
  body: {
    flex: 1,
  },
});

