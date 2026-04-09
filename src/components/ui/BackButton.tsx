import Colors from "@/src/constants/Colors";
import { useNavigation, useRouter } from "expo-router";
import { ChevronLeft } from "lucide-react-native";
import { Pressable, useColorScheme } from "react-native";

type BackButtonProps = {
  /** Route to replace with when there is no navigation history. Defaults to '/'. */
  fallback?: string;
  /** Icon size in px. Defaults to 20. */
  size?: number;
  /** Extra NativeWind className for the pressable wrapper. */
  className?: string;
  /** Override the default back navigation logic entirely. */
  onPress?: () => void;
  /** Remove the circular pill background — use for bare icon-only placements. */
  unstyled?: boolean;
};

/**
 * A reusable back button for headers and screens.
 *
 * Usage in a layout headerLeft:
 *   headerLeft: () => <BackButton fallback="/(main)/farm" />
 *
 * Usage inside a screen:
 *   <BackButton fallback="/(main)/home" className="ml-4" />
 *
 * Usage with custom logic:
 *   <BackButton onPress={() => { ... }} />
 */
export default function BackButton({
  fallback = "/",
  size = 20,
  className = "",
  onPress,
  unstyled = false,
}: BackButtonProps) {
  const router = useRouter();
  const navigation = useNavigation();
  const scheme = useColorScheme() ?? "light";
  const iconColor = Colors[scheme].primary;

  const handleBack = () => {
    const state = navigation.getState();
    const isTabNavigator = state?.type === "tab";
    if (!isTabNavigator && navigation.canGoBack()) {
      navigation.goBack();
    } else {
      router.replace(fallback as any);
    }
  };

  const baseClass = unstyled
    ? "p-1"
    : "h-10 w-10 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800";

  return (
    <Pressable
      onPress={onPress ?? handleBack}
      className={`${baseClass} ${className}`.trim()}
      accessibilityRole="button"
      accessibilityLabel="Go back"
    >
      <ChevronLeft size={size} color={iconColor} />
    </Pressable>
  );
}
