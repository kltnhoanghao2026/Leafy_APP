import React from "react";
import { Stack } from "expo-router";

import CreatePlanScreen from "@/src/features/plan/components/create-plan/CreatePlanScreen";

export default function CreatePlanPage() {
  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: "Tạo kế hoạch",
          headerShadowVisible: false,
          // tighter header -> less vertical gap before tab switcher
          headerTitleStyle: {
            fontSize: 16,
            fontWeight: "700",
          },
          headerBackTitleVisible: false,
          headerStyle: {
            backgroundColor: "#ffffff",
          },
          headerTitleAlign: "center",
        }}
      />
      <CreatePlanScreen />
    </>
  );
}
