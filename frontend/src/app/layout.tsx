"use client";

import React from 'react';
import { Inter } from 'next/font/google';
import './globals.css';
import '@/styles/dialog-fix.css';
import '@/utils/suppressWarnings';
import { ThemeProvider } from 'next-themes';
import { AuthProvider } from '@/contexts/AuthContext';
import { RealTimeProvider } from '@/context/RealTimeContext';
import { Toaster } from '@/components/ui/toaster';
import { ThemeEnforcer } from '@/components/theme-enforcer';

const inter = Inter({ subsets: ['latin'] });

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head />
      <body className={`${inter.className} bg-background text-foreground`} suppressHydrationWarning>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange={false}
          storageKey="theme"
        >
          <ThemeEnforcer />
          <AuthProvider>
            <RealTimeProvider>
              {children}
              <Toaster />
            </RealTimeProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}