"use client";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { translate } from "./content";
import { fetchBackend, readApiJson } from "@/config/api";
export type LanguageOption = { code: string; name: string };
type Localization = { language: string; languages: LanguageOption[]; changeLanguage: (code: string) => void; t: (key: string, fallback?: string) => string };
const english: LanguageOption = { code: "en", name: "English" };
const Context = createContext<Localization>({ language: "en", languages: [english], changeLanguage: () => {}, t: (key, fallback) => fallback ?? key });
export const useLocalization = () => useContext(Context);
export function LocalizationProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState("en");
  const [languages, setLanguages] = useState<LanguageOption[]>([english]);
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
    fetchBackend(`/api/localization/${encodeURIComponent(language)}`, { signal: controller.signal, cache: "no-store" })
      .then(readApiJson<{ code: string; translations: Record<string,string> }>).then(data => {
        if (controller.signal.aborted || !data.translations || typeof data.translations !== "object" || typeof data.code !== "string") return;
        setResources(data.translations);
        if (data.code !== language) setLanguage(data.code);
        document.documentElement.lang = data.code;
        try { localStorage.setItem("paladinhub-language", data.code); } catch {}
      }).catch(() => { if (!controller.signal.aborted) document.documentElement.lang = "en"; });
    return () => controller.abort();
  }, [language, refresh]);
  const changeLanguage = (code: string) => { setLanguage(code); try { localStorage.setItem("paladinhub-language", code); } catch {} };
  return <Context.Provider value={{ language, languages, changeLanguage, t: (key, fallback) => translate(resources, key, fallback) }}>{children}</Context.Provider>;
}
export function LanguagePicker() {
  const { language, languages, changeLanguage, t } = useLocalization();
  return <li className="nav-item d-flex align-items-center px-2"><select aria-label={t("Language")} value={languages.some(l => l.code === language) ? language : "en"} onChange={e => changeLanguage(e.target.value)} style={{ minHeight: 44, maxWidth: "100%", width: 135, fontSize: 16, color: "#FFD700", background: "#1e1e1e", border: "1px solid #6b5b20", borderRadius: 4, padding: "4px 8px" }}>{languages.map(l => <option key={l.code} value={l.code}>{l.name}</option>)}</select></li>;
}
