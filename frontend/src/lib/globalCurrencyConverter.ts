import { CURRENCY_CONFIG } from '@/config/currency.config';

// Exchange rates with USD as base currency
const EXCHANGE_RATES: Record<string, number> = {
  'USD': 1,
  'INR': 83.12,
  'EUR': 0.92,
  'GBP': 0.79,
  'JPY': 149.50,
  'CAD': 1.36,
  'AUD': 1.52,
  'CHF': 0.88,
  'AED': 3.67,
  'SAR': 3.75,
  'QAR': 3.64,
  'KWD': 0.31,
  'BHD': 0.38,
  'OMR': 0.38,
  'JOD': 0.71,
  'ILS': 3.64,
  'LBP': 1507.50,
  'EGP': 30.90,
  'TRY': 32.20,
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

  convert(amount: number, fromCurrency: string = 'USD'): number {
    if (amount === null || amount === undefined || isNaN(amount)) {
      return 0;
    }
    
    if (this.selectedCurrency === 'Original') return amount;
    
    // Convert to USD first
    let amountInUSD = amount;
    if (fromCurrency !== 'USD' && EXCHANGE_RATES[fromCurrency]) {
      amountInUSD = amount / EXCHANGE_RATES[fromCurrency];
    }
    
    // Convert from USD to target currency
    if (this.selectedCurrency === 'USD') return amountInUSD;
    
    const rate = EXCHANGE_RATES[this.selectedCurrency];
    return rate ? amountInUSD * rate : amountInUSD;
  }

  formatAmount(amount: number, fromCurrency: string = 'USD'): string {
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