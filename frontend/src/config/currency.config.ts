export const CURRENCY_CONFIG = {
  default: {
    code: 'INR',
    symbol: '₹',
    name: 'Indian Rupee',
    locale: 'en-IN'
  },
  supported: [
    { code: 'INR', symbol: '₹', name: 'Indian Rupee', locale: 'en-IN' },
    { code: 'USD', symbol: '$', name: 'US Dollar', locale: 'en-US' },
    { code: 'EUR', symbol: '€', name: 'Euro', locale: 'de-DE' },
    { code: 'GBP', symbol: '£', name: 'British Pound', locale: 'en-GB' },
    { code: 'JPY', symbol: '¥', name: 'Japanese Yen', locale: 'ja-JP' },
    { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar', locale: 'en-CA' },
    { code: 'AUD', symbol: 'A$', name: 'Australian Dollar', locale: 'en-AU' },
    { code: 'CHF', symbol: 'CHF', name: 'Swiss Franc', locale: 'de-CH' },
    { code: 'AED', symbol: 'د.إ', name: 'UAE Dirham', locale: 'ar-AE' },
    { code: 'SAR', symbol: 'ر.س', name: 'Saudi Riyal', locale: 'ar-SA' },
    { code: 'QAR', symbol: 'ر.ق', name: 'Qatari Riyal', locale: 'ar-QA' },
    { code: 'KWD', symbol: 'د.ك', name: 'Kuwaiti Dinar', locale: 'ar-KW' },
    { code: 'BHD', symbol: 'د.ب', name: 'Bahraini Dinar', locale: 'ar-BH' },
    { code: 'OMR', symbol: 'ر.ع', name: 'Omani Rial', locale: 'ar-OM' },
    { code: 'JOD', symbol: 'د.ا', name: 'Jordanian Dinar', locale: 'ar-JO' },
    { code: 'ILS', symbol: '₪', name: 'Israeli Shekel', locale: 'he-IL' },
    { code: 'LBP', symbol: 'ل.ل', name: 'Lebanese Pound', locale: 'ar-LB' },
    { code: 'EGP', symbol: 'ج.م', name: 'Egyptian Pound', locale: 'ar-EG' },
    { code: 'IQD', symbol: 'ع.د', name: 'Iraqi Dinar', locale: 'ar-IQ' },
    { code: 'SYP', symbol: 'ل.س', name: 'Syrian Pound', locale: 'ar-SY' },
    { code: 'YER', symbol: 'ر.ي', name: 'Yemeni Rial', locale: 'ar-YE' },
    { code: 'TRY', symbol: '₺', name: 'Turkish Lira', locale: 'tr-TR' },
    { code: 'IRR', symbol: '﷼', name: 'Iranian Rial', locale: 'fa-IR' }
  ]
} as const;

export const formatCurrency = (
  amount: number, 
  currencyCode: string = CURRENCY_CONFIG.default.code
): string => {
  const currency = CURRENCY_CONFIG.supported.find(c => c.code === currencyCode) || CURRENCY_CONFIG.default;
  return `${currency.code} ${amount.toLocaleString(currency.locale, { 
    minimumFractionDigits: 2, 
    maximumFractionDigits: 2 
  })}`;
};
