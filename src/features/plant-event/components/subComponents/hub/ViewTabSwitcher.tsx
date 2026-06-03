import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { CalendarDays, CalendarRange, Clock } from "lucide-react-native";
import type { ViewType } from "../../PlantEventHubScreen";

interface ViewTabSwitcherProps {
  activeView: ViewType;
  onViewChange: (view: ViewType) => void;
  palette: any;
  scheme: "light" | "dark";
  t: (key: string) => string;
}

export function ViewTabSwitcher({
  activeView,
  onViewChange,
  palette,
  scheme,
  t,
}: ViewTabSwitcherProps) {
  return (
    <View className="flex-row mt-1.5 rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
      {(["month", "week", "timeline"] as ViewType[]).map((view) => {
        const isActive = activeView === view;
        const Icon =
          view === "month"
            ? CalendarDays
            : view === "week"
              ? CalendarRange
              : Clock;
        const label =
          view === "month"
            ? t("calendar.monthView")
            : view === "week"
              ? t("calendar.weekView")
              : t("calendar.timelineShort");
        return (
          <TouchableOpacity
            key={view}
            style={{
              flex: 1,
              alignItems: "center",
              paddingVertical: 6,
              gap: 2,
              borderRadius: 10,
              backgroundColor: isActive
                ? scheme === "dark"
                  ? "#334155"
                  : "#ffffff"
                : "transparent",
              shadowOpacity: isActive ? 0.06 : 0,
              shadowRadius: 4,
              shadowOffset: { width: 0, height: 1 },
              elevation: isActive ? 2 : 0,
            }}
            onPress={() => onViewChange(view)}
            activeOpacity={0.7}
          >
            <Icon
              size={16}
              color={isActive ? palette.primary : palette.textGray}
            />
            <Text
              style={{
                fontSize: 10,
                fontWeight: isActive ? "700" : "500",
                color: isActive ? palette.primary : palette.textGray,
              }}
            >
              {label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}
