'use client';
import { createContext, useContext, ReactNode, useState } from 'react';

interface FiscalPeriodContextType {
  fiscalYear: string;
  fiscalPeriod: string;
  setFiscalYear: (year: string) => void;
  setFiscalPeriod: (period: string) => void;
}

const FiscalPeriodContext = createContext<FiscalPeriodContextType | undefined>(undefined);

export const useFiscalPeriod = () => {
  const context = useContext(FiscalPeriodContext);
  if (!context) {
    throw new Error('useFiscalPeriod must be used within FiscalPeriodProvider');
  }
  return context;
};

export const FiscalPeriodProvider = ({ children }: { children: ReactNode }) => {
  const [fiscalYear, setFiscalYear] = useState('2024');
  const [fiscalPeriod, setFiscalPeriod] = useState('Q1');

  return (
    <FiscalPeriodContext.Provider value={{
      fiscalYear,
      fiscalPeriod,
      setFiscalYear,
      setFiscalPeriod
    }}>
      {children}
    </FiscalPeriodContext.Provider>
  );
};
