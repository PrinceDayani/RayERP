"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'dark' | 'light' | 'system';

type ThemeProviderProps = {
  children: React.ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
};

type ThemeProviderState = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  actualTheme: 'dark' | 'light';
};

const initialState: ThemeProviderState = {
  theme: 'system',
  setTheme: () => null,
  actualTheme: 'light',
};

const ThemeProviderContext = createContext<ThemeProviderState>(initialState);

export function ThemeProvider({
  children,
  defaultTheme = 'system',
  storageKey = 'rayerp-ui-theme',
  ...props
}: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(defaultTheme);
  const [actualTheme, setActualTheme] = useState<'dark' | 'light'>('light');

  useEffect(() => {
    try {
      const storedTheme = localStorage.getItem(storageKey) as Theme;
      if (storedTheme) {
        setTheme(storedTheme);
      }
    } catch (error) {
      console.warn('Failed to load theme from localStorage:', error instanceof Error ? error.message : 'Unknown error');
    }
  }, [storageKey]);

  useEffect(() => {
    const root = window.document.documentElement;
    
    try {
      root.classList.remove('light', 'dark');

      let effectiveTheme: 'dark' | 'light' = 'light';

      if (theme === 'system') {
        effectiveTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      } else {
        effectiveTheme = theme;
      }

      root.classList.add(effectiveTheme);
      setActualTheme(effectiveTheme);

      // Update CSS custom properties for consistent theming
      if (effectiveTheme === 'dark') {
        root.style.setProperty('--theme-bg-primary', 'hsl(222 84% 5%)');
        root.style.setProperty('--theme-bg-secondary', 'hsl(217 32% 17%)');
        root.style.setProperty('--theme-text-primary', 'hsl(210 40% 98%)');
        root.style.setProperty('--theme-text-secondary', 'hsl(215 20% 65%)');
        root.style.setProperty('--theme-border', 'hsl(217 32% 17%)');
        root.style.setProperty('--theme-card-bg', 'hsl(222 84% 5%)');
      } else {
        root.style.setProperty('--theme-bg-primary', 'hsl(0 0% 100%)');
        root.style.setProperty('--theme-bg-secondary', 'hsl(210 40% 98%)');
        root.style.setProperty('--theme-text-primary', 'hsl(220 13% 18%)');
        root.style.setProperty('--theme-text-secondary', 'hsl(215 16% 47%)');
        root.style.setProperty('--theme-border', 'hsl(214 32% 91%)');
        root.style.setProperty('--theme-card-bg', 'hsl(0 0% 100%)');
      }
    } catch (error) {
      console.warn('Failed to apply theme:', error instanceof Error ? error.message : 'Unknown error');
    }
  }, [theme]);

  const value = {
    theme,
    setTheme: (theme: Theme) => {
      try {
        localStorage.setItem(storageKey, theme);
        setTheme(theme);
      } catch (error) {
        console.warn('Failed to save theme to localStorage:', error instanceof Error ? error.message : 'Unknown error');
        setTheme(theme); // Still apply the theme even if storage fails
      }
    },
    actualTheme,
  };

  return (
    <ThemeProviderContext.Provider {...props} value={value}>
      {children}
    </ThemeProviderContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext);

  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }

  return context;
};

// Enhanced theme utilities
export const themeColors = {
  light: {
    primary: 'hsl(0 84% 60%)',
    secondary: 'hsl(210 40% 98%)',
    background: 'hsl(0 0% 100%)',
    foreground: 'hsl(220 13% 18%)',
    card: 'hsl(0 0% 100%)',
    border: 'hsl(214 32% 91%)',
    success: 'hsl(142 76% 36%)',
    warning: 'hsl(32 95% 44%)',
    danger: 'hsl(0 84% 60%)',
  },
  dark: {
    primary: 'hsl(0 84% 60%)',
    secondary: 'hsl(217 32% 17%)',
    background: 'hsl(222 84% 5%)',
    foreground: 'hsl(210 40% 98%)',
    card: 'hsl(222 84% 5%)',
    border: 'hsl(217 32% 17%)',
    success: 'hsl(142 76% 50%)',
    warning: 'hsl(32 95% 55%)',
    danger: 'hsl(0 84% 60%)',
  }
};

export const getThemeColor = (colorName: keyof typeof themeColors.light, theme: 'light' | 'dark' = 'light') => {
  return themeColors[theme][colorName];
};