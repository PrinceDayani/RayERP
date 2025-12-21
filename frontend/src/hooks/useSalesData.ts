import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api';

interface SalesData {
  totalRevenue: number;
  totalPaid: number;
  totalPending: number;
  transactionCount: number;
  avgSaleValue: number;
  monthlyTrend: Array<{ month: string; revenue: number }>;
}

interface UseSalesDataOptions {
  accountId?: string;
  dateFrom?: string;
  dateTo?: string;
}

interface UseSalesDataReturn {
  salesData: SalesData;
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

export const useSalesData = (options: UseSalesDataOptions = {}): UseSalesDataReturn => {
  const { accountId, dateFrom, dateTo } = options;
  const [salesData, setSalesData] = useState<SalesData>({
    totalRevenue: 0,
    totalPaid: 0,
    totalPending: 0,
    transactionCount: 0,
    avgSaleValue: 0,
    monthlyTrend: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSalesData = async () => {
    try {
      setLoading(true);
      setError(null);

      let endpoint = '/sales-reports/report';
      let ledgerData = null;

      // If specific account selected, get ledger data
      if (accountId && accountId !== 'all') {
        try {
          const params = new URLSearchParams();
          if (dateFrom) params.append('from', dateFrom);
          if (dateTo) params.append('to', dateTo);
          
          const ledgerResponse = await apiClient.get(
            `/general-ledger/accounts/${accountId}/ledger?${params.toString()}`
          );
          ledgerData = (ledgerResponse as any).entries || [];
        } catch (ledgerError) {
          console.warn('Ledger data not available:', ledgerError);
          ledgerData = null;
        }
      }

      // Get invoice-based sales data
      let salesResponse;
      try {
        salesResponse = await apiClient.get(endpoint);
      } catch (error) {
        console.warn('Sales API not available, using demo data');
        salesResponse = { data: [], summary: null };
      }
      
      const invoiceSales = Array.isArray(salesResponse.data) ? salesResponse.data : [];
      const salesSummary = salesResponse.summary;

      let totalRevenue = 0;
      let totalPaid = 0;
      let transactionCount = 0;

      if (salesSummary) {
        // Use summary data from backend
        totalRevenue = salesSummary.totalRevenue || 0;
        totalPaid = salesSummary.totalPaid || 0;
        transactionCount = salesSummary.transactionCount || 0;
      } else if (ledgerData && ledgerData.length > 0) {
        // Use ledger data (more accurate)
        totalRevenue = ledgerData.reduce((sum: number, entry: any) => sum + (entry.credit || 0), 0);
        totalPaid = totalRevenue; // Ledger entries are actual transactions
        transactionCount = ledgerData.length;
      } else if (invoiceSales.length > 0) {
        // Use invoice data
        totalRevenue = invoiceSales.reduce((sum: number, sale: any) => sum + (sale.totalAmount || 0), 0);
        totalPaid = invoiceSales.reduce((sum: number, sale: any) => sum + (sale.paidAmount || 0), 0);
        transactionCount = invoiceSales.length;
      }

      const totalPending = totalRevenue - totalPaid;
      const avgSaleValue = transactionCount > 0 ? totalRevenue / transactionCount : 0;

      // Get monthly trend data from backend
      let monthlyTrend = [];
      try {
        const trendsResponse = await apiClient.get('/sales-reports/monthly-trends');
        monthlyTrend = trendsResponse.data || [];
      } catch (error) {
        console.warn('Monthly trends not available, generating from local data');
        monthlyTrend = generateMonthlyTrend(ledgerData || invoiceSales);
      }

      setSalesData({
        totalRevenue,
        totalPaid,
        totalPending,
        transactionCount,
        avgSaleValue,
        monthlyTrend
      });
    } catch (err) {
      console.error('Error fetching sales data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch sales data');
    } finally {
      setLoading(false);
    }
  };

  const refresh = () => {
    fetchSalesData();
  };

  useEffect(() => {
    fetchSalesData();
  }, [accountId, dateFrom, dateTo]);

  return { salesData, loading, error, refresh };
};

// Helper function to generate monthly trend from actual data
function generateMonthlyTrend(data: any[]): Array<{ month: string; revenue: number }> {
  const monthlyData = new Map<string, number>();
  const now = new Date();
  
  // Initialize last 6 months with 0
  for (let i = 5; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthKey = date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
    monthlyData.set(monthKey, 0);
  }
  
  // Process actual data
  data.forEach((item: any) => {
    const date = new Date(item.date || item.createdAt || item.invoiceDate);
    if (isNaN(date.getTime())) return;
    
    const monthKey = date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
    const revenue = item.credit || item.totalAmount || item.amount || 0;
    
    if (monthlyData.has(monthKey)) {
      monthlyData.set(monthKey, monthlyData.get(monthKey)! + revenue);
    }
  });
  
  return Array.from(monthlyData.entries()).map(([month, revenue]) => ({
    month,
    revenue
  }));
}