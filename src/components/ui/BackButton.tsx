import Colors from '@/src/constants/Colors';
import { useNavigation } from '@react-navigation/native';
import { useLocalSearchParams } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { Pressable, useColorScheme } from 'react-native';

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
 * Uses navigation.canGoBack() (from @react-navigation/native) rather than
 * router.canGoBack() because expo-router's router.back() maintains its own
 * navigation history that is decoupled from the native history stack.
 * navigation.canGoBack() correctly reflects whether expo-router has a page
 * to go back to.
 *
 * The fallback is only used when there is genuinely no history
 * (e.g. deep-link cold start).
 *
 * When navigating from a page that passes a returnTo param (e.g. diagnosis -> plant-events detail),
 * this button will respect that returnTo path for proper navigation flow.
 *
 * Usage in a layout headerLeft:
 *   headerLeft: () => <BackButton fallback="/(main)/plans" />
 *
 * Usage with custom logic:
 *   <BackButton onPress={() => { ... }} />
 */
export default function BackButton({
  fallback = '/',
  size = 20,
  className = '',
  onPress,
  unstyled = false,
}: BackButtonProps) {
  const navigation = useNavigation();
  const params = useLocalSearchParams<{ returnTo?: string | string[] }>();
  const scheme = useColorScheme() ?? 'light';
  const iconColor = Colors[scheme].primary;

  const handleBack = () => {
    const returnTo = params.returnTo;
    if (returnTo) {
      const target = Array.isArray(returnTo) ? returnTo[0] : returnTo;
      if (navigation.canGoBack()) {
        navigation.goBack();
      } else {
        navigation.replace(target as never);
      }
      return;
    }
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.replace(fallback as never);
    }
  };

  const baseClass = unstyled
    ? 'p-1'
    : 'h-10 w-10 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800';

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
