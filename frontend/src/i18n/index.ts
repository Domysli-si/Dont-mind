import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import cs from "./cs.json";
import en from "./en.json";

const savedLang = localStorage.getItem("language") || "cs";

i18n.use(initReactI18next).init({
  resources: {
    cs: { translation: cs },
    en: { translation: en },
  },
  lng: savedLang,
  fallbackLng: "cs",
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;
