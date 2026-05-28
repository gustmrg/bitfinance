import i18n from "i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import { initReactI18next } from "react-i18next";

import enUS from "./locales/en-US.json";
import ptBR from "./locales/pt-BR.json";

export const supportedLanguages = ["en-US", "pt-BR"] as const;
const languageStorageKey = "bitfinanceLng";

function normalizeDetectedLanguage(language: string) {
  const normalizedLanguage = language.toLowerCase();

  if (normalizedLanguage === "pt" || normalizedLanguage.startsWith("pt-")) {
    return "pt-BR";
  }

  if (normalizedLanguage === "en" || normalizedLanguage.startsWith("en-")) {
    return "en-US";
  }

  return language;
}

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      "en-US": { translation: enUS },
      "pt-BR": { translation: ptBR },
    },
    supportedLngs: [...supportedLanguages],
    fallbackLng: "en-US",
    load: "currentOnly",
    debug: import.meta.env.DEV,
    detection: {
      order: ["localStorage", "navigator", "htmlTag", "path", "subdomain"],
      caches: ["localStorage"],
      lookupLocalStorage: languageStorageKey,
      convertDetectedLanguage: normalizeDetectedLanguage,
    },
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;
