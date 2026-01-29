/**
 * Currency utility functions for safe currency handling
 */

const DEFAULT_CURRENCY = 'USD';

export type NumberFormat = 'indian' | 'international' | 'auto';
const NUMBER_FORMAT_KEY = 'numberFormat';
const DEFAULT_NUMBER_FORMAT: NumberFormat = 'indian';

/**
 * Get currency from entity with fallback to default
 */
export const getCurrency = (entity: { currency?: string } | null | undefined): string => {
  return entity?.currency || DEFAULT_CURRENCY;
};

/**
 * Format currency symbol
 */
export const formatCurrency = (amount: number, currency: string = DEFAULT_CURRENCY): string => {
  return `${currency} ${amount.toLocaleString('en-US', { 
    minimumFractionDigits: 2, 
    maximumFractionDigits: 2 
  })}`;
};

/**
 * Validate currency code
 */
export const isValidCurrency = (currency: string): boolean => {
  const validCurrencies = ['USD', 'EUR', 'GBP', 'INR', 'JPY', 'CAD', 'AUD', 'CHF', 'AED', 'SAR'];
  return validCurrencies.includes(currency.toUpperCase());
};

/**
 * Get number format from localStorage
 */
export const getNumberFormat = (): NumberFormat => {
  if (typeof window === 'undefined') return DEFAULT_NUMBER_FORMAT;
  const stored = localStorage.getItem(NUMBER_FORMAT_KEY);
  return (stored as NumberFormat) || DEFAULT_NUMBER_FORMAT;
};

/**
 * Set number format in localStorage
 */
export const setNumberFormat = (format: NumberFormat): void => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(NUMBER_FORMAT_KEY, format);
};

/**
 * Get user preferred currency from localStorage
 */
export const getUserPreferredCurrency = (): string => {
  if (typeof window === 'undefined') return DEFAULT_CURRENCY;
  return localStorage.getItem('preferredCurrency') || DEFAULT_CURRENCY;
};
