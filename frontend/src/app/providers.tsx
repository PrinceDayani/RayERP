"use client";

import { AuthProvider } from '@/contexts/AuthContext';
import { CurrencyProvider } from '@/contexts/CurrencyContext';
import { PreferencesProvider } from '@/contexts/PreferencesContext';
import { ReactQueryProvider } from '@/providers/ReactQueryProvider';
import { ThemeProvider } from 'next-themes';

// PreferencesProvider sits inside ThemeProvider because it drives next-themes
// from the user's saved theme preference.
export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ReactQueryProvider>
      <AuthProvider>
        <CurrencyProvider>
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
            <PreferencesProvider>{children}</PreferencesProvider>
          </ThemeProvider>
        </CurrencyProvider>
      </AuthProvider>
    </ReactQueryProvider>
  );
}
