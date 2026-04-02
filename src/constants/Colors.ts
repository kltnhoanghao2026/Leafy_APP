const PRIMARY = "#2F7F34";
const SECONDARY = "#6D4C41";
const ACCENT = "#FF9800";
const BACKGROUND_LIGHT = "#F6F8F6";
const BACKGROUND_DARK = "#0F172A"; // Sleek slate-900 dark bg

const tintColorLight = PRIMARY;
const tintColorDark = "#4ADE80"; // Brighter green for dark mode tint

export default {
  light: {
    text: "#0F172A",
    background: BACKGROUND_LIGHT,
    textInputBackground: "#FFFFFF",
    green: PRIMARY,
    primary: PRIMARY,
    secondary: SECONDARY,
    accent: ACCENT,
    textGray: "#334155",
    textInputPlaceholder: "#94A3B8",
    tint: tintColorLight,
    tabIconDefault: "#94A3B8",
    tabIconSelected: tintColorLight,
  },
  dark: {
    text: "#F8FAFC", // Much brighter text
    background: BACKGROUND_DARK,
    textInputBackground: "#1E293B", // slate-800 for inputs/cards
    green: "#4ADE80", // Brighter green in dark mode
    primary: "#4ADE80", // Pop out the primary in dark mode
    secondary: SECONDARY,
    accent: "#FBBF24", // bright accent
    textGray: "#94A3B8",
    textInputPlaceholder: "#64748B",
    tint: tintColorDark,
    tabIconDefault: "#64748B",
    tabIconSelected: tintColorDark,
  },
};
