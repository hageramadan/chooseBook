// services/settingsApi.ts

import { getHeaders } from "./api";

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
}

interface SettingsResponse {
  result: boolean;
  errNum: number;
  message: string;
  data: SettingsData;
}

// ✅ إضافة معامل اللغة
export async function getSettings(lang?: string): Promise<SettingsData> {
  try {
    const response = await fetch(`https://ekhtarktabak.t-carts.com/api/settings`, {
      method: 'GET',
      headers: getHeaders(false, lang), // ✅ تمرير اللغة
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data: SettingsResponse = await response.json();
    
    if (!data.result) {
      throw new Error(data.message || 'Failed to fetch settings');
    }

    return data.data;
  } catch (error) {
    console.error('Error fetching settings:', error);
    throw error;
  }
}