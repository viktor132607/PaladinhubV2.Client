"use client";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { resolveMessage } from "./catalog";
import { fetchBackend, readApiJson } from "@/config/api";
export type LanguageOption = { code: string; name: string };
type Localization = { language: string; languages: LanguageOption[]; changeLanguage: (code: string) => void; t: (key: string, fallback?: string) => string };
const english: LanguageOption = { code: "en", name: "English" };
const builtInLanguages = [english, { code: "bg", name: "Български" }];
const Context = createContext<Localization>({ language: "en", languages: [english], changeLanguage: () => {}, t: (key, fallback) => fallback ?? key });
export const useLocalization = () => useContext(Context);
export function LocalizationProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState("en");
  const [languages, setLanguages] = useState<LanguageOption[]>(builtInLanguages);
  const [resources, setResources] = useState<Record<string,string>>({});
  const [refresh, setRefresh] = useState(0);
  useEffect(() => {
    try { const stored = localStorage.getItem("paladinhub-language"); if (stored) setLanguage(stored); } catch {}
    const update = () => setRefresh(value => value + 1);
    window.addEventListener("localization-updated", update);
    return () => window.removeEventListener("localization-updated", update);
  }, []);
  useEffect(() => {
    const controller = new AbortController();
    fetchBackend("/api/localization", { signal: controller.signal, cache: "no-store" }).then(readApiJson<LanguageOption[]>).then(rows => {
      if (!controller.signal.aborted && Array.isArray(rows) && rows.length) setLanguages(rows);
    }).catch(() => {});
    return () => controller.abort();
  }, [refresh]);
  useEffect(() => {
    const controller = new AbortController();
    setResources({});
    document.documentElement.lang = language;
    fetchBackend(`/api/localization/${encodeURIComponent(language)}`, { signal: controller.signal, cache: "no-store" })
      .then(readApiJson<{ code: string; translations: Record<string,string> }>).then(data => {
        if (controller.signal.aborted || !data.translations || typeof data.translations !== "object" || typeof data.code !== "string") return;
        setResources(data.translations);
        if (data.code !== language) setLanguage(data.code);
        document.documentElement.lang = data.code;
        try { localStorage.setItem("paladinhub-language", data.code); } catch {}
      }).catch(() => { if (!controller.signal.aborted) document.documentElement.lang = language; });
    return () => controller.abort();
  }, [language, refresh]);
  const changeLanguage = (code: string) => { setLanguage(code); try { localStorage.setItem("paladinhub-language", code); } catch {} };
  return <Context.Provider value={{ language, languages, changeLanguage, t: (key, fallback) => resolveMessage(language, resources, key, fallback) }}>{children}</Context.Provider>;
}

function languageLabel(option: LanguageOption) {
  const code = option.code.toLowerCase().split("-")[0];
  if (code === "en") return "🇬🇧";
  if (code === "bg") return "🇧🇬";
  return option.name;
}

export function LanguagePicker() {
  const { language, languages, changeLanguage, t } = useLocalization();
  return <li className="nav-item d-flex align-items-center px-2"><select aria-label={t("language.label", "Language")} title={t("language.label", "Language")} value={languages.some(l => l.code === language) ? language : "en"} onChange={e => changeLanguage(e.target.value)} style={{ minHeight: 44, width: 64, fontSize: 22, lineHeight: 1, color: "#FFD700", background: "transparent", border: 0, borderRadius: 0, outline: "none", boxShadow: "none", padding: "4px 20px 4px 6px", cursor: "pointer" }}>{languages.map(l => <option key={l.code} value={l.code}>{languageLabel(l)}</option>)}</select></li>;
}
