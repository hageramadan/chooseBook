// contexts/CurrencyContext.tsx
"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { getSettings } from "@/services/settingsApi";
import { useLanguage } from "./LanguageContext";

interface CurrencyContextType {
  currency: string | null;
  isLoading: boolean;
  error: string | null;
  refreshCurrency: () => Promise<void>;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const { language } = useLanguage();
  const [currency, setCurrency] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCurrency = async (lang: string) => {
    try {
      setIsLoading(true);
      setError(null);

      // ✅ تخزين العملة حسب اللغة في localStorage
      const cacheKey = `currency_${lang}`;
      const cachedCurrency = localStorage.getItem(cacheKey);
      
      if (cachedCurrency) {
        setCurrency(cachedCurrency);
        setIsLoading(false);
        return;
      }

      // ✅ جلب العملة من API مع اللغة المحددة
      const settings = await getSettings(lang);

      if (settings?.setting?.currency) {
        const currencyCode = settings.setting.currency;
        setCurrency(currencyCode);
        localStorage.setItem(cacheKey, currencyCode);
      } else {
        // العملة الافتراضية حسب اللغة
        const defaultCurrency = lang === 'ar' ? 'جنيه مصري' : 'Egyptian Pound (EGP)';
        setCurrency(defaultCurrency);
        localStorage.setItem(cacheKey, defaultCurrency);
      }
    } catch (err) {
      console.error("Error fetching currency:", err);
      setError("Failed to load currency settings");
      // العملة الافتراضية حسب اللغة
      const defaultCurrency = lang === 'ar' ? 'جنيه مصري' : 'Egyptian Pound (EGP)';
      setCurrency(defaultCurrency);
    } finally {
      setIsLoading(false);
    }
  };

  // ✅ جلب العملة عند تحميل المكون أو تغيير اللغة
  useEffect(() => {
    fetchCurrency(language);
  }, [language]); // يتغير عند تغيير اللغة

  const refreshCurrency = async () => {
    // مسح الكاش للغة الحالية
    const cacheKey = `currency_${language}`;
    localStorage.removeItem(cacheKey);
    await fetchCurrency(language);
  };

  return (
    <CurrencyContext.Provider value={{ currency, isLoading, error, refreshCurrency }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const context = useContext(CurrencyContext);
  if (context === undefined) {
    throw new Error("useCurrency must be used within a CurrencyProvider");
  }
  return context;
}