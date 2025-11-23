'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Download, TrendingUp, TrendingDown, RefreshCw, BarChart3, LineChart, PieChart, Filter } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL  || process.env.BACKEND_URL;

export default function EnhancedReportsPage() {
  const [reportType, setReportType] = useState('profit-loss');
  const [chartType, setChartType] = useState('bar');
  const [startDate, setStartDate] = useState('2024-01-01');
  const [endDate, setEndDate] = useState('2024-12-31');
  const [reportData, setReportData] = useState<any>(null);
  const [variance, setVariance] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (startDate && endDate) {
      generateReport();
    }
  }, [reportType, startDate, endDate]);

  const generateReport = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('auth-token');
      const [reportRes, varianceRes] = await Promise.all([
        fetch(`${API_URL}/api/financial-reports-enhanced/profit-loss-budget?startDate=${startDate}&endDate=${endDate}`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch(`${API_URL}/api/financial-reports-enhanced/variance-analysis?startDate=${startDate}&endDate=${endDate}&compareWith=2023-01-01`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      const [reportData, varianceData] = await Promise.all([
        reportRes.json(),
        varianceRes.json()
      ]);

      if (reportData.success) setReportData(reportData.data);
      if (varianceData.success) setVariance(varianceData.data);
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to generate report', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const exportReport = async (format: string) => {
    try {
      const token = localStorage.getItem('auth-token');
      const res = await fetch(
        `${API_URL}/api/financial-reports-enhanced/export?reportType=${reportType}&format=${format}&startDate=${startDate}&endDate=${endDate}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await res.json();
      if (data.success) {
        toast({ title: 'Success', description: `Report exported as ${format.toUpperCase()}` });
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to export', variant: 'destructive' });
    }
  };

  const scheduleEmail = async () => {
    try {
      const token = localStorage.getItem('auth-token');
      const res = await fetch(`${API_URL}/api/financial-reports-enhanced/schedule-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          reportType,
          frequency: 'monthly',
          recipients: ['finance@company.com'],
          format: 'pdf'
        })
      });
      const data = await res.json();
      if (data.success) {
        toast({ title: 'Success', description: 'Email scheduled successfully' });
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to schedule email', variant: 'destructive' });
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Enhanced Financial Reports</h1>
          <p className="text-gray-600 mt-1">Comprehensive financial analysis and reporting</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => exportReport('pdf')} variant="outline">
            <Download className="w-4 h-4 mr-2" />PDF
          </Button>
          <Button onClick={() => exportReport('excel')} variant="outline">
            <Download className="w-4 h-4 mr-2" />Excel
          </Button>
          <Button onClick={scheduleEmail} variant="outline">
            Schedule Email
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Report Configuration</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label>Report Type</Label>
              <Select value={reportType} onValueChange={setReportType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="profit-loss">Profit & Loss</SelectItem>
                  <SelectItem value="balance-sheet">Balance Sheet</SelectItem>
                  <SelectItem value="cash-flow">Cash Flow</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Start Date</Label>
              <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </div>
            <div>
              <Label>End Date</Label>
              <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </div>
            <div className="flex items-end">
              <Button onClick={generateReport} className="w-full" disabled={loading}>
                {loading ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <BarChart3 className="w-4 h-4 mr-2" />}
                Generate
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {variance && (
        <Card>
          <CardHeader>
            <CardTitle>Variance Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Current Period</p>
                <p className="text-2xl font-bold text-blue-600">₹{variance.current?.toLocaleString()}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Previous Period</p>
                <p className="text-2xl font-bold text-gray-600">₹{variance.previous?.toLocaleString()}</p>
              </div>
              <div className={`p-4 rounded-lg ${variance.color === 'green' ? 'bg-green-50' : 'bg-red-50'}`}>
                <p className="text-sm text-gray-600 mb-1">Variance</p>
                <p className={`text-2xl font-bold flex items-center ${variance.color === 'green' ? 'text-green-600' : 'text-red-600'}`}>
                  {variance.trend === 'up' ? <TrendingUp className="w-6 h-6 mr-2" /> : <TrendingDown className="w-6 h-6 mr-2" />}
                  ₹{Math.abs(variance.variance)?.toLocaleString()}
                </p>
              </div>
              <div className={`p-4 rounded-lg ${variance.color === 'green' ? 'bg-green-50' : 'bg-red-50'}`}>
                <p className="text-sm text-gray-600 mb-1">Variance %</p>
                <p className={`text-2xl font-bold ${variance.color === 'green' ? 'text-green-600' : 'text-red-600'}`}>
                  {variance.variancePercent}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {reportData && (
        <Card>
          <CardHeader>
            <CardTitle>Profit & Loss Statement</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="summary">
              <TabsList>
                <TabsTrigger value="summary">Summary</TabsTrigger>
                <TabsTrigger value="detailed">Detailed</TabsTrigger>
                <TabsTrigger value="budget">Budget vs Actual</TabsTrigger>
              </TabsList>

              <TabsContent value="summary" className="mt-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-600">Revenue</p>
                          <p className="text-2xl font-bold text-green-600">
                            ₹{reportData.revenue?.actual?.toLocaleString() || 0}
                          </p>
                        </div>
                        <TrendingUp className="w-8 h-8 text-green-600" />
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-600">Expenses</p>
                          <p className="text-2xl font-bold text-red-600">
                            ₹{reportData.expenses?.actual?.toLocaleString() || 0}
                          </p>
                        </div>
                        <TrendingDown className="w-8 h-8 text-red-600" />
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-600">Net Income</p>
                          <p className={`text-2xl font-bold ${reportData.netIncome?.actual >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            ₹{reportData.netIncome?.actual?.toLocaleString() || 0}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="detailed" className="mt-4">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold mb-2 text-green-600">REVENUE</h3>
                    <div className="bg-green-50 p-4 rounded-lg">
                      <div className="flex justify-between items-center">
                        <span>Total Revenue</span>
                        <span className="font-bold">₹{reportData.revenue?.actual?.toLocaleString() || 0}</span>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold mb-2 text-red-600">EXPENSES</h3>
                    <div className="bg-red-50 p-4 rounded-lg">
                      <div className="flex justify-between items-center">
                        <span>Total Expenses</span>
                        <span className="font-bold">₹{reportData.expenses?.actual?.toLocaleString() || 0}</span>
                      </div>
                    </div>
                  </div>
                  <div className="border-t-2 border-gray-300 pt-4">
                    <div className="flex justify-between items-center text-lg font-bold">
                      <span>NET INCOME</span>
                      <span className={reportData.netIncome?.actual >= 0 ? 'text-green-600' : 'text-red-600'}>
                        ₹{reportData.netIncome?.actual?.toLocaleString() || 0}
                      </span>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="budget" className="mt-4">
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-4 text-sm font-semibold text-gray-600 mb-2">
                    <div>Category</div>
                    <div className="text-right">Budget</div>
                    <div className="text-right">Actual</div>
                  </div>
                  <div className="space-y-2">
                    <div className="grid grid-cols-3 gap-4 p-3 bg-green-50 rounded">
                      <div>Revenue</div>
                      <div className="text-right">₹{reportData.revenue?.budget?.toLocaleString() || 0}</div>
                      <div className="text-right font-bold">₹{reportData.revenue?.actual?.toLocaleString() || 0}</div>
                    </div>
                    <div className="grid grid-cols-3 gap-4 p-3 bg-red-50 rounded">
                      <div>Expenses</div>
                      <div className="text-right">₹{reportData.expenses?.budget?.toLocaleString() || 0}</div>
                      <div className="text-right font-bold">₹{reportData.expenses?.actual?.toLocaleString() || 0}</div>
                    </div>
                    <div className="grid grid-cols-3 gap-4 p-3 bg-blue-50 rounded border-t-2 border-blue-300">
                      <div className="font-bold">Net Income</div>
                      <div className="text-right font-bold">₹{reportData.netIncome?.budget?.toLocaleString() || 0}</div>
                      <div className="text-right font-bold">₹{reportData.netIncome?.actual?.toLocaleString() || 0}</div>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}

      {!reportData && !loading && (
        <Card>
          <CardContent className="p-12 text-center text-gray-500">
            <BarChart3 className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <p className="text-lg">Select dates and click Generate to view reports</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
