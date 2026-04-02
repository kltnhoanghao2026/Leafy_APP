import * as SecureStore from "expo-secure-store";

export const SUPPORTED_LANGUAGES = ["en", "vi"] as const;

export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

const LANGUAGE_PREFERENCE_KEY = "app_language";
const DEFAULT_LANGUAGE: SupportedLanguage = "en";

export const normalizeLanguageCode = (
  value?: string | null,
): SupportedLanguage | null => {
  if (!value) return null;

  const normalized = value.toLowerCase().trim();
  const primaryCode = normalized.split(/[-_]/)[0];

  if (SUPPORTED_LANGUAGES.includes(primaryCode as SupportedLanguage)) {
    return primaryCode as SupportedLanguage;
  }

  return null;
};

export const getDeviceLanguage = (): SupportedLanguage => {
  try {
    const locale = Intl.DateTimeFormat().resolvedOptions().locale;
    return normalizeLanguageCode(locale) ?? DEFAULT_LANGUAGE;
  } catch {
    return DEFAULT_LANGUAGE;
  }
};

export const getStoredLanguage =
  async (): Promise<SupportedLanguage | null> => {
    try {
      const storedLanguage = await SecureStore.getItemAsync(
        LANGUAGE_PREFERENCE_KEY,
      );
      return normalizeLanguageCode(storedLanguage);
    } catch {
      return null;
    }
  };

export const persistLanguagePreference = async (
  language: SupportedLanguage,
): Promise<void> => {
  try {
    await SecureStore.setItemAsync(LANGUAGE_PREFERENCE_KEY, language);
  } catch {
    // Ignore persistence errors and keep language change in-memory.
  }
};

export const resolveInitialLanguage = async (): Promise<SupportedLanguage> => {
  const storedLanguage = await getStoredLanguage();

  if (storedLanguage) {
    return storedLanguage;
  }

  return getDeviceLanguage();
};
