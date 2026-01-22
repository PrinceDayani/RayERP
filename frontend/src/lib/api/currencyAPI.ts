import { apiClient } from '@/lib/api';

export interface Currency {
  _id: string;
  code: string;
  name: string;
  symbol: string;
  isBaseCurrency: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ExchangeRate {
  _id: string;
  fromCurrency: string;
  toCurrency: string;
  rate: number;
  date: string;
  createdAt: string;
  updatedAt: string;
}

export const currencyAPI = {
  // Get all currencies
  getAll: async (): Promise<Currency[]> => {
    return apiClient.get<Currency[]>('/currencies');
  },

  // Get base currency
  getBase: async (): Promise<Currency> => {
    return apiClient.get<Currency>('/currencies/base');
  },

  // Get exchange rates
  getRates: async (from?: string, to?: string): Promise<ExchangeRate[]> => {
    const params = new URLSearchParams();
    if (from) params.append('from', from);
    if (to) params.append('to', to);
    
    return apiClient.get<ExchangeRate[]>(`/currencies/rates?${params}`);
  }
};

export default currencyAPI;