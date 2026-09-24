"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { fetchBackend, readApiJson } from "@/config/api";

export type CurrencyCode = "EUR" | "USD";
type Rate = { baseCurrency: string; usdPerEur: number; asOf: string };
type CurrencyState = {
  currency: CurrencyCode;
  usdPerEur: number | null;
  rateDate: string;
  setCurrency: (currency: CurrencyCode) => void;
  formatMoney: (euros: number) => string;
};

const KEY = "paladinhub.currency";
const CurrencyContext = createContext<CurrencyState | null>(null);

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [currency, updateCurrency] = useState<CurrencyCode>("EUR");
  const [rate, setRate] = useState<Rate | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    void fetchBackend("/api/currency/rate", { cache: "no-store", signal: controller.signal })
      .then((response) => readApiJson<Rate>(response))
      .then((result) => {
        if (controller.signal.aborted || result.baseCurrency !== "EUR" || !Number.isFinite(result.usdPerEur) || result.usdPerEur <= 0) return;
        setRate(result);
        try { if (localStorage.getItem(KEY) === "USD") updateCurrency("USD"); } catch { /* storage is optional */ }
      }).catch(() => { /* Keep EUR when the verified rate is unavailable. */ });
    return () => controller.abort();
  }, []);

  const setCurrency = (next: CurrencyCode) => {
    if (next === "USD" && !rate) return;
    updateCurrency(next);
    try { localStorage.setItem(KEY, next); } catch { /* storage is optional */ }
  };

  const value = useMemo<CurrencyState>(() => ({
    currency,
    usdPerEur: rate?.usdPerEur ?? null,
    rateDate: rate?.asOf ?? "",
    setCurrency,
    formatMoney: (euros) => new Intl.NumberFormat("en-US", { style: "currency", currency, minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(currency === "USD" && rate ? euros * rate.usdPerEur : euros),
  }), [currency, rate]);

  return <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>;
}

export function useCurrency(): CurrencyState {
  const context = useContext(CurrencyContext);
  if (!context) throw new Error("CurrencyProvider is missing.");
  return context;
}
