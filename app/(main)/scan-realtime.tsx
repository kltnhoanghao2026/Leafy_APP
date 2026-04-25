import React from "react";
import { Stack } from "expo-router";
import { useTranslation } from "react-i18next";

import RealtimeScanScreen from "@/src/features/disease-detection/components/RealtimeScanScreen";

export default function ScanRealtimeRoute() {
  const { t } = useTranslation();

  return (
    <>
      <Stack.Screen
        options={{
          title: t("diseaseDetection.realtimeScan", "Real-time Scan"),
          headerShown: false,
        }}
      />
      <RealtimeScanScreen />
    </>
  );
}
