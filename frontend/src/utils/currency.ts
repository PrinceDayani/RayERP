import { APP_CONFIG } from '@/config/app.config';

export type NumberFormat = 'indian' | 'international' | 'auto';

// Format large numbers in Indian style (Lakhs/Crores)
export const formatIndianNumber = (amount: number): string => {
  if (amount >= 10000000) { // 1 Crore
    return `${(amount / 10000000)} Cr`;
  } else if (amount >= 100000) { // 1 Lakh
    return `${(amount / 100000)} L`;
  } else if (amount >= 1000) {
    return `${(amount / 1000)} K`;
  }
  return amount.toString();
};

// Format large numbers in International style (Million/Billion)
export const formatInternationalNumber = (amount: number): string => {
  if (amount >= 1000000000) { // 1 Billion
    return `${(amount / 1000000000)} B`;
  } else if (amount >= 1000000) { // 1 Million
    return `${(amount / 1000000)} M`;
  } else if (amount >= 1000) {
    return `${(amount / 1000)} K`;
  }
  return amount.toString();
};

const getUserCurrency = (): string => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('preferredCurrency') || APP_CONFIG.currency.default;
  }
  return APP_CONFIG.currency.default;
};

const getUserNumberFormat = (): NumberFormat => {
  if (typeof window !== 'undefined') {
    return (localStorage.getItem('numberFormat') as NumberFormat) || 'indian';
  }
  return 'indian';
};

export const setNumberFormat = (format: NumberFormat): void => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('numberFormat', format);
  }
};

export const getNumberFormat = (): NumberFormat => getUserNumberFormat();

export const formatCurrency = (
  amount: number,
  currencyCode?: string,
  showSymbol: boolean = true,
  compact: boolean = false
): string => {
  if (amount === null || amount === undefined || isNaN(amount)) {
    amount = 0;
  }
  
  const currency = currencyCode || getUserCurrency();
  const numberFormat = getUserNumberFormat();
  
  if (!showSymbol) {
    return amount.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 20
    });
  }

  // Compact format for large numbers
  if (compact) {
    let formattedNumber: string;
    if (numberFormat === 'indian') {
      formattedNumber = formatIndianNumber(amount);
    } else if (numberFormat === 'international') {
      formattedNumber = formatInternationalNumber(amount);
    } else {
      // Auto: use Indian for INR, International for others
      formattedNumber = currency === 'INR' 
        ? formatIndianNumber(amount)
        : formatInternationalNumber(amount);
    }
    return `${currency} ${formattedNumber}`;
  }

  // Standard format with locale-specific separators
  let locale: string;
  if (numberFormat === 'indian') {
    locale = 'en-IN';
  } else if (numberFormat === 'international') {
    locale = 'en-US';
  } else {
    // Auto: use Indian locale for INR, US for others
    locale = currency === 'INR' ? 'en-IN' : 'en-US';
  }
  
  const formatted = amount.toLocaleString(locale, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 20
  });

  return `${currency} ${formatted}`;
};

export const getCurrencySymbol = (currencyCode?: string): string => {
  const currency = currencyCode || getUserCurrency();
  const symbols: Record<string, string> = {
    INR: '₹',
    USD: '$',
    EUR: '€',
    GBP: '£',
    JPY: '¥',
    CAD: 'C$',
    AUD: 'A$',
    CHF: 'CHF',
    AED: 'د.إ',
    SAR: 'ر.س',
    QAR: 'ر.ق',
    KWD: 'د.ك',
    BHD: 'د.ب',
    OMR: 'ر.ع',
    JOD: 'د.ا',
    ILS: '₪',
    LBP: 'ل.ل',
    EGP: 'ج.م',
    IQD: 'ع.د',
    SYP: 'ل.س',
    YER: 'ر.ي',
    TRY: '₺',
    IRR: '﷼'
  };
  return symbols[currency] || symbols[APP_CONFIG.currency.default];
};

export const formatNumber = (
  amount: number,
  options?: Intl.NumberFormatOptions
): string => {
  const numberFormat = getUserNumberFormat();
  
  let locale: string;
  if (numberFormat === 'indian') {
    locale = 'en-IN';
  } else if (numberFormat === 'international') {
    locale = 'en-US';
  } else {
    locale = 'en-IN';
  }
  
  return amount.toLocaleString(locale, options);
};

export const getUserPreferredCurrency = (): string => getUserCurrency();

export const DEFAULT_CURRENCY = APP_CONFIG.currency.default;
export const DEFAULT_CURRENCY_SYMBOL = APP_CONFIG.currency.symbol;

// Helper to format currency with smart compact notation
export const formatCurrencySmart = (amount: number, currencyCode?: string): string => {
  return formatCurrency(amount, currencyCode, true, false);
};
