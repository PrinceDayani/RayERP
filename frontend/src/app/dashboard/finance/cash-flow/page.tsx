"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Coins, TrendingUp, TrendingDown, Download, Calendar, AlertCircle, Eye, Printer, RefreshCw, Loader2 } from "lucide-react";
import { reportingApi } from "@/lib/api/finance/reportingApi";
import { billsApi } from "@/lib/api/billsApi";
import { BarChart, Bar, LineChart, Line, ComposedChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { useToast } from "@/hooks/use-toast";
import { validateDateRange, formatCurrency, formatPercentage } from "@/lib/utils/validation";

const COLORS = ['#10b981', '#3b82f6', '#8b5cf6'];
const LOW_CASH_THRESHOLD = 10000;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

const CashFlowPage = () => {
  const { toast } = useToast();
  const [cashFlowData, setCashFlowData] = useState<any>(null);
  const [compareData, setCompareData] = useState<any>(null);
  const [forecastData, setForecastData] = useState<any[]>([]);
  const [multiPeriodData, setMultiPeriodData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [startDate, setStartDate] = useState(new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [compareMode, setCompareMode] = useState<'none' | 'yoy' | 'qoq'>('none');
  const [drilldownActivity, setDrilldownActivity] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [lastFetch, setLastFetch] = useState<number>(0);

  useEffect(() => {
    fetchCashFlowData();
  }, []);

  useEffect(() => {
    fetchHistoricalData();
  }, []);

  const setupKeyboardShortcuts = useCallback(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        if (e.key === 'p') { e.preventDefault(); window.print(); }
        if (e.key === 'e') { e.preventDefault(); handleExport('csv'); }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  useEffect(() => {
    const cleanup = setupKeyboardShortcuts();
    return cleanup;
  }, [setupKeyboardShortcuts]);

  useEffect(() => {
    if (compareMode !== 'none') fetchCompareData();
  }, [compareMode]);

  const fetchCashFlowData = async () => {
    const validation = validateDateRange(startDate, endDate);
    if (!validation.valid) {
      toast({ title: "Validation Error", description: validation.error, variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const response = await reportingApi.getCashFlow(startDate, endDate);
      if (response.success && response.data) {
        setCashFlowData(response.data);
        generateForecast(response.data);
      }
    } catch (error: any) {
      console.error('Error fetching cash flow:', error);
      toast({ title: "Error", description: error.message || "Failed to load data", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const fetchCompareData = async () => {
    if (compareMode === 'none') return;

    try {
      const start = new Date(startDate);
      const end = new Date(endDate);
      
      if (compareMode === 'yoy') {
        start.setFullYear(start.getFullYear() - 1);
        end.setFullYear(end.getFullYear() - 1);
      } else if (compareMode === 'qoq') {
        start.setMonth(start.getMonth() - 3);
        end.setMonth(end.getMonth() - 3);
      }
      
      const response = await reportingApi.getCashFlow(start.toISOString().split('T')[0], end.toISOString().split('T')[0]);
      if (response.success) {
        setCompareData(response.data);
      }
    } catch (error: any) {
      console.error('Compare data error:', error);
    }
  };

  const fetchHistoricalData = async () => {
    try {
      const response = await billsApi.getHistoricalCashFlow(6);
      if (response.success) {
        setMultiPeriodData(response.data);
      }
    } catch (error) {
      console.error('Historical data error:', error);
    }
  };

  const generateForecast = useCallback((data: any) => {
    if (!data) return;

    const avgOperating = data.operatingActivities?.net || 0;
    const avgInvesting = data.investingActivities?.net || 0;
    const avgFinancing = data.financingActivities?.net || 0;
    
    const forecast = [];
    let balance = data.closingBalance || 0;
    
    for (let i = 1; i <= 6; i++) {
      balance += avgOperating + avgInvesting + avgFinancing;
      forecast.push({
        month: `Month ${i}`,
        projected: Math.max(0, balance),
        operating: avgOperating,
        investing: avgInvesting,
        financing: avgFinancing
      });
    }
    
    setForecastData(forecast);
  }, []);

  const handleExport = useCallback(async (format: 'csv' | 'pdf') => {
    setExporting(true);
    try {
      const blob = await reportingApi.exportReport('cash-flow', format, startDate, endDate);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `cash-flow-${startDate}-${endDate}.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      toast({ title: "Success", description: `Report exported as ${format.toUpperCase()}` });
    } catch (error: any) {
      console.error('Export error:', error);
      toast({ title: "Error", description: "Failed to export report", variant: "destructive" });
    } finally {
      setExporting(false);
    }
  }, [startDate, endDate, toast]);

  const handleDrilldown = async (activity: string) => {
    setDrilldownActivity(activity);
    setTransactions([]);
    try {
      const response = await billsApi.getActivityTransactions(activity, startDate, endDate);
      if (response.success) {
        setTransactions(response.data.map((t: any) => ({
          date: new Date(t.date).toLocaleDateString('en-IN'),
          description: t.description || t.accountId?.name || 'Transaction',
          amount: t.debit - t.credit
        })));
      } else {
        toast({ title: "Info", description: "No transactions found" });
      }
    } catch (error: any) {
      console.error('Drill-down error:', error);
      toast({ title: "Error", description: "Failed to load transactions", variant: "destructive" });
    }
  };

  const waterfallData = useMemo(() => cashFlowData ? [
    { name: 'Opening', value: cashFlowData.openingBalance || 0, fill: '#3b82f6' },
    { name: 'Operating', value: cashFlowData.operatingActivities?.net || 0, fill: (cashFlowData.operatingActivities?.net || 0) > 0 ? '#10b981' : '#ef4444' },
    { name: 'Investing', value: cashFlowData.investingActivities?.net || 0, fill: (cashFlowData.investingActivities?.net || 0) > 0 ? '#10b981' : '#ef4444' },
    { name: 'Financing', value: cashFlowData.financingActivities?.net || 0, fill: (cashFlowData.financingActivities?.net || 0) > 0 ? '#10b981' : '#ef4444' },
    { name: 'Closing', value: cashFlowData.closingBalance || 0, fill: '#3b82f6' }
  ] : [], [cashFlowData]);

  const comparisonData = useMemo(() => cashFlowData && compareData ? [
    { activity: 'Operating', current: cashFlowData.operatingActivities?.net || 0, previous: compareData.operatingActivities?.net || 0 },
    { activity: 'Investing', current: cashFlowData.investingActivities?.net || 0, previous: compareData.investingActivities?.net || 0 },
    { activity: 'Financing', current: cashFlowData.financingActivities?.net || 0, previous: compareData.financingActivities?.net || 0 }
  ] : [], [cashFlowData, compareData]);

  const ratios = useMemo(() => cashFlowData ? {
    operatingCashRatio: ((cashFlowData.operatingActivities?.net || 0) / (cashFlowData.closingBalance || 1) * 100).toFixed(1),
    cashFlowMargin: ((cashFlowData.netCashFlow || 0) / (cashFlowData.operatingActivities?.inflows || 1) * 100).toFixed(1),
    cashCoverage: ((cashFlowData.operatingActivities?.net || 0) / (cashFlowData.operatingActivities?.outflows || 1)).toFixed(2)
  } : null, [cashFlowData]);

  const lowCashWarning = useMemo(() => cashFlowData && (cashFlowData.closingBalance || 0) < LOW_CASH_THRESHOLD, [cashFlowData]);

  return (
    <div className="flex-1 space-y-6 p-6" style={{ '@media print': { padding: 0 } } as any}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Coins className="h-8 w-8 text-orange-600" />
          <div>
            <h1 className="text-3xl font-bold">Cash Flow Statement</h1>
            <p className="text-muted-foreground">Track, analyze, and forecast cash movements</p>
          </div>
        </div>
        <div className="flex gap-2 no-print">
          <Select value={compareMode} onValueChange={(val: any) => setCompareMode(val)} disabled={loading}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Compare" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No Compare</SelectItem>
              <SelectItem value="yoy">YoY</SelectItem>
              <SelectItem value="qoq">QoQ</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-40" />
            <span>to</span>
            <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-40" />
          </div>
          <Button onClick={fetchCashFlowData} disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
            Refresh
          </Button>
          <Button variant="outline" onClick={() => handleExport('csv')} disabled={exporting || !cashFlowData}>
            <Download className="h-4 w-4 mr-2" />CSV
          </Button>
          <Button variant="outline" onClick={() => handleExport('pdf')} disabled={exporting || !cashFlowData}>
            <Download className="h-4 w-4 mr-2" />PDF
          </Button>
          <Button variant="outline" onClick={() => window.print()} disabled={!cashFlowData}>
            <Printer className="h-4 w-4 mr-2" />Print
          </Button>
        </div>
      </div>

      {lowCashWarning && (
        <Card className="border-red-200 bg-red-50 print-avoid-break">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <div>
                <p className="font-semibold text-red-800">Low Cash Warning</p>
                <p className="text-sm text-red-700">Cash balance is below recommended threshold</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {ratios && (
        <div className="grid grid-cols-3 gap-4 print-avoid-break">
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-gray-600">Operating Cash Ratio</p>
              <p className="text-2xl font-bold">{formatPercentage(Number(ratios.operatingCashRatio))}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-gray-600">Cash Flow Margin</p>
              <p className="text-2xl font-bold">{formatPercentage(Number(ratios.cashFlowMargin))}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-gray-600">Cash Coverage</p>
              <p className="text-2xl font-bold">{ratios.cashCoverage}x</p>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="statement" className="print-avoid-break">
        <TabsList className="no-print">
          <TabsTrigger value="statement">Statement</TabsTrigger>
          <TabsTrigger value="waterfall">Waterfall</TabsTrigger>
          <TabsTrigger value="comparison">Comparison</TabsTrigger>
          <TabsTrigger value="forecast">Forecast</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
        </TabsList>

        <TabsContent value="statement">
          {loading ? (
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-center gap-2">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>Loading cash flow data...</span>
                </div>
              </CardContent>
            </Card>
          ) : !cashFlowData ? (
            <Card>
              <CardContent className="p-6">
                <div className="text-center text-muted-foreground">No data available. Please select a date range and click Refresh.</div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Opening Balance</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{formatCurrency(cashFlowData.openingBalance || 0)}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Net Cash Flow</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className={`text-2xl font-bold flex items-center gap-2 ${cashFlowData.netCashFlow > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {cashFlowData.netCashFlow > 0 ? <TrendingUp className="h-6 w-6" /> : <TrendingDown className="h-6 w-6" />}
                      {formatCurrency(cashFlowData.netCashFlow || 0)}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Closing Balance</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-blue-600">{formatCurrency(cashFlowData.closingBalance || 0)}</div>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => handleDrilldown('operating')}>
                  <CardHeader>
                    <div className="flex justify-between items-center">
                      <CardTitle className="text-green-600">Operating Activities</CardTitle>
                      <Eye className="h-4 w-4 text-gray-400" />
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between">
                      <span>Cash Inflows</span>
                      <span className="font-medium text-green-600">+{formatCurrency(cashFlowData.operatingActivities?.inflows || 0)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Cash Outflows</span>
                      <span className="font-medium text-red-600">-{formatCurrency(cashFlowData.operatingActivities?.outflows || 0)}</span>
                    </div>
                    <hr />
                    <div className="flex justify-between font-bold">
                      <span>Net Operating</span>
                      <span className={cashFlowData.operatingActivities?.net > 0 ? 'text-green-600' : 'text-red-600'}>
                        {formatCurrency(cashFlowData.operatingActivities?.net || 0)}
                      </span>
                    </div>
                  </CardContent>
                </Card>

                <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => handleDrilldown('investing')}>
                  <CardHeader>
                    <div className="flex justify-between items-center">
                      <CardTitle className="text-blue-600">Investing Activities</CardTitle>
                      <Eye className="h-4 w-4 text-gray-400" />
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between">
                      <span>Cash Inflows</span>
                      <span className="font-medium text-green-600">+{formatCurrency(cashFlowData.investingActivities?.inflows || 0)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Cash Outflows</span>
                      <span className="font-medium text-red-600">-{formatCurrency(cashFlowData.investingActivities?.outflows || 0)}</span>
                    </div>
                    <hr />
                    <div className="flex justify-between font-bold">
                      <span>Net Investing</span>
                      <span className={cashFlowData.investingActivities?.net > 0 ? 'text-green-600' : 'text-red-600'}>
                        {formatCurrency(cashFlowData.investingActivities?.net || 0)}
                      </span>
                    </div>
                  </CardContent>
                </Card>

                <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => handleDrilldown('financing')}>
                  <CardHeader>
                    <div className="flex justify-between items-center">
                      <CardTitle className="text-purple-600">Financing Activities</CardTitle>
                      <Eye className="h-4 w-4 text-gray-400" />
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between">
                      <span>Cash Inflows</span>
                      <span className="font-medium text-green-600">+{formatCurrency(cashFlowData.financingActivities?.inflows || 0)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Cash Outflows</span>
                      <span className="font-medium text-red-600">-{formatCurrency(cashFlowData.financingActivities?.outflows || 0)}</span>
                    </div>
                    <hr />
                    <div className="flex justify-between font-bold">
                      <span>Net Financing</span>
                      <span className={cashFlowData.financingActivities?.net > 0 ? 'text-green-600' : 'text-red-600'}>
                        {formatCurrency(cashFlowData.financingActivities?.net || 0)}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="waterfall">
          <Card>
            <CardHeader>
              <CardTitle>Cash Flow Waterfall</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={waterfallData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip formatter={(value: any) => `₹${value.toLocaleString('en-IN')}`} />
                  <Bar dataKey="value">
                    {waterfallData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="comparison">
          <Card>
            <CardHeader>
              <CardTitle>Period Comparison</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={comparisonData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="activity" />
                  <YAxis />
                  <Tooltip formatter={(value: any) => `₹${value.toLocaleString('en-IN')}`} />
                  <Legend />
                  <Bar dataKey="current" fill="#3b82f6" name="Current Period" />
                  <Bar dataKey="previous" fill="#94a3b8" name="Previous Period" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="forecast">
          <Card>
            <CardHeader>
              <CardTitle>6-Month Cash Flow Forecast</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <ComposedChart data={forecastData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value: any) => `₹${value.toLocaleString('en-IN')}`} />
                  <Legend />
                  <Area type="monotone" dataKey="projected" fill="#3b82f6" stroke="#3b82f6" fillOpacity={0.3} name="Projected Balance" />
                  <Line type="monotone" dataKey="operating" stroke="#10b981" name="Operating" />
                  <Line type="monotone" dataKey="investing" stroke="#8b5cf6" name="Investing" />
                  <Line type="monotone" dataKey="financing" stroke="#f59e0b" name="Financing" />
                </ComposedChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trends">
          <Card>
            <CardHeader>
              <CardTitle>Activity Trends</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={multiPeriodData.length > 0 ? multiPeriodData : [
                  { month: 'Jan', operating: 5000, investing: -2000, financing: 1000 },
                  { month: 'Feb', operating: 6000, investing: -1500, financing: 800 },
                  { month: 'Mar', operating: 5500, investing: -2500, financing: 1200 }
                ]}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value: any) => `₹${value.toLocaleString('en-IN')}`} />
                  <Legend />
                  <Line type="monotone" dataKey="operating" stroke="#10b981" strokeWidth={2} name="Operating" />
                  <Line type="monotone" dataKey="investing" stroke="#3b82f6" strokeWidth={2} name="Investing" />
                  <Line type="monotone" dataKey="financing" stroke="#8b5cf6" strokeWidth={2} name="Financing" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={!!drilldownActivity} onOpenChange={() => setDrilldownActivity(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Transactions: {drilldownActivity} Activities</DialogTitle>
          </DialogHeader>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.map((txn, idx) => (
                <TableRow key={idx}>
                  <TableCell>{txn.date}</TableCell>
                  <TableCell>{txn.description}</TableCell>
                  <TableCell className="text-right">{formatCurrency(txn.amount)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </DialogContent>
      </Dialog>

      <div className="text-xs text-gray-500 no-print">
        <p>Shortcuts: Ctrl+P (Print), Ctrl+E (Export)</p>
      </div>
    </div>
  );
};

export default CashFlowPage;
