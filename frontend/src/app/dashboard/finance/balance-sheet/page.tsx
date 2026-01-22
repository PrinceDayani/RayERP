"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SectionLoader } from '@/components/PageLoader';
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
  const [accountCodeFrom, setAccountCodeFrom] = useState('');
  const [accountCodeTo, setAccountCodeTo] = useState('');
  const [selectedJournalEntry, setSelectedJournalEntry] = useState<any>(null);
  const [savedViews, setSavedViews] = useState<any[]>([]);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [viewName, setViewName] = useState('');
  const [showScheduleDialog, setShowScheduleDialog] = useState(false);
  const [scheduleEmail, setScheduleEmail] = useState('');
  const [scheduleFrequency, setScheduleFrequency] = useState('monthly');
  const [format, setFormat] = useState<'report' | 'account'>('report');
  const [showCommonSize, setShowCommonSize] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['current-assets', 'non-current-assets', 'current-liabilities', 'long-term-liabilities', 'equity']));
  const [error, setError] = useState<string | null>(null);
  const [showNotesDialog, setShowNotesDialog] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<any>(null);
  const [noteText, setNoteText] = useState('');
  const [noteType, setNoteType] = useState('general');
  const [showInsights, setShowInsights] = useState(true);
  const [selectedCompanies, setSelectedCompanies] = useState<string[]>([]);

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
    setError(null);
    try {
      const params: any = { asOfDate };
      if (compareDate) params.compareDate = compareDate;
      if (accountCodeFrom) params.accountCodeFrom = accountCodeFrom;
      if (accountCodeTo) params.accountCodeTo = accountCodeTo;
      
      const response = await reportingApi.getBalanceSheet(asOfDate, compareDate || undefined, Object.keys(params).length > 1 ? params : undefined);
      if (response.success) {
        setBalanceSheetData(response.data);
        if (compareMode === 'multi') fetchMultiPeriodData();
      } else {
        setError('Failed to fetch balance sheet data');
      }
    } catch (error: any) {
      console.error('Error fetching balance sheet:', error);
      setError(error.message || 'An error occurred while fetching data');
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

  const handleScheduleReport = async () => {
    try {
      await fetch('/api/finance/reports/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reportType: 'balance-sheet',
          frequency: scheduleFrequency,
          email: scheduleEmail,
          parameters: { asOfDate }
        })
      });
      setShowScheduleDialog(false);
      setScheduleEmail('');
    } catch (error) {
      console.error('Schedule error:', error);
    }
  };

  const handleAddNote = async () => {
    try {
      await fetch('/api/finance/accounts/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accountId: selectedAccount.accountId,
          note: noteText,
          noteType,
          asOfDate
        })
      });
      setShowNotesDialog(false);
      setNoteText('');
      fetchBalanceSheetData();
    } catch (error) {
      console.error('Add note error:', error);
    }
  };

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };

  const getAccountChange = (accountId: string, type: 'assets' | 'liabilities' | 'equity') => {
    if (!balanceSheetData?.comparison?.accounts) return null;
    const accountComparison = balanceSheetData.comparison.accounts[type]?.find((a: any) => a.accountId === accountId);
    return accountComparison ? accountComparison.change : 0;
  };

  const filteredAssets = balanceSheetData?.assets?.current?.filter((a: any) => 
    a.account.toLowerCase().includes(searchTerm.toLowerCase()) || 
    a.code.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const filteredLiabilities = balanceSheetData?.liabilities?.current?.filter((l: any) => 
    l.account.toLowerCase().includes(searchTerm.toLowerCase()) || 
    l.code.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const filteredEquity = balanceSheetData?.equity?.shareCapital?.filter((e: any) => 
    e.account.toLowerCase().includes(searchTerm.toLowerCase()) || 
    e.code.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const pieData = balanceSheetData ? [
    { name: 'Assets', value: balanceSheetData.totalAssets },
    { name: 'Liabilities', value: balanceSheetData.totalLiabilities },
    { name: 'Equity', value: balanceSheetData.totalEquity }
  ] : [];

  const renderAccountRow = (item: any, type: 'assets' | 'liabilities' | 'equity') => {
    const change = getAccountChange(item.accountId, type);
    const percentage = showCommonSize && balanceSheetData?.commonSize ? 
      balanceSheetData.commonSize[type]?.find((a: any) => a.accountId === item.accountId)?.percentage : null;
    const hasNotes = balanceSheetData?.notes?.[item.accountId]?.length > 0;
    
    return (
      <div key={item.code} className="flex justify-between items-center text-sm py-1 hover:bg-gray-50 px-2 rounded print:hover:bg-white">
        <div className="flex items-center gap-2">
          <span className="cursor-pointer" onClick={() => handleDrilldown(item)}>{item.account} ({item.code})</span>
          <Eye className="h-3 w-3 text-gray-400 print:hidden cursor-pointer" onClick={() => handleDrilldown(item)} />
          {hasNotes && <span className="text-xs text-blue-600 cursor-pointer" onClick={() => { setSelectedAccount(item); setShowNotesDialog(true); }}>📝</span>}
          <button className="text-xs text-gray-400 hover:text-blue-600 print:hidden" onClick={() => { setSelectedAccount(item); setShowNotesDialog(true); }}>+Note</button>
        </div>
        <div className="flex items-center gap-3">
          <span className="font-medium">₹{item.amount.toFixed(2)}</span>
          {showCommonSize && percentage !== null && (
            <span className="text-xs text-gray-500">({percentage.toFixed(1)}%)</span>
          )}
          {compareDate && change !== null && change !== 0 && (
            <span className={`text-xs flex items-center gap-1 print:hidden ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {change >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
              {Math.abs(change).toFixed(2)}
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
        @media (max-width: 768px) {
          .grid-cols-3 { grid-template-columns: 1fr !important; }
          .grid-cols-4 { grid-template-columns: repeat(2, 1fr) !important; }
          .flex-wrap { flex-wrap: wrap !important; }
          .text-3xl { font-size: 1.5rem !important; }
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
          <Input placeholder="From Code" value={accountCodeFrom} onChange={(e) => setAccountCodeFrom(e.target.value)} className="w-28" />
          <Input placeholder="To Code" value={accountCodeTo} onChange={(e) => setAccountCodeTo(e.target.value)} className="w-28" />
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
          <Button variant="outline" onClick={() => setFormat(format === 'report' ? 'account' : 'report')}>{format === 'report' ? 'Account Format' : 'Report Format'}</Button>
          <Button variant="outline" onClick={() => setShowCommonSize(!showCommonSize)}>{showCommonSize ? 'Hide %' : 'Show %'}</Button>
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
          {error && (
            <Card className="mb-6 border-red-200 bg-red-50">
              <CardContent className="p-4">
                <p className="text-red-600">{error}</p>
              </CardContent>
            </Card>
          )}

          {balanceSheetData?.ratios && (
            <div className="grid grid-cols-4 gap-4 mb-6">
              <Card>
                <CardContent className="p-4">
                  <p className="text-sm text-gray-600">Current Ratio</p>
                  <p className="text-2xl font-bold">{balanceSheetData.ratios.currentRatio.toFixed(2)}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <p className="text-sm text-gray-600">Quick Ratio</p>
                  <p className="text-2xl font-bold">{balanceSheetData.ratios.quickRatio.toFixed(2)}</p>
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
                  <p className="text-sm text-gray-600">Equity Ratio</p>
                  <p className="text-2xl font-bold">{(balanceSheetData.ratios.equityRatio * 100).toFixed(1)}%</p>
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
            format === 'report' ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-green-600">Assets</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="font-semibold text-sm cursor-pointer" onClick={() => toggleSection('current-assets')}>
                    {expandedSections.has('current-assets') ? '▼' : '▶'} Current Assets
                  </div>
                  {expandedSections.has('current-assets') && balanceSheetData.assets?.current?.map((asset: any) => renderAccountRow(asset, 'assets'))}
                  {expandedSections.has('current-assets') && (
                    <div className="flex justify-between text-sm font-medium pl-4">
                      <span>Total Current Assets</span>
                      <span>₹{balanceSheetData.assets?.totalCurrent?.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="font-semibold text-sm cursor-pointer mt-2" onClick={() => toggleSection('non-current-assets')}>
                    {expandedSections.has('non-current-assets') ? '▼' : '▶'} Non-Current Assets
                  </div>
                  {expandedSections.has('non-current-assets') && (
                    <>
                      <div className="text-xs font-medium pl-4">Fixed Assets</div>
                      {balanceSheetData.assets?.nonCurrent?.fixed?.map((asset: any) => <div key={asset.code} className="pl-6">{renderAccountRow(asset, 'assets')}</div>)}
                      <div className="text-xs font-medium pl-4 mt-1">Intangible Assets</div>
                      {balanceSheetData.assets?.nonCurrent?.intangible?.map((asset: any) => <div key={asset.code} className="pl-6">{renderAccountRow(asset, 'assets')}</div>)}
                      {balanceSheetData.assets?.nonCurrent?.other?.length > 0 && (
                        <>
                          <div className="text-xs font-medium pl-4 mt-1">Other Assets</div>
                          {balanceSheetData.assets?.nonCurrent?.other?.map((asset: any) => <div key={asset.code} className="pl-6">{renderAccountRow(asset, 'assets')}</div>)}
                        </>
                      )}
                      <div className="flex justify-between text-sm font-medium pl-4 mt-1">
                        <span>Total Non-Current Assets</span>
                        <span>₹{balanceSheetData.assets?.totalNonCurrent?.toFixed(2)}</span>
                      </div>
                    </>
                  )}
                  <hr className="my-2" />
                  <div className="flex justify-between font-bold text-lg">
                    <span>Total Assets</span>
                    <span className="text-green-600">₹{balanceSheetData.totalAssets?.toFixed(2)}</span>
                  </div>
                  {balanceSheetData.comparison && (
                    <div className="text-sm text-gray-600 flex justify-between">
                      <span>Change:</span>
                      <span className={balanceSheetData.comparison.assetChange >= 0 ? 'text-green-600' : 'text-red-600'}>
                        ₹{Math.abs(balanceSheetData.comparison.assetChange).toFixed(2)} ({balanceSheetData.comparison.assetChangePercent?.toFixed(1)}%)
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
                  <div className="font-semibold text-sm cursor-pointer" onClick={() => toggleSection('current-liabilities')}>
                    {expandedSections.has('current-liabilities') ? '▼' : '▶'} Current Liabilities
                  </div>
                  {expandedSections.has('current-liabilities') && balanceSheetData.liabilities?.current?.map((liability: any) => renderAccountRow(liability, 'liabilities'))}
                  {expandedSections.has('current-liabilities') && (
                    <div className="flex justify-between text-sm font-medium pl-4">
                      <span>Total Current Liabilities</span>
                      <span>₹{balanceSheetData.liabilities?.totalCurrent?.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="font-semibold text-sm cursor-pointer mt-2" onClick={() => toggleSection('long-term-liabilities')}>
                    {expandedSections.has('long-term-liabilities') ? '▼' : '▶'} Long-Term Liabilities
                  </div>
                  {expandedSections.has('long-term-liabilities') && balanceSheetData.liabilities?.longTerm?.map((liability: any) => renderAccountRow(liability, 'liabilities'))}
                  {expandedSections.has('long-term-liabilities') && (
                    <div className="flex justify-between text-sm font-medium pl-4">
                      <span>Total Long-Term Liabilities</span>
                      <span>₹{balanceSheetData.liabilities?.totalLongTerm?.toFixed(2)}</span>
                    </div>
                  )}
                  <hr className="my-2" />
                  <div className="flex justify-between font-bold text-lg">
                    <span>Total Liabilities</span>
                    <span className="text-red-600">₹{balanceSheetData.totalLiabilities?.toFixed(2)}</span>
                  </div>
                  {balanceSheetData.comparison && (
                    <div className="text-sm text-gray-600 flex justify-between">
                      <span>Change:</span>
                      <span className={balanceSheetData.comparison.liabilityChange >= 0 ? 'text-red-600' : 'text-green-600'}>
                        ₹{Math.abs(balanceSheetData.comparison.liabilityChange).toFixed(2)} ({balanceSheetData.comparison.liabilityChangePercent?.toFixed(1)}%)
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
                  <div className="font-semibold text-sm cursor-pointer" onClick={() => toggleSection('equity')}>
                    {expandedSections.has('equity') ? '▼' : '▶'} Equity Components
                  </div>
                  {expandedSections.has('equity') && (
                    <>
                      {balanceSheetData.equity?.shareCapital?.length > 0 && (
                        <>
                          <div className="text-xs font-medium pl-4">Share Capital</div>
                          {balanceSheetData.equity.shareCapital.map((item: any) => <div key={item.code} className="pl-6">{renderAccountRow(item, 'equity')}</div>)}
                        </>
                      )}
                      {balanceSheetData.equity?.retainedEarnings?.length > 0 && (
                        <>
                          <div className="text-xs font-medium pl-4 mt-1">Retained Earnings</div>
                          {balanceSheetData.equity.retainedEarnings.map((item: any) => <div key={item.code} className="pl-6">{renderAccountRow(item, 'equity')}</div>)}
                        </>
                      )}
                      {balanceSheetData.equity?.reserves?.length > 0 && (
                        <>
                          <div className="text-xs font-medium pl-4 mt-1">Reserves</div>
                          {balanceSheetData.equity.reserves.map((item: any) => <div key={item.code} className="pl-6">{renderAccountRow(item, 'equity')}</div>)}
                        </>
                      )}
                      {balanceSheetData.equity?.other?.length > 0 && (
                        <>
                          <div className="text-xs font-medium pl-4 mt-1">Other Equity</div>
                          {balanceSheetData.equity.other.map((item: any) => <div key={item.code} className="pl-6">{renderAccountRow(item, 'equity')}</div>)}
                        </>
                      )}
                    </>
                  )}
                  <hr className="my-2" />
                  <div className="flex justify-between font-bold text-lg">
                    <span>Total Equity</span>
                    <span className="text-blue-600">₹{balanceSheetData.totalEquity?.toFixed(2)}</span>
                  </div>
                  {balanceSheetData.comparison && (
                    <div className="text-sm text-gray-600 flex justify-between">
                      <span>Change:</span>
                      <span className={balanceSheetData.comparison.equityChange >= 0 ? 'text-green-600' : 'text-red-600'}>
                        ₹{Math.abs(balanceSheetData.comparison.equityChange).toFixed(2)} ({balanceSheetData.comparison.equityChangePercent?.toFixed(1)}%)
                      </span>
                    </div>
                  )}
                  <hr className="my-2" />
                  <div className="flex justify-between font-semibold text-lg">
                    <span>Total Liab. + Equity</span>
                    <span>₹{(balanceSheetData.totalLiabilities + balanceSheetData.totalEquity).toFixed(2)}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    {balanceSheetData.balanced ? 
                      "✓ Balance sheet balances" : `⚠ Difference: ₹${Math.abs(balanceSheetData.balanceDifference).toFixed(2)}`}
                  </p>
                  {balanceSheetData.budget && (
                    <div className="mt-4 p-3 bg-blue-50 rounded">
                      <p className="text-xs font-semibold mb-1">Budget Variance</p>
                      <div className="text-xs space-y-1">
                        <div className="flex justify-between">
                          <span>Assets:</span>
                          <span className={balanceSheetData.budget.variance.assets >= 0 ? 'text-green-600' : 'text-red-600'}>
                            ₹{Math.abs(balanceSheetData.budget.variance.assets).toFixed(2)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Equity:</span>
                          <span className={balanceSheetData.budget.variance.equity >= 0 ? 'text-green-600' : 'text-red-600'}>
                            ₹{Math.abs(balanceSheetData.budget.variance.equity).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
            ) : (
              <Card>
                <CardContent className="p-6">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Account</TableHead>
                        <TableHead>Code</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                        {showCommonSize && <TableHead className="text-right">%</TableHead>}
                        {compareDate && <TableHead className="text-right">Change</TableHead>}
                        <TableHead className="text-center">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow className="bg-green-50 font-semibold">
                        <TableCell colSpan={6} className="text-green-700">ASSETS</TableCell>
                      </TableRow>
                      <TableRow className="bg-gray-50">
                        <TableCell colSpan={6} className="font-medium text-sm">Current Assets</TableCell>
                      </TableRow>
                      {balanceSheetData.assets?.current?.map((asset: any) => {
                        const change = getAccountChange(asset.accountId, 'assets');
                        const percentage = showCommonSize && balanceSheetData?.commonSize?.assets?.find((a: any) => a.accountId === asset.accountId)?.percentage;
                        return (
                          <TableRow key={asset.code} className="hover:bg-gray-50">
                            <TableCell className="pl-8">{asset.account}</TableCell>
                            <TableCell>{asset.code}</TableCell>
                            <TableCell className="text-right font-medium">₹{asset.amount.toFixed(2)}</TableCell>
                            {showCommonSize && <TableCell className="text-right text-sm text-gray-600">{percentage?.toFixed(1)}%</TableCell>}
                            {compareDate && <TableCell className="text-right"><span className={change >= 0 ? 'text-green-600' : 'text-red-600'}>{change !== 0 ? `₹${Math.abs(change).toFixed(2)}` : '-'}</span></TableCell>}
                            <TableCell className="text-center">
                              <Button variant="ghost" size="sm" onClick={() => handleDrilldown(asset)}><Eye className="h-3 w-3" /></Button>
                              <Button variant="ghost" size="sm" onClick={() => { setSelectedAccount(asset); setShowNotesDialog(true); }}>+Note</Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                      <TableRow className="font-medium bg-gray-100">
                        <TableCell colSpan={2}>Total Current Assets</TableCell>
                        <TableCell className="text-right">₹{balanceSheetData.assets?.totalCurrent?.toFixed(2)}</TableCell>
                        {showCommonSize && <TableCell></TableCell>}
                        {compareDate && <TableCell></TableCell>}
                        <TableCell></TableCell>
                      </TableRow>
                      <TableRow className="bg-gray-50">
                        <TableCell colSpan={6} className="font-medium text-sm">Non-Current Assets</TableCell>
                      </TableRow>
                      {balanceSheetData.assets?.nonCurrent?.fixed?.map((asset: any) => {
                        const change = getAccountChange(asset.accountId, 'assets');
                        const percentage = showCommonSize && balanceSheetData?.commonSize?.assets?.find((a: any) => a.accountId === asset.accountId)?.percentage;
                        return (
                          <TableRow key={asset.code} className="hover:bg-gray-50">
                            <TableCell className="pl-8">{asset.account}</TableCell>
                            <TableCell>{asset.code}</TableCell>
                            <TableCell className="text-right font-medium">₹{asset.amount.toFixed(2)}</TableCell>
                            {showCommonSize && <TableCell className="text-right text-sm text-gray-600">{percentage?.toFixed(1)}%</TableCell>}
                            {compareDate && <TableCell className="text-right"><span className={change >= 0 ? 'text-green-600' : 'text-red-600'}>{change !== 0 ? `₹${Math.abs(change).toFixed(2)}` : '-'}</span></TableCell>}
                            <TableCell className="text-center">
                              <Button variant="ghost" size="sm" onClick={() => handleDrilldown(asset)}><Eye className="h-3 w-3" /></Button>
                              <Button variant="ghost" size="sm" onClick={() => { setSelectedAccount(asset); setShowNotesDialog(true); }}>+Note</Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                      <TableRow className="font-medium bg-gray-100">
                        <TableCell colSpan={2}>Total Non-Current Assets</TableCell>
                        <TableCell className="text-right">₹{balanceSheetData.assets?.totalNonCurrent?.toFixed(2)}</TableCell>
                        {showCommonSize && <TableCell></TableCell>}
                        {compareDate && <TableCell></TableCell>}
                        <TableCell></TableCell>
                      </TableRow>
                      <TableRow className="font-bold bg-green-100">
                        <TableCell colSpan={2} className="text-green-700">TOTAL ASSETS</TableCell>
                        <TableCell className="text-right text-green-700">₹{balanceSheetData.totalAssets?.toFixed(2)}</TableCell>
                        {showCommonSize && <TableCell></TableCell>}
                        {compareDate && <TableCell className="text-right text-green-700">{balanceSheetData.comparison && `₹${Math.abs(balanceSheetData.comparison.assetChange).toFixed(2)} (${balanceSheetData.comparison.assetChangePercent?.toFixed(1)}%)`}</TableCell>}
                        <TableCell></TableCell>
                      </TableRow>
                      <TableRow><TableCell colSpan={6} className="h-4"></TableCell></TableRow>
                      <TableRow className="bg-red-50 font-semibold">
                        <TableCell colSpan={6} className="text-red-700">LIABILITIES</TableCell>
                      </TableRow>
                      <TableRow className="bg-gray-50">
                        <TableCell colSpan={6} className="font-medium text-sm">Current Liabilities</TableCell>
                      </TableRow>
                      {balanceSheetData.liabilities?.current?.map((liability: any) => {
                        const change = getAccountChange(liability.accountId, 'liabilities');
                        const percentage = showCommonSize && balanceSheetData?.commonSize?.liabilities?.find((a: any) => a.accountId === liability.accountId)?.percentage;
                        return (
                          <TableRow key={liability.code} className="hover:bg-gray-50">
                            <TableCell className="pl-8">{liability.account}</TableCell>
                            <TableCell>{liability.code}</TableCell>
                            <TableCell className="text-right font-medium">₹{liability.amount.toFixed(2)}</TableCell>
                            {showCommonSize && <TableCell className="text-right text-sm text-gray-600">{percentage?.toFixed(1)}%</TableCell>}
                            {compareDate && <TableCell className="text-right"><span className={change >= 0 ? 'text-red-600' : 'text-green-600'}>{change !== 0 ? `₹${Math.abs(change).toFixed(2)}` : '-'}</span></TableCell>}
                            <TableCell className="text-center">
                              <Button variant="ghost" size="sm" onClick={() => handleDrilldown(liability)}><Eye className="h-3 w-3" /></Button>
                              <Button variant="ghost" size="sm" onClick={() => { setSelectedAccount(liability); setShowNotesDialog(true); }}>+Note</Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                      <TableRow className="font-medium bg-gray-100">
                        <TableCell colSpan={2}>Total Current Liabilities</TableCell>
                        <TableCell className="text-right">₹{balanceSheetData.liabilities?.totalCurrent?.toFixed(2)}</TableCell>
                        {showCommonSize && <TableCell></TableCell>}
                        {compareDate && <TableCell></TableCell>}
                        <TableCell></TableCell>
                      </TableRow>
                      <TableRow className="bg-gray-50">
                        <TableCell colSpan={6} className="font-medium text-sm">Long-Term Liabilities</TableCell>
                      </TableRow>
                      {balanceSheetData.liabilities?.longTerm?.map((liability: any) => {
                        const change = getAccountChange(liability.accountId, 'liabilities');
                        const percentage = showCommonSize && balanceSheetData?.commonSize?.liabilities?.find((a: any) => a.accountId === liability.accountId)?.percentage;
                        return (
                          <TableRow key={liability.code} className="hover:bg-gray-50">
                            <TableCell className="pl-8">{liability.account}</TableCell>
                            <TableCell>{liability.code}</TableCell>
                            <TableCell className="text-right font-medium">₹{liability.amount.toFixed(2)}</TableCell>
                            {showCommonSize && <TableCell className="text-right text-sm text-gray-600">{percentage?.toFixed(1)}%</TableCell>}
                            {compareDate && <TableCell className="text-right"><span className={change >= 0 ? 'text-red-600' : 'text-green-600'}>{change !== 0 ? `₹${Math.abs(change).toFixed(2)}` : '-'}</span></TableCell>}
                            <TableCell className="text-center">
                              <Button variant="ghost" size="sm" onClick={() => handleDrilldown(liability)}><Eye className="h-3 w-3" /></Button>
                              <Button variant="ghost" size="sm" onClick={() => { setSelectedAccount(liability); setShowNotesDialog(true); }}>+Note</Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                      <TableRow className="font-medium bg-gray-100">
                        <TableCell colSpan={2}>Total Long-Term Liabilities</TableCell>
                        <TableCell className="text-right">₹{balanceSheetData.liabilities?.totalLongTerm?.toFixed(2)}</TableCell>
                        {showCommonSize && <TableCell></TableCell>}
                        {compareDate && <TableCell></TableCell>}
                        <TableCell></TableCell>
                      </TableRow>
                      <TableRow className="font-bold bg-red-100">
                        <TableCell colSpan={2} className="text-red-700">TOTAL LIABILITIES</TableCell>
                        <TableCell className="text-right text-red-700">₹{balanceSheetData.totalLiabilities?.toFixed(2)}</TableCell>
                        {showCommonSize && <TableCell></TableCell>}
                        {compareDate && <TableCell className="text-right text-red-700">{balanceSheetData.comparison && `₹${Math.abs(balanceSheetData.comparison.liabilityChange).toFixed(2)} (${balanceSheetData.comparison.liabilityChangePercent?.toFixed(1)}%)`}</TableCell>}
                        <TableCell></TableCell>
                      </TableRow>
                      <TableRow><TableCell colSpan={6} className="h-4"></TableCell></TableRow>
                      <TableRow className="bg-blue-50 font-semibold">
                        <TableCell colSpan={6} className="text-blue-700">EQUITY</TableCell>
                      </TableRow>
                      {balanceSheetData.equity?.shareCapital?.map((item: any) => {
                        const change = getAccountChange(item.accountId, 'equity');
                        const percentage = showCommonSize && balanceSheetData?.commonSize?.equity?.find((a: any) => a.accountId === item.accountId)?.percentage;
                        return (
                          <TableRow key={item.code} className="hover:bg-gray-50">
                            <TableCell className="pl-8">{item.account}</TableCell>
                            <TableCell>{item.code}</TableCell>
                            <TableCell className="text-right font-medium">₹{item.amount.toFixed(2)}</TableCell>
                            {showCommonSize && <TableCell className="text-right text-sm text-gray-600">{percentage?.toFixed(1)}%</TableCell>}
                            {compareDate && <TableCell className="text-right"><span className={change >= 0 ? 'text-green-600' : 'text-red-600'}>{change !== 0 ? `₹${Math.abs(change).toFixed(2)}` : '-'}</span></TableCell>}
                            <TableCell className="text-center">
                              <Button variant="ghost" size="sm" onClick={() => handleDrilldown(item)}><Eye className="h-3 w-3" /></Button>
                              <Button variant="ghost" size="sm" onClick={() => { setSelectedAccount(item); setShowNotesDialog(true); }}>+Note</Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                      {balanceSheetData.equity?.retainedEarnings?.map((item: any) => {
                        const change = getAccountChange(item.accountId, 'equity');
                        const percentage = showCommonSize && balanceSheetData?.commonSize?.equity?.find((a: any) => a.accountId === item.accountId)?.percentage;
                        return (
                          <TableRow key={item.code} className="hover:bg-gray-50">
                            <TableCell className="pl-8">{item.account}</TableCell>
                            <TableCell>{item.code}</TableCell>
                            <TableCell className="text-right font-medium">₹{item.amount.toFixed(2)}</TableCell>
                            {showCommonSize && <TableCell className="text-right text-sm text-gray-600">{percentage?.toFixed(1)}%</TableCell>}
                            {compareDate && <TableCell className="text-right"><span className={change >= 0 ? 'text-green-600' : 'text-red-600'}>{change !== 0 ? `₹${Math.abs(change).toFixed(2)}` : '-'}</span></TableCell>}
                            <TableCell className="text-center">
                              <Button variant="ghost" size="sm" onClick={() => handleDrilldown(item)}><Eye className="h-3 w-3" /></Button>
                              <Button variant="ghost" size="sm" onClick={() => { setSelectedAccount(item); setShowNotesDialog(true); }}>+Note</Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                      <TableRow className="font-bold bg-blue-100">
                        <TableCell colSpan={2} className="text-blue-700">TOTAL EQUITY</TableCell>
                        <TableCell className="text-right text-blue-700">₹{balanceSheetData.totalEquity?.toFixed(2)}</TableCell>
                        {showCommonSize && <TableCell></TableCell>}
                        {compareDate && <TableCell className="text-right text-blue-700">{balanceSheetData.comparison && `₹${Math.abs(balanceSheetData.comparison.equityChange).toFixed(2)} (${balanceSheetData.comparison.equityChangePercent?.toFixed(1)}%)`}</TableCell>}
                        <TableCell></TableCell>
                      </TableRow>
                      <TableRow><TableCell colSpan={6} className="h-4"></TableCell></TableRow>
                      <TableRow className="font-bold bg-gray-200">
                        <TableCell colSpan={2}>TOTAL LIABILITIES + EQUITY</TableCell>
                        <TableCell className="text-right">₹{(balanceSheetData.totalLiabilities + balanceSheetData.totalEquity).toFixed(2)}</TableCell>
                        {showCommonSize && <TableCell></TableCell>}
                        {compareDate && <TableCell></TableCell>}
                        <TableCell></TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell colSpan={6} className="text-xs text-center py-2">
                          {balanceSheetData.balanced ? 
                            <span className="text-green-600">✓ Balance sheet balances</span> : 
                            <span className="text-red-600">⚠ Difference: ₹{Math.abs(balanceSheetData.balanceDifference).toFixed(2)}</span>
                          }
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )
          ) : null}
        </TabsContent>

        <TabsContent value="charts">
          {loading ? (
            <div className="grid grid-cols-2 gap-6">
              {[1, 2, 3, 4].map((i) => (
                <Card key={i}>
                  <CardContent className="p-6 h-80 flex items-center justify-center">
                    <SectionLoader text="Loading chart..." />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : !balanceSheetData ? (
            <Card>
              <CardContent className="p-12 text-center">
                <BarChart3 className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No data available. Please refresh to load balance sheet data.</p>
                <Button onClick={fetchBalanceSheetData} className="mt-4">Load Data</Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>Asset Composition</span>
                      <span className="text-sm font-normal text-gray-500">₹{balanceSheetData.totalAssets?.toFixed(2)}</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {balanceSheetData.totalAssets > 0 ? (
                      <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                          <Pie 
                            data={[
                              { name: 'Current Assets', value: balanceSheetData.assets?.totalCurrent || 0 },
                              { name: 'Fixed Assets', value: balanceSheetData.assets?.nonCurrent?.fixed?.reduce((sum: number, a: any) => sum + a.amount, 0) || 0 },
                              { name: 'Intangible Assets', value: balanceSheetData.assets?.nonCurrent?.intangible?.reduce((sum: number, a: any) => sum + a.amount, 0) || 0 },
                              { name: 'Other Assets', value: balanceSheetData.assets?.nonCurrent?.other?.reduce((sum: number, a: any) => sum + a.amount, 0) || 0 }
                            ].filter(d => d.value > 0)} 
                            dataKey="value" 
                            nameKey="name" 
                            cx="50%" 
                            cy="50%" 
                            outerRadius={100} 
                            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
                            labelLine={true}
                          >
                            {[0, 1, 2, 3].map((index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value: any) => `₹${value.toFixed(2)}`} />
                          <Legend verticalAlign="bottom" height={36} />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-80 flex items-center justify-center text-gray-400">
                        <p>No asset data available</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>Liability & Equity Structure</span>
                      <span className="text-sm font-normal text-gray-500">₹{(balanceSheetData.totalLiabilities + balanceSheetData.totalEquity)?.toFixed(2)}</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {(balanceSheetData.totalLiabilities + balanceSheetData.totalEquity) > 0 ? (
                      <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                          <Pie 
                            data={[
                              { name: 'Current Liabilities', value: balanceSheetData.liabilities?.totalCurrent || 0 },
                              { name: 'Long-Term Liabilities', value: balanceSheetData.liabilities?.totalLongTerm || 0 },
                              { name: 'Equity', value: balanceSheetData.totalEquity || 0 }
                            ].filter(d => d.value > 0)} 
                            dataKey="value" 
                            nameKey="name" 
                            cx="50%" 
                            cy="50%" 
                            outerRadius={100} 
                            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
                            labelLine={true}
                          >
                            {[0, 1, 2].map((index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value: any) => `₹${value.toFixed(2)}`} />
                          <Legend verticalAlign="bottom" height={36} />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-80 flex items-center justify-center text-gray-400">
                        <p>No liability/equity data available</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Period Comparison</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {compareDate && balanceSheetData.comparison ? (
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={[
                          { name: 'Assets', current: balanceSheetData.totalAssets || 0, previous: balanceSheetData.comparison.totalAssets || 0 },
                          { name: 'Liabilities', current: balanceSheetData.totalLiabilities || 0, previous: balanceSheetData.comparison.totalLiabilities || 0 },
                          { name: 'Equity', current: balanceSheetData.totalEquity || 0, previous: balanceSheetData.comparison.totalEquity || 0 }
                        ]}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}K`} />
                          <Tooltip formatter={(value: any) => `₹${value.toFixed(2)}`} />
                          <Legend />
                          <Bar dataKey="current" fill="#3b82f6" name="Current Period" radius={[8, 8, 0, 0]} />
                          <Bar dataKey="previous" fill="#94a3b8" name="Previous Period" radius={[8, 8, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-80 flex items-center justify-center text-gray-400">
                        <div className="text-center">
                          <p className="mb-2">No comparison data available</p>
                          <p className="text-sm">Select a comparison mode (YoY/QoQ/Custom) to view period comparison</p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Financial Ratios</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {balanceSheetData.ratios ? (
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={[
                          { name: 'Current', value: balanceSheetData.ratios.currentRatio || 0, benchmark: 2.0 },
                          { name: 'Quick', value: balanceSheetData.ratios.quickRatio || 0, benchmark: 1.0 },
                          { name: 'D/E', value: balanceSheetData.ratios.debtToEquity || 0, benchmark: 1.5 },
                          { name: 'Equity %', value: (balanceSheetData.ratios.equityRatio || 0) * 100, benchmark: 50 }
                        ]} layout="vertical">
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis type="number" />
                          <YAxis dataKey="name" type="category" width={80} />
                          <Tooltip />
                          <Legend />
                          <Bar dataKey="value" fill="#8b5cf6" name="Actual" radius={[0, 8, 8, 0]} />
                          <Bar dataKey="benchmark" fill="#d1d5db" name="Benchmark" radius={[0, 8, 8, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-80 flex items-center justify-center text-gray-400">
                        <p>No ratio data available</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Asset vs Liability Breakdown</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={[
                      { category: 'Current Assets', amount: balanceSheetData.assets?.totalCurrent || 0, type: 'Asset' },
                      { category: 'Non-Current Assets', amount: balanceSheetData.assets?.totalNonCurrent || 0, type: 'Asset' },
                      { category: 'Current Liabilities', amount: balanceSheetData.liabilities?.totalCurrent || 0, type: 'Liability' },
                      { category: 'Long-Term Liabilities', amount: balanceSheetData.liabilities?.totalLongTerm || 0, type: 'Liability' },
                      { category: 'Equity', amount: balanceSheetData.totalEquity || 0, type: 'Equity' }
                    ]}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="category" angle={-45} textAnchor="end" height={100} />
                      <YAxis tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}K`} />
                      <Tooltip formatter={(value: any) => `₹${value.toFixed(2)}`} />
                      <Bar dataKey="amount" radius={[8, 8, 0, 0]}>
                        {[
                          { category: 'Current Assets', amount: balanceSheetData.assets?.totalCurrent || 0, type: 'Asset' },
                          { category: 'Non-Current Assets', amount: balanceSheetData.assets?.totalNonCurrent || 0, type: 'Asset' },
                          { category: 'Current Liabilities', amount: balanceSheetData.liabilities?.totalCurrent || 0, type: 'Liability' },
                          { category: 'Long-Term Liabilities', amount: balanceSheetData.liabilities?.totalLongTerm || 0, type: 'Liability' },
                          { category: 'Equity', amount: balanceSheetData.totalEquity || 0, type: 'Equity' }
                        ].map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.type === 'Asset' ? '#10b981' : entry.type === 'Liability' ? '#ef4444' : '#3b82f6'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        <TabsContent value="trends">
          {loading ? (
            <Card>
              <CardContent className="p-12 flex items-center justify-center">
                <SectionLoader text="Loading trend data..." />
              </CardContent>
            </Card>
          ) : !balanceSheetData ? (
            <Card>
              <CardContent className="p-12 text-center">
                <TrendingUp className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No data available. Please refresh to load balance sheet data.</p>
                <Button onClick={fetchBalanceSheetData} className="mt-4">Load Data</Button>
              </CardContent>
            </Card>
          ) : multiPeriodData.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <TrendingUp className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 mb-2">No multi-period data available</p>
                <p className="text-sm text-gray-400 mb-4">Select "Multi-Period" comparison mode to view trends</p>
                <Button onClick={() => handleCompareMode('multi')}>Load Multi-Period Data</Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Multi-Period Trend Analysis</span>
                    <span className="text-sm font-normal text-gray-500">{multiPeriodData.length} periods</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={400}>
                    <LineChart data={multiPeriodData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="period" />
                      <YAxis tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}K`} />
                      <Tooltip formatter={(value: any) => `₹${value.toFixed(2)}`} />
                      <Legend />
                      <Line type="monotone" dataKey="assets" stroke="#10b981" name="Assets" strokeWidth={3} dot={{ r: 6 }} activeDot={{ r: 8 }} />
                      <Line type="monotone" dataKey="liabilities" stroke="#ef4444" name="Liabilities" strokeWidth={3} dot={{ r: 6 }} activeDot={{ r: 8 }} />
                      <Line type="monotone" dataKey="equity" stroke="#3b82f6" name="Equity" strokeWidth={3} dot={{ r: 6 }} activeDot={{ r: 8 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Growth Trends</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={multiPeriodData.map((period, idx) => {
                        if (idx === 0) return { period: period.period, assetGrowth: 0, equityGrowth: 0 };
                        const prev = multiPeriodData[idx - 1];
                        return {
                          period: period.period,
                          assetGrowth: prev.assets > 0 ? ((period.assets - prev.assets) / prev.assets) * 100 : 0,
                          equityGrowth: prev.equity > 0 ? ((period.equity - prev.equity) / prev.equity) * 100 : 0
                        };
                      })}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="period" />
                        <YAxis tickFormatter={(value) => `${value.toFixed(0)}%`} />
                        <Tooltip formatter={(value: any) => `${value.toFixed(2)}%`} />
                        <Legend />
                        <Bar dataKey="assetGrowth" fill="#10b981" name="Asset Growth %" radius={[8, 8, 0, 0]} />
                        <Bar dataKey="equityGrowth" fill="#3b82f6" name="Equity Growth %" radius={[8, 8, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Debt-to-Equity Trend</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={multiPeriodData.map(period => ({
                        period: period.period,
                        debtToEquity: period.equity > 0 ? (period.liabilities / period.equity).toFixed(2) : 0,
                        benchmark: 1.5
                      }))}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="period" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Line type="monotone" dataKey="debtToEquity" stroke="#8b5cf6" name="D/E Ratio" strokeWidth={3} dot={{ r: 6 }} />
                        <Line type="monotone" dataKey="benchmark" stroke="#d1d5db" name="Benchmark" strokeWidth={2} strokeDasharray="5 5" />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Period-over-Period Changes</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left p-2">Period</th>
                          <th className="text-right p-2">Assets</th>
                          <th className="text-right p-2">Change</th>
                          <th className="text-right p-2">Liabilities</th>
                          <th className="text-right p-2">Change</th>
                          <th className="text-right p-2">Equity</th>
                          <th className="text-right p-2">Change</th>
                        </tr>
                      </thead>
                      <tbody>
                        {multiPeriodData.map((period, idx) => {
                          const prev = idx > 0 ? multiPeriodData[idx - 1] : null;
                          const assetChange = prev ? ((period.assets - prev.assets) / prev.assets) * 100 : 0;
                          const liabilityChange = prev ? ((period.liabilities - prev.liabilities) / prev.liabilities) * 100 : 0;
                          const equityChange = prev ? ((period.equity - prev.equity) / prev.equity) * 100 : 0;
                          return (
                            <tr key={idx} className="border-b hover:bg-gray-50">
                              <td className="p-2 font-medium">{period.period}</td>
                              <td className="text-right p-2">₹{period.assets.toFixed(2)}</td>
                              <td className={`text-right p-2 ${assetChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {prev ? `${assetChange >= 0 ? '+' : ''}${assetChange.toFixed(1)}%` : '-'}
                              </td>
                              <td className="text-right p-2">₹{period.liabilities.toFixed(2)}</td>
                              <td className={`text-right p-2 ${liabilityChange >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                                {prev ? `${liabilityChange >= 0 ? '+' : ''}${liabilityChange.toFixed(1)}%` : '-'}
                              </td>
                              <td className="text-right p-2">₹{period.equity.toFixed(2)}</td>
                              <td className={`text-right p-2 ${equityChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {prev ? `${equityChange >= 0 ? '+' : ''}${equityChange.toFixed(1)}%` : '-'}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={!!drilldownAccount} onOpenChange={() => setDrilldownAccount(null)}>
        <DialogContent className="max-w-6xl max-h-[80vh] overflow-y-auto">
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
                <TableHead className="text-center">Entry</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.map((txn: any, idx: number) => (
                <TableRow key={idx}>
                  <TableCell>{new Date(txn.date).toLocaleDateString('en-IN')}</TableCell>
                  <TableCell>{txn.description}</TableCell>
                  <TableCell className="text-right">{txn.debit ? `₹${txn.debit.toFixed(2)}` : '0.00'}</TableCell>
                  <TableCell className="text-right">{txn.credit ? `₹${txn.credit.toFixed(2)}` : '0.00'}</TableCell>
                  <TableCell className="text-right">₹{txn.balance?.toFixed(2) || '0.00'}</TableCell>
                  <TableCell className="text-center">
                    {txn.journalEntry && (
                      <Button variant="ghost" size="sm" onClick={() => setSelectedJournalEntry(txn.journalEntry)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </DialogContent>
      </Dialog>

      <Dialog open={!!selectedJournalEntry} onOpenChange={() => setSelectedJournalEntry(null)}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Journal Entry: {selectedJournalEntry?.entryNumber}</DialogTitle>
          </DialogHeader>
          {selectedJournalEntry && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><span className="font-semibold">Date:</span> {new Date(selectedJournalEntry.entryDate).toLocaleDateString('en-IN')}</div>
                <div><span className="font-semibold">Reference:</span> {selectedJournalEntry.reference || 'N/A'}</div>
                <div className="col-span-2"><span className="font-semibold">Description:</span> {selectedJournalEntry.description}</div>
              </div>
              
              {selectedJournalEntry.attachments && selectedJournalEntry.attachments.length > 0 && (
                <div className="border-t pt-3">
                  <p className="font-semibold text-sm mb-2">Attachments ({selectedJournalEntry.attachments.length})</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedJournalEntry.attachments.map((attachment: string, idx: number) => (
                      <a
                        key={idx}
                        href={attachment}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-3 py-2 bg-blue-50 hover:bg-blue-100 rounded border border-blue-200 text-sm text-blue-700"
                      >
                        <FileText className="h-4 w-4" />
                        <span>Attachment {idx + 1}</span>
                      </a>
                    ))}
                  </div>
                </div>
              )}
              
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Account</TableHead>
                    <TableHead>Code</TableHead>
                    <TableHead className="text-right">Debit</TableHead>
                    <TableHead className="text-right">Credit</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {selectedJournalEntry.lines?.map((line: any, idx: number) => (
                    <TableRow key={idx}>
                      <TableCell>{line.account?.name || 'N/A'}</TableCell>
                      <TableCell>{line.account?.code || 'N/A'}</TableCell>
                      <TableCell className="text-right">{line.debit > 0 ? `₹${line.debit.toFixed(2)}` : '0.00'}</TableCell>
                      <TableCell className="text-right">{line.credit > 0 ? `₹${line.credit.toFixed(2)}` : '0.00'}</TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="font-bold">
                    <TableCell colSpan={2}>Total</TableCell>
                    <TableCell className="text-right">₹{selectedJournalEntry.lines?.reduce((sum: number, l: any) => sum + l.debit, 0).toFixed(2)}</TableCell>
                    <TableCell className="text-right">₹{selectedJournalEntry.lines?.reduce((sum: number, l: any) => sum + l.credit, 0).toFixed(2)}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          )}
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

      <Dialog open={showNotesDialog} onOpenChange={setShowNotesDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Note to {selectedAccount?.account}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Select value={noteType} onValueChange={setNoteType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="general">General</SelectItem>
                <SelectItem value="valuation">Valuation</SelectItem>
                <SelectItem value="contingency">Contingency</SelectItem>
                <SelectItem value="policy">Policy</SelectItem>
              </SelectContent>
            </Select>
            <textarea 
              className="w-full p-2 border rounded" 
              rows={4} 
              placeholder="Enter note..." 
              value={noteText} 
              onChange={(e) => setNoteText(e.target.value)}
            />
            {balanceSheetData?.notes?.[selectedAccount?.accountId]?.length > 0 && (
              <div className="border-t pt-2">
                <p className="text-sm font-semibold mb-2">Existing Notes:</p>
                {balanceSheetData.notes[selectedAccount.accountId].map((note: any, idx: number) => (
                  <div key={idx} className="text-xs bg-gray-50 p-2 rounded mb-1">
                    <span className="font-medium">{note.noteType}:</span> {note.note}
                  </div>
                ))}
              </div>
            )}
            <Button onClick={handleAddNote} disabled={!noteText}>Add Note</Button>
          </div>
        </DialogContent>
      </Dialog>

      {showInsights && balanceSheetData?.insights?.length > 0 && (
        <Card className="print:hidden">
          <CardHeader>
            <CardTitle className="flex justify-between items-center">
              <span>AI-Powered Insights</span>
              <Button variant="ghost" size="sm" onClick={() => setShowInsights(false)}>×</Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {balanceSheetData.insights.map((insight: any, idx: number) => (
              <div key={idx} className={`p-3 rounded border-l-4 ${
                insight.type === 'warning' ? 'bg-yellow-50 border-yellow-500' :
                insight.type === 'alert' ? 'bg-red-50 border-red-500' :
                insight.type === 'success' ? 'bg-green-50 border-green-500' :
                'bg-blue-50 border-blue-500'
              }`}>
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-xs font-semibold uppercase">{insight.category}</span>
                    <p className="text-sm mt-1">{insight.message}</p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded ${
                    insight.severity === 'high' ? 'bg-red-200 text-red-800' :
                    insight.severity === 'medium' ? 'bg-yellow-200 text-yellow-800' :
                    'bg-gray-200 text-gray-800'
                  }`}>{insight.severity}</span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {balanceSheetData?.ratios?.roe !== undefined && (
        <Card className="print:hidden">
          <CardHeader>
            <CardTitle>Profitability Ratios</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Return on Equity (ROE)</p>
              <p className="text-2xl font-bold">{balanceSheetData.ratios.roe.toFixed(2)}%</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Return on Assets (ROA)</p>
              <p className="text-2xl font-bold">{balanceSheetData.ratios.roa.toFixed(2)}%</p>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="text-xs text-gray-500 print:hidden">
        <p>Keyboard shortcuts: Ctrl+P (Print), Ctrl+S (Save View), Ctrl+E (Export CSV), Ctrl+F (Search)</p>
      </div>
    </div>
  );
};

export default BalanceSheetPage;
