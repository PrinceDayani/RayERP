'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TrendingUp, DollarSign, ShoppingCart, Calendar, Download, Search, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { apiClient } from '@/lib/api';
import { useDebounce } from '@/hooks/useDebounce';

interface Sale {
  _id: string;
  invoiceNumber: string;
  partyName: string;
  totalAmount: number;
  paidAmount: number;
  status: string;
  invoiceDate: string;
}

export default function SalesReportsPage() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateRange, setDateRange] = useState('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const debouncedSearch = useDebounce(searchTerm, 500);

  useEffect(() => {
    fetchSales();
  }, [statusFilter, dateRange, page]);

  const fetchSales = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.append('status', statusFilter);
      params.append('page', page.toString());
      params.append('limit', '50');
      
      if (dateRange !== 'all') {
        const now = new Date();
        let startDate: Date;
        
        if (dateRange === 'today') {
          startDate = new Date(now.setHours(0, 0, 0, 0));
        } else if (dateRange === 'week') {
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        } else if (dateRange === 'month') {
          startDate = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
        } else {
          startDate = now;
        }
        
        params.append('startDate', startDate.toISOString().split('T')[0]);
      }

      const data = await apiClient.get(`/api/sales-reports/report?${params}`);
      setSales(data.data || []);
      setTotalPages(data.pagination?.pages || 1);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load sales data';
      setError(message);
      setSales([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredSales = sales.filter(sale => {
    if (!debouncedSearch) return true;
    const search = debouncedSearch.toLowerCase();
    return sale.partyName?.toLowerCase().includes(search) ||
           sale.invoiceNumber?.toLowerCase().includes(search);
  });

  const totalRevenue = filteredSales.reduce((sum, sale) => sum + (sale.totalAmount || 0), 0);
  const totalPaid = filteredSales.reduce((sum, sale) => sum + (sale.paidAmount || 0), 0);
  const totalPending = totalRevenue - totalPaid;
  const avgSale = filteredSales.length > 0 ? totalRevenue / filteredSales.length : 0;

  const getStatusColor = (status: string) => {
    const s = status.toLowerCase();
    const colors: Record<string, string> = {
      draft: 'bg-gray-100 text-gray-800',
      sent: 'bg-blue-100 text-blue-800',
      paid: 'bg-green-100 text-green-800',
      partially_paid: 'bg-yellow-100 text-yellow-800',
      overdue: 'bg-red-100 text-red-800',
      approved: 'bg-green-100 text-green-800'
    };
    return colors[s] || 'bg-gray-100 text-gray-800';
  };

  if (loading && sales.length === 0) {
    return (
      <div className="min-h-screen bg-background p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading sales data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Sales Reports</h1>
          <p className="text-muted-foreground mt-1">Track and analyze all sales transactions</p>
        </div>
        <Button className="bg-primary" aria-label="Export sales report">
          <Download className="w-4 h-4 mr-2" />
          Export Report
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{totalRevenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">{filteredSales.length} transactions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Amount Received</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">₹{totalPaid.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {totalRevenue > 0 ? ((totalPaid/totalRevenue)*100).toFixed(1) : '0.0'}% collected
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pending Amount</CardTitle>
            <TrendingUp className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">₹{totalPending.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {totalRevenue > 0 ? ((totalPending/totalRevenue)*100).toFixed(1) : '0.0'}% pending
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Avg Sale Value</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{avgSale.toLocaleString(undefined, {maximumFractionDigits: 0})}</div>
            <p className="text-xs text-muted-foreground mt-1">Per transaction</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
            <CardTitle>Sales Transactions</CardTitle>
            <div className="flex gap-2 w-full md:w-auto">
              <div className="relative flex-1 md:w-64">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search customer or invoice..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                  aria-label="Search sales"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-32" aria-label="Filter by status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="PAID">Paid</SelectItem>
                  <SelectItem value="SENT">Sent</SelectItem>
                  <SelectItem value="DRAFT">Draft</SelectItem>
                  <SelectItem value="PARTIALLY_PAID">Partially Paid</SelectItem>
                  <SelectItem value="APPROVED">Approved</SelectItem>
                  <SelectItem value="OVERDUE">Overdue</SelectItem>
                </SelectContent>
              </Select>
              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger className="w-32" aria-label="Filter by date range">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="week">This Week</SelectItem>
                  <SelectItem value="month">This Month</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full" role="table">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-medium text-sm">Invoice #</th>
                  <th className="text-left py-3 px-4 font-medium text-sm">Customer</th>
                  <th className="text-left py-3 px-4 font-medium text-sm">Date</th>
                  <th className="text-right py-3 px-4 font-medium text-sm">Total Amount</th>
                  <th className="text-right py-3 px-4 font-medium text-sm">Paid Amount</th>
                  <th className="text-right py-3 px-4 font-medium text-sm">Balance</th>
                  <th className="text-center py-3 px-4 font-medium text-sm">Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredSales.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-muted-foreground">
                      {error ? 'Failed to load data' : 'No sales data available'}
                    </td>
                  </tr>
                ) : (
                  filteredSales.map((sale) => (
                    <tr key={sale._id} className="border-b hover:bg-muted/50 transition-colors">
                      <td className="py-3 px-4 font-medium">{sale.invoiceNumber}</td>
                      <td className="py-3 px-4">{sale.partyName}</td>
                      <td className="py-3 px-4 text-sm text-muted-foreground">
                        {new Date(sale.invoiceDate).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4 text-right font-medium">
                        ₹{(sale.totalAmount || 0).toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-right text-green-600">
                        ₹{(sale.paidAmount || 0).toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-right text-orange-600">
                        ₹{((sale.totalAmount || 0) - (sale.paidAmount || 0)).toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <Badge className={getStatusColor(sale.status)}>
                          {sale.status}
                        </Badge>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1 || loading}
              >
                Previous
              </Button>
              <span className="py-2 px-4 text-sm">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages || loading}
              >
                Next
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
