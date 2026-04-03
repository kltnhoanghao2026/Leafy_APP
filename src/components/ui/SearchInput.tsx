import { TextInput, View } from "react-native";
import { Search } from "lucide-react-native";

type SearchInputProps = {
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
};

export function SearchInput({
  value,
  onChangeText,
  placeholder,
}: SearchInputProps) {
  return (
    <View className="mr-1 flex-1 flex-row items-center rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <Search size={20} className="text-slate-400 dark:text-slate-500" />
      <TextInput
        placeholder={placeholder}
        placeholderTextColor="#94A3B8"
        className="ml-2 flex-1 text-[15px] text-slate-800 dark:text-slate-100"
        value={value}
        onChangeText={onChangeText}
      />
    </View>
  );
}
