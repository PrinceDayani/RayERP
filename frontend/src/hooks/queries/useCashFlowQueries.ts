import { useQuery, useMutation } from '@tanstack/react-query';
import { reportingApi } from '@/lib/api/finance/reportingApi';
import { billsApi } from '@/lib/api/billsApi';
import type { CashFlowData, HistoricalData, Transaction } from '@/types/cashflow';

export const useCashFlowQuery = (startDate: string, endDate: string, enabled = true) => {
  return useQuery({
    queryKey: ['cashFlow', startDate, endDate],
    queryFn: async () => {
      const response = await reportingApi.getCashFlow(startDate, endDate);
      if (!response.success) throw new Error(response.message || 'Failed to fetch');
      return response.data as CashFlowData;
    },
    enabled: enabled && !!startDate && !!endDate,
    staleTime: 5 * 60 * 1000,
    retry: 3,
  });
};

export const useHistoricalCashFlowQuery = (periods: number = 6) => {
  return useQuery({
    queryKey: ['historicalCashFlow', periods],
    queryFn: async () => {
      const response = await billsApi.getHistoricalCashFlow(periods);
      if (!response.success) throw new Error('Failed to fetch historical data');
      return (response.data || []) as HistoricalData[];
    },
    staleTime: 10 * 60 * 1000,
  });
};

export const useActivityTransactionsQuery = (
  activity: string | null,
  startDate: string,
  endDate: string
) => {
  return useQuery({
    queryKey: ['activityTransactions', activity, startDate, endDate],
    queryFn: async () => {
      if (!activity) return [];
      const response = await billsApi.getActivityTransactions(activity, startDate, endDate);
      if (!response.success) return [];
      return (response.data || []).map((t: any) => ({
        date: new Date(t.date).toLocaleDateString('en-IN'),
        description: t.description || t.accountId?.name || 'Transaction',
        amount: t.debit - t.credit,
      })) as Transaction[];
    },
    enabled: !!activity,
    staleTime: 3 * 60 * 1000,
  });
};

export const useExportReport = () => {
  return useMutation({
    mutationFn: async ({
      reportType,
      format,
      startDate,
      endDate,
    }: {
      reportType: string;
      format: string;
      startDate?: string;
      endDate?: string;
    }) => {
      return await reportingApi.exportReport(reportType, format, startDate, endDate);
    },
  });
};
