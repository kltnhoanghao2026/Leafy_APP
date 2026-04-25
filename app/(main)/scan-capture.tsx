import React from "react";
import { Stack } from "expo-router";
import { useTranslation } from "react-i18next";

import LocalCaptureScreen from "@/src/features/disease-detection/components/LocalCaptureScreen";

export default function ScanCaptureRoute() {
  const { t } = useTranslation();

  return (
    <>
      <Stack.Screen
        options={{
          title: t("diseaseDetection.localCapture", "Local Scan"),
          headerShown: true,
        }}
      />
      <LocalCaptureScreen />
    </>
  );
}
