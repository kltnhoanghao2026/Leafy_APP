import { Link, Tabs } from "expo-router";
import {
  Home,
  Search,
  Leaf,
  User,
  Settings,
  Info,
  RadioTower,
} from "lucide-react-native";
import React from "react";
import { Pressable } from "react-native";

import Colors from "@/src/constants/Colors";
import { useColorScheme } from "@/src/hooks/useColorScheme";
import { useTranslation } from "react-i18next";

export default function MainLayout() {
  const colorScheme = useColorScheme();
  const theme = colorScheme ?? "light";
  const { t } = useTranslation();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[theme].tint,
        headerShown: true,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t("tabs.home"),
          tabBarIcon: ({ color }) => <Home color={color} size={24} />,
          headerRight: () => (
            <Link href="/modal" asChild>
              <Pressable style={{ marginRight: 15 }}>
                {({ pressed }) => (
                  <Info
                    size={22}
                    color={Colors[theme].text}
                    style={{ opacity: pressed ? 0.5 : 1 }}
                  />
                )}
              </Pressable>
            </Link>
          ),
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: t("tabs.explore"),
          tabBarIcon: ({ color }) => <Search color={color} size={24} />,
        }}
      />
      <Tabs.Screen
        name="farms"
        options={{
          title: t("tabs.farms"),
          tabBarIcon: ({ color }) => <Leaf color={color} size={24} />,
        }}
      />
      <Tabs.Screen
        name="iot"
        options={{
          title: "IoT",
          tabBarIcon: ({ color }) => <RadioTower color={color} size={24} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: t("tabs.profile"),
          tabBarIcon: ({ color }) => <User color={color} size={24} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: t("tabs.settings"),
          tabBarIcon: ({ color }) => <Settings color={color} size={24} />,
        }}
      />
    </Tabs>
  );
}
