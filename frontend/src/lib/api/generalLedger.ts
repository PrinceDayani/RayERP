import api from '../api';

export interface Account {
  _id: string;
  code: string;
  name: string;
  type: 'asset' | 'liability' | 'equity' | 'revenue' | 'expense';
  balance: number;
  currency: string;
  isActive: boolean;
}

export interface JournalEntry {
  _id: string;
  entryNumber: string;
  date: string;
  description: string;
  totalDebit: number;
  totalCredit: number;
  currency: string;
  status: string;
  lines: JournalEntryLine[];
}

export interface JournalEntryLine {
  accountId: string;
  debit: number;
  credit: number;
  description: string;
  currency?: string;
  exchangeRate?: number;
}

export interface Currency {
  _id: string;
  code: string;
  name: string;
  symbol: string;
  isBaseCurrency: boolean;
}

export interface ExchangeRate {
  fromCurrency: string;
  toCurrency: string;
  rate: number;
  date: string;
}

// Accounts
export const getAccounts = async (currency?: string) => {
  const params = currency ? { currency } : undefined;
  const response = await api.get('/general-ledger/accounts', params ? { params } : undefined);
  return response.data;
};

export const createAccount = async (data: Partial<Account>) => {
  const response = await api.post('/general-ledger/accounts', data);
  return response.data;
};

export const updateAccount = async (id: string, data: Partial<Account>) => {
  const response = await api.put(`/general-ledger/accounts/${id}`, data);
  return response.data;
};

export const deleteAccount = async (id: string) => {
  const response = await api.delete(`/general-ledger/accounts/${id}`);
  return response.data;
};

// Journal Entries
export const getJournalEntries = async (filters?: any) => {
  const response = await api.get('/general-ledger/journal-entries', filters ? { params: filters } : undefined);
  return response.data;
};

export const createJournalEntry = async (data: Partial<JournalEntry>) => {
  const response = await api.post('/general-ledger/journal-entries', data);
  return response.data;
};

export const updateJournalEntry = async (id: string, data: Partial<JournalEntry>) => {
  const response = await api.put(`/general-ledger/journal-entries/${id}`, data);
  return response.data;
};

export const postJournalEntry = async (id: string) => {
  const response = await api.post(`/general-ledger/journal-entries/${id}/post`, {});
  return response.data;
};

export const deleteJournalEntry = async (id: string) => {
  const response = await api.delete(`/general-ledger/journal-entries/${id}`);
  return response.data;
};

// Currencies
export const getCurrencies = async () => {
  const response = await api.get('/general-ledger/currencies');
  return response.data;
};

export const createCurrency = async (data: Partial<Currency>) => {
  const response = await api.post('/general-ledger/currencies', data);
  return response.data;
};

export const updateCurrency = async (id: string, data: Partial<Currency>) => {
  const response = await api.put(`/general-ledger/currencies/${id}`, data);
  return response.data;
};

export const deleteCurrency = async (id: string) => {
  const response = await api.delete(`/general-ledger/currencies/${id}`);
  return response.data;
};

// Exchange Rates
export const getExchangeRate = async (from: string, to: string, date?: string) => {
  const params = { from, to, ...(date && { date }) };
  const response = await api.get('/general-ledger/exchange-rates', { params });
  return response.data;
};

export const updateExchangeRate = async (data: Partial<ExchangeRate>) => {
  const response = await api.post('/general-ledger/exchange-rates', data);
  return response.data;
};

// Reports
export const getTrialBalance = async (currency?: string, date?: string) => {
  const params = { ...(currency && { currency }), ...(date && { date }) };
  const response = await api.get('/general-ledger/trial-balance', Object.keys(params).length > 0 ? { params } : undefined);
  return response.data;
};

export const getAccountLedger = async (accountId: string, filters?: any) => {
  const response = await api.get(`/general-ledger/accounts/${accountId}/ledger`, filters ? { params: filters } : undefined);
  return response.data;
};

export const getFinancialReports = async (type: string, currency?: string) => {
  const params = { type, ...(currency && { currency }) };
  const response = await api.get('/general-ledger/reports', { params });
  return response.data;
};

// Currency Conversion Helper
export const convertAmount = async (amount: number, fromCurrency: string, toCurrency: string) => {
  if (fromCurrency === toCurrency) return amount;
  
  const rate = await getExchangeRate(fromCurrency, toCurrency);
  return amount * (rate.rate || 1);
};
