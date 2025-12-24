'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TrendingUp, Banknote, ShoppingCart, Calendar, Download, Search, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { apiClient } from '@/lib/api';
import { useDebounce } from '@/hooks/useDebounce';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

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
  const [selectedAccount, setSelectedAccount] = useState<string>('all');
  const [accounts, setAccounts] = useState<any[]>([]);

  const debouncedSearch = useDebounce(searchTerm, 500);

  useEffect(() => {
    fetchSales();
    fetchAccounts();
  }, [statusFilter, dateRange, page, selectedAccount]);

  const fetchAccounts = async () => {
    try {
      const response = await apiClient.get('/general-ledger/accounts?type=revenue');
      setAccounts(response.data.accounts || []);
    } catch (error) {
      console.error('Failed to load accounts:', error);
    }
  };

  const fetchSales = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (selectedAccount !== 'all') params.append('accountId', selectedAccount);
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

      // If account is selected, get ledger transactions instead of invoices
      const endpoint = selectedAccount !== 'all' 
        ? `/general-ledger/accounts/${selectedAccount}/ledger?${params}`
        : `/sales-reports/report?${params}`;
      
      const response = await apiClient.get(endpoint);
      console.log('API Response:', response.data);
      
      if (selectedAccount !== 'all') {
        // Transform ledger entries to sales format
        const ledgerEntries = response.data.entries || [];
        const transformedSales = ledgerEntries.map((entry: any) => ({
          _id: entry._id,
          invoiceNumber: entry.reference || entry.journalEntryId?.entryNumber || 'N/A',
          partyName: entry.description || 'Direct Transaction',
          totalAmount: entry.credit || 0, // Revenue accounts increase with credits
          paidAmount: entry.credit || 0,
          status: 'paid',
          invoiceDate: entry.date
        }));
        setSales(transformedSales);
        setTotalPages(response.data.pagination?.pages || 1);
      } else {
        setSales(Array.isArray(response.data.data) ? response.data.data : []);
        setTotalPages(response.data.pagination?.pages || 1);
      }
    } catch (err) {
      console.error('Fetch error:', err);
      const message = err instanceof Error ? err.message : 'Failed to load sales data';
      setError(message);
      setSales([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredSales = Array.isArray(sales) ? sales.filter(sale => {
    if (!debouncedSearch) return true;
    const search = debouncedSearch.toLowerCase();
    return sale.partyName?.toLowerCase().includes(search) ||
           sale.invoiceNumber?.toLowerCase().includes(search);
  }) : [];

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

  const chartData = useMemo(() => {
    if (!Array.isArray(sales)) return [];
    const grouped = sales.reduce((acc, sale) => {
      const date = new Date(sale.invoiceDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      const existing = acc.find(d => d.date === date);
      if (existing) existing.amount += sale.totalAmount;
      else acc.push({ date, amount: sale.totalAmount });
      return acc;
    }, [] as { date: string; amount: number }[]);
    return grouped.slice(-10);
  }, [sales]);

  const statusData = useMemo(() => {
    if (!Array.isArray(sales)) return [];
    const counts = sales.reduce((acc, sale) => {
      acc[sale.status] = (acc[sale.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [sales]);

  const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'];

  if (loading && sales.length === 0) {
    return (
      <div className="min-h-screen bg-background p-6 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Sales Reports</h1>
            <p className="text-muted-foreground mt-1">Loading...</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-24 bg-muted animate-pulse rounded-lg" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-80 bg-muted animate-pulse rounded-lg" />
          <div className="h-80 bg-muted animate-pulse rounded-lg" />
        </div>
        <div className="h-96 bg-muted animate-pulse rounded-lg" />
      </div>
    );
  }

  console.log('Sales state:', sales, 'Length:', sales.length);

  return (
    <div className="min-h-screen bg-background p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Sales Reports</h1>
          <p className="text-muted-foreground mt-1">Track and analyze all sales transactions</p>
        </div>
        <Button onClick={() => {
          const csv = [
            ['Invoice #', 'Customer', 'Date', 'Total', 'Paid', 'Balance', 'Status'],
            ...filteredSales.map(s => [
              s.invoiceNumber, s.partyName, new Date(s.invoiceDate).toLocaleDateString(),
              s.totalAmount, s.paidAmount, s.totalAmount - s.paidAmount, s.status
            ])
          ].map(r => r.join(',')).join('\n');
          const blob = new Blob([csv], { type: 'text/csv' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `sales-${new Date().toISOString().split('T')[0]}.csv`;
          a.click();
          URL.revokeObjectURL(url);
        }} className="bg-primary" aria-label="Export sales report">
          <Download className="w-4 h-4 mr-2" />
          Export Report
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-4 mb-6">
        <div className="flex items-center gap-2">
          <Search className="w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search transactions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-64"
          />
        </div>
        <Select value={selectedAccount} onValueChange={setSelectedAccount}>
          <SelectTrigger className="w-64">
            <SelectValue placeholder="Select Revenue Account" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Sales (Invoice-based)</SelectItem>
            {accounts.map((account) => (
              <SelectItem key={account._id} value={account._id}>
                {account.code} - {account.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="paid">Paid</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="overdue">Overdue</SelectItem>
          </SelectContent>
        </Select>
        <Select value={dateRange} onValueChange={setDateRange}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Date range" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Time</SelectItem>
            <SelectItem value="today">Today</SelectItem>
            <SelectItem value="week">This Week</SelectItem>
            <SelectItem value="month">This Month</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
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
            <Banknote className="h-4 w-4 text-green-600" />
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

      {sales.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Sales Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip formatter={(value) => `₹${Number(value).toLocaleString()}`} />
                  <Bar dataKey="amount" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Status Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}



      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>
              {selectedAccount !== 'all' ? 'Account Transactions' : 'Sales Transactions'}
              <Badge variant="secondary" className="ml-2">{filteredSales.length}</Badge>
            </span>
            {selectedAccount !== 'all' && accounts.find(a => a._id === selectedAccount) && (
              <div className="text-sm text-muted-foreground">
                Account: {accounts.find(a => a._id === selectedAccount)?.code} - {accounts.find(a => a._id === selectedAccount)?.name}
              </div>
            )}
          </CardTitle>
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
