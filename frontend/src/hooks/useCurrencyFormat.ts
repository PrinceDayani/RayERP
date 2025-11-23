import { useCurrency } from '@/contexts/CurrencyContext';

export function useCurrencyFormat() {
  const { currency, symbol, formatAmount } = useCurrency();

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
    return formatAmount(amount, options?.showSymbol);
  };

  return { currency, symbol, format };
}
