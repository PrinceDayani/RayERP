"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Coins, TrendingUp, TrendingDown, Download, Calendar, BarChart3, AlertCircle, Eye, Printer } from "lucide-react";
import { reportingApi } from "@/lib/api/finance/reportingApi";
import { billsApi } from "@/lib/api/billsApi";
import { BarChart, Bar, LineChart, Line, ComposedChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';

const COLORS = ['#10b981', '#3b82f6', '#8b5cf6'];

const CashFlowPage = () => {
  const [cashFlowData, setCashFlowData] = useState<any>(null);
  const [compareData, setCompareData] = useState<any>(null);
  const [forecastData, setForecastData] = useState<any[]>([]);
  const [multiPeriodData, setMultiPeriodData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [startDate, setStartDate] = useState(new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [compareMode, setCompareMode] = useState<'none' | 'yoy' | 'qoq'>('none');
  const [drilldownActivity, setDrilldownActivity] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);

  useEffect(() => {
    fetchCashFlowData();
    fetchHistoricalData();
    setupKeyboardShortcuts();
  }, []);

  const setupKeyboardShortcuts = () => {
    const handler = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        if (e.key === 'p') { e.preventDefault(); window.print(); }
        if (e.key === 'e') { e.preventDefault(); handleExport('csv'); }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  };

  const fetchCashFlowData = async () => {
    setLoading(true);
    try {
      const response = await reportingApi.getCashFlow(startDate, endDate);
      if (response.success) {
        setCashFlowData(response.data);
        generateForecast(response.data);
        if (compareMode !== 'none') fetchCompareData();
      }
    } catch (error) {
      console.error('Error fetching cash flow:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCompareData = async () => {
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
    if (response.success) setCompareData(response.data);
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

  const generateForecast = (data: any) => {
    const avgOperating = data.operatingActivities?.net || 0;
    const avgInvesting = data.investingActivities?.net || 0;
    const avgFinancing = data.financingActivities?.net || 0;
    
    const forecast = [];
    let balance = data.closingBalance || 0;
    
    for (let i = 1; i <= 6; i++) {
      balance += avgOperating + avgInvesting + avgFinancing;
      forecast.push({
        month: `Month ${i}`,
        projected: balance,
        operating: avgOperating,
        investing: avgInvesting,
        financing: avgFinancing
      });
    }
    
    setForecastData(forecast);
  };

  const handleExport = async (format: 'csv' | 'pdf') => {
    try {
      const blob = await reportingApi.exportReport('cash-flow', format, startDate, endDate);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `cash-flow-${startDate}-${endDate}.${format}`;
      a.click();
    } catch (error) {
      console.error('Export error:', error);
    }
  };

  const handleDrilldown = async (activity: string) => {
    setDrilldownActivity(activity);
    try {
      const response = await billsApi.getActivityTransactions(activity, startDate, endDate);
      if (response.success) {
        setTransactions(response.data.map((t: any) => ({
          date: new Date(t.date).toLocaleDateString('en-IN'),
          description: t.description || t.accountId?.name || 'Transaction',
          amount: t.debit - t.credit
        })));
      }
    } catch (error) {
      console.error('Drill-down error:', error);
    }
  };

  const waterfallData = cashFlowData ? [
    { name: 'Opening', value: cashFlowData.openingBalance, fill: '#3b82f6' },
    { name: 'Operating', value: cashFlowData.operatingActivities?.net, fill: cashFlowData.operatingActivities?.net > 0 ? '#10b981' : '#ef4444' },
    { name: 'Investing', value: cashFlowData.investingActivities?.net, fill: cashFlowData.investingActivities?.net > 0 ? '#10b981' : '#ef4444' },
    { name: 'Financing', value: cashFlowData.financingActivities?.net, fill: cashFlowData.financingActivities?.net > 0 ? '#10b981' : '#ef4444' },
    { name: 'Closing', value: cashFlowData.closingBalance, fill: '#3b82f6' }
  ] : [];

  const comparisonData = cashFlowData && compareData ? [
    { activity: 'Operating', current: cashFlowData.operatingActivities?.net, previous: compareData.operatingActivities?.net },
    { activity: 'Investing', current: cashFlowData.investingActivities?.net, previous: compareData.investingActivities?.net },
    { activity: 'Financing', current: cashFlowData.financingActivities?.net, previous: compareData.financingActivities?.net }
  ] : [];

  const ratios = cashFlowData ? {
    operatingCashRatio: (cashFlowData.operatingActivities?.net / cashFlowData.closingBalance * 100).toFixed(1),
    cashFlowMargin: (cashFlowData.netCashFlow / (cashFlowData.operatingActivities?.inflows || 1) * 100).toFixed(1),
    cashCoverage: (cashFlowData.operatingActivities?.net / (cashFlowData.operatingActivities?.outflows || 1)).toFixed(2)
  } : null;

  const lowCashWarning = cashFlowData && cashFlowData.closingBalance < 10000;

  return (
    <div className="flex-1 space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Coins className="h-8 w-8 text-orange-600" />
          <div>
            <h1 className="text-3xl font-bold">Cash Flow Statement</h1>
            <p className="text-muted-foreground">Track, analyze, and forecast cash movements</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Select value={compareMode} onValueChange={(val: any) => { setCompareMode(val); fetchCompareData(); }}>
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
          <Button onClick={fetchCashFlowData}>Refresh</Button>
          <Button variant="outline" onClick={() => handleExport('csv')}><Download className="h-4 w-4 mr-2" />CSV</Button>
          <Button variant="outline" onClick={() => handleExport('pdf')}><Download className="h-4 w-4 mr-2" />PDF</Button>
          <Button variant="outline" onClick={() => window.print()}><Printer className="h-4 w-4 mr-2" />Print</Button>
        </div>
      </div>

      {lowCashWarning && (
        <Card className="border-red-200 bg-red-50">
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
        <div className="grid grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-gray-600">Operating Cash Ratio</p>
              <p className="text-2xl font-bold">{ratios.operatingCashRatio}%</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-gray-600">Cash Flow Margin</p>
              <p className="text-2xl font-bold">{ratios.cashFlowMargin}%</p>
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

      <Tabs defaultValue="statement">
        <TabsList>
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
                <div className="text-center">Loading cash flow data...</div>
              </CardContent>
            </Card>
          ) : cashFlowData ? (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Opening Balance</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">₹{cashFlowData.openingBalance?.toLocaleString('en-IN')}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Net Cash Flow</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className={`text-2xl font-bold flex items-center gap-2 ${cashFlowData.netCashFlow > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {cashFlowData.netCashFlow > 0 ? <TrendingUp className="h-6 w-6" /> : <TrendingDown className="h-6 w-6" />}
                      ₹{cashFlowData.netCashFlow?.toLocaleString('en-IN')}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Closing Balance</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-blue-600">₹{cashFlowData.closingBalance?.toLocaleString('en-IN')}</div>
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
                      <span className="font-medium text-green-600">+₹{cashFlowData.operatingActivities?.inflows?.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Cash Outflows</span>
                      <span className="font-medium text-red-600">-₹{cashFlowData.operatingActivities?.outflows?.toLocaleString('en-IN')}</span>
                    </div>
                    <hr />
                    <div className="flex justify-between font-bold">
                      <span>Net Operating</span>
                      <span className={cashFlowData.operatingActivities?.net > 0 ? 'text-green-600' : 'text-red-600'}>
                        ₹{cashFlowData.operatingActivities?.net?.toLocaleString('en-IN')}
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
                      <span className="font-medium text-green-600">+₹{cashFlowData.investingActivities?.inflows?.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Cash Outflows</span>
                      <span className="font-medium text-red-600">-₹{cashFlowData.investingActivities?.outflows?.toLocaleString('en-IN')}</span>
                    </div>
                    <hr />
                    <div className="flex justify-between font-bold">
                      <span>Net Investing</span>
                      <span className={cashFlowData.investingActivities?.net > 0 ? 'text-green-600' : 'text-red-600'}>
                        ₹{cashFlowData.investingActivities?.net?.toLocaleString('en-IN')}
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
                      <span className="font-medium text-green-600">+₹{cashFlowData.financingActivities?.inflows?.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Cash Outflows</span>
                      <span className="font-medium text-red-600">-₹{cashFlowData.financingActivities?.outflows?.toLocaleString('en-IN')}</span>
                    </div>
                    <hr />
                    <div className="flex justify-between font-bold">
                      <span>Net Financing</span>
                      <span className={cashFlowData.financingActivities?.net > 0 ? 'text-green-600' : 'text-red-600'}>
                        ₹{cashFlowData.financingActivities?.net?.toLocaleString('en-IN')}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          ) : null}
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
                  <TableCell className="text-right">₹{txn.amount.toLocaleString('en-IN')}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </DialogContent>
      </Dialog>

      <div className="text-xs text-gray-500">
        <p>Shortcuts: Ctrl+P (Print), Ctrl+E (Export)</p>
      </div>
    </div>
  );
};

export default CashFlowPage;
