"use client";

import { useState, useEffect } from 'react';
import { AuthProvider } from '@/contexts/AuthContext';
import { CurrencyProvider } from '@/contexts/CurrencyContext';

export function Providers({ children }: { children: React.ReactNode }) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return (
      <AuthProvider>
        <CurrencyProvider>
          {children}
        </CurrencyProvider>
      </AuthProvider>
    );
  }

  return (
    <AuthProvider>
      <CurrencyProvider>
        {children}
      </CurrencyProvider>
    </AuthProvider>
  );
}
