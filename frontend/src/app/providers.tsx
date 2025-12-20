"use client";

import { useState, useEffect } from 'react';
import { AuthProvider } from '@/contexts/AuthContext';
import { CurrencyProvider } from '@/contexts/CurrencyContext';
import { ReactQueryProvider } from '@/providers/ReactQueryProvider';

export function Providers({ children }: { children: React.ReactNode }) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return (
      <ReactQueryProvider>
        <AuthProvider>
          <CurrencyProvider>
            {children}
          </CurrencyProvider>
        </AuthProvider>
      </ReactQueryProvider>
    );
  }

  return (
    <ReactQueryProvider>
      <AuthProvider>
        <CurrencyProvider>
          {children}
        </CurrencyProvider>
      </AuthProvider>
    </ReactQueryProvider>
  );
}
