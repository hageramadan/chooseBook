// hooks/useSettings.ts
import { useEffect, useState } from 'react';
import { getSettings } from '@/services/settingsApi';

interface SettingData {
  name: string;
  address: string;
  privacy_policy: string;
  terms_and_conditions: string;
  linkedin: string;
  twitter: string;
  facebook: string;
  snapchat: string;
  instagram: string;
  whatsapp: string;
  email: string;
  phone: string;
  logo?: string;
  main_color?: string;
  secondary_color?: string;
  template_id?: number;
  currency?: string;
}

export function useSettings() {
  const [settings, setSettings] = useState<SettingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mainColor, setMainColor] = useState<string>('#246487'); // قيمة افتراضية
  const [secondaryColor, setSecondaryColor] = useState<string>('#D56A2D');

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setLoading(true);
        const data = await getSettings();
        setSettings(data.setting);
        
        // تحديث الألوان من الـ API
        if (data.setting.main_color) {
          setMainColor(data.setting.main_color);
        }
        if (data.setting.secondary_color) {
          setSecondaryColor(data.setting.secondary_color);
        }
        
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load settings');
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  return { settings, loading, error, mainColor, secondaryColor };
}