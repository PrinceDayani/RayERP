"use client";

import React from 'react';
import { Inter } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from 'next-themes';
import { AuthProvider } from '@/contexts/AuthContext';
import { RealTimeProvider } from '@/context/RealTimeContext';
import { Toaster } from '@/components/ui/toaster';
import { Toaster as HotToaster } from 'react-hot-toast';
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
              <HotToaster 
                position="top-right"
                toastOptions={{
                  duration: 4000,
                  style: {
                    background: '#1f2937',
                    color: '#fff',
                    border: '1px solid #374151'
                  }
                }}
              />
            </RealTimeProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}