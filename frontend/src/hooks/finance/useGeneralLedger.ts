import { useState, useCallback } from 'react';
import { generalLedgerAPI } from '@/lib/api/generalLedgerAPI';
import { AccountLedger as Account, JournalEntry } from '@/types/finance/generalLedger.types';

export const useGeneralLedger = () => {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([]);
  const [trialBalance, setTrialBalance] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAccounts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await generalLedgerAPI.getAccounts();
      const accountsData = data?.accounts || data || [];
      // Map _id to id for frontend compatibility
      const mappedAccounts = Array.isArray(accountsData) 
        ? accountsData.map((acc: any) => ({ ...acc, id: acc._id || acc.id }))
        : [];
      setAccounts(mappedAccounts);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error fetching accounts';
      setError(errorMessage);
      setAccounts([]);
      console.error('Error fetching accounts:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const createAccount = useCallback(async (accountData: Partial<Account>) => {
    setLoading(true);
    setError(null);
    try {
      const newAccount = await generalLedgerAPI.createAccount(accountData);
      setAccounts(prev => [...prev, newAccount]);
      return newAccount;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error creating account';
      setError(errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchJournalEntries = useCallback(async (params?: any) => {
    setLoading(true);
    setError(null);
    try {
      const data = await generalLedgerAPI.getJournalEntries(params);
      const entriesData = data?.journalEntries || data || [];
      setJournalEntries(Array.isArray(entriesData) ? entriesData : []);
      return data;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error fetching journal entries';
      setError(errorMessage);
      setJournalEntries([]);
      console.error('Error fetching journal entries:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const createJournalEntry = useCallback(async (entryData: any) => {
    setLoading(true);
    setError(null);
    try {
      const newEntry = await generalLedgerAPI.createJournalEntry(entryData);
      setJournalEntries(prev => [newEntry, ...prev]);
      return newEntry;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error creating journal entry';
      setError(errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchTrialBalance = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await generalLedgerAPI.getTrialBalance();
      setTrialBalance(data);
      return data;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error fetching trial balance';
      setError(errorMessage);
      console.error('Error fetching trial balance:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    accounts,
    journalEntries,
    trialBalance,
    loading,
    error,
    fetchAccounts,
    createAccount,
    fetchJournalEntries,
    createJournalEntry,
    fetchTrialBalance
  };
};
