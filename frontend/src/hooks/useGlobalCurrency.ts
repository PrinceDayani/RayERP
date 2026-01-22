import { useState, useEffect } from 'react';
import { globalCurrencyConverter } from '@/lib/globalCurrencyConverter';

export const useGlobalCurrency = () => {
  const [displayCurrency, setDisplayCurrency] = useState(globalCurrencyConverter.getDisplayCurrency());

  useEffect(() => {
    const unsubscribe = globalCurrencyConverter.subscribe(setDisplayCurrency);
    return unsubscribe;
  }, []);

  const convertAmount = (amount: number, fromCurrency?: string) => 
    globalCurrencyConverter.convert(amount, fromCurrency);

  const formatAmount = (amount: number, fromCurrency?: string) => 
    globalCurrencyConverter.formatAmount(amount, fromCurrency);

  const setGlobalCurrency = (currency: string) => 
    globalCurrencyConverter.setDisplayCurrency(currency);

  return {
    displayCurrency,
    convertAmount,
    formatAmount,
    setGlobalCurrency
  };
};