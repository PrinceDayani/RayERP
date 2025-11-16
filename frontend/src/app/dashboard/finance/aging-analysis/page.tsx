'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Clock, TrendingDown, AlertTriangle, Download, Filter, Calendar } from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import DataTable, { Column } from '@/components/DataTable';
import LoadingSpinner from '@/components/LoadingSpinner';

interface AgingRecord {
  id: string;
  customerName: string;
  invoiceNumber: string;
  amount: number;
  dueDate: string;
  daysOverdue: number;
  agingBucket: '0-30' | '31-60' | '61-90' | '90+';
  status: 'Current' | 'Overdue' | 'Critical';
  contactInfo: string;
}

export default function AgingAnalysisPage() {
  const [agingData, setAgingData] = useState<AgingRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState('receivables');
  const [stats, setStats] = useState({
    totalOutstanding: 0,
    current: 0,
    overdue30: 0,
    overdue60: 0,
    overdue90: 0,
    criticalAccounts: 0
  });

  useEffect(() => {
    fetchAgingData();
  }, [selectedType]);

  const fetchAgingData = async () => {
    setLoading(true);
    try {
      const { agingAnalysisAPI } = await import('@/lib/api/financeApi');
      const [dataResponse, summaryResponse] = await Promise.all([
        agingAnalysisAPI.getAgingData(selectedType as 'receivables' | 'payables'),
        agingAnalysisAPI.getAgingSummary(selectedType as 'receivables' | 'payables')
      ]);
      
      if (dataResponse.success) {
        setAgingData(dataResponse.data);
      }
      
      if (summaryResponse.success) {
        setStats(summaryResponse.data);
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Error fetching aging data:', error);
      // Fallback to mock data
      setAgingData([
        {
          id: '1',
          customerName: 'ABC Corp Ltd',
          invoiceNumber: 'INV-2023-001',
          amount: 50000,
          dueDate: '2023-12-15',
          daysOverdue: 45,
          agingBucket: '31-60',
          status: 'Overdue',
          contactInfo: 'finance@abccorp.com'
        },
        {
          id: '2',
          customerName: 'XYZ Industries',
          invoiceNumber: 'INV-2023-002',
          amount: 75000,
          dueDate: '2023-11-20',
          daysOverdue: 70,
          agingBucket: '61-90',
          status: 'Critical',
          contactInfo: 'accounts@xyzind.com'
        },
        {
          id: '3',
          customerName: 'Tech Solutions Inc',
          invoiceNumber: 'INV-2024-001',
          amount: 25000,
          dueDate: '2024-01-30',
          daysOverdue: 0,
          agingBucket: '0-30',
          status: 'Current',
          contactInfo: 'billing@techsol.com'
        }
      ]);
      setStats({
        totalOutstanding: 150000,
        current: 25000,
        overdue30: 50000,
        overdue60: 75000,
        overdue90: 0,
        criticalAccounts: 1
      });
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Current': return 'bg-green-100 text-green-700';
      case 'Overdue': return 'bg-yellow-100 text-yellow-700';
      case 'Critical': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getBucketColor = (bucket: string) => {
    switch (bucket) {
      case '0-30': return 'bg-blue-100 text-blue-700';
      case '31-60': return 'bg-yellow-100 text-yellow-700';
      case '61-90': return 'bg-orange-100 text-orange-700';
      case '90+': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const columns: Column<AgingRecord>[] = [
    {
      key: 'customerName',
      header: 'Customer',
      sortable: true
    },
    {
      key: 'invoiceNumber',
      header: 'Invoice #',
      sortable: true
    },
    {
      key: 'amount',
      header: 'Amount',
      render: (value) => `₹${value.toLocaleString()}`,
      sortable: true
    },
    {
      key: 'dueDate',
      header: 'Due Date',
      render: (value) => new Date(value).toLocaleDateString(),
      sortable: true
    },
    {
      key: 'daysOverdue',
      header: 'Days Overdue',
      render: (value) => value > 0 ? `${value} days` : 'Current',
      sortable: true
    },
    {
      key: 'agingBucket',
      header: 'Aging Bucket',
      render: (value) => (
        <Badge className={getBucketColor(value)} variant="secondary">
          {value} days
        </Badge>
      )
    },
    {
      key: 'status',
      header: 'Status',
      render: (value) => (
        <Badge className={getStatusColor(value)} variant="secondary">
          {value}
        </Badge>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Aging Analysis"
        description="Track receivables and payables aging for better cash flow management"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Finance', href: '/dashboard/finance' },
          { label: 'Aging Analysis' }
        ]}
        actions={
          <div className="flex gap-2">
            <Select value={selectedType} onValueChange={setSelectedType}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="receivables">Receivables</SelectItem>
                <SelectItem value="payables">Payables</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>
        }
      />

      {/* Aging Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-sm font-medium text-muted-foreground">Total Outstanding</p>
              <p className="text-xl font-bold">₹{stats.totalOutstanding.toLocaleString()}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-sm font-medium text-muted-foreground">Current (0-30)</p>
              <p className="text-xl font-bold text-green-600">₹{stats.current.toLocaleString()}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-sm font-medium text-muted-foreground">31-60 Days</p>
              <p className="text-xl font-bold text-yellow-600">₹{stats.overdue30.toLocaleString()}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-sm font-medium text-muted-foreground">61-90 Days</p>
              <p className="text-xl font-bold text-orange-600">₹{stats.overdue60.toLocaleString()}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-sm font-medium text-muted-foreground">90+ Days</p>
              <p className="text-xl font-bold text-red-600">₹{stats.overdue90.toLocaleString()}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-sm font-medium text-muted-foreground">Critical Accounts</p>
              <p className="text-xl font-bold text-red-600">{stats.criticalAccounts}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Aging Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Aging Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 bg-green-500 rounded"></div>
                <span className="font-medium">0-30 Days (Current)</span>
              </div>
              <div className="text-right">
                <div className="font-bold">₹{stats.current.toLocaleString()}</div>
                <div className="text-sm text-muted-foreground">
                  {((stats.current / stats.totalOutstanding) * 100).toFixed(1)}%
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 bg-yellow-500 rounded"></div>
                <span className="font-medium">31-60 Days</span>
              </div>
              <div className="text-right">
                <div className="font-bold">₹{stats.overdue30.toLocaleString()}</div>
                <div className="text-sm text-muted-foreground">
                  {((stats.overdue30 / stats.totalOutstanding) * 100).toFixed(1)}%
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-orange-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 bg-orange-500 rounded"></div>
                <span className="font-medium">61-90 Days</span>
              </div>
              <div className="text-right">
                <div className="font-bold">₹{stats.overdue60.toLocaleString()}</div>
                <div className="text-sm text-muted-foreground">
                  {((stats.overdue60 / stats.totalOutstanding) * 100).toFixed(1)}%
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 bg-red-500 rounded"></div>
                <span className="font-medium">90+ Days</span>
              </div>
              <div className="text-right">
                <div className="font-bold">₹{stats.overdue90.toLocaleString()}</div>
                <div className="text-sm text-muted-foreground">
                  {((stats.overdue90 / stats.totalOutstanding) * 100).toFixed(1)}%
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Aging Table */}
      <Tabs defaultValue="detailed" className="space-y-6">
        <TabsList>
          <TabsTrigger value="detailed">Detailed View</TabsTrigger>
          <TabsTrigger value="summary">Summary Report</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
        </TabsList>

        <TabsContent value="detailed">
          {loading ? (
            <LoadingSpinner size="lg" text="Loading aging data..." />
          ) : (
            <DataTable
              data={agingData}
              columns={columns}
              title={`${selectedType === 'receivables' ? 'Accounts Receivable' : 'Accounts Payable'} Aging`}
              searchable
              exportable
              onExport={() => console.log('Export aging data')}
            />
          )}
        </TabsContent>

        <TabsContent value="summary">
          <Card>
            <CardHeader>
              <CardTitle>Aging Summary Report</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold mb-4">Key Metrics</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span>Average Days Outstanding:</span>
                      <span className="font-medium">42 days</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Collection Efficiency:</span>
                      <span className="font-medium text-green-600">78%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Bad Debt Risk:</span>
                      <span className="font-medium text-red-600">₹75,000</span>
                    </div>
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold mb-4">Action Items</h3>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 p-2 bg-yellow-50 rounded">
                      <AlertTriangle className="w-4 h-4 text-yellow-600" />
                      <span className="text-sm">Follow up with XYZ Industries (70 days overdue)</span>
                    </div>
                    <div className="flex items-center gap-2 p-2 bg-blue-50 rounded">
                      <Clock className="w-4 h-4 text-blue-600" />
                      <span className="text-sm">Send reminder to ABC Corp Ltd (45 days overdue)</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trends">
          <Card>
            <CardHeader>
              <CardTitle>Aging Trends</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <TrendingDown className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Trend Analysis</h3>
                <p className="text-muted-foreground">
                  Historical aging trends and forecasting will be displayed here.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}