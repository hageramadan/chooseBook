// components/ThemeStyles.tsx
'use client';

import { useEffect } from 'react';
import { useTheme } from '@/contexts/ThemeContext';

export function ThemeStyles() {
  const { mainColor, secondaryColor } = useTheme();

  useEffect(() => {
    // تعيين CSS Variables في الجذر
    document.documentElement.style.setProperty('--main-color', mainColor);
    document.documentElement.style.setProperty('--secondary-color', secondaryColor);
    
    // إضافة ألوان مشتقة
    document.documentElement.style.setProperty('--main-color-light', `${mainColor}20`);
    document.documentElement.style.setProperty('--main-color-dark', `${mainColor}CC`);
    document.documentElement.style.setProperty('--secondary-color-light', `${secondaryColor}20`);
    document.documentElement.style.setProperty('--secondary-color-dark', `${secondaryColor}CC`);

    // تحديث لون شريط المتصفح (Chrome, Edge, etc.)
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', mainColor);
    } else {
      const meta = document.createElement('meta');
      meta.name = 'theme-color';
      meta.content = mainColor;
      document.head.appendChild(meta);
    }
  }, [mainColor, secondaryColor]);

  return null;
}