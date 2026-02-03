import { useState, useEffect, useCallback } from 'react';
import { useCurrency } from '@/contexts/CurrencyContext';
import * as glApi from '@/lib/api/generalLedger';
import { toast } from './use-toast';

export const useGeneralLedger = () => {
  const { baseCurrency } = useCurrency();
  const currency = baseCurrency?.code || 'USD';
  const [accounts, setAccounts] = useState<glApi.Account[]>([]);
  const [journalEntries, setJournalEntries] = useState<glApi.JournalEntry[]>([]);
  const [currencies, setCurrencies] = useState<glApi.Currency[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch accounts
  const fetchAccounts = useCallback(async () => {
    try {
      setLoading(true);
      const data = await glApi.getAccounts(currency);
      setAccounts(data);
      setError(null);
    } catch (err: any) {
      setError(err.message);
      toast({ title: 'Error', description: 'Failed to fetch accounts', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [currency]);

  // Fetch journal entries
  const fetchJournalEntries = useCallback(async (filters?: any) => {
    try {
      setLoading(true);
      const data = await glApi.getJournalEntries(filters);
      setJournalEntries(data);
      setError(null);
    } catch (err: any) {
      setError(err.message);
      toast({ title: 'Error', description: 'Failed to fetch journal entries', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch currencies
  const fetchCurrencies = useCallback(async () => {
    try {
      const data = await glApi.getCurrencies();
      setCurrencies(data);
    } catch (err: any) {
      console.error('Failed to fetch currencies:', err);
    }
  }, []);

  // Create account
  const createAccount = useCallback(async (data: Partial<glApi.Account>) => {
    try {
      setLoading(true);
      const newAccount = await glApi.createAccount({ ...data, currency });
      setAccounts(prev => [...prev, newAccount]);
      toast({ title: 'Success', description: 'Account created successfully' });
      return newAccount;
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
      throw err;
    } finally {
      setLoading(false);
    }
  }, [currency]);

  // Update account
  const updateAccount = useCallback(async (id: string, data: Partial<glApi.Account>) => {
    try {
      setLoading(true);
      const updated = await glApi.updateAccount(id, data);
      setAccounts(prev => prev.map(acc => acc._id === id ? updated : acc));
      toast({ title: 'Success', description: 'Account updated successfully' });
      return updated;
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Delete account
  const deleteAccount = useCallback(async (id: string) => {
    try {
      setLoading(true);
      await glApi.deleteAccount(id);
      setAccounts(prev => prev.filter(acc => acc._id !== id));
      toast({ title: 'Success', description: 'Account deleted successfully' });
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Create journal entry
  const createJournalEntry = useCallback(async (data: Partial<glApi.JournalEntry>) => {
    try {
      setLoading(true);
      const newEntry = await glApi.createJournalEntry({ ...data, currency });
      setJournalEntries(prev => [...prev, newEntry]);
      toast({ title: 'Success', description: 'Journal entry created successfully' });
      return newEntry;
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
      throw err;
    } finally {
      setLoading(false);
    }
  }, [currency]);

  // Post journal entry
  const postJournalEntry = useCallback(async (id: string) => {
    try {
      setLoading(true);
      const posted = await glApi.postJournalEntry(id);
      setJournalEntries(prev => prev.map(entry => entry._id === id ? posted : entry));
      toast({ title: 'Success', description: 'Journal entry posted successfully' });
      return posted;
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Calculate KPIs
  const calculateKPIs = useCallback(() => {
    const totalRevenue = accounts.filter(a => a.type === 'revenue').reduce((sum, a) => sum + a.balance, 0);
    const totalExpenses = accounts.filter(a => a.type === 'expense').reduce((sum, a) => sum + a.balance, 0);
    const totalAssets = accounts.filter(a => a.type === 'asset').reduce((sum, a) => sum + a.balance, 0);
    const totalLiabilities = accounts.filter(a => a.type === 'liability').reduce((sum, a) => sum + a.balance, 0);
    const totalEquity = accounts.filter(a => a.type === 'equity').reduce((sum, a) => sum + a.balance, 0);
    const netProfit = totalRevenue - totalExpenses;

    return {
      totalRevenue,
      totalExpenses,
      totalAssets,
      totalLiabilities,
      totalEquity,
      netProfit,
      profitMargin: totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0,
      expenseRatio: totalRevenue > 0 ? (totalExpenses / totalRevenue) * 100 : 0
    };
  }, [accounts]);

  // Get trial balance
  const getTrialBalance = useCallback(async (date?: string) => {
    try {
      setLoading(true);
      const data = await glApi.getTrialBalance(currency, date);
      return data;
    } catch (err: any) {
      toast({ title: 'Error', description: 'Failed to generate trial balance', variant: 'destructive' });
      throw err;
    } finally {
      setLoading(false);
    }
  }, [currency]);

  // Get account ledger
  const getAccountLedger = useCallback(async (accountId: string, filters?: any) => {
    try {
      setLoading(true);
      const data = await glApi.getAccountLedger(accountId, filters);
      return data;
    } catch (err: any) {
      toast({ title: 'Error', description: 'Failed to fetch account ledger', variant: 'destructive' });
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchAccounts();
    fetchJournalEntries();
    fetchCurrencies();
  }, [fetchAccounts, fetchJournalEntries, fetchCurrencies]);

  return {
    // State
    accounts,
    journalEntries,
    currencies,
    loading,
    error,
    
    // Actions
    fetchAccounts,
    fetchJournalEntries,
    createAccount,
    updateAccount,
    deleteAccount,
    createJournalEntry,
    postJournalEntry,
    
    // Utilities
    calculateKPIs,
    getTrialBalance,
    getAccountLedger
  };
};
