import React, { useState } from "react";
import { View, Text, TouchableOpacity, Platform, StyleSheet, useColorScheme } from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useTranslation } from "react-i18next";
import { CalendarDays } from "lucide-react-native";

interface ApplyPlanDatePickerProps {
  startDate: Date;
  onDateChange: (date: Date) => void;
}

export function ApplyPlanDatePicker({ startDate, onDateChange }: ApplyPlanDatePickerProps) {
  const { t } = useTranslation();
  const [showDatePicker, setShowDatePicker] = useState(false);
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === "ios");
    if (selectedDate) {
      onDateChange(selectedDate);
    }
  };

  return (
    <View style={ds.container}>
      <View style={ds.labelRow}>
        <CalendarDays size={16} color="#94a3b8" />
        <Text style={[ds.label, isDark && ds.labelDark]}>
          {t("plan.apply.startDate", "Ngày bắt đầu")}
        </Text>
        <Text style={ds.required}>*</Text>
      </View>

      <TouchableOpacity
        onPress={() => setShowDatePicker(true)}
        style={[ds.dateBtn, isDark && ds.dateBtnDark]}
      >
        <Text style={[ds.dateText, isDark && ds.dateTextDark]}>
          {startDate.toLocaleDateString(undefined, {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </Text>
      </TouchableOpacity>
      
      {showDatePicker && (
        <DateTimePicker
          value={startDate}
          mode="date"
          display="default"
          onChange={handleDateChange}
          minimumDate={new Date()}
        />
      )}
    </View>
  );
}

const ds = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  labelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: "900",
    color: "#334155",
  },
  labelDark: {
    color: "#e2e8f0",
  },
  required: {
    color: "#ef4444",
    fontWeight: "900",
    fontSize: 14,
  },
  dateBtn: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    backgroundColor: "#f8fafc",
    padding: 16,
    borderRadius: 12,
  },
  dateBtnDark: {
    borderColor: "#1e293b",
    backgroundColor: "#0f172a",
  },
  dateText: {
    color: "#0f172a",
    fontWeight: "700",
    flex: 1,
    fontSize: 16,
  },
  dateTextDark: {
    color: "#f1f5f9",
  },
});
