import { LocaleConfig } from "react-native-calendars";
import { enUS, vi } from "date-fns/locale";

import type { EventCategory } from "./plant-event.types";

// ── Color mapping for calendar dots ─────────────────────────────────────
export const CATEGORY_DOT_COLORS: Record<EventCategory, string> = {
  ROUTINE_CARE: "#3B82F6",
  HEALTH_MEDICAL: "#F97316",
  GROWTH_LIFECYCLE: "#10B981",
};

// ── Sync LocaleConfig with react-native-calendars ───────────────────────
export function initCalendarLocale(language: string) {
  if (!LocaleConfig.locales["vi"]) {
    LocaleConfig.locales["vi"] = {
      monthNames: [
        "Tháng 1",
        "Tháng 2",
        "Tháng 3",
        "Tháng 4",
        "Tháng 5",
        "Tháng 6",
        "Tháng 7",
        "Tháng 8",
        "Tháng 9",
        "Tháng 10",
        "Tháng 11",
        "Tháng 12",
      ],
      monthNamesShort: [
        "Th1",
        "Th2",
        "Th3",
        "Th4",
        "Th5",
        "Th6",
        "Th7",
        "Th8",
        "Th9",
        "Th10",
        "Th11",
        "Th12",
      ],
      dayNames: [
        "Chủ nhật",
        "Thứ hai",
        "Thứ ba",
        "Thứ tư",
        "Thứ năm",
        "Thứ sáu",
        "Thứ bảy",
      ],
      dayNamesShort: ["CN", "T2", "T3", "T4", "T5", "T6", "T7"],
      today: "Hôm nay",
    };
    LocaleConfig.locales["en"] = {
      monthNames: [
        "January",
        "February",
        "March",
        "April",
        "May",
        "June",
        "July",
        "August",
        "September",
        "October",
        "November",
        "December",
      ],
      monthNamesShort: [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
      ],
      dayNames: [
        "Sunday",
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
      ],
      dayNamesShort: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
      today: "Today",
    };
  }
  LocaleConfig.defaultLocale = language.startsWith("vi") ? "vi" : "en";
  return language.startsWith("vi") ? vi : enUS;
}
