'use client';
import { createContext, useContext, ReactNode } from 'react';

interface FinanceContextType {
  currentPeriod: string;
  currency: string;
  permissions: string[];
}

const FinanceContext = createContext<FinanceContextType | undefined>(undefined);

export const useFinanceContext = () => {
  const context = useContext(FinanceContext);
  if (!context) {
    throw new Error('useFinanceContext must be used within FinanceProvider');
  }
  return context;
};

export const FinanceProvider = ({ children }: { children: ReactNode }) => {
  const value = {
    currentPeriod: '2024',
    currency: 'INR',
    permissions: ['read', 'write']
  };

  return (
    <FinanceContext.Provider value={value}>
      {children}
    </FinanceContext.Provider>
  );
};