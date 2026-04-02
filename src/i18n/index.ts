import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import en from "./locales/en.json";
import vi from "./locales/vi.json";
import {
  normalizeLanguageCode,
  persistLanguagePreference,
  resolveInitialLanguage,
  type SupportedLanguage,
} from "./language";

const resources = {
  en: { translation: en },
  vi: { translation: vi },
} as const;

const fallbackLanguage: SupportedLanguage = "en";

let initializationPromise: Promise<typeof i18n> | null = null;

export const initializeI18n = async () => {
  if (i18n.isInitialized) return i18n;
  if (initializationPromise) return initializationPromise;

  initializationPromise = (async () => {
    const initialLanguage = await resolveInitialLanguage();

    await i18n.use(initReactI18next).init({
      resources,
      lng: initialLanguage,
      fallbackLng: fallbackLanguage,
      interpolation: {
        escapeValue: false,
      },
      compatibilityJSON: "v4",
    });

    return i18n;
  })();

  return initializationPromise;
};

export const getCurrentLanguage = (): SupportedLanguage =>
  normalizeLanguageCode(i18n.resolvedLanguage ?? i18n.language) ??
  fallbackLanguage;

export const changeAppLanguage = async (
  language: string,
): Promise<SupportedLanguage> => {
  const nextLanguage = normalizeLanguageCode(language) ?? fallbackLanguage;

  if (!i18n.isInitialized) {
    await initializeI18n();
  }

  if (getCurrentLanguage() !== nextLanguage) {
    await i18n.changeLanguage(nextLanguage);
  }

  await persistLanguagePreference(nextLanguage);

  return nextLanguage;
};

void initializeI18n();

export default i18n;
