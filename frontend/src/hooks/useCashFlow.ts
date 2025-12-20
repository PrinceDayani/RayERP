import { useState, useEffect, useCallback, useRef } from 'react';
import { reportingApi } from '@/lib/api/finance/reportingApi';
import { billsApi } from '@/lib/api/billsApi';
import { CashFlowData, HistoricalData, Transaction, ApiResponse } from '@/types/cashflow';

interface UseCashFlowOptions {
  startDate: string;
  endDate: string;
  enabled?: boolean;
  retries?: number;
  retryDelay?: number;
}

export const useCashFlow = ({ startDate, endDate, enabled = true, retries = 3, retryDelay = 1000 }: UseCashFlowOptions) => {
  const [data, setData] = useState<CashFlowData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchWithRetry = useCallback(async (attempt = 0): Promise<void> => {
    if (!enabled) return;

    try {
      setLoading(true);
      setError(null);

      abortControllerRef.current = new AbortController();
      
      const response: ApiResponse<CashFlowData> = await reportingApi.getCashFlow(startDate, endDate);
      
      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch cash flow data');
      }

      setData(response.data || null);
    } catch (err: any) {
      if (err.name === 'AbortError') return;

      if (attempt < retries) {
        await new Promise(resolve => setTimeout(resolve, retryDelay * Math.pow(2, attempt)));
        return fetchWithRetry(attempt + 1);
      }

      setError(err.message || 'Failed to load cash flow data');
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate, enabled, retries, retryDelay]);

  useEffect(() => {
    fetchWithRetry();

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [fetchWithRetry]);

  const refetch = useCallback(() => {
    fetchWithRetry();
  }, [fetchWithRetry]);

  return { data, loading, error, refetch };
};

export const useHistoricalCashFlow = (periods: number = 6) => {
  const [data, setData] = useState<HistoricalData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        abortControllerRef.current = new AbortController();
        
        const response = await billsApi.getHistoricalCashFlow(periods);
        
        if (response.success) {
          setData(response.data || []);
        } else {
          throw new Error('Failed to fetch historical data');
        }
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          setError(err.message);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [periods]);

  return { data, loading, error };
};

export const useActivityTransactions = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchTransactions = useCallback(async (activity: string, startDate: string, endDate: string) => {
    try {
      setLoading(true);
      setError(null);

      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      abortControllerRef.current = new AbortController();
      
      const response = await billsApi.getActivityTransactions(activity, startDate, endDate);
      
      if (response.success) {
        setTransactions(response.data.map((t: any) => ({
          date: new Date(t.date).toLocaleDateString('en-IN'),
          description: t.description || t.accountId?.name || 'Transaction',
          amount: t.debit - t.credit
        })));
      } else {
        setTransactions([]);
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        setError(err.message);
        setTransactions([]);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return { transactions, loading, error, fetchTransactions };
};
