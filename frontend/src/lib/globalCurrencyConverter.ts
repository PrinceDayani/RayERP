import { CURRENCY_CONFIG } from '@/config/currency.config';

// Exchange rates with INR as base currency
const EXCHANGE_RATES: Record<string, number> = {
  'INR': 1,
  'USD': 0.012,
  'EUR': 0.011,
  'GBP': 0.0095,
  'JPY': 1.8,
  'CAD': 0.016,
  'AUD': 0.018,
  'CHF': 0.011,
  'AED': 0.044,
  'SAR': 0.045,
  'QAR': 0.044,
  'KWD': 0.0036,
  'BHD': 0.0045,
  'OMR': 0.0046,
  'JOD': 0.0085,
  'ILS': 0.044,
  'LBP': 18.2,
  'EGP': 0.37,
  'TRY': 0.35,
};

class CurrencyConverter {
  private static instance: CurrencyConverter;
  private selectedCurrency: string = 'Original';
  private listeners: ((currency: string) => void)[] = [];

  static getInstance(): CurrencyConverter {
    if (!CurrencyConverter.instance) {
      CurrencyConverter.instance = new CurrencyConverter();
    }
    return CurrencyConverter.instance;
  }

  setDisplayCurrency(currency: string): void {
    this.selectedCurrency = currency;
    this.listeners.forEach(listener => listener(currency));
  }

  getDisplayCurrency(): string {
    return this.selectedCurrency;
  }

  subscribe(listener: (currency: string) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  convert(amount: number, fromCurrency: string = 'INR'): number {
    if (amount === null || amount === undefined || isNaN(amount)) {
      return 0;
    }
    
    if (this.selectedCurrency === 'Original') return amount;
    
    // Convert to INR first
    let amountInINR = amount;
    if (fromCurrency !== 'INR' && EXCHANGE_RATES[fromCurrency]) {
      amountInINR = amount / EXCHANGE_RATES[fromCurrency];
    }
    
    // Convert from INR to target currency
    if (this.selectedCurrency === 'INR') return amountInINR;
    
    const rate = EXCHANGE_RATES[this.selectedCurrency];
    return rate ? amountInINR * rate : amountInINR;
  }

  formatAmount(amount: number, fromCurrency: string = 'INR'): string {
    if (amount === null || amount === undefined || isNaN(amount)) {
      amount = 0;
    }
    
    const convertedAmount = this.convert(amount, fromCurrency);
    const displayCurrency = this.selectedCurrency === 'Original' ? fromCurrency : this.selectedCurrency;
    
    return `${displayCurrency} ${convertedAmount.toLocaleString('en-US', { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    })}`;
  }
}

export const globalCurrencyConverter = CurrencyConverter.getInstance();
export default globalCurrencyConverter;