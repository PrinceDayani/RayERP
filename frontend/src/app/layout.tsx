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
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                const theme = localStorage.getItem('theme') || 'system';
                const root = document.documentElement;
                
                if (theme === 'dark') {
                  root.classList.add('dark');
                  root.setAttribute('data-theme', 'dark');
                } else if (theme === 'light') {
                  root.classList.add('light');
                  root.setAttribute('data-theme', 'light');
                } else {
                  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                  root.classList.add(prefersDark ? 'dark' : 'light');
                  root.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
                }
              } catch (e) {
                console.warn('Theme initialization failed:', e);
              }
            `,
          }}
        />
      </head>
      <body className={`${inter.className} bg-background text-foreground transition-colors duration-300`} suppressHydrationWarning>
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
      </body>
    </html>
  );
}