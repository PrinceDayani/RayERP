"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { currencyAPI, type Currency } from '@/lib/api/currencyAPI';

interface CurrencyContextType {
  currencies: Currency[];
  baseCurrency: Currency | null;
  loading: boolean;
  error: string | null;
  formatCurrency: (amount: number, currencyCode?: string) => string;
  getCurrencySymbol: (currencyCode: string) => string;
  refreshCurrencies: () => Promise<void>;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export const CurrencyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [baseCurrency, setBaseCurrency] = useState<Currency | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCurrencies = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Check if user is authenticated
      const token = sessionStorage.getItem('auth-token') || localStorage.getItem('token');
      if (!token) {
        console.log('No auth token found, using default currencies');
        const defaultCurrencies = [
          { _id: 'usd', code: 'USD', name: 'US Dollar', symbol: '$', isBaseCurrency: false, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
          { _id: 'eur', code: 'EUR', name: 'Euro', symbol: '€', isBaseCurrency: false, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
          { _id: 'gbp', code: 'GBP', name: 'British Pound', symbol: '£', isBaseCurrency: false, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
          { _id: 'inr', code: 'INR', name: 'Indian Rupee', symbol: '₹', isBaseCurrency: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
        ];
        setCurrencies(defaultCurrencies);
        setBaseCurrency(defaultCurrencies[3]); // INR as base
        setLoading(false);
        return;
      }
      
      console.log('Fetching currencies from API...');
      const [currenciesData, baseCurrencyData] = await Promise.all([
        currencyAPI.getAll(),
        currencyAPI.getBase()
      ]);
      
      console.log('Currencies fetched:', currenciesData);
      setCurrencies(currenciesData);
      setBaseCurrency(baseCurrencyData);
    } catch (err) {
      console.error('Error fetching currencies:', err);
      setError('Failed to load currencies');
      // Set default fallback
      const defaultCurrencies = [
        { _id: 'usd', code: 'USD', name: 'US Dollar', symbol: '$', isBaseCurrency: false, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        { _id: 'eur', code: 'EUR', name: 'Euro', symbol: '€', isBaseCurrency: false, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        { _id: 'gbp', code: 'GBP', name: 'British Pound', symbol: '£', isBaseCurrency: false, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        { _id: 'inr', code: 'INR', name: 'Indian Rupee', symbol: '₹', isBaseCurrency: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
      ];
      setCurrencies(defaultCurrencies);
      setBaseCurrency(defaultCurrencies[3]); // INR as base
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCurrencies();
    
    // Listen for auth changes
    const handleStorageChange = (e: StorageEvent) => {
      if ((e.key === 'auth-token' || e.key === 'token') && e.newValue) {
        console.log('Auth token detected, refreshing currencies');
        fetchCurrencies();
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const formatCurrency = (amount: number, currencyCode?: string): string => {
    const currency = currencyCode 
      ? currencies.find(c => c.code === currencyCode) 
      : baseCurrency;
    
    const symbol = currency?.symbol || '$';
    return `${symbol}${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const getCurrencySymbol = (currencyCode: string): string => {
    const currency = currencies.find(c => c.code === currencyCode);
    return currency?.symbol || '$';
  };

  const refreshCurrencies = async () => {
    await fetchCurrencies();
  };

  return (
    <CurrencyContext.Provider value={{
      currencies,
      baseCurrency,
      loading,
      error,
      formatCurrency,
      getCurrencySymbol,
      refreshCurrencies
    }}>
      {children}
    </CurrencyContext.Provider>
  );
};

export const useCurrency = () => {
  const context = useContext(CurrencyContext);
  if (context === undefined) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
};