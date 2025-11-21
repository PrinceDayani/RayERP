import React from 'react';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';

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
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}