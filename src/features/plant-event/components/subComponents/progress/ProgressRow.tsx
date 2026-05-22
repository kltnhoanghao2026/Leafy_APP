import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity } from "react-native";
import { CheckCircle2, Circle } from "lucide-react-native";
import { useTranslation } from "react-i18next";
import type { EventProgressResponse } from "../../plant-event.types";

interface ProgressRowProps {
  entry: EventProgressResponse;
  onToggle: () => void;
  onNoteChange: (note: string) => void;
  dotColor: string;
}

export function ProgressRow({
  entry,
  onToggle,
  onNoteChange,
  dotColor,
}: ProgressRowProps) {
  const { t } = useTranslation();
  const [editing, setEditing] = useState(false);
  const [note, setNote] = useState(entry.note ?? "");

  return (
    <View className="mb-2 flex-row items-center gap-3 rounded-xl border border-slate-100 bg-white p-3 dark:border-slate-800 dark:bg-slate-900">
      <TouchableOpacity
        onPress={onToggle}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        activeOpacity={0.6}
      >
        {entry.completed ? (
          <CheckCircle2 size={20} color="#10b981" />
        ) : (
          <Circle size={20} color="#cbd5e1" />
        )}
      </TouchableOpacity>
      <View className="flex-1">
        <Text className="text-sm font-semibold text-slate-700 dark:text-slate-200">
          {entry.targetId?.slice(0, 8)}...
        </Text>
        {editing ? (
          <TextInput
            value={note}
            onChangeText={setNote}
            onBlur={() => {
              setEditing(false);
              onNoteChange(note);
            }}
            autoFocus
            className="mt-1 rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-xs text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
          />
        ) : (
          <TouchableOpacity onPress={() => setEditing(true)} activeOpacity={0.7}>
            <Text className="mt-0.5 text-xs text-slate-400 dark:text-slate-500">
              {entry.note ?? t("plantEvent.progress.addNote")}
            </Text>
          </TouchableOpacity>
        )}
      </View>
      <View
        className="h-2 w-2 rounded-full"
        style={{ backgroundColor: dotColor }}
      />
    </View>
  );
}
