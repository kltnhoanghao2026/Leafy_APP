import React from "react";
import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import { ChevronDown, ChevronRight } from "lucide-react-native";

type SelectRowProps = {
  label: string;
  selectedLabel: string;
  isOpen: boolean;
  onToggle: () => void;
  color: string;
  children: React.ReactNode;
};

export function SelectRow({ label, selectedLabel, isOpen, onToggle, color, children }: SelectRowProps) {
  return (
    <View className="mb-3">
      <Text className="mb-1.5 text-[10px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
        {label}
      </Text>

      {/* Select trigger */}
      <TouchableOpacity
        className="flex-row items-center justify-between rounded-xl border px-3 py-2.5"
        style={{
          borderColor: isOpen ? color + "99" : "#e2e8f0",
          backgroundColor: isOpen ? color + "0f" : "#f8fafc",
        }}
        onPress={onToggle}
        activeOpacity={0.7}
      >
        <Text
          className="flex-1 text-sm font-medium"
          style={{ color: selectedLabel ? color : "#94a3b8" }}
          numberOfLines={1}
        >
          {selectedLabel}
        </Text>
        {isOpen ? (
          <ChevronDown size={15} color="#94a3b8" />
        ) : (
          <ChevronRight size={15} color="#94a3b8" />
        )}
      </TouchableOpacity>

      {/* Dropdown options */}
      {isOpen && (
        <View
          className="mt-1 rounded-xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900 overflow-hidden"
          style={{ maxHeight: 180 }}
        >
          <ScrollView showsVerticalScrollIndicator={false}>
            {children}
          </ScrollView>
        </View>
      )}
    </View>
  );
}

type SelectOptionProps = {
  label: string;
  active: boolean;
  color: string;
  onPress: () => void;
};

export function SelectOption({ label, active, color, onPress }: SelectOptionProps) {
  return (
    <TouchableOpacity
      className="flex-row items-center justify-between px-3 py-2.5 border-b border-slate-100 dark:border-slate-800 last:border-b-0"
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text
        className="flex-1 text-sm font-medium"
        style={{ color: active ? color : "#334155" }}
        numberOfLines={1}
      >
        {label}
      </Text>
      {active && (
        <View
          className="h-5 w-5 items-center justify-center rounded-full"
          style={{ backgroundColor: color }}
        >
          <Text className="text-[10px] font-bold text-white">✓</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}
