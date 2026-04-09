import { StyleSheet, TextInput, View } from "react-native";
import { Search } from "lucide-react-native";
import { useColorScheme } from "@/src/hooks/useColorScheme";
import Colors from "@/src/constants/Colors";

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
  const colorScheme = useColorScheme();
  const palette = Colors[colorScheme];
  const isDark = colorScheme === "dark";

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: isDark ? "#0F172A" : "#FFFFFF",
          borderColor: isDark ? "#1E293B" : "#E2E8F0",
        },
      ]}
    >
      <Search size={20} color="#94A3B8" />
      <TextInput
        placeholder={placeholder}
        placeholderTextColor="#94A3B8"
        style={[styles.input, { color: palette.text }]}
        value={value}
        onChangeText={onChangeText}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginRight: 4,
  },
  input: {
    flex: 1,
    marginLeft: 8,
    fontSize: 15,
  },
});
