import { useCurrency } from '@/contexts/CurrencyContext';

export function useCurrencyFormat() {
  const { baseCurrency, formatCurrency: contextFormatCurrency, getCurrencySymbol } = useCurrency();

  const format = (amount: number, options?: { showSymbol?: boolean; currencyOverride?: string }) => {
    if (options?.currencyOverride) {
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
      const sym = symbols[options.currencyOverride] || '₹';
      const loc = locales[options.currencyOverride] || 'en-IN';
      const formatted = amount.toLocaleString(loc, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      return options.showSymbol !== false ? `${sym}${formatted}` : formatted;
    }
    return contextFormatCurrency(amount, baseCurrency?.code);
  };

  const formatAmount = (amount: number, currencyOverride?: string) => {
    return contextFormatCurrency(amount, currencyOverride || baseCurrency?.code);
  };

  const formatCompact = (amount: number) => {
    if (amount >= 10000000) return `${(amount / 10000000).toFixed(2)}Cr`;
    if (amount >= 100000) return `${(amount / 100000).toFixed(2)}L`;
    if (amount >= 1000) return `${(amount / 1000).toFixed(2)}K`;
    return amount.toFixed(2);
  };

  return { 
    currency: baseCurrency?.code || 'USD', 
    symbol: baseCurrency?.symbol || '$', 
    format,
    formatAmount,
    formatCompact
  };
}
