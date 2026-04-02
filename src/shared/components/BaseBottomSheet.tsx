import React, { forwardRef, useCallback, useMemo } from "react";
import { StyleSheet, View } from "react-native";
import BottomSheet, {
  BottomSheetBackdrop,
  BottomSheetProps,
  BottomSheetBackdropProps,
} from "@gorhom/bottom-sheet";
import { useColorScheme } from "nativewind";

import { useSafeAreaInsets } from "react-native-safe-area-context";

interface BaseBottomSheetProps extends BottomSheetProps {
  children: React.ReactNode;
}

export const BaseBottomSheet = forwardRef<BottomSheet, BaseBottomSheetProps>(
  ({ children, ...props }, ref) => {
    const { colorScheme } = useColorScheme();
    const insets = useSafeAreaInsets();
    const isDark = colorScheme === "dark";

    const renderBackdrop = useCallback(
      (backdropProps: BottomSheetBackdropProps) => (
        <BottomSheetBackdrop
          {...backdropProps}
          appearsOnIndex={0}
          disappearsOnIndex={-1}
        />
      ),
      [],
    );

    const backgroundStyle = useMemo(
      () => ({
        backgroundColor: isDark ? "#0f172a" : "#ffffff", // slate-900 / white
      }),
      [isDark],
    );

    const handleStyle = useMemo(
      () => ({
        backgroundColor: isDark ? "#0f172a" : "#ffffff", // matches background properly
        borderTopLeftRadius: 15,
        borderTopRightRadius: 15,
      }),
      [isDark],
    );

    const handleIndicatorStyle = useMemo(
      () => ({
        backgroundColor: isDark ? "#475569" : "#cbd5e1", // slate-600 / slate-300
      }),
      [isDark],
    );

    return (
      <BottomSheet
        ref={ref}
        backdropComponent={renderBackdrop}
        backgroundStyle={backgroundStyle}
        handleStyle={handleStyle}
        handleIndicatorStyle={handleIndicatorStyle}
        enablePanDownToClose
        keyboardBehavior="extend" // or fill/interactive if needed, 'extend' usually plays well for generic bottom-sheets
        {...props}
      >
        <View
          className="flex-1 px-4"
          style={{ paddingBottom: Math.max(insets.bottom + 16, 90) }}
        >
          {children}
        </View>
      </BottomSheet>
    );
  },
);

BaseBottomSheet.displayName = "BaseBottomSheet";
