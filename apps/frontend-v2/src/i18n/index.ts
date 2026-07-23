import i18next from "i18next";
import { initReactI18next } from "react-i18next";

import { enUS } from "@/i18n/locales/en-US";
import { ptBR } from "@/i18n/locales/pt-BR";

export const resources = { "en-US": enUS, "pt-BR": ptBR } as const;

function updateDocumentLanguage(language: string) {
  const locale = language === "pt-BR" ? "pt-BR" : "en-US";
  document.documentElement.lang = locale;
  document.title = i18next.t("meta.title", { lng: locale });
  const description = document.querySelector<HTMLMetaElement>('meta[name="description"]');
  if (description) description.content = i18next.t("meta.description", { lng: locale });
}

void i18next.use(initReactI18next).init({
  resources,
  lng: localStorage.getItem("bitfinance-v2-locale") ?? "en-US",
  fallbackLng: "en-US",
  interpolation: { escapeValue: false },
});
i18next.on("languageChanged", updateDocumentLanguage);
updateDocumentLanguage(i18next.language);

export default i18next;
