"use client";

import React from 'react';
import { ThemeProvider } from 'next-themes';
import { AuthProvider } from '@/contexts/AuthContext';
import { RealTimeProvider } from '@/context/RealTimeContext';
import { Toaster } from '@/components/ui/toaster';
import { Toaster as HotToaster } from 'react-hot-toast';
import { ThemeEnforcer } from '@/components/theme-enforcer';
import { ErrorBoundary } from '@/components/ErrorBoundary';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary>
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange={false}
        storageKey="theme"
        themes={['light', 'dark', 'system']}
      >
        <ThemeEnforcer />
        <AuthProvider>
          <RealTimeProvider>
            {children}
            <Toaster />
            <HotToaster 
              position="top-right"
              toastOptions={{
                duration: 4000,
                className: 'dark:bg-gray-800 dark:text-white dark:border-gray-700 bg-white text-gray-900 border-gray-200',
                style: {
                  background: 'var(--background)',
                  color: 'var(--foreground)',
                  border: '1px solid var(--border)'
                }
              }}
            />
          </RealTimeProvider>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
