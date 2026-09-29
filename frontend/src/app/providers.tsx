"use client";

import { AuthProvider } from '@/contexts/AuthContext';
import { CurrencyProvider } from '@/contexts/CurrencyContext';
import { PreferencesProvider } from '@/contexts/PreferencesContext';
import { ReactQueryProvider } from '@/providers/ReactQueryProvider';
import { ThemeProvider } from 'next-themes';
import { Toaster } from '@/components/ui/toaster';
import { Toaster as HotToaster } from 'react-hot-toast';
import { Toaster as SonnerToaster } from 'sonner';

// PreferencesProvider sits inside ThemeProvider because it drives next-themes
// from the user's saved theme preference.
//
// Screens use three toast libraries (ui/use-toast, react-hot-toast, sonner).
// Each only renders through its own mounted Toaster, so all three stay here;
// without them every success and error message is silently dropped.
export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ReactQueryProvider>
      <AuthProvider>
        <CurrencyProvider>
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
            <PreferencesProvider>{children}</PreferencesProvider>
            <Toaster />
            <HotToaster
              position="top-right"
              toastOptions={{
                duration: 4000,
                className: 'dark:bg-gray-800 dark:text-white dark:border-gray-700 bg-white text-gray-900 border-gray-200'
              }}
            />
            <SonnerToaster position="top-center" richColors closeButton />
          </ThemeProvider>
        </CurrencyProvider>
      </AuthProvider>
    </ReactQueryProvider>
  );
}
