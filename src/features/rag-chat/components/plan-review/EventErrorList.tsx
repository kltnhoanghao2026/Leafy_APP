import { View, Text } from "react-native";

export function EventErrorList({ errors }: { errors?: string[] }) {
  if (!errors || errors.length === 0) return null;

  return (
    <View className="mt-2 rounded-xl border border-red-200 bg-red-50 p-2">
      {errors.map((error, index) => (
        <Text key={`${error}-${index}`} className="text-xs text-red-700">
          - {error}
        </Text>
      ))}
    </View>
  );
}
