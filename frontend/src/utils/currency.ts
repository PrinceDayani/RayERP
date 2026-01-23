/**
 * Currency utility functions for safe currency handling
 */

const DEFAULT_CURRENCY = 'USD';

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
