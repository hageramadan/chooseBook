// services/settingsApi.ts

import { getHeaders } from "./api";

// إضافة الخصائص الجديدة للـ Interface
interface SettingsData {
  setting: {
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
    meta: {
      meta_title: string | null;
      meta_description: string | null;
    };
  };
  // إضافة الخصائص الجديدة على مستوى البيانات
  mainColor?: string;
  secondaryColor?: string;
}

interface SettingsResponse {
  result: boolean;
  errNum: number;
  message: string;
  data: SettingsData;
}

export async function getSettings(lang?: string): Promise<SettingsData> {
  try {
    const response = await fetch(`https://admin.ekhtarktabak.com/api/settings`, {
      method: 'GET',
      headers: getHeaders(false, lang),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data: SettingsResponse = await response.json();
    
    if (!data.result) {
      throw new Error(data.message || 'Failed to fetch settings');
    }

    // إرجاع البيانات مع الخصائص الإضافية
    return {
      ...data.data,
      mainColor: data.data.setting.main_color || '#246487',
      secondaryColor: data.data.setting.secondary_color || '#D56A2D',
    };
  } catch (error) {
    console.error('Error fetching settings:', error);
    throw error;
  }
}