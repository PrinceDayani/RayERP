'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calculator, FileText, TrendingUp, AlertCircle, Download, Plus } from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import DataTable, { Column } from '@/components/DataTable';
import LoadingSpinner from '@/components/LoadingSpinner';

interface TaxRecord {
  id: string;
  type: 'GST' | 'VAT' | 'TDS' | 'Income Tax' | 'Sales Tax';
  amount: number;
  rate: number;
  status: 'Pending' | 'Filed' | 'Paid' | 'Overdue';
  dueDate: string;
  period: string;
  description: string;
}

export default function TaxManagementPage() {
  const [taxRecords, setTaxRecords] = useState<TaxRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalTax: 0,
    pendingReturns: 0,
    overduePayments: 0,
    complianceScore: 95
  });

  useEffect(() => {
    fetchTaxData();
  }, []);

  const fetchTaxData = async () => {
    try {
      const { taxManagementAPI } = await import('@/lib/api/financeApi');
      const [recordsResponse, statsResponse] = await Promise.all([
        taxManagementAPI.getTaxRecords(),
        taxManagementAPI.getTaxStats()
      ]);
      
      if (recordsResponse.success) {
        setTaxRecords(recordsResponse.data);
      }
      
      if (statsResponse.success) {
        setStats(statsResponse.data);
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Error fetching tax data:', error);
      // Fallback to mock data
      setTaxRecords([
        {
          id: '1',
          type: 'GST',
          amount: 25000,
          rate: 18,
          status: 'Filed',
          dueDate: '2024-01-20',
          period: 'Dec 2023',
          description: 'Monthly GST Return'
        },
        {
          id: '2',
          type: 'TDS',
          amount: 15000,
          rate: 10,
          status: 'Pending',
          dueDate: '2024-01-15',
          period: 'Q3 2023',
          description: 'TDS on Salary'
        }
      ]);
      setStats({
        totalTax: 90000,
        pendingReturns: 2,
        overduePayments: 1,
        complianceScore: 85
      });
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Filed': return 'bg-green-100 text-green-700';
      case 'Paid': return 'bg-blue-100 text-blue-700';
      case 'Pending': return 'bg-yellow-100 text-yellow-700';
      case 'Overdue': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const columns: Column<TaxRecord>[] = [
    {
      key: 'type',
      header: 'Tax Type',
      render: (value) => (
        <Badge variant="outline">{value}</Badge>
      )
    },
    {
      key: 'period',
      header: 'Period'
    },
    {
      key: 'amount',
      header: 'Amount',
      render: (value) => `₹${value.toLocaleString()}`
    },
    {
      key: 'rate',
      header: 'Rate',
      render: (value) => `${value}%`
    },
    {
      key: 'status',
      header: 'Status',
      render: (value) => (
        <Badge className={getStatusColor(value)} variant="secondary">
          {value}
        </Badge>
      )
    },
    {
      key: 'dueDate',
      header: 'Due Date',
      render: (value) => new Date(value).toLocaleDateString()
    }
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tax Management"
        description="Manage GST, VAT, TDS, and other tax obligations"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Finance', href: '/dashboard/finance' },
          { label: 'Tax Management' }
        ]}
        actions={
          <div className="flex gap-2">
            <Button variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              New Tax Entry
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Tax Liability</p>
                <p className="text-2xl font-bold">₹{stats.totalTax.toLocaleString()}</p>
              </div>
              <Calculator className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Pending Returns</p>
                <p className="text-2xl font-bold">{stats.pendingReturns}</p>
              </div>
              <FileText className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Overdue Payments</p>
                <p className="text-2xl font-bold">{stats.overduePayments}</p>
              </div>
              <AlertCircle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Compliance Score</p>
                <p className="text-2xl font-bold">{stats.complianceScore}%</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="gst">GST</TabsTrigger>
          <TabsTrigger value="tds">TDS</TabsTrigger>
          <TabsTrigger value="income-tax">Income Tax</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          {loading ? (
            <LoadingSpinner size="lg" text="Loading tax data..." />
          ) : (
            <DataTable
              data={taxRecords}
              columns={columns}
              title="Tax Records"
              searchable
              exportable
              onExport={() => console.log('Export tax records')}
            />
          )}
        </TabsContent>

        <TabsContent value="gst">
          <Card>
            <CardHeader>
              <CardTitle>GST Management</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                  <CardContent className="p-4">
                    <h3 className="font-semibold mb-2">GSTR-1</h3>
                    <p className="text-sm text-muted-foreground mb-2">Outward supplies</p>
                    <Badge className="bg-green-100 text-green-700">Filed</Badge>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <h3 className="font-semibold mb-2">GSTR-3B</h3>
                    <p className="text-sm text-muted-foreground mb-2">Monthly return</p>
                    <Badge className="bg-yellow-100 text-yellow-700">Pending</Badge>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <h3 className="font-semibold mb-2">GSTR-9</h3>
                    <p className="text-sm text-muted-foreground mb-2">Annual return</p>
                    <Badge className="bg-blue-100 text-blue-700">Due Soon</Badge>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tds">
          <Card>
            <CardHeader>
              <CardTitle>TDS Management</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">TDS Rate</label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select TDS rate" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="10">10% - Salary</SelectItem>
                        <SelectItem value="2">2% - Contractor</SelectItem>
                        <SelectItem value="1">1% - Rent</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Amount</label>
                    <Input placeholder="Enter amount" />
                  </div>
                </div>
                <Button>Calculate TDS</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="income-tax">
          <Card>
            <CardHeader>
              <CardTitle>Income Tax Planning</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold mb-4">Tax Slabs (FY 2023-24)</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between p-2 bg-muted rounded">
                      <span>₹0 - ₹2.5L</span>
                      <span>0%</span>
                    </div>
                    <div className="flex justify-between p-2 bg-muted rounded">
                      <span>₹2.5L - ₹5L</span>
                      <span>5%</span>
                    </div>
                    <div className="flex justify-between p-2 bg-muted rounded">
                      <span>₹5L - ₹10L</span>
                      <span>20%</span>
                    </div>
                    <div className="flex justify-between p-2 bg-muted rounded">
                      <span>Above ₹10L</span>
                      <span>30%</span>
                    </div>
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold mb-4">Tax Calculator</h3>
                  <div className="space-y-4">
                    <Input placeholder="Annual Income" />
                    <Input placeholder="Deductions (80C, 80D, etc.)" />
                    <Button className="w-full">Calculate Tax</Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
