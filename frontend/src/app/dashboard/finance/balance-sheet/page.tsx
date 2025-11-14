"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, Download, Calendar, TrendingUp, TrendingDown, Eye, BarChart3, Save, Printer, Search, Mail } from "lucide-react";
import { reportingApi } from "@/lib/api/finance/reportingApi";
import { BarChart, Bar, PieChart, Pie, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';

const COLORS = ['#10b981', '#ef4444', '#3b82f6', '#f59e0b', '#8b5cf6'];

const BalanceSheetPage = () => {
  const [balanceSheetData, setBalanceSheetData] = useState<any>(null);
  const [multiPeriodData, setMultiPeriodData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [asOfDate, setAsOfDate] = useState(new Date().toISOString().split('T')[0]);
  const [compareDate, setCompareDate] = useState('');
  const [compareMode, setCompareMode] = useState<'none' | 'yoy' | 'qoq' | 'custom' | 'multi'>('none');
  const [drilldownAccount, setDrilldownAccount] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [savedViews, setSavedViews] = useState<any[]>([]);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [viewName, setViewName] = useState('');
  const [showScheduleDialog, setShowScheduleDialog] = useState(false);
  const [scheduleEmail, setScheduleEmail] = useState('');
  const [scheduleFrequency, setScheduleFrequency] = useState('monthly');

  useEffect(() => {
    fetchBalanceSheetData();
    loadSavedViews();
    setupKeyboardShortcuts();
  }, []);

  const setupKeyboardShortcuts = () => {
    const handler = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        if (e.key === 'p') { e.preventDefault(); handlePrint(); }
        if (e.key === 's') { e.preventDefault(); setShowSaveDialog(true); }
        if (e.key === 'e') { e.preventDefault(); handleExport('csv'); }
        if (e.key === 'f') { e.preventDefault(); document.getElementById('search-input')?.focus(); }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  };

  const loadSavedViews = () => {
    const saved = localStorage.getItem('balanceSheetViews');
    if (saved) setSavedViews(JSON.parse(saved));
  };

  const saveCurrentView = () => {
    const view = { name: viewName, asOfDate, compareDate, compareMode, savedAt: new Date().toISOString() };
    const updated = [...savedViews, view];
    setSavedViews(updated);
    localStorage.setItem('balanceSheetViews', JSON.stringify(updated));
    setShowSaveDialog(false);
    setViewName('');
  };

  const loadView = (view: any) => {
    setAsOfDate(view.asOfDate);
    setCompareDate(view.compareDate);
    setCompareMode(view.compareMode);
    fetchBalanceSheetData();
  };

  const fetchBalanceSheetData = async () => {
    setLoading(true);
    try {
      const response = await reportingApi.getBalanceSheet(asOfDate, compareDate || undefined);
      if (response.success) {
        setBalanceSheetData(response.data);
        if (compareMode === 'multi') fetchMultiPeriodData();
      }
    } catch (error) {
      console.error('Error fetching balance sheet:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMultiPeriodData = async () => {
    const periods = [];
    const date = new Date(asOfDate);
    for (let i = 0; i < 5; i++) {
      const periodDate = new Date(date);
      periodDate.setMonth(date.getMonth() - i * 3);
      const response = await reportingApi.getBalanceSheet(periodDate.toISOString().split('T')[0]);
      if (response.success) {
        periods.push({
          period: periodDate.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }),
          assets: response.data.totalAssets,
          liabilities: response.data.totalLiabilities,
          equity: response.data.totalEquity
        });
      }
    }
    setMultiPeriodData(periods.reverse());
  };

  const handleCompareMode = (mode: string) => {
    setCompareMode(mode as any);
    const date = new Date(asOfDate);
    if (mode === 'yoy') {
      date.setFullYear(date.getFullYear() - 1);
      setCompareDate(date.toISOString().split('T')[0]);
    } else if (mode === 'qoq') {
      date.setMonth(date.getMonth() - 3);
      setCompareDate(date.toISOString().split('T')[0]);
    } else if (mode === 'none') {
      setCompareDate('');
    } else if (mode === 'multi') {
      fetchMultiPeriodData();
    }
  };

  const handleDrilldown = async (account: any) => {
    setDrilldownAccount(account);
    try {
      const response = await reportingApi.getAccountTransactions(account.accountId);
      if (response.success) {
        setTransactions(response.data.transactions || []);
      }
    } catch (error) {
      console.error('Error fetching transactions:', error);
    }
  };

  const handleExport = async (format: 'csv' | 'pdf') => {
    try {
      const blob = await reportingApi.exportReport('balance-sheet', format, undefined, undefined, asOfDate);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `balance-sheet-${asOfDate}.${format}`;
      a.click();
    } catch (error) {
      console.error('Export error:', error);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleScheduleReport = () => {
    console.log('Scheduling report:', { email: scheduleEmail, frequency: scheduleFrequency });
    setShowScheduleDialog(false);
  };

  const filteredAssets = balanceSheetData?.assets?.filter((a: any) => 
    a.account.toLowerCase().includes(searchTerm.toLowerCase()) || 
    a.code.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const filteredLiabilities = balanceSheetData?.liabilities?.filter((l: any) => 
    l.account.toLowerCase().includes(searchTerm.toLowerCase()) || 
    l.code.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const filteredEquity = balanceSheetData?.equity?.filter((e: any) => 
    e.account.toLowerCase().includes(searchTerm.toLowerCase()) || 
    e.code.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const pieData = balanceSheetData ? [
    { name: 'Assets', value: balanceSheetData.totalAssets },
    { name: 'Liabilities', value: balanceSheetData.totalLiabilities },
    { name: 'Equity', value: balanceSheetData.totalEquity }
  ] : [];

  const renderAccountRow = (item: any, type: string) => {
    const change = balanceSheetData?.comparison ? 
      (type === 'assets' ? item.amount - (balanceSheetData.comparison.totalAssets / balanceSheetData.assets.length) :
       type === 'liabilities' ? item.amount - (balanceSheetData.comparison.totalLiabilities / balanceSheetData.liabilities.length) :
       item.amount - (balanceSheetData.comparison.totalEquity / balanceSheetData.equity.length)) : 0;
    
    return (
      <div key={item.code} className="flex justify-between items-center text-sm py-1 hover:bg-gray-50 px-2 rounded cursor-pointer print:hover:bg-white" onClick={() => handleDrilldown(item)}>
        <div className="flex items-center gap-2">
          <span>{item.account} ({item.code})</span>
          <Eye className="h-3 w-3 text-gray-400 print:hidden" />
        </div>
        <div className="flex items-center gap-3">
          <span className="font-medium">₹{item.amount.toLocaleString('en-IN')}</span>
          {compareDate && (
            <span className={`text-xs flex items-center gap-1 print:hidden ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {change >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
              {Math.abs(change).toLocaleString('en-IN')}
            </span>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="flex-1 space-y-6 p-6 print:p-0">
      <style jsx global>{`
        @media print {
          body * { visibility: hidden; }
          .print-area, .print-area * { visibility: visible; }
          .print-area { position: absolute; left: 0; top: 0; width: 100%; }
          .print\\:hidden { display: none !important; }
        }
      `}</style>

      <div className="flex items-center justify-between print:hidden">
        <div className="flex items-center gap-3">
          <FileText className="h-8 w-8 text-purple-600" />
          <div>
            <h1 className="text-3xl font-bold">Balance Sheet</h1>
            <p className="text-muted-foreground">Assets, liabilities, and equity with advanced analytics</p>
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
            <Input id="search-input" placeholder="Search accounts..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-8 w-48" />
          </div>
          <Select value={compareMode} onValueChange={handleCompareMode}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Compare" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No Compare</SelectItem>
              <SelectItem value="yoy">YoY</SelectItem>
              <SelectItem value="qoq">QoQ</SelectItem>
              <SelectItem value="custom">Custom</SelectItem>
              <SelectItem value="multi">Multi-Period</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            <Input type="date" value={asOfDate} onChange={(e) => setAsOfDate(e.target.value)} className="w-40" />
          </div>
          {compareMode === 'custom' && (
            <Input type="date" value={compareDate} onChange={(e) => setCompareDate(e.target.value)} className="w-40" placeholder="Compare date" />
          )}
          <Button onClick={fetchBalanceSheetData}>Refresh</Button>
          <Button variant="outline" onClick={() => setShowSaveDialog(true)}><Save className="h-4 w-4 mr-2" />Save View</Button>
          <Button variant="outline" onClick={handlePrint}><Printer className="h-4 w-4 mr-2" />Print</Button>
          <Button variant="outline" onClick={() => handleExport('csv')}><Download className="h-4 w-4 mr-2" />CSV</Button>
          <Button variant="outline" onClick={() => handleExport('pdf')}><Download className="h-4 w-4 mr-2" />PDF</Button>
          <Button variant="outline" onClick={() => setShowScheduleDialog(true)}><Mail className="h-4 w-4 mr-2" />Schedule</Button>
        </div>
      </div>

      {savedViews.length > 0 && (
        <Card className="print:hidden">
          <CardHeader>
            <CardTitle className="text-sm">Saved Views</CardTitle>
          </CardHeader>
          <CardContent className="flex gap-2 flex-wrap">
            {savedViews.map((view, idx) => (
              <Button key={idx} variant="outline" size="sm" onClick={() => loadView(view)}>
                {view.name}
              </Button>
            ))}
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="statement" className="print:hidden">
        <TabsList>
          <TabsTrigger value="statement">Statement</TabsTrigger>
          <TabsTrigger value="charts">Charts</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
        </TabsList>

        <TabsContent value="statement" className="print-area">
          {balanceSheetData?.ratios && (
            <div className="grid grid-cols-3 gap-4 mb-6">
              <Card>
                <CardContent className="p-4">
                  <p className="text-sm text-gray-600">Current Ratio</p>
                  <p className="text-2xl font-bold">{balanceSheetData.ratios.currentRatio.toFixed(2)}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <p className="text-sm text-gray-600">Debt-to-Equity</p>
                  <p className="text-2xl font-bold">{balanceSheetData.ratios.debtToEquity.toFixed(2)}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <p className="text-sm text-gray-600">Working Capital</p>
                  <p className="text-2xl font-bold">₹{balanceSheetData.ratios.workingCapital.toLocaleString('en-IN')}</p>
                </CardContent>
              </Card>
            </div>
          )}

          {loading ? (
            <Card>
              <CardContent className="p-6">
                <div className="text-center">Loading balance sheet data...</div>
              </CardContent>
            </Card>
          ) : balanceSheetData ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-green-600">Assets</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {filteredAssets.map((asset: any) => renderAccountRow(asset, 'assets'))}
                  <hr className="my-2" />
                  <div className="flex justify-between font-bold text-lg">
                    <span>Total Assets</span>
                    <span className="text-green-600">₹{balanceSheetData.totalAssets?.toLocaleString('en-IN')}</span>
                  </div>
                  {balanceSheetData.comparison && (
                    <div className="text-sm text-gray-600 flex justify-between">
                      <span>Change:</span>
                      <span className={balanceSheetData.comparison.assetChange >= 0 ? 'text-green-600' : 'text-red-600'}>
                        ₹{Math.abs(balanceSheetData.comparison.assetChange).toLocaleString('en-IN')}
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-red-600">Liabilities</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {filteredLiabilities.map((liability: any) => renderAccountRow(liability, 'liabilities'))}
                  <hr className="my-2" />
                  <div className="flex justify-between font-bold text-lg">
                    <span>Total Liabilities</span>
                    <span className="text-red-600">₹{balanceSheetData.totalLiabilities?.toLocaleString('en-IN')}</span>
                  </div>
                  {balanceSheetData.comparison && (
                    <div className="text-sm text-gray-600 flex justify-between">
                      <span>Change:</span>
                      <span className={balanceSheetData.comparison.liabilityChange >= 0 ? 'text-red-600' : 'text-green-600'}>
                        ₹{Math.abs(balanceSheetData.comparison.liabilityChange).toLocaleString('en-IN')}
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-blue-600">Equity</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {filteredEquity.map((item: any) => renderAccountRow(item, 'equity'))}
                  <hr className="my-2" />
                  <div className="flex justify-between font-bold text-lg">
                    <span>Total Equity</span>
                    <span className="text-blue-600">₹{balanceSheetData.totalEquity?.toLocaleString('en-IN')}</span>
                  </div>
                  {balanceSheetData.comparison && (
                    <div className="text-sm text-gray-600 flex justify-between">
                      <span>Change:</span>
                      <span className={balanceSheetData.comparison.equityChange >= 0 ? 'text-green-600' : 'text-red-600'}>
                        ₹{Math.abs(balanceSheetData.comparison.equityChange).toLocaleString('en-IN')}
                      </span>
                    </div>
                  )}
                  <hr className="my-2" />
                  <div className="flex justify-between font-semibold text-lg">
                    <span>Total Liab. + Equity</span>
                    <span>₹{(balanceSheetData.totalLiabilities + balanceSheetData.totalEquity).toLocaleString('en-IN')}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    {Math.abs(balanceSheetData.totalAssets - (balanceSheetData.totalLiabilities + balanceSheetData.totalEquity)) < 0.01 ? 
                      "✓ Balance sheet balances" : "⚠ Balance sheet does not balance"}
                  </p>
                </CardContent>
              </Card>
            </div>
          ) : null}
        </TabsContent>

        <TabsContent value="charts">
          <div className="grid grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Composition</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: any) => `₹${value.toLocaleString('en-IN')}`} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Comparison</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={[
                    { name: 'Assets', current: balanceSheetData?.totalAssets || 0, previous: balanceSheetData?.comparison?.totalAssets || 0 },
                    { name: 'Liabilities', current: balanceSheetData?.totalLiabilities || 0, previous: balanceSheetData?.comparison?.totalLiabilities || 0 },
                    { name: 'Equity', current: balanceSheetData?.totalEquity || 0, previous: balanceSheetData?.comparison?.totalEquity || 0 }
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip formatter={(value: any) => `₹${value.toLocaleString('en-IN')}`} />
                    <Legend />
                    <Bar dataKey="current" fill="#3b82f6" name="Current" />
                    <Bar dataKey="previous" fill="#94a3b8" name="Previous" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="trends">
          <Card>
            <CardHeader>
              <CardTitle>Multi-Period Trend Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={multiPeriodData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="period" />
                  <YAxis />
                  <Tooltip formatter={(value: any) => `₹${value.toLocaleString('en-IN')}`} />
                  <Legend />
                  <Line type="monotone" dataKey="assets" stroke="#10b981" name="Assets" strokeWidth={2} />
                  <Line type="monotone" dataKey="liabilities" stroke="#ef4444" name="Liabilities" strokeWidth={2} />
                  <Line type="monotone" dataKey="equity" stroke="#3b82f6" name="Equity" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={!!drilldownAccount} onOpenChange={() => setDrilldownAccount(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Transactions: {drilldownAccount?.account}</DialogTitle>
          </DialogHeader>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="text-right">Debit</TableHead>
                <TableHead className="text-right">Credit</TableHead>
                <TableHead className="text-right">Balance</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.map((txn: any, idx: number) => (
                <TableRow key={idx}>
                  <TableCell>{new Date(txn.date).toLocaleDateString('en-IN')}</TableCell>
                  <TableCell>{txn.description}</TableCell>
                  <TableCell className="text-right">{txn.debit ? `₹${txn.debit.toLocaleString('en-IN')}` : '-'}</TableCell>
                  <TableCell className="text-right">{txn.credit ? `₹${txn.credit.toLocaleString('en-IN')}` : '-'}</TableCell>
                  <TableCell className="text-right">₹{txn.balance?.toLocaleString('en-IN')}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </DialogContent>
      </Dialog>

      <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save Current View</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input placeholder="View name" value={viewName} onChange={(e) => setViewName(e.target.value)} />
            <Button onClick={saveCurrentView} disabled={!viewName}>Save</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showScheduleDialog} onOpenChange={setShowScheduleDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Schedule Report</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input type="email" placeholder="Email address" value={scheduleEmail} onChange={(e) => setScheduleEmail(e.target.value)} />
            <Select value={scheduleFrequency} onValueChange={setScheduleFrequency}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">Daily</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
                <SelectItem value="quarterly">Quarterly</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={handleScheduleReport} disabled={!scheduleEmail}>Schedule</Button>
          </div>
        </DialogContent>
      </Dialog>

      <div className="text-xs text-gray-500 print:hidden">
        <p>Keyboard shortcuts: Ctrl+P (Print), Ctrl+S (Save View), Ctrl+E (Export CSV), Ctrl+F (Search)</p>
      </div>
    </div>
  );
};

export default BalanceSheetPage;
