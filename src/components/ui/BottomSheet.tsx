import { X } from "lucide-react-native";
import React, { useEffect, useRef, type ReactNode } from "react";
import { Pressable, Text, View, Animated, Dimensions, type DimensionValue } from "react-native";

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
    <View
      className="flex-1 justify-end"
      style={{ backgroundColor: "rgba(15, 23, 42, 0.45)" }}
    >
      <Pressable className="absolute inset-0" onPress={handleClose} />

      <Animated.View
        className="rounded-t-3xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-black"
        style={{ height: heightPct, transform: [{ translateY: slideAnim }] }}
      >
        <View className="items-center pt-3">
          <View className="h-1.5 w-12 rounded-full bg-slate-300 dark:bg-slate-700" />
        </View>

        <View className="flex-row items-center justify-between border-b border-slate-200 px-4 py-4 dark:border-slate-800">
          <Text className="text-lg font-semibold" style={{ color: titleColor }}>
            {title}
          </Text>
          <Pressable onPress={handleClose} className="rounded-full p-1">
            <X size={20} color={titleColor} />
          </Pressable>
        </View>

        <View className="flex-1">{children}</View>
      </Animated.View>
    </View>
  );
}
