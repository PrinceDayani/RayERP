'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RefreshCw, TrendingUp, AlertCircle } from 'lucide-react';
import FinanceAnalyticsDashboard from '../components/FinanceAnalyticsDashboard';
import { analyticsApi } from '@/lib/api/finance/analyticsApi';

export default function InvoiceAnalyticsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const response = await analyticsApi.getInvoiceAnalytics();
      const result = await response.json();
      if (result.success) setData(result.data);
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAnalytics(); }, []);

  if (loading) {
    return (
      <div className="p-6 flex justify-center items-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Invoice Analytics</h1>
          <p className="text-muted-foreground">Comprehensive insights and metrics</p>
        </div>
        <Button onClick={fetchAnalytics} variant="outline">
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      {data && <FinanceAnalyticsDashboard data={data} />}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Key Insights
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-sm">• Revenue trending upward this quarter</p>
            <p className="text-sm">• {data?.metrics?.overdueCount || 0} invoices need attention</p>
            <p className="text-sm">• Average payment time: {data?.metrics?.avgPaymentTime || 0} days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Action Items
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-sm">• Follow up on overdue invoices</p>
            <p className="text-sm">• Review payment methods distribution</p>
            <p className="text-sm">• Monitor cash flow trends</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
