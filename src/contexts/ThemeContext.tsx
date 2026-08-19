// contexts/ThemeContext.tsx
'use client';
import React, { createContext, useContext, ReactNode } from 'react';
import { useSettings } from '@/hooks/useSettings';

interface ThemeContextType {
  mainColor: string;
  secondaryColor: string;
  loading: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const { mainColor, secondaryColor, loading } = useSettings();

  return (
    <ThemeContext.Provider value={{ mainColor, secondaryColor, loading }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}