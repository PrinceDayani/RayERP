import { useState } from 'react';
import { generalLedgerApi } from '@/lib/api/finance/generalLedgerApi';

export const useGeneralLedger = () => {
  const [accounts, setAccounts] = useState([]);
  const [journalEntries, setJournalEntries] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchAccounts = async () => {
    setLoading(true);
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));
      const data = await generalLedgerApi.getAccounts();
      setAccounts(data || []);
    } catch (error) {
      console.error('Error fetching accounts:', error);
      setAccounts([]);
    } finally {
      setLoading(false);
    }
  };

  return { accounts, journalEntries, loading, fetchAccounts };
};