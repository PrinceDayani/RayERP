"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface CurrencyContextType {
  currency: string;
  symbol: string;
  setCurrency: (currency: string) => void;
  formatAmount: (amount: number, showSymbol?: boolean) => string;
  formatCompact: (amount: number) => string;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [currency, setCurrencyState] = useState('INR');
  const [symbol, setSymbol] = useState('₹');

  const symbols: Record<string, string> = {
    INR: '₹', USD: '$', EUR: '€', GBP: '£', JPY: '¥', CAD: 'C$', AUD: 'A$', CHF: 'CHF',
    AED: 'د.إ', SAR: 'ر.س', QAR: 'ر.ق', KWD: 'د.ك', BHD: 'د.ب', OMR: 'ر.ع',
    JOD: 'د.ا', ILS: '₪', LBP: 'ل.ل', EGP: 'ج.م', IQD: 'ع.د', SYP: 'ل.س',
    YER: 'ر.ي', TRY: '₺', IRR: '﷼'
  };

  const locales: Record<string, string> = {
    INR: 'en-IN', USD: 'en-US', EUR: 'de-DE', GBP: 'en-GB', JPY: 'ja-JP', CAD: 'en-CA',
    AUD: 'en-AU', CHF: 'de-CH', AED: 'ar-AE', SAR: 'ar-SA', QAR: 'ar-QA', KWD: 'ar-KW',
    BHD: 'ar-BH', OMR: 'ar-OM', JOD: 'ar-JO', ILS: 'he-IL', LBP: 'ar-LB', EGP: 'ar-EG',
    IQD: 'ar-IQ', SYP: 'ar-SY', YER: 'ar-YE', TRY: 'tr-TR', IRR: 'fa-IR'
  };

  useEffect(() => {
    const saved = localStorage.getItem('preferredCurrency') || 'INR';
    setCurrencyState(saved);
    setSymbol(symbols[saved] || '₹');
  }, []);

  const setCurrency = (newCurrency: string) => {
    setCurrencyState(newCurrency);
    setSymbol(symbols[newCurrency] || '₹');
    localStorage.setItem('preferredCurrency', newCurrency);
  };

  const formatAmount = (amount: number, showSymbol = true) => {
    const locale = locales[currency] || 'en-IN';
    const formatted = amount.toLocaleString(locale, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
    return showSymbol ? `${symbol}${formatted}` : formatted;
  };

  const formatCompact = (amount: number) => {
    // Indian format (Lakhs/Crores) for INR
    if (currency === 'INR') {
      if (amount >= 10000000) return `${symbol}${(amount / 10000000).toFixed(2)} Cr`;
      if (amount >= 100000) return `${symbol}${(amount / 100000).toFixed(2)} L`;
      if (amount >= 1000) return `${symbol}${(amount / 1000).toFixed(0)}K`;
      return `${symbol}${amount.toFixed(0)}`;
    }
    // International format (Million/Billion) for others
    if (amount >= 1000000000) return `${symbol}${(amount / 1000000000).toFixed(2)}B`;
    if (amount >= 1000000) return `${symbol}${(amount / 1000000).toFixed(2)}M`;
    if (amount >= 1000) return `${symbol}${(amount / 1000).toFixed(0)}K`;
    return `${symbol}${amount.toFixed(0)}`;
  };

  return (
    <CurrencyContext.Provider value={{ currency, symbol, setCurrency, formatAmount, formatCompact }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const context = useContext(CurrencyContext);
  if (!context) throw new Error('useCurrency must be used within CurrencyProvider');
  return context;
}
