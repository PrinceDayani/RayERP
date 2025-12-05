'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TrendingUp, DollarSign, ShoppingCart, Calendar, Download, Search } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const API_URL = process.env.NEXT_PUBLIC_API_URL || process.env.BACKEND_URL;

interface Sale {
  _id: string;
  invoiceNumber: string;
  partyName: string;
  totalAmount: number;
  paidAmount: number;
  status: string;
  invoiceDate: string;
  lineItems?: { description: string; quantity: number; unitPrice: number }[];
}

export default function SalesReportsPage() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateRange, setDateRange] = useState('all');

  useEffect(() => {
    fetchSales();
  }, [statusFilter, dateRange]);

  const fetchSales = async () => {
    try {
      const token = localStorage.getItem('auth-token');
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (dateRange !== 'all') {
        const now = new Date();
        if (dateRange === 'today') {
          params.append('startDate', now.toISOString().split('T')[0]);
        } else if (dateRange === 'week') {
          const weekAgo = new Date(now.setDate(now.getDate() - 7));
          params.append('startDate', weekAgo.toISOString().split('T')[0]);
        } else if (dateRange === 'month') {
          const monthAgo = new Date(now.setMonth(now.getMonth() - 1));
          params.append('startDate', monthAgo.toISOString().split('T')[0]);
        }
      }
      const res = await fetch(`${API_URL}/api/sales-reports/report?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      console.log('Sales data received:', data);
      setSales(data.data || []);
    } catch (error) {
      console.error('Error fetching sales:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredSales = sales.filter(sale => {
    const matchesSearch = sale.partyName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         sale.invoiceNumber?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || sale.status.toLowerCase() === statusFilter.toLowerCase();
    return matchesSearch && matchesStatus;
  });

  const totalRevenue = filteredSales.reduce((sum, sale) => sum + sale.totalAmount, 0);
  const totalPaid = filteredSales.reduce((sum, sale) => sum + sale.paidAmount, 0);
  const totalPending = totalRevenue - totalPaid;

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

  if (loading) return <div className="p-6">Loading sales data...</div>;

  return (
    <div className="min-h-screen bg-background p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Sales Reports</h1>
          <p className="text-muted-foreground mt-1">Track and analyze all sales transactions</p>
        </div>
        <Button className="bg-primary">
          <Download className="w-4 h-4 mr-2" />
          Export Report
        </Button>
      </div>

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
            <p className="text-xs text-muted-foreground mt-1">{((totalPaid/totalRevenue)*100).toFixed(1)}% collected</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pending Amount</CardTitle>
            <TrendingUp className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">₹{totalPending.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">{((totalPending/totalRevenue)*100).toFixed(1)}% pending</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Avg Sale Value</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{(totalRevenue/filteredSales.length || 0).toLocaleString(undefined, {maximumFractionDigits: 0})}</div>
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
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-32">
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
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
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
                      No sales data available
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
                        ₹{sale.totalAmount.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-right text-green-600">
                        ₹{sale.paidAmount.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-right text-orange-600">
                        ₹{(sale.totalAmount - sale.paidAmount).toLocaleString()}
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
        </CardContent>
      </Card>
    </div>
  );
}
