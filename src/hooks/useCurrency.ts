// hooks/useCurrency.ts
import { useState, useEffect } from "react";
import { getSettings } from "@/services/settingsApi";
import { useLanguage } from "@/contexts/LanguageContext";

// ✅ تخزين العملة حسب اللغة
let currencyCache: Record<string, string> = {};

const fetchCurrencyFromAPI = async (lang: string): Promise<string> => {
  // إذا كانت العملة مخزنة لهذه اللغة
  if (currencyCache[lang]) {
    return currencyCache[lang];
  }

  try {
    // جلب العملة من localStorage حسب اللغة
    const cacheKey = `currency_${lang}`;
    const storedCurrency = localStorage.getItem(cacheKey);
    if (storedCurrency) {
      currencyCache[lang] = storedCurrency;
      return storedCurrency;
    }

    // جلب العملة من API مع تمرير اللغة
    const settings = await getSettings(lang);

    if (settings?.setting?.currency) {
      const currencyCode = settings.setting.currency;
      currencyCache[lang] = currencyCode;
      localStorage.setItem(cacheKey, currencyCode);
      return currencyCode;
    }

    // العملة الافتراضية حسب اللغة
    const defaultCurrency = lang === 'ar' ? 'جنيه مصري' : 'Egyptian Pound (EGP)';
    currencyCache[lang] = defaultCurrency;
    localStorage.setItem(cacheKey, defaultCurrency);
    return defaultCurrency;
  } catch (error) {
    console.error("Error fetching currency:", error);
    const defaultCurrency = lang === 'ar' ? 'جنيه مصري' : 'Egyptian Pound (EGP)';
    currencyCache[lang] = defaultCurrency;
    return defaultCurrency;
  }
};

interface UseCurrencyReturn {
  currency: string | null;
  isLoading: boolean;
  error: string | null;
  refreshCurrency: () => Promise<void>;
}

export function useCurrency(): UseCurrencyReturn {
  const { language } = useLanguage();
  const [currency, setCurrency] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadCurrency = async () => {
      try {
        setIsLoading(true);
        const result = await fetchCurrencyFromAPI(language);
        if (isMounted) {
          setCurrency(result);
          setError(null);
        }
      } catch (err) {
        if (isMounted) {
          setError("Failed to load currency");
          const defaultCurrency = language === 'ar' ? 'جنيه مصري' : 'Egyptian Pound (EGP)';
          setCurrency(defaultCurrency);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadCurrency();

    return () => {
      isMounted = false;
    };
  }, [language]); // ✅ يتغير عند تغيير اللغة

  const refreshCurrency = async () => {
    // مسح الكاش للغة الحالية
    delete currencyCache[language];
    localStorage.removeItem(`currency_${language}`);
    
    try {
      setIsLoading(true);
      const result = await fetchCurrencyFromAPI(language);
      setCurrency(result);
      setError(null);
    } catch (err) {
      setError("Failed to refresh currency");
    } finally {
      setIsLoading(false);
    }
  };

  return { currency, isLoading, error, refreshCurrency };
}