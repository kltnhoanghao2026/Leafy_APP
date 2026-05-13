import { View, Text, TextInput } from "react-native";

type InputProps = {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  multiline?: boolean;
  keyboardType?: "default" | "numeric";
};

export function FieldInput({
  label,
  value,
  onChangeText,
  placeholder,
  multiline,
  keyboardType = "default",
}: InputProps) {
  return (
    <View className="mb-2">
      <Text className="mb-1 text-xs font-semibold text-slate-600">{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#94a3b8"
        multiline={multiline}
        keyboardType={keyboardType}
        className={`rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 ${
          multiline ? "min-h-[72px]" : ""
        }`}
        textAlignVertical={multiline ? "top" : "center"}
      />
    </View>
  );
}
