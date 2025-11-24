import { useState, useEffect } from 'react';

const EXCHANGE_RATES: Record<string, number> = {
  USD: 1,
  INR: 83.12,
  EUR: 0.92,
  GBP: 0.79,
};

const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: '$',
  INR: '₹',
  EUR: '€',
  GBP: '£',
};

export const useCurrency = () => {
  const [displayCurrency, setDisplayCurrency] = useState(() => 
    localStorage.getItem('display-currency') || 'INR'
  );

  const handleCurrencyChange = (currency: string) => {
    setDisplayCurrency(currency);
    localStorage.setItem('display-currency', currency);
    window.dispatchEvent(new CustomEvent('currency-change', { detail: currency }));
  };

  useEffect(() => {
    const handleStorageChange = (e: CustomEvent) => {
      setDisplayCurrency(e.detail);
    };
    window.addEventListener('currency-change' as any, handleStorageChange as any);
    return () => window.removeEventListener('currency-change' as any, handleStorageChange as any);
  }, []);

  const convertCurrency = (amount: number, fromCurrency: string, toCurrency: string) => {
    if (fromCurrency === toCurrency) return amount;
    const amountInUSD = amount / EXCHANGE_RATES[fromCurrency];
    return amountInUSD * EXCHANGE_RATES[toCurrency];
  };

  const formatAmount = (amount: number, currency?: string) => {
    const curr = currency || displayCurrency;
    const symbol = CURRENCY_SYMBOLS[curr] || curr;
    return `${symbol}${amount.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  };

  return {
    displayCurrency,
    setDisplayCurrency: handleCurrencyChange,
    convertCurrency,
    formatAmount,
    CURRENCY_SYMBOLS,
    EXCHANGE_RATES,
  };
};
