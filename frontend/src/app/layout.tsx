import React from 'react';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';
import { PerformanceMonitor } from '@/components/PerformanceMonitor';

const inter = Inter({ 
  subsets: ['latin'],
  display: 'swap',
  preload: true
});

export const metadata = {
  title: 'RayERP - Enterprise Resource Planning',
  description: 'Modern ERP solution for business management'
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} bg-background text-foreground`} suppressHydrationWarning>
        <PerformanceMonitor />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
