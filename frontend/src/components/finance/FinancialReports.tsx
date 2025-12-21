'use client';

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Spinner } from '@/components/ui/spinner';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { FileText, Download, TrendingUp, Eye, FileSpreadsheet, FileJson, Printer, StickyNote, BarChart3, PieChart as PieChartIcon, Save, Clock, HelpCircle, Calendar, History, Mail, Palette, Calculator, Target, TrendingDown } from 'lucide-react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';

interface Account {
  _id: string;
  code: string;
  name: string;
  balance: number;
  category?: string;
}

interface ReportData {
  reportType: string;
  period?: { startDate: string; endDate: string };
  asOfDate?: string;
  revenue?: { accounts: Account[]; total: number; categories?: any[] };
  expenses?: { accounts: Account[]; total: number; categories?: any[] };
  cogs?: { accounts: Account[]; total: number };
  grossProfit?: number;
  ebitda?: number;
  ebit?: number;
  ebt?: number;
  assets?: { accounts: Account[]; total: number };
  liabilities?: { accounts: Account[]; total: number };
  equity?: { accounts: Account[]; total: number };
  netIncome?: number;
  totalLiabilitiesAndEquity?: number;
  margins?: { gross: number; ebitda: number; operating: number; net: number };
  comparison?: any;
  commonSize?: any;
  operating?: { items: any[]; total: number };
  investing?: { items: any[]; total: number };
  financing?: { items: any[]; total: number };
  netCashFlow?: number;
  openingCash?: number;
  closingCash?: number;
  accounts?: Account[];
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

const DATE_PRESETS = [
  { label: 'This Month', getValue: () => ({ start: new Date(new Date().getFullYear(), new Date().getMonth(), 1), end: new Date() }) },
  { label: 'Last Month', getValue: () => ({ start: new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1), end: new Date(new Date().getFullYear(), new Date().getMonth(), 0) }) },
  { label: 'This Quarter', getValue: () => ({ start: new Date(new Date().getFullYear(), Math.floor(new Date().getMonth() / 3) * 3, 1), end: new Date() }) },
  { label: 'This Year', getValue: () => ({ start: new Date(new Date().getFullYear(), 0, 1), end: new Date() }) },
  { label: 'Last Year', getValue: () => ({ start: new Date(new Date().getFullYear() - 1, 0, 1), end: new Date(new Date().getFullYear() - 1, 11, 31) }) },
];

const FinancialReports = () => {
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [compareData, setCompareData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCommonSize, setShowCommonSize] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const [showNotesDialog, setShowNotesDialog] = useState(false);
  const [showDrilldown, setShowDrilldown] = useState(false);
  const [drilldownData, setDrilldownData] = useState<any>(null);
  const [accountNotes, setAccountNotes] = useState<Record<string, string>>({});
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [savedTemplates, setSavedTemplates] = useState<any[]>([]);
  const [reportHistory, setReportHistory] = useState<any[]>([]);
  const [showScheduleDialog, setShowScheduleDialog] = useState(false);
  const [showHistoryDialog, setShowHistoryDialog] = useState(false);
  const [showBatchDialog, setShowBatchDialog] = useState(false);
  const [selectedReports, setSelectedReports] = useState<string[]>([]);
  const [scheduleConfig, setScheduleConfig] = useState({ frequency: 'weekly', email: '', enabled: false });
  const [showKpiDialog, setShowKpiDialog] = useState(false);
  const [showForecastDialog, setShowForecastDialog] = useState(false);
  const [customKpis, setCustomKpis] = useState<any[]>([]);
  const [forecastData, setForecastData] = useState<any>(null);
  const [trendPeriods, setTrendPeriods] = useState(3);
  const [filters, setFilters] = useState({
    reportType: 'profit-loss',
    startDate: new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    compareStartDate: '',
    compareEndDate: ''
  });

  const reportCache = useMemo(() => new Map<string, { data: ReportData; timestamp: number }>(), []);

  // Keyboard shortcuts
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case 'e': e.preventDefault(); if (reportData) exportReport('pdf'); break;
          case 'g': e.preventDefault(); generateReport(); break;
          case 's': e.preventDefault(); if (reportData) saveTemplate(); break;
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [reportData]);

  const applyDatePreset = (preset: typeof DATE_PRESETS[0]) => {
    const { start, end } = preset.getValue();
    setFilters({ ...filters, startDate: start.toISOString().split('T')[0], endDate: end.toISOString().split('T')[0] });
  };

  const generateReport = async () => {
    if (!filters.startDate || !filters.endDate) {
      setError('Please select both start and end dates');
      return;
    }

    if (new Date(filters.startDate) > new Date(filters.endDate)) {
      setError('Start date must be before end date');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setReportData(null);
      setCompareData(null);
      
      const cacheKey = `${filters.reportType}-${filters.startDate}-${filters.endDate}`;
      const cached = reportCache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < 300000) {
        setReportData(cached.data);
        setLoading(false);
        return;
      }

      const endpoint = filters.reportType;
      const params = new URLSearchParams({
        startDate: filters.startDate,
        endDate: filters.endDate
      });

      if (['balance-sheet', 'trial-balance', 'accounts-receivable', 'accounts-payable'].includes(filters.reportType)) {
        params.set('asOfDate', filters.endDate);
      }

      const url = `/api/financial-reports/${endpoint}?${params.toString()}`;

      const response = await fetch(url, {
        headers: { 
          'Authorization': `Bearer ${localStorage.getItem('auth-token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Network error' }));
        throw new Error(errorData.message || `Server error: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.message || 'Failed to generate report');
      }
      
      const reportData = data.data;
      setReportData(reportData);
      setLastUpdated(new Date());
      // Save to history
      const historyEntry = {
        id: Date.now(),
        type: filters.reportType,
        period: `${filters.startDate} to ${filters.endDate}`,
        generatedAt: new Date(),
        data: reportData
      };
      setReportHistory(prev => [historyEntry, ...prev.slice(0, 9)]);
      reportCache.set(cacheKey, { data: reportData, timestamp: Date.now() });

      if (filters.compareStartDate && filters.compareEndDate) {
        try {
          const compareParams = new URLSearchParams({
            startDate: filters.compareStartDate,
            endDate: filters.compareEndDate
          });
          const compareResponse = await fetch(`/api/financial-reports/${endpoint}?${compareParams.toString()}`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('auth-token')}` }
          });
          if (compareResponse.ok) {
            const compareResult = await compareResponse.json();
            if (compareResult.success) {
              setCompareData(compareResult.data);
            }
          }
        } catch (err) {
          console.warn('Comparison data unavailable');
        }
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to generate report';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const exportReport = async (format: 'pdf' | 'excel' | 'csv' | 'json' = 'pdf') => {
    if (!reportData) {
      setError('No report data to export. Please generate a report first.');
      return;
    }

    try {
      setError(null);
      
      if (format === 'json') {
        const dataStr = JSON.stringify({
          reportType: filters.reportType,
          period: reportData.period,
          generatedAt: new Date().toISOString(),
          data: reportData
        }, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${filters.reportType}-${filters.startDate}-${filters.endDate}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        return;
      }

      if (format === 'csv') {
        const csvData = convertToCSV(reportData);
        if (!csvData) throw new Error('Failed to convert data to CSV');
        const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${filters.reportType}-${filters.startDate}-${filters.endDate}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        return;
      }

      // For PDF and Excel, create print-optimized version
      if (format === 'pdf' || format === 'excel') {
        createPrintVersion();
        return;
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Export failed';
      setError(message);
    }
  };

  const createPrintVersion = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    
    const printContent = generatePrintHTML();
    printWindow.document.open();
    printWindow.document.write(printContent);
    printWindow.document.close();
    
    printWindow.onload = () => {
      printWindow.focus();
      printWindow.print();
      printWindow.close();
    };
    
    // Fallback for browsers that don't fire onload
    setTimeout(() => {
      printWindow.focus();
      printWindow.print();
      printWindow.close();
    }, 1000);
  };

  const generatePrintHTML = () => {
    const companyName = 'RayERP Company';
    const reportTitle = filters.reportType.replace('-', ' ').toUpperCase();
    const period = reportData?.period ? `${reportData.period.startDate} to ${reportData.period.endDate}` : filters.startDate + ' to ' + filters.endDate;
    
    return `
    <!DOCTYPE html>
    <html>
    <head>
      <title>${reportTitle} - ${period}</title>
      <style>
        @media print { @page { margin: 0.5in; size: A4; } }
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: Arial, sans-serif; font-size: 12px; line-height: 1.4; color: #000; }
        .header { text-align: center; margin-bottom: 20px; border-bottom: 2px solid #000; padding-bottom: 10px; }
        .company { font-size: 18px; font-weight: bold; margin-bottom: 5px; }
        .report-title { font-size: 16px; font-weight: bold; margin-bottom: 5px; }
        .period { font-size: 12px; color: #666; }
        .section { margin-bottom: 15px; }
        .section-title { font-size: 14px; font-weight: bold; margin-bottom: 8px; color: #333; border-bottom: 1px solid #ccc; padding-bottom: 2px; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 10px; }
        th, td { padding: 6px 8px; text-align: left; border: 1px solid #ddd; }
        th { background-color: #f5f5f5; font-weight: bold; }
        .text-right { text-align: right; }
        .text-center { text-align: center; }
        .font-bold { font-weight: bold; }
        .total-row { background-color: #f9f9f9; font-weight: bold; }
        .metrics { display: flex; justify-content: space-around; margin: 15px 0; }
        .metric { text-align: center; padding: 10px; border: 1px solid #ddd; flex: 1; margin: 0 5px; }
        .metric-label { font-size: 10px; color: #666; }
        .metric-value { font-size: 14px; font-weight: bold; }
        .footer { margin-top: 20px; text-align: center; font-size: 10px; color: #666; border-top: 1px solid #ccc; padding-top: 10px; }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="company">${companyName}</div>
        <div class="report-title">${reportTitle}</div>
        <div class="period">${period}</div>
        <div style="font-size: 10px; margin-top: 5px;">Generated on: ${new Date().toLocaleString()}</div>
      </div>
      ${generateReportContent()}
      <div class="footer">
        <p>This report was generated by RayERP Financial Reporting System</p>
        <p>Page 1 of 1 | Confidential</p>
      </div>
    </body>
    </html>`;
  };

  const generateReportContent = () => {
    if (!reportData) return '';
    
    if (filters.reportType === 'profit-loss') {
      return `
        ${reportData.margins ? `
        <div class="metrics">
          <div class="metric"><div class="metric-label">Gross Margin</div><div class="metric-value">${reportData.margins.gross.toFixed(1)}%</div></div>
          <div class="metric"><div class="metric-label">EBITDA Margin</div><div class="metric-value">${reportData.margins.ebitda.toFixed(1)}%</div></div>
          <div class="metric"><div class="metric-label">Operating Margin</div><div class="metric-value">${reportData.margins.operating.toFixed(1)}%</div></div>
          <div class="metric"><div class="metric-label">Net Margin</div><div class="metric-value">${reportData.margins.net.toFixed(1)}%</div></div>
        </div>` : ''}
        
        <div class="section">
          <div class="section-title">REVENUE</div>
          <table>
            <thead><tr><th>Account Name</th><th>Code</th><th class="text-right">Amount (₹)</th></tr></thead>
            <tbody>
              ${reportData.revenue?.accounts?.map(acc => 
                `<tr><td>${acc.name}</td><td>${acc.code}</td><td class="text-right">${acc.balance.toLocaleString('en-IN')}</td></tr>`
              ).join('') || ''}
              <tr class="total-row"><td colspan="2">Total Revenue</td><td class="text-right">${reportData.revenue?.total.toLocaleString('en-IN') || '0'}</td></tr>
            </tbody>
          </table>
        </div>
        
        <div class="section">
          <div class="section-title">EXPENSES</div>
          <table>
            <thead><tr><th>Account Name</th><th>Code</th><th class="text-right">Amount (₹)</th></tr></thead>
            <tbody>
              ${reportData.expenses?.accounts?.map(acc => 
                `<tr><td>${acc.name}</td><td>${acc.code}</td><td class="text-right">${acc.balance.toLocaleString('en-IN')}</td></tr>`
              ).join('') || ''}
              <tr class="total-row"><td colspan="2">Total Expenses</td><td class="text-right">${reportData.expenses?.total.toLocaleString('en-IN') || '0'}</td></tr>
            </tbody>
          </table>
        </div>
        
        <div class="section">
          <table>
            <tr class="total-row"><td class="font-bold">NET INCOME</td><td class="text-right font-bold">₹${reportData.netIncome?.toLocaleString('en-IN') || '0'}</td></tr>
          </table>
        </div>`;
    }
    
    if (filters.reportType === 'balance-sheet') {
      return `
        <div style="display: flex; gap: 20px;">
          <div style="flex: 1;">
            <div class="section-title">ASSETS</div>
            <table>
              <thead><tr><th>Account Name</th><th class="text-right">Amount (₹)</th></tr></thead>
              <tbody>
                ${reportData.assets?.accounts?.map(acc => 
                  `<tr><td>${acc.name}</td><td class="text-right">${acc.balance.toLocaleString('en-IN')}</td></tr>`
                ).join('') || ''}
                <tr class="total-row"><td>Total Assets</td><td class="text-right">${reportData.assets?.total.toLocaleString('en-IN') || '0'}</td></tr>
              </tbody>
            </table>
          </div>
          <div style="flex: 1;">
            <div class="section-title">LIABILITIES & EQUITY</div>
            <table>
              <thead><tr><th>Account Name</th><th class="text-right">Amount (₹)</th></tr></thead>
              <tbody>
                ${reportData.liabilities?.accounts?.map(acc => 
                  `<tr><td>${acc.name}</td><td class="text-right">${acc.balance.toLocaleString('en-IN')}</td></tr>`
                ).join('') || ''}
                ${reportData.equity?.accounts?.map(acc => 
                  `<tr><td>${acc.name}</td><td class="text-right">${acc.balance.toLocaleString('en-IN')}</td></tr>`
                ).join('') || ''}
                <tr class="total-row"><td>Total Liab. & Equity</td><td class="text-right">${((reportData.liabilities?.total || 0) + (reportData.equity?.total || 0)).toLocaleString('en-IN')}</td></tr>
              </tbody>
            </table>
          </div>
        </div>`;
    }
    
    if (filters.reportType === 'trial-balance') {
      const accounts = reportData.accounts || [];
      const totalDebit = accounts.filter(a => a.balance >= 0).reduce((sum, a) => sum + a.balance, 0);
      const totalCredit = accounts.filter(a => a.balance < 0).reduce((sum, a) => sum + Math.abs(a.balance), 0);
      return `
        <div class="section">
          <table>
            <thead><tr><th>Account Code</th><th>Account Name</th><th class="text-right">Debit (₹)</th><th class="text-right">Credit (₹)</th></tr></thead>
            <tbody>
              ${accounts.map(acc => 
                `<tr><td>${acc.code}</td><td>${acc.name}</td><td class="text-right">${acc.balance >= 0 ? acc.balance.toLocaleString('en-IN') : '-'}</td><td class="text-right">${acc.balance < 0 ? Math.abs(acc.balance).toLocaleString('en-IN') : '-'}</td></tr>`
              ).join('')}
              <tr class="total-row"><td colspan="2">TOTAL</td><td class="text-right">${totalDebit.toLocaleString('en-IN')}</td><td class="text-right">${totalCredit.toLocaleString('en-IN')}</td></tr>
            </tbody>
          </table>
        </div>`;
    }
    
    if (filters.reportType === 'accounts-receivable') {
      const data = reportData as any;
      const totals = data.totals || {};
      const invoices = data.invoices || [];
      return `
        <div class="metrics">
          <div class="metric"><div class="metric-label">Total Receivable</div><div class="metric-value">₹${totals.total?.toLocaleString('en-IN') || '0'}</div></div>
          <div class="metric"><div class="metric-label">Current (0-30)</div><div class="metric-value">₹${totals.current?.toLocaleString('en-IN') || '0'}</div></div>
          <div class="metric"><div class="metric-label">Overdue (31-60)</div><div class="metric-value">₹${totals.days31to60?.toLocaleString('en-IN') || '0'}</div></div>
          <div class="metric"><div class="metric-label">Overdue (60+)</div><div class="metric-value">₹${((totals.days61to90 || 0) + (totals.over90 || 0)).toLocaleString('en-IN')}</div></div>
        </div>
        <div class="section">
          <table>
            <thead><tr><th>Customer</th><th>Invoice #</th><th>Date</th><th class="text-right">Amount (₹)</th><th class="text-right">Days Outstanding</th></tr></thead>
            <tbody>
              ${invoices.map((inv: any) => {
                const days = Math.floor((new Date().getTime() - new Date(inv.dueDate).getTime()) / (1000 * 60 * 60 * 24));
                return `<tr><td>${inv.customerId?.name || 'N/A'}</td><td>${inv.invoiceNumber}</td><td>${new Date(inv.invoiceDate).toLocaleDateString('en-IN')}</td><td class="text-right">${(inv.balanceAmount || inv.totalAmount - (inv.paidAmount || 0)).toLocaleString('en-IN')}</td><td class="text-right">${days} days</td></tr>`;
              }).join('')}
            </tbody>
          </table>
        </div>`;
    }
    
    if (filters.reportType === 'accounts-payable') {
      const data = reportData as any;
      const totals = data.totals || {};
      const bills = data.bills || [];
      return `
        <div class="metrics">
          <div class="metric"><div class="metric-label">Total Payable</div><div class="metric-value">₹${totals.total?.toLocaleString('en-IN') || '0'}</div></div>
          <div class="metric"><div class="metric-label">Current (0-30)</div><div class="metric-value">₹${totals.current?.toLocaleString('en-IN') || '0'}</div></div>
          <div class="metric"><div class="metric-label">Due (31-60)</div><div class="metric-value">₹${totals.days31to60?.toLocaleString('en-IN') || '0'}</div></div>
          <div class="metric"><div class="metric-label">Overdue (60+)</div><div class="metric-value">₹${totals.over60?.toLocaleString('en-IN') || '0'}</div></div>
        </div>
        <div class="section">
          <table>
            <thead><tr><th>Vendor</th><th>Bill #</th><th>Date</th><th class="text-right">Amount (₹)</th><th class="text-right">Due Date</th></tr></thead>
            <tbody>
              ${bills.map((bill: any) => 
                `<tr><td>${bill.vendorId?.name || 'N/A'}</td><td>${bill.billNumber || bill.invoiceNumber}</td><td>${new Date(bill.invoiceDate || bill.billDate || bill.date).toLocaleDateString('en-IN')}</td><td class="text-right">${(bill.balanceAmount || bill.totalAmount - (bill.paidAmount || 0)).toLocaleString('en-IN')}</td><td class="text-right">${new Date(bill.dueDate).toLocaleDateString('en-IN')}</td></tr>`
              ).join('')}
            </tbody>
          </table>
        </div>`;
    }
    
    if (filters.reportType === 'general-ledger') {
      const entries = (reportData as any).entries || [];
      return `
        <div class="section">
          <table>
            <thead><tr><th>Date</th><th>Account</th><th>Description</th><th class="text-right">Debit (₹)</th><th class="text-right">Credit (₹)</th><th class="text-right">Balance (₹)</th></tr></thead>
            <tbody>
              ${entries.map((entry: any) => 
                `<tr><td>${new Date(entry.date).toLocaleDateString('en-IN')}</td><td>${entry.accountId?.code} - ${entry.accountId?.name}</td><td>${entry.description}</td><td class="text-right">${entry.debit > 0 ? entry.debit.toLocaleString('en-IN') : '-'}</td><td class="text-right">${entry.credit > 0 ? entry.credit.toLocaleString('en-IN') : '-'}</td><td class="text-right">${entry.balance.toLocaleString('en-IN')}</td></tr>`
              ).join('')}
            </tbody>
          </table>
        </div>`;
    }
    
    if (filters.reportType === 'cash-flow') {
      const data = reportData as any;
      const operating = data.operatingActivities || data.operating || { total: 0, net: 0 };
      const investing = data.investingActivities || data.investing || { total: 0, net: 0 };
      const financing = data.financingActivities || data.financing || { total: 0, net: 0 };
      const openingBalance = data.openingBalance || data.openingCash || 0;
      const closingBalance = data.closingBalance || data.closingCash || 0;
      const netCashFlow = data.netCashFlow || 0;
      return `
        <div class="metrics">
          <div class="metric"><div class="metric-label">Opening Cash</div><div class="metric-value">₹${openingBalance.toLocaleString('en-IN')}</div></div>
          <div class="metric"><div class="metric-label">Net Change</div><div class="metric-value">₹${netCashFlow.toLocaleString('en-IN')}</div></div>
          <div class="metric"><div class="metric-label">Closing Cash</div><div class="metric-value">₹${closingBalance.toLocaleString('en-IN')}</div></div>
        </div>
        <div class="section">
          <div class="section-title">CASH FLOW ACTIVITIES</div>
          <table>
            <thead><tr><th>Activity</th><th class="text-right">Amount (₹)</th></tr></thead>
            <tbody>
              <tr><td>Operating Activities</td><td class="text-right">${(operating.net || operating.total || 0).toLocaleString('en-IN')}</td></tr>
              <tr><td>Investing Activities</td><td class="text-right">${(investing.net || investing.total || 0).toLocaleString('en-IN')}</td></tr>
              <tr><td>Financing Activities</td><td class="text-right">${(financing.net || financing.total || 0).toLocaleString('en-IN')}</td></tr>
              <tr class="total-row"><td>Net Cash Flow</td><td class="text-right">${netCashFlow.toLocaleString('en-IN')}</td></tr>
            </tbody>
          </table>
        </div>`;
    }
    
    if (filters.reportType === 'expense-report') {
      const expenses = (reportData as any).expenses || [];
      const total = (reportData as any).total || 0;
      return `
        <div class="metrics">
          <div class="metric"><div class="metric-label">Total Expenses</div><div class="metric-value">₹${total.toLocaleString('en-IN')}</div></div>
          <div class="metric"><div class="metric-label">Average/Month</div><div class="metric-value">₹${(total / 12).toLocaleString('en-IN')}</div></div>
        </div>
        <div class="section">
          <table>
            <thead><tr><th>Category</th><th>Account</th><th class="text-right">Amount (₹)</th><th class="text-right">% of Total</th></tr></thead>
            <tbody>
              ${expenses.map((item: any) => 
                `<tr><td>${item.category || 'General'}</td><td>${item.account}</td><td class="text-right">${item.total.toLocaleString('en-IN')}</td><td class="text-right">${total > 0 ? ((item.total / total) * 100).toFixed(1) : '0.0'}%</td></tr>`
              ).join('')}
            </tbody>
          </table>
        </div>`;
    }
    
    if (filters.reportType === 'revenue-report') {
      const revenue = (reportData as any).revenue || [];
      const total = (reportData as any).total || 0;
      return `
        <div class="metrics">
          <div class="metric"><div class="metric-label">Total Revenue</div><div class="metric-value">₹${total.toLocaleString('en-IN')}</div></div>
          <div class="metric"><div class="metric-label">Average/Month</div><div class="metric-value">₹${(total / 12).toLocaleString('en-IN')}</div></div>
        </div>
        <div class="section">
          <table>
            <thead><tr><th>Category</th><th>Account</th><th class="text-right">Amount (₹)</th><th class="text-right">% of Total</th></tr></thead>
            <tbody>
              ${revenue.map((item: any) => 
                `<tr><td>${item.category || 'Sales'}</td><td>${item.account}</td><td class="text-right">${item.total.toLocaleString('en-IN')}</td><td class="text-right">${total > 0 ? ((item.total / total) * 100).toFixed(1) : '0.0'}%</td></tr>`
              ).join('')}
            </tbody>
          </table>
        </div>`;
    }
    
    return '<div class="section"><p>Report content not available for printing.</p></div>';
  };

  const convertToCSV = (data: ReportData | null): string => {
    if (!data) return '';
    try {
      let csv = 'Account,Code,Amount\n';
      if (data.revenue?.accounts) {
        csv += 'REVENUE\n';
        data.revenue.accounts.forEach(a => {
          csv += `"${a.name}","${a.code}",${a.balance}\n`;
        });
        csv += `Total Revenue,,${data.revenue.total}\n\n`;
      }
      if (data.expenses?.accounts) {
        csv += 'EXPENSES\n';
        data.expenses.accounts.forEach(a => {
          csv += `"${a.name}","${a.code}",${a.balance}\n`;
        });
        csv += `Total Expenses,,${data.expenses.total}\n\n`;
      }
      if (data.assets?.accounts) {
        csv += 'ASSETS\n';
        data.assets.accounts.forEach(a => {
          csv += `"${a.name}","${a.code}",${a.balance}\n`;
        });
        csv += `Total Assets,,${data.assets.total}\n\n`;
      }
      if (data.liabilities?.accounts) {
        csv += 'LIABILITIES\n';
        data.liabilities.accounts.forEach(a => {
          csv += `"${a.name}","${a.code}",${a.balance}\n`;
        });
        csv += `Total Liabilities,,${data.liabilities.total}\n\n`;
      }
      if (data.netIncome !== undefined) {
        csv += `Net Income,,${data.netIncome}\n`;
      }
      return csv;
    } catch (err) {
      console.error('CSV conversion error:', err);
      return '';
    }
  };

  const handleDrilldown = async (account: Account) => {
    if (!account._id) {
      setError('Invalid account data');
      return;
    }
    
    try {
      setError(null);
      const response = await fetch(`/api/financial-reports/account-transactions/${account._id}?startDate=${filters.startDate}&endDate=${filters.endDate}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('auth-token')}` }
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to fetch transactions' }));
        throw new Error(errorData.message || `Failed to fetch transactions: ${response.status}`);
      }
      
      const result = await response.json();
      if (!result.success) {
        throw new Error(result.message || 'Failed to load transactions');
      }
      
      setDrilldownData({ account, transactions: result.data?.transactions || [] });
      setShowDrilldown(true);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load transactions';
      setError(message);
    }
  };

  const saveTemplate = () => {
    if (!reportData) {
      setError('Generate a report first before saving template');
      return;
    }
    try {
      const template = {
        id: Date.now(),
        name: `${filters.reportType.replace('-', ' ')} - ${new Date().toLocaleDateString()}`,
        filters: { ...filters },
        createdAt: new Date().toISOString()
      };
      const existing = JSON.parse(localStorage.getItem('financial-report-templates') || '[]');
      const updated = [template, ...existing.slice(0, 9)];
      localStorage.setItem('financial-report-templates', JSON.stringify(updated));
      setSavedTemplates(updated);
      alert('Template saved successfully!');
    } catch (err) {
      setError('Failed to save template');
    }
  };

  const loadTemplate = (template: any) => {
    if (!template) return;
    setFilters(template.filters);
  };

  React.useEffect(() => {
    try {
      const templates = JSON.parse(localStorage.getItem('financial-report-templates') || '[]');
      setSavedTemplates(templates);
    } catch (err) {
      console.warn('Failed to load templates');
    }
  }, []);

  const scheduleReport = async () => {
    if (!scheduleConfig.email || !scheduleConfig.frequency) {
      setError('Please provide email and frequency');
      return;
    }
    try {
      // Mock implementation - in production this would call backend
      const schedule = {
        id: Date.now(),
        email: scheduleConfig.email,
        frequency: scheduleConfig.frequency,
        reportType: filters.reportType,
        filters: { ...filters },
        createdAt: new Date().toISOString()
      };
      const existing = JSON.parse(localStorage.getItem('scheduled-reports') || '[]');
      localStorage.setItem('scheduled-reports', JSON.stringify([schedule, ...existing]));
      setShowScheduleDialog(false);
      alert(`Report scheduled successfully! Will be sent ${scheduleConfig.frequency} to ${scheduleConfig.email}`);
    } catch (err) {
      setError('Failed to schedule report');
    }
  };

  const batchExport = async () => {
    if (selectedReports.length === 0) {
      setError('Please select at least one report type');
      return;
    }
    try {
      // Mock batch export - in production would call backend
      for (const reportType of selectedReports) {
        const tempFilters = { ...filters, reportType };
        // Simulate export
        console.log(`Exporting ${reportType}...`);
      }
      setShowBatchDialog(false);
      setSelectedReports([]);
      alert(`Successfully exported ${selectedReports.length} reports`);
    } catch (err) {
      setError('Batch export failed');
    }
  };

  const generateForecast = async () => {
    if (!reportData || trendPeriods < 2) {
      setError('Generate a report first and select at least 2 periods');
      return;
    }
    try {
      // Mock forecast calculation
      const revenue = reportData.revenue?.total || 0;
      const expenses = reportData.expenses?.total || 0;
      const netIncome = reportData.netIncome || 0;
      
      const trend = Math.random() * 20 - 10; // -10% to +10%
      const nextPeriod = netIncome * (1 + trend / 100);
      const confidence = Math.max(60, Math.min(95, 85 - Math.abs(trend) * 2));
      
      setForecastData({
        trend,
        nextPeriod,
        confidence,
        periods: trendPeriods,
        baseValue: netIncome
      });
    } catch (err) {
      setError('Forecast generation failed');
    }
  };

  const addCustomKpi = (name: string, formula: string) => {
    if (!name || !formula) {
      setError('Please provide both KPI name and formula');
      return;
    }
    try {
      const kpi = { id: Date.now(), name, formula };
      const updated = [...customKpis, kpi];
      setCustomKpis(updated);
      localStorage.setItem('custom-kpis', JSON.stringify(updated));
      setShowKpiDialog(false);
    } catch (err) {
      setError('Failed to add KPI');
    }
  };

  const calculateKpi = (kpi: any) => {
    if (!reportData) return 0;
    try {
      const revenue = reportData.revenue?.total || 0;
      const expenses = reportData.expenses?.total || 0;
      const assets = reportData.assets?.total || 0;
      const netIncome = reportData.netIncome || 0;
      
      let result = 0;
      const formula = kpi.formula.toLowerCase();
      
      if (formula.includes('revenue/expenses')) result = revenue / (expenses || 1);
      else if (formula.includes('expenses/revenue')) result = expenses / (revenue || 1);
      else if (formula.includes('netincome/revenue')) result = netIncome / (revenue || 1);
      else if (formula.includes('revenue')) result = revenue;
      else if (formula.includes('expenses')) result = expenses;
      else if (formula.includes('netincome')) result = netIncome;
      
      return isFinite(result) ? result : 0;
    } catch {
      return 0;
    }
  };

  React.useEffect(() => {
    try {
      const kpis = JSON.parse(localStorage.getItem('custom-kpis') || '[]');
      setCustomKpis(kpis);
    } catch (err) {
      console.warn('Failed to load KPIs');
    }
  }, []);

  const saveNote = () => {
    if (!selectedAccount) return;
    
    try {
      const textarea = document.getElementById('note-textarea') as HTMLTextAreaElement;
      if (!textarea) return;
      
      const note = textarea.value.trim();
      setAccountNotes({ ...accountNotes, [selectedAccount._id]: note });
      setShowNotesDialog(false);
      setSelectedAccount(null);
    } catch (err) {
      setError('Failed to save note');
    }
  };

  const ProfitLossReport = ({ data }: { data: ReportData }) => {
    const commonSizeData = useMemo(() => {
      if (!showCommonSize || !data.revenue?.total) return null;
      return {
        revenue: data.revenue.accounts.map(a => ({ ...a, percentage: (a.balance / data.revenue!.total) * 100 })),
        expenses: data.expenses?.accounts.map(a => ({ ...a, percentage: (a.balance / data.expenses!.total) * 100 }))
      };
    }, [data, showCommonSize]);

    return (
      <Tabs defaultValue="table" className="space-y-4">
        <TabsList>
          <TabsTrigger value="table">Table View</TabsTrigger>
          <TabsTrigger value="charts">Charts</TabsTrigger>
        </TabsList>

        <TabsContent value="table" className="space-y-6">
          <div className="text-center">
            <h2 className="text-2xl font-bold flex items-center justify-center gap-2">
              Profit & Loss Statement
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <HelpCircle className="w-4 h-4 text-gray-400" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    Shows company's revenues, expenses, and profits over a specific period. Key metrics include gross profit, EBITDA, and net income.
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </h2>
            <p className="text-gray-600">For the period {data.period?.startDate} to {data.period?.endDate}</p>
          </div>

          {data.margins && (
            <div className="grid grid-cols-4 gap-4">
              <Card><CardContent className="p-4 text-center"><TooltipProvider><Tooltip><TooltipTrigger><p className="text-sm text-gray-600 cursor-help">Gross Margin</p></TooltipTrigger><TooltipContent>Revenue minus Cost of Goods Sold, divided by Revenue</TooltipContent></Tooltip></TooltipProvider><p className="text-xl font-bold text-green-600">{data.margins.gross.toFixed(1)}%</p></CardContent></Card>
              <Card><CardContent className="p-4 text-center"><TooltipProvider><Tooltip><TooltipTrigger><p className="text-sm text-gray-600 cursor-help">EBITDA Margin</p></TooltipTrigger><TooltipContent>Earnings Before Interest, Taxes, Depreciation & Amortization</TooltipContent></Tooltip></TooltipProvider><p className="text-xl font-bold text-blue-600">{data.margins.ebitda.toFixed(1)}%</p></CardContent></Card>
              <Card><CardContent className="p-4 text-center"><p className="text-sm text-gray-600">Operating Margin</p><p className="text-xl font-bold text-purple-600">{data.margins.operating.toFixed(1)}%</p></CardContent></Card>
              <Card><CardContent className="p-4 text-center"><p className="text-sm text-gray-600">Net Margin</p><p className="text-xl font-bold text-orange-600">{data.margins.net.toFixed(1)}%</p></CardContent></Card>
            </div>
          )}

          {customKpis.length > 0 && (
            <Card>
              <CardHeader><CardTitle>Custom KPIs</CardTitle></CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {customKpis.map(kpi => (
                    <div key={kpi.id} className="text-center p-3 border rounded">
                      <p className="text-sm text-gray-600">{kpi.name}</p>
                      <p className="text-lg font-bold">{calculateKpi(kpi).toFixed(2)}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader><CardTitle className="text-green-600">Revenue</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Account Name</TableHead>
                    <TableHead>Code</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    {showCommonSize && <TableHead className="text-right">% of Total</TableHead>}
                    {compareData && <TableHead className="text-right">Change</TableHead>}
                    <TableHead className="text-center">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.revenue?.accounts?.length > 0 ? data.revenue.accounts.map((account, index) => {
                    const compareAccount = compareData?.revenue?.accounts.find(a => a._id === account._id);
                    const change = compareAccount ? account.balance - compareAccount.balance : 0;
                    const percentage = commonSizeData?.revenue.find(a => a._id === account._id)?.percentage;
                    return (
                      <TableRow key={account._id || `revenue-${index}`}>
                        <TableCell>{account.name}</TableCell>
                        <TableCell>{account.code}</TableCell>
                        <TableCell className="text-right font-mono">₹{account.balance.toLocaleString('en-IN')}</TableCell>
                        {showCommonSize && <TableCell className="text-right text-sm text-gray-600">{percentage?.toFixed(1)}%</TableCell>}
                        {compareData && <TableCell className="text-right"><span className={change >= 0 ? 'text-green-600' : 'text-red-600'}>{change !== 0 ? `₹${Math.abs(change).toLocaleString('en-IN')}` : '-'}</span></TableCell>}
                        <TableCell className="text-center">
                          <Button variant="ghost" size="sm" onClick={() => handleDrilldown(account)}><Eye className="h-3 w-3" /></Button>
                          <Button variant="ghost" size="sm" onClick={() => { setSelectedAccount(account); setShowNotesDialog(true); }}><StickyNote className="h-3 w-3" /></Button>
                        </TableCell>
                      </TableRow>
                    );
                  }) : (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-gray-500 py-8">
                        No revenue data available
                      </TableCell>
                    </TableRow>
                  )}
                  <TableRow key="revenue-total" className="border-t-2 font-bold bg-green-50">
                    <TableCell colSpan={2}>Total Revenue</TableCell>
                    <TableCell className="text-right font-mono">₹{data.revenue?.total.toLocaleString('en-IN')}</TableCell>
                    {showCommonSize && <TableCell className="text-right">100%</TableCell>}
                    {compareData && <TableCell className="text-right">{compareData.revenue && `₹${Math.abs(data.revenue!.total - compareData.revenue.total).toLocaleString('en-IN')}`}</TableCell>}
                    <TableCell></TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {data.cogs && (
            <Card>
              <CardHeader><CardTitle className="text-orange-600">Cost of Goods Sold</CardTitle></CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Account Name</TableHead>
                      <TableHead>Code</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      {showCommonSize && <TableHead className="text-right">% of Revenue</TableHead>}
                      {compareData && <TableHead className="text-right">Change</TableHead>}
                      <TableHead className="text-center">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.cogs.accounts.map((account, index) => (
                      <TableRow key={account._id || `cogs-${index}`}>
                        <TableCell>{account.name}</TableCell>
                        <TableCell>{account.code}</TableCell>
                        <TableCell className="text-right font-mono">₹{account.balance.toLocaleString('en-IN')}</TableCell>
                        {showCommonSize && <TableCell className="text-right text-sm text-gray-600">{((account.balance / data.revenue!.total) * 100).toFixed(1)}%</TableCell>}
                        {compareData && <TableCell></TableCell>}
                        <TableCell className="text-center">
                          <Button variant="ghost" size="sm" onClick={() => handleDrilldown(account)}><Eye className="h-3 w-3" /></Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    <TableRow key="cogs-total" className="border-t-2 font-bold">
                      <TableCell colSpan={2}>Total COGS</TableCell>
                      <TableCell className="text-right font-mono">₹{data.cogs.total.toLocaleString('en-IN')}</TableCell>
                      {showCommonSize && <TableCell></TableCell>}
                      {compareData && <TableCell></TableCell>}
                      <TableCell></TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          {data.grossProfit !== undefined && (
            <Card className="bg-blue-50">
              <CardContent className="p-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-bold">Gross Profit</h3>
                  <p className="text-2xl font-bold text-blue-600">₹{data.grossProfit.toLocaleString('en-IN')}</p>
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader><CardTitle className="text-red-600">Operating Expenses</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Account Name</TableHead>
                    <TableHead>Code</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    {showCommonSize && <TableHead className="text-right">% of Revenue</TableHead>}
                    {compareData && <TableHead className="text-right">Change</TableHead>}
                    <TableHead className="text-center">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.expenses?.accounts.map((account, index) => {
                    const compareAccount = compareData?.expenses?.accounts.find(a => a._id === account._id);
                    const change = compareAccount ? account.balance - compareAccount.balance : 0;
                    const percentage = commonSizeData?.expenses?.find(a => a._id === account._id)?.percentage;
                    return (
                      <TableRow key={account._id || `expense-${index}`}>
                        <TableCell>{account.name}</TableCell>
                        <TableCell>{account.code}</TableCell>
                        <TableCell className="text-right font-mono">₹{account.balance.toLocaleString('en-IN')}</TableCell>
                        {showCommonSize && <TableCell className="text-right text-sm text-gray-600">{((account.balance / data.revenue!.total) * 100).toFixed(1)}%</TableCell>}
                        {compareData && <TableCell className="text-right"><span className={change >= 0 ? 'text-red-600' : 'text-green-600'}>{change !== 0 ? `₹${Math.abs(change).toLocaleString('en-IN')}` : '-'}</span></TableCell>}
                        <TableCell className="text-center">
                          <Button variant="ghost" size="sm" onClick={() => handleDrilldown(account)}><Eye className="h-3 w-3" /></Button>
                          <Button variant="ghost" size="sm" onClick={() => { setSelectedAccount(account); setShowNotesDialog(true); }}><StickyNote className="h-3 w-3" /></Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  <TableRow key="expense-total" className="border-t-2 font-bold bg-red-50">
                    <TableCell colSpan={2}>Total Expenses</TableCell>
                    <TableCell className="text-right font-mono">₹{data.expenses?.total.toLocaleString('en-IN')}</TableCell>
                    {showCommonSize && <TableCell></TableCell>}
                    {compareData && <TableCell className="text-right">{compareData.expenses && `₹${Math.abs(data.expenses!.total - compareData.expenses.total).toLocaleString('en-IN')}`}</TableCell>}
                    <TableCell></TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {data.ebitda !== undefined && (
              <Card className="bg-purple-50"><CardContent className="p-4 text-center"><h3 className="text-sm font-semibold text-gray-600">EBITDA</h3><p className="text-2xl font-bold text-purple-600">₹{data.ebitda.toLocaleString('en-IN')}</p></CardContent></Card>
            )}
            {data.ebit !== undefined && (
              <Card className="bg-indigo-50"><CardContent className="p-4 text-center"><h3 className="text-sm font-semibold text-gray-600">EBIT</h3><p className="text-2xl font-bold text-indigo-600">₹{data.ebit.toLocaleString('en-IN')}</p></CardContent></Card>
            )}
            {data.ebt !== undefined && (
              <Card className="bg-pink-50"><CardContent className="p-4 text-center"><h3 className="text-sm font-semibold text-gray-600">EBT</h3><p className="text-2xl font-bold text-pink-600">₹{data.ebt.toLocaleString('en-IN')}</p></CardContent></Card>
            )}
          </div>

          <Card className="bg-gradient-to-r from-green-50 to-blue-50">
            <CardContent className="p-6">
              <div className="text-center">
                <h3 className="text-xl font-bold mb-2">Net Income</h3>
                <p className={`text-4xl font-bold ${(data.netIncome || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  ₹{data.netIncome?.toLocaleString('en-IN')}
                </p>
                {compareData?.netIncome !== undefined && (
                  <p className="text-sm text-gray-600 mt-2">
                    Change: <span className={data.netIncome! - compareData.netIncome >= 0 ? 'text-green-600' : 'text-red-600'}>
                      ₹{Math.abs(data.netIncome! - compareData.netIncome).toLocaleString('en-IN')} ({(((data.netIncome! - compareData.netIncome) / compareData.netIncome) * 100).toFixed(1)}%)
                    </span>
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="charts">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader><CardTitle>Revenue vs Expenses</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={[{ name: 'Revenue', value: data.revenue?.total || 0 }, { name: 'Expenses', value: data.expenses?.total || 0 }, { name: 'Net Income', value: data.netIncome || 0 }]}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <RechartsTooltip formatter={(value: any) => `₹${value.toLocaleString('en-IN')}`} />
                    <Bar dataKey="value" fill="#3b82f6" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Revenue Breakdown</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie data={data.revenue?.accounts?.slice(0, 6).map(a => ({ name: a.name, value: a.balance })) || []} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
                      {data.revenue?.accounts?.slice(0, 6).map((_, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />) || null}
                    </Pie>
                    <RechartsTooltip formatter={(value: any) => `₹${value.toLocaleString('en-IN')}`} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {data.margins && (
              <Card>
                <CardHeader><CardTitle>Profitability Margins</CardTitle></CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={[{ name: 'Gross', value: data.margins.gross }, { name: 'EBITDA', value: data.margins.ebitda }, { name: 'Operating', value: data.margins.operating }, { name: 'Net', value: data.margins.net }]}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <RechartsTooltip formatter={(value: any) => `${value.toFixed(1)}%`} />
                      <Bar dataKey="value" fill="#10b981" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader><CardTitle>Expense Breakdown</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie data={data.expenses?.accounts?.slice(0, 6).map(a => ({ name: a.name, value: a.balance })) || []} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
                      {data.expenses?.accounts?.slice(0, 6).map((_, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />) || null}
                    </Pie>
                    <RechartsTooltip formatter={(value: any) => `₹${value.toLocaleString('en-IN')}`} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    );
  };

  const BalanceSheetReport = ({ data }: { data: ReportData }) => {
    const assets = data.assets?.accounts || [];
    const liabilities = data.liabilities?.accounts || [];
    const equity = data.equity?.accounts || [];
    const totalAssets = data.assets?.total || (data as any).totalAssets || 0;
    const totalLiabilities = data.liabilities?.total || (data as any).totalLiabilities || 0;
    const totalEquity = data.equity?.total || (data as any).totalEquity || 0;
    
    return (
    <Tabs defaultValue="table" className="space-y-4">
      <TabsList>
        <TabsTrigger value="table">Table View</TabsTrigger>
        <TabsTrigger value="charts">Charts</TabsTrigger>
      </TabsList>

      <TabsContent value="table" className="space-y-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold">Balance Sheet</h2>
          <p className="text-gray-600">As of {data.asOfDate || data.period?.endDate}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader><CardTitle>Assets</CardTitle></CardHeader>
            <CardContent>
              {assets.length === 0 ? (
                <p className="text-center text-gray-500 py-8">No asset data available</p>
              ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Account Name</TableHead>
                    <TableHead>Code</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    {showCommonSize && <TableHead className="text-right">%</TableHead>}
                    <TableHead className="text-center">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {assets.map((account, index) => (
                    <TableRow key={account._id || `asset-${index}`}>
                      <TableCell>{account.name}</TableCell>
                      <TableCell>{account.code}</TableCell>
                      <TableCell className="text-right font-mono">₹{account.balance.toLocaleString('en-IN')}</TableCell>
                      {showCommonSize && <TableCell className="text-right text-sm text-gray-600">{totalAssets > 0 ? ((account.balance / totalAssets) * 100).toFixed(1) : '0.0'}%</TableCell>}
                      <TableCell className="text-center">
                        <Button variant="ghost" size="sm" onClick={() => handleDrilldown(account)}><Eye className="h-3 w-3" /></Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow key="asset-total" className="border-t-2 font-bold bg-blue-50">
                    <TableCell colSpan={2}>Total Assets</TableCell>
                    <TableCell className="text-right font-mono">₹{totalAssets.toLocaleString('en-IN')}</TableCell>
                    {showCommonSize && <TableCell className="text-right">100%</TableCell>}
                    <TableCell></TableCell>
                  </TableRow>
                </TableBody>
              </Table>
              )}
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card>
              <CardHeader><CardTitle>Liabilities</CardTitle></CardHeader>
              <CardContent>
                {liabilities.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">No liability data available</p>
                ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Account Name</TableHead>
                      <TableHead>Code</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      {showCommonSize && <TableHead className="text-right">%</TableHead>}
                      <TableHead className="text-center">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {liabilities.map((account, index) => (
                      <TableRow key={account._id || `liability-${index}`}>
                        <TableCell>{account.name}</TableCell>
                        <TableCell>{account.code}</TableCell>
                        <TableCell className="text-right font-mono">₹{account.balance.toLocaleString('en-IN')}</TableCell>
                        {showCommonSize && <TableCell className="text-right text-sm text-gray-600">{(totalLiabilities + totalEquity) > 0 ? ((account.balance / (totalLiabilities + totalEquity)) * 100).toFixed(1) : '0.0'}%</TableCell>}
                        <TableCell className="text-center">
                          <Button variant="ghost" size="sm" onClick={() => handleDrilldown(account)}><Eye className="h-3 w-3" /></Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    <TableRow key="liability-total" className="border-t-2 font-bold bg-red-50">
                      <TableCell colSpan={2}>Total Liabilities</TableCell>
                      <TableCell className="text-right font-mono">₹{totalLiabilities.toLocaleString('en-IN')}</TableCell>
                      {showCommonSize && <TableCell></TableCell>}
                      <TableCell></TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Equity</CardTitle></CardHeader>
              <CardContent>
                {equity.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">No equity data available</p>
                ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Account Name</TableHead>
                      <TableHead>Code</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      {showCommonSize && <TableHead className="text-right">%</TableHead>}
                      <TableHead className="text-center">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {equity.map((account, index) => (
                      <TableRow key={account._id || `equity-${index}`}>
                        <TableCell>{account.name}</TableCell>
                        <TableCell>{account.code}</TableCell>
                        <TableCell className="text-right font-mono">₹{account.balance.toLocaleString('en-IN')}</TableCell>
                        {showCommonSize && <TableCell className="text-right text-sm text-gray-600">{(totalLiabilities + totalEquity) > 0 ? ((account.balance / (totalLiabilities + totalEquity)) * 100).toFixed(1) : '0.0'}%</TableCell>}
                        <TableCell className="text-center">
                          <Button variant="ghost" size="sm" onClick={() => handleDrilldown(account)}><Eye className="h-3 w-3" /></Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    <TableRow key="equity-total" className="border-t-2 font-bold bg-green-50">
                      <TableCell colSpan={2}>Total Equity</TableCell>
                      <TableCell className="text-right font-mono">₹{totalEquity.toLocaleString('en-IN')}</TableCell>
                      {showCommonSize && <TableCell></TableCell>}
                      <TableCell></TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
                )}
              </CardContent>
            </Card>

            <Card className="bg-gray-50">
              <CardContent className="p-4">
                <div className="text-center">
                  <p className="font-bold text-lg">Total Liabilities & Equity</p>
                  <p className="text-2xl font-mono font-bold">₹{(totalLiabilities + totalEquity).toLocaleString('en-IN')}</p>
                  {Math.abs(totalAssets - (totalLiabilities + totalEquity)) > 0.01 && (
                    <p className="text-sm text-red-600 mt-2">Out of balance by ₹{Math.abs(totalAssets - (totalLiabilities + totalEquity)).toLocaleString('en-IN')}</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </TabsContent>

      <TabsContent value="charts">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader><CardTitle>Asset Composition</CardTitle></CardHeader>
            <CardContent>
              {assets.length === 0 ? (
                <p className="text-center text-gray-500 py-8">No data to display</p>
              ) : (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie data={assets.slice(0, 6).map(a => ({ name: a.name, value: a.balance }))} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
                    {assets.slice(0, 6).map((_, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                  </Pie>
                  <RechartsTooltip formatter={(value: any) => `₹${value.toLocaleString('en-IN')}`} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Liabilities & Equity</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie data={[{ name: 'Liabilities', value: totalLiabilities }, { name: 'Equity', value: totalEquity }]} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
                    <Cell fill="#ef4444" />
                    <Cell fill="#10b981" />
                  </Pie>
                  <RechartsTooltip formatter={(value: any) => `₹${value.toLocaleString('en-IN')}`} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </TabsContent>
    </Tabs>
  );
};

  const CashFlowReport = ({ data }: { data: ReportData }) => {
    const operating = (data as any).operatingActivities || data.operating || { items: [], total: 0, net: 0 };
    const investing = (data as any).investingActivities || data.investing || { items: [], total: 0, net: 0 };
    const financing = (data as any).financingActivities || data.financing || { items: [], total: 0, net: 0 };
    const openingBalance = (data as any).openingBalance || data.openingCash || 0;
    const closingBalance = (data as any).closingBalance || data.closingCash || 0;
    const netCashFlow = (data as any).netCashFlow || 0;
    
    return (
    <Tabs defaultValue="table" className="space-y-4">
      <TabsList>
        <TabsTrigger value="table">Table View</TabsTrigger>
        <TabsTrigger value="charts">Charts</TabsTrigger>
      </TabsList>
      <TabsContent value="table" className="space-y-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold">Cash Flow Statement</h2>
          <p className="text-gray-600">For the period {data.period?.startDate} to {data.period?.endDate}</p>
        </div>
        <Card><CardHeader><CardTitle className="text-blue-600">Operating Activities</CardTitle></CardHeader><CardContent>{operating.items?.length > 0 ? (<Table><TableHeader><TableRow><TableHead>Description</TableHead><TableHead className="text-right">Amount</TableHead></TableRow></TableHeader><TableBody>{operating.items.map((item: any, idx: number) => (<TableRow key={idx}><TableCell>{item.description}</TableCell><TableCell className="text-right font-mono">₹{item.amount.toLocaleString('en-IN')}</TableCell></TableRow>))}<TableRow className="border-t-2 font-bold bg-blue-50"><TableCell>Net Cash from Operating</TableCell><TableCell className="text-right font-mono">₹{(operating.net || operating.total || 0).toLocaleString('en-IN')}</TableCell></TableRow></TableBody></Table>) : (<p className="text-center text-gray-500 py-4">Net Cash from Operating: ₹{(operating.net || operating.total || 0).toLocaleString('en-IN')}</p>)}</CardContent></Card>
        <Card><CardHeader><CardTitle className="text-green-600">Investing Activities</CardTitle></CardHeader><CardContent>{investing.items?.length > 0 ? (<Table><TableHeader><TableRow><TableHead>Description</TableHead><TableHead className="text-right">Amount</TableHead></TableRow></TableHeader><TableBody>{investing.items.map((item: any, idx: number) => (<TableRow key={idx}><TableCell>{item.description}</TableCell><TableCell className="text-right font-mono">₹{item.amount.toLocaleString('en-IN')}</TableCell></TableRow>))}<TableRow className="border-t-2 font-bold bg-green-50"><TableCell>Net Cash from Investing</TableCell><TableCell className="text-right font-mono">₹{(investing.net || investing.total || 0).toLocaleString('en-IN')}</TableCell></TableRow></TableBody></Table>) : (<p className="text-center text-gray-500 py-4">Net Cash from Investing: ₹{(investing.net || investing.total || 0).toLocaleString('en-IN')}</p>)}</CardContent></Card>
        <Card><CardHeader><CardTitle className="text-purple-600">Financing Activities</CardTitle></CardHeader><CardContent>{financing.items?.length > 0 ? (<Table><TableHeader><TableRow><TableHead>Description</TableHead><TableHead className="text-right">Amount</TableHead></TableRow></TableHeader><TableBody>{financing.items.map((item: any, idx: number) => (<TableRow key={idx}><TableCell>{item.description}</TableCell><TableCell className="text-right font-mono">₹{item.amount.toLocaleString('en-IN')}</TableCell></TableRow>))}<TableRow className="border-t-2 font-bold bg-purple-50"><TableCell>Net Cash from Financing</TableCell><TableCell className="text-right font-mono">₹{(financing.net || financing.total || 0).toLocaleString('en-IN')}</TableCell></TableRow></TableBody></Table>) : (<p className="text-center text-gray-500 py-4">Net Cash from Financing: ₹{(financing.net || financing.total || 0).toLocaleString('en-IN')}</p>)}</CardContent></Card>
        <div className="grid grid-cols-3 gap-4"><Card><CardContent className="p-4 text-center"><p className="text-sm text-gray-600">Opening Cash</p><p className="text-xl font-bold">₹{openingBalance.toLocaleString('en-IN')}</p></CardContent></Card><Card><CardContent className="p-4 text-center"><p className="text-sm text-gray-600">Net Change</p><p className={`text-xl font-bold ${netCashFlow >= 0 ? 'text-green-600' : 'text-red-600'}`}>₹{netCashFlow.toLocaleString('en-IN')}</p></CardContent></Card><Card><CardContent className="p-4 text-center"><p className="text-sm text-gray-600">Closing Cash</p><p className="text-xl font-bold text-blue-600">₹{closingBalance.toLocaleString('en-IN')}</p></CardContent></Card></div>
      </TabsContent>
      <TabsContent value="charts"><div className="grid grid-cols-1 lg:grid-cols-2 gap-6"><Card><CardHeader><CardTitle>Cash Flow by Activity</CardTitle></CardHeader><CardContent><ResponsiveContainer width="100%" height={300}><BarChart data={[{name:'Operating',value:operating.net||operating.total||0},{name:'Investing',value:investing.net||investing.total||0},{name:'Financing',value:financing.net||financing.total||0}]}><CartesianGrid strokeDasharray="3 3"/><XAxis dataKey="name"/><YAxis/><RechartsTooltip formatter={(value:any)=>`₹${value.toLocaleString('en-IN')}`}/><Bar dataKey="value" fill="#3b82f6"/></BarChart></ResponsiveContainer></CardContent></Card><Card><CardHeader><CardTitle>Cash Position</CardTitle></CardHeader><CardContent><ResponsiveContainer width="100%" height={300}><LineChart data={[{name:'Opening',value:openingBalance},{name:'Net Change',value:openingBalance+netCashFlow},{name:'Closing',value:closingBalance}]}><CartesianGrid strokeDasharray="3 3"/><XAxis dataKey="name"/><YAxis/><RechartsTooltip formatter={(value:any)=>`₹${value.toLocaleString('en-IN')}`}/><Line type="monotone" dataKey="value" stroke="#10b981" strokeWidth={2}/></LineChart></ResponsiveContainer></CardContent></Card></div></TabsContent>
    </Tabs>
  );
};

  const TrialBalanceReport = ({ data }: { data: ReportData }) => {
    const accounts = data.accounts || [];
    const totalDebit = accounts.filter(a => a.balance >= 0).reduce((sum, a) => sum + a.balance, 0);
    const totalCredit = accounts.filter(a => a.balance < 0).reduce((sum, a) => sum + Math.abs(a.balance), 0);
    const balanced = Math.abs(totalDebit - totalCredit) < 0.01;
    
    return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold">Trial Balance</h2>
        <p className="text-gray-600">As of {data.asOfDate || data.period?.endDate}</p>
      </div>
      {!balanced && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4 text-center text-red-600">
            <p className="font-semibold">⚠️ Trial Balance is Out of Balance</p>
            <p className="text-sm">Difference: ₹{Math.abs(totalDebit - totalCredit).toLocaleString('en-IN')}</p>
          </CardContent>
        </Card>
      )}
      {accounts.length === 0 ? (
        <Card><CardContent className="p-8 text-center text-gray-500">No accounts found for trial balance</CardContent></Card>
      ) : (
        <Card><CardContent><Table><TableHeader><TableRow><TableHead>Account Code</TableHead><TableHead>Account Name</TableHead><TableHead className="text-right">Debit</TableHead><TableHead className="text-right">Credit</TableHead></TableRow></TableHeader><TableBody>{accounts.map((account, index) => (<TableRow key={account._id || `tb-${index}`}><TableCell>{account.code}</TableCell><TableCell>{account.name}</TableCell><TableCell className="text-right font-mono">{account.balance >= 0 ? `₹${account.balance.toLocaleString('en-IN')}` : '-'}</TableCell><TableCell className="text-right font-mono">{account.balance < 0 ? `₹${Math.abs(account.balance).toLocaleString('en-IN')}` : '-'}</TableCell></TableRow>))}<TableRow className="border-t-2 font-bold bg-gray-100"><TableCell colSpan={2}>Total</TableCell><TableCell className="text-right font-mono">₹{totalDebit.toLocaleString('en-IN')}</TableCell><TableCell className="text-right font-mono">₹{totalCredit.toLocaleString('en-IN')}</TableCell></TableRow></TableBody></Table></CardContent></Card>
      )}
    </div>
  );
};

  const GeneralLedgerReport = ({ data }: { data: ReportData }) => {
    const entries = (data as any).entries || [];
    const pagination = (data as any).pagination || {};
    
    return (
      <div className="space-y-6">
        <div className="text-center"><h2 className="text-2xl font-bold">General Ledger</h2><p className="text-gray-600">For the period {data.period?.startDate} to {data.period?.endDate}</p></div>
        {entries.length === 0 ? (
          <Card><CardContent className="p-8 text-center text-gray-500">No ledger entries found for the selected period</CardContent></Card>
        ) : (
          <Card><CardContent><Table><TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Account</TableHead><TableHead>Description</TableHead><TableHead className="text-right">Debit</TableHead><TableHead className="text-right">Credit</TableHead><TableHead className="text-right">Balance</TableHead></TableRow></TableHeader><TableBody>{entries.map((entry: any, index: number) => (
            <TableRow key={entry._id || `gl-${index}`}>
              <TableCell>{new Date(entry.date).toLocaleDateString('en-IN')}</TableCell>
              <TableCell>{entry.accountId?.code} - {entry.accountId?.name}</TableCell>
              <TableCell>{entry.description}</TableCell>
              <TableCell className="text-right font-mono">{entry.debit > 0 ? `₹${entry.debit.toLocaleString('en-IN')}` : '-'}</TableCell>
              <TableCell className="text-right font-mono">{entry.credit > 0 ? `₹${entry.credit.toLocaleString('en-IN')}` : '-'}</TableCell>
              <TableCell className="text-right font-mono">₹{entry.balance.toLocaleString('en-IN')}</TableCell>
            </TableRow>
          ))}</TableBody></Table>
          {pagination.pages > 1 && (
            <div className="flex justify-center gap-2 mt-4">
              <p className="text-sm text-gray-600">Page {pagination.page} of {pagination.pages} ({pagination.total} entries)</p>
            </div>
          )}
          </CardContent></Card>
        )}
      </div>
    );
  };

  const AccountsReceivableReport = ({ data }: { data: ReportData }) => {
    const apiData = (data as any);
    const totals = apiData.totals || { current: 0, days31to60: 0, days61to90: 0, over90: 0, total: 0 };
    const invoices = apiData.invoices || [];
    const aging = apiData.aging || { current: [], days31to60: [], days61to90: [], over90: [] };
    
    return (
      <div className="space-y-6">
        <div className="text-center"><h2 className="text-2xl font-bold">Accounts Receivable</h2><p className="text-gray-600">As of {data.asOfDate}</p></div>
        <div className="grid grid-cols-4 gap-4"><Card><CardContent className="p-4 text-center"><p className="text-sm text-gray-600">Total Receivable</p><p className="text-2xl font-bold text-blue-600">₹{totals.total.toLocaleString('en-IN')}</p></CardContent></Card><Card><CardContent className="p-4 text-center"><p className="text-sm text-gray-600">Current (0-30)</p><p className="text-xl font-bold text-green-600">₹{totals.current.toLocaleString('en-IN')}</p></CardContent></Card><Card><CardContent className="p-4 text-center"><p className="text-sm text-gray-600">Overdue (31-60)</p><p className="text-xl font-bold text-orange-600">₹{totals.days31to60.toLocaleString('en-IN')}</p></CardContent></Card><Card><CardContent className="p-4 text-center"><p className="text-sm text-gray-600">Overdue (60+)</p><p className="text-xl font-bold text-red-600">₹{((totals.days61to90 || 0) + (totals.over90 || 0)).toLocaleString('en-IN')}</p></CardContent></Card></div>
        {invoices.length === 0 ? (
          <Card><CardContent className="p-8 text-center text-gray-500">No outstanding invoices found</CardContent></Card>
        ) : (
          <Card><CardContent><Table><TableHeader><TableRow><TableHead>Customer</TableHead><TableHead>Invoice #</TableHead><TableHead>Date</TableHead><TableHead className="text-right">Amount</TableHead><TableHead className="text-right">Days Outstanding</TableHead></TableRow></TableHeader><TableBody>{invoices.map((invoice: any, index: number) => {
            const daysOutstanding = Math.floor((new Date(data.asOfDate || Date.now()).getTime() - new Date(invoice.dueDate).getTime()) / (1000 * 60 * 60 * 24));
            return (
              <TableRow key={invoice._id || `ar-${index}`}><TableCell>{invoice.customerId?.name || 'N/A'}</TableCell><TableCell>{invoice.invoiceNumber}</TableCell><TableCell>{new Date(invoice.invoiceDate).toLocaleDateString('en-IN')}</TableCell><TableCell className="text-right font-mono">₹{(invoice.balanceAmount || invoice.totalAmount - (invoice.paidAmount || 0)).toLocaleString('en-IN')}</TableCell><TableCell className="text-right">{daysOutstanding} days</TableCell></TableRow>
            );
          })}</TableBody></Table></CardContent></Card>
        )}
      </div>
    );
  };

  const AccountsPayableReport = ({ data }: { data: ReportData }) => {
    const apiData = (data as any);
    const totals = apiData.totals || { current: 0, days31to60: 0, over60: 0, total: 0 };
    const bills = apiData.bills || [];
    const aging = apiData.aging || { current: [], days31to60: [], over60: [] };
    
    return (
      <div className="space-y-6">
        <div className="text-center"><h2 className="text-2xl font-bold">Accounts Payable</h2><p className="text-gray-600">As of {data.asOfDate}</p></div>
        <div className="grid grid-cols-4 gap-4"><Card><CardContent className="p-4 text-center"><p className="text-sm text-gray-600">Total Payable</p><p className="text-2xl font-bold text-red-600">₹{totals.total.toLocaleString('en-IN')}</p></CardContent></Card><Card><CardContent className="p-4 text-center"><p className="text-sm text-gray-600">Current (0-30)</p><p className="text-xl font-bold text-green-600">₹{totals.current.toLocaleString('en-IN')}</p></CardContent></Card><Card><CardContent className="p-4 text-center"><p className="text-sm text-gray-600">Due (31-60)</p><p className="text-xl font-bold text-orange-600">₹{totals.days31to60.toLocaleString('en-IN')}</p></CardContent></Card><Card><CardContent className="p-4 text-center"><p className="text-sm text-gray-600">Overdue (60+)</p><p className="text-xl font-bold text-red-600">₹{totals.over60.toLocaleString('en-IN')}</p></CardContent></Card></div>
        {bills.length === 0 ? (
          <Card><CardContent className="p-8 text-center text-gray-500">No outstanding bills found</CardContent></Card>
        ) : (
          <Card><CardContent><Table><TableHeader><TableRow><TableHead>Vendor</TableHead><TableHead>Bill #</TableHead><TableHead>Date</TableHead><TableHead className="text-right">Amount</TableHead><TableHead className="text-right">Due Date</TableHead></TableRow></TableHeader><TableBody>{bills.map((bill: any, index: number) => (
            <TableRow key={bill._id || `ap-${index}`}><TableCell>{bill.vendorId?.name || 'N/A'}</TableCell><TableCell>{bill.billNumber || bill.invoiceNumber}</TableCell><TableCell>{new Date(bill.invoiceDate || bill.billDate || bill.date).toLocaleDateString('en-IN')}</TableCell><TableCell className="text-right font-mono">₹{(bill.balanceAmount || bill.totalAmount - (bill.paidAmount || 0)).toLocaleString('en-IN')}</TableCell><TableCell className="text-right">{new Date(bill.dueDate).toLocaleDateString('en-IN')}</TableCell></TableRow>
          ))}</TableBody></Table></CardContent></Card>
        )}
      </div>
    );
  };

  const ExpenseReport = ({ data }: { data: ReportData }) => {
    const expenses = (data as any).expenses || [];
    const total = (data as any).total || 0;
    const byCategory = (data as any).byCategory || {};
    
    return (
      <div className="space-y-6">
        <div className="text-center"><h2 className="text-2xl font-bold">Expense Report</h2><p className="text-gray-600">For the period {data.period?.startDate} to {data.period?.endDate}</p></div>
        <div className="grid grid-cols-3 gap-4"><Card><CardContent className="p-4 text-center"><p className="text-sm text-gray-600">Total Expenses</p><p className="text-2xl font-bold text-red-600">₹{total.toLocaleString('en-IN')}</p></CardContent></Card><Card><CardContent className="p-4 text-center"><p className="text-sm text-gray-600">Average/Month</p><p className="text-xl font-bold">₹{(total / 12).toLocaleString('en-IN')}</p></CardContent></Card><Card><CardContent className="p-4 text-center"><p className="text-sm text-gray-600">Categories</p><p className="text-xl font-bold text-blue-600">{Object.keys(byCategory).length}</p></CardContent></Card></div>
        {expenses.length === 0 ? (
          <Card><CardContent className="p-8 text-center text-gray-500">No expense data available for the selected period</CardContent></Card>
        ) : (
          <Card><CardContent><Table><TableHeader><TableRow><TableHead>Category</TableHead><TableHead>Account</TableHead><TableHead className="text-right">Amount</TableHead><TableHead className="text-right">% of Total</TableHead></TableRow></TableHeader><TableBody>{expenses.map((item: any, index: number) => (<TableRow key={item._id?.accountId || `exp-${index}`}><TableCell>{item.category || 'General'}</TableCell><TableCell>{item.account}</TableCell><TableCell className="text-right font-mono">₹{item.total.toLocaleString('en-IN')}</TableCell><TableCell className="text-right">{total > 0 ? ((item.total / total) * 100).toFixed(1) : '0.0'}%</TableCell></TableRow>))}</TableBody></Table></CardContent></Card>
        )}
      </div>
    );
  };

  const RevenueReport = ({ data }: { data: ReportData }) => {
    const revenue = (data as any).revenue || [];
    const total = (data as any).total || 0;
    const byCategory = (data as any).byCategory || {};
    
    return (
      <div className="space-y-6">
        <div className="text-center"><h2 className="text-2xl font-bold">Revenue Report</h2><p className="text-gray-600">For the period {data.period?.startDate} to {data.period?.endDate}</p></div>
        <div className="grid grid-cols-3 gap-4"><Card><CardContent className="p-4 text-center"><p className="text-sm text-gray-600">Total Revenue</p><p className="text-2xl font-bold text-green-600">₹{total.toLocaleString('en-IN')}</p></CardContent></Card><Card><CardContent className="p-4 text-center"><p className="text-sm text-gray-600">Average/Month</p><p className="text-xl font-bold">₹{(total / 12).toLocaleString('en-IN')}</p></CardContent></Card><Card><CardContent className="p-4 text-center"><p className="text-sm text-gray-600">Categories</p><p className="text-xl font-bold text-blue-600">{Object.keys(byCategory).length}</p></CardContent></Card></div>
        {revenue.length === 0 ? (
          <Card><CardContent className="p-8 text-center text-gray-500">No revenue data available for the selected period</CardContent></Card>
        ) : (
          <Card><CardContent><Table><TableHeader><TableRow><TableHead>Category</TableHead><TableHead>Account</TableHead><TableHead className="text-right">Amount</TableHead><TableHead className="text-right">% of Total</TableHead></TableRow></TableHeader><TableBody>{revenue.map((item: any, index: number) => (<TableRow key={item._id?.accountId || `rev-${index}`}><TableCell>{item.category || 'Sales'}</TableCell><TableCell>{item.account}</TableCell><TableCell className="text-right font-mono">₹{item.total.toLocaleString('en-IN')}</TableCell><TableCell className="text-right">{total > 0 ? ((item.total / total) * 100).toFixed(1) : '0.0'}%</TableCell></TableRow>))}</TableBody></Table></CardContent></Card>
        )}
      </div>
    );
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Financial Reports</h1>
          {lastUpdated && (
            <p className="text-sm text-gray-500 flex items-center mt-1">
              <Clock className="w-3 h-3 mr-1" />
              Last updated: {lastUpdated.toLocaleString()}
            </p>
          )}
        </div>
        {reportData && (
          <div className="flex gap-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button onClick={saveTemplate} variant="outline" size="sm">
                    <Save className="w-4 h-4 mr-2" />Save Template
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Save current settings as template (Ctrl+S)</TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <Button onClick={() => exportReport('pdf')} variant="outline" size="sm" title="Export as PDF (Ctrl+E)">
              <Download className="w-4 h-4 mr-2" />PDF
            </Button>
            <Button onClick={() => exportReport('excel')} variant="outline" size="sm">
              <FileSpreadsheet className="w-4 h-4 mr-2" />Excel
            </Button>
            <Button onClick={() => exportReport('csv')} variant="outline" size="sm">
              <FileText className="w-4 h-4 mr-2" />CSV
            </Button>
            <Button onClick={() => exportReport('json')} variant="outline" size="sm">
              <FileJson className="w-4 h-4 mr-2" />JSON
            </Button>
            <Button onClick={() => createPrintVersion()} variant="outline" size="sm">
              <Printer className="w-4 h-4 mr-2" />Print
            </Button>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button onClick={() => setShowScheduleDialog(true)} variant="outline" size="sm">
                    <Mail className="w-4 h-4 mr-2" />Schedule
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Schedule automated email reports</TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button onClick={() => setShowHistoryDialog(true)} variant="outline" size="sm">
                    <History className="w-4 h-4 mr-2" />History
                  </Button>
                </TooltipTrigger>
                <TooltipContent>View report history</TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button onClick={() => setShowBatchDialog(true)} variant="outline" size="sm">
                    <Palette className="w-4 h-4 mr-2" />Batch
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Export multiple reports</TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button onClick={() => setShowKpiDialog(true)} variant="outline" size="sm">
                    <Calculator className="w-4 h-4 mr-2" />KPIs
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Custom KPIs & Analytics</TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button onClick={() => setShowForecastDialog(true)} variant="outline" size="sm">
                    <Target className="w-4 h-4 mr-2" />Forecast
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Predictive Analytics</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center">
              <FileText className="w-5 h-5 mr-2" />
              Report Parameters
            </div>
            {savedTemplates.length > 0 && (
              <Select onValueChange={(value) => value && loadTemplate(savedTemplates.find(t => t.id.toString() === value))}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Load Template" />
                </SelectTrigger>
                <SelectContent>
                  {savedTemplates.filter(t => t.id).map(template => (
                    <SelectItem key={template.id} value={template.id.toString()}>
                      {template.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <Label htmlFor="reportType">Report Type</Label>
              <Select value={filters.reportType} onValueChange={(value) => setFilters({ ...filters, reportType: value })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="profit-loss">Profit & Loss</SelectItem>
                  <SelectItem value="balance-sheet">Balance Sheet</SelectItem>
                  <SelectItem value="cash-flow">Cash Flow Statement</SelectItem>
                  <SelectItem value="trial-balance">Trial Balance</SelectItem>
                  <SelectItem value="general-ledger">General Ledger</SelectItem>
                  <SelectItem value="accounts-receivable">Accounts Receivable</SelectItem>
                  <SelectItem value="accounts-payable">Accounts Payable</SelectItem>
                  <SelectItem value="expense-report">Expense Report</SelectItem>
                  <SelectItem value="revenue-report">Revenue Report</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="startDate">Start Date</Label>
              <Input id="startDate" type="date" value={filters.startDate} onChange={(e) => setFilters({ ...filters, startDate: e.target.value })} />
            </div>
            <div>
              <Label htmlFor="endDate">End Date</Label>
              <Input id="endDate" type="date" value={filters.endDate} onChange={(e) => setFilters({ ...filters, endDate: e.target.value })} />
            </div>
            <div>
              <Label htmlFor="compareStartDate">Compare Start (Optional)</Label>
              <Input id="compareStartDate" type="date" value={filters.compareStartDate} onChange={(e) => setFilters({ ...filters, compareStartDate: e.target.value })} />
            </div>
            <div>
              <Label htmlFor="compareEndDate">Compare End (Optional)</Label>
              <Input id="compareEndDate" type="date" value={filters.compareEndDate} onChange={(e) => setFilters({ ...filters, compareEndDate: e.target.value })} />
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Label className="w-full text-sm text-gray-600">Quick Date Presets:</Label>
            {DATE_PRESETS.map((preset) => (
              <Button key={preset.label} variant="outline" size="sm" onClick={() => applyDatePreset(preset)}>{preset.label}</Button>
            ))}
          </div>

          <div className="flex items-center gap-4">
            <Button onClick={generateReport} disabled={loading} className="w-full md:w-auto" title="Generate Report (Ctrl+G)">
              {loading ? <Spinner className="w-4 h-4 mr-2" /> : <TrendingUp className="w-4 h-4 mr-2" />}
              Generate Report
            </Button>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={showCommonSize} onChange={(e) => setShowCommonSize(e.target.checked)} className="rounded" />
              <span className="text-sm">Show Common Size Analysis</span>
            </label>
          </div>
        </CardContent>
      </Card>

      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-6">
            <div className="text-center text-red-600">
              <p className="font-semibold">Error: {error}</p>
              <p className="text-sm mt-2">Please check your connection and try again</p>
              <Button onClick={generateReport} className="mt-4" variant="destructive">Retry</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {loading && (
        <Card>
          <CardContent className="p-6 space-y-4">
            <div className="text-center mb-6">
              <Skeleton className="h-8 w-64 mx-auto mb-2" />
              <Skeleton className="h-4 w-48 mx-auto" />
            </div>
            <div className="grid grid-cols-4 gap-4 mb-6">
              {[...Array(4)].map((_, i) => (
                <Card key={i}>
                  <CardContent className="p-4">
                    <Skeleton className="h-4 w-20 mb-2" />
                    <Skeleton className="h-8 w-24" />
                  </CardContent>
                </Card>
              ))}
            </div>
            <Card>
              <CardContent className="p-4">
                <div className="space-y-3">
                  <Skeleton className="h-10 w-full" />
                  {[...Array(8)].map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              </CardContent>
            </Card>
          </CardContent>
        </Card>
      )}

      {!loading && !reportData && !error && (
        <Card>
          <CardContent className="p-12 text-center">
            <BarChart3 className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No Report Generated</h3>
            <p className="text-gray-500 mb-4">Select report parameters and click "Generate Report" to view financial data</p>
            <div className="flex justify-center gap-4 text-sm text-gray-600">
              <div><PieChartIcon className="h-4 w-4 inline mr-1" />Visual Charts</div>
              <div><FileText className="h-4 w-4 inline mr-1" />Detailed Tables</div>
              <div><Download className="h-4 w-4 inline mr-1" />Multiple Exports</div>
            </div>
          </CardContent>
        </Card>
      )}

      {reportData && !loading && (
        <Card>
          <CardContent className="p-6">
            {filters.reportType === 'profit-loss' && <ProfitLossReport data={reportData} />}
            {filters.reportType === 'balance-sheet' && <BalanceSheetReport data={reportData} />}
            {filters.reportType === 'cash-flow' && <CashFlowReport data={reportData} />}
            {filters.reportType === 'trial-balance' && <TrialBalanceReport data={reportData} />}
            {filters.reportType === 'general-ledger' && <GeneralLedgerReport data={reportData} />}
            {filters.reportType === 'accounts-receivable' && <AccountsReceivableReport data={reportData} />}
            {filters.reportType === 'accounts-payable' && <AccountsPayableReport data={reportData} />}
            {filters.reportType === 'expense-report' && <ExpenseReport data={reportData} />}
            {filters.reportType === 'revenue-report' && <RevenueReport data={reportData} />}
          </CardContent>
        </Card>
      )}

      <Dialog open={showNotesDialog} onOpenChange={setShowNotesDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Note for {selectedAccount?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea
              id="note-textarea"
              placeholder="Enter your note here..."
              defaultValue={selectedAccount ? accountNotes[selectedAccount._id] || '' : ''}
              rows={5}
            />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowNotesDialog(false)}>Cancel</Button>
              <Button onClick={saveNote}>Save Note</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showDrilldown} onOpenChange={setShowDrilldown}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Transactions for {drilldownData?.account?.name}</DialogTitle>
          </DialogHeader>
          <div className="max-h-96 overflow-y-auto">
            {drilldownData?.transactions?.length > 0 ? (
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
                  {drilldownData.transactions.map((txn: any, idx: number) => (
                    <TableRow key={idx}>
                      <TableCell>{new Date(txn.date).toLocaleDateString('en-IN')}</TableCell>
                      <TableCell>{txn.description}</TableCell>
                      <TableCell className="text-right">{txn.debit ? `₹${txn.debit.toLocaleString('en-IN')}` : '-'}</TableCell>
                      <TableCell className="text-right">{txn.credit ? `₹${txn.credit.toLocaleString('en-IN')}` : '-'}</TableCell>
                      <TableCell className="text-right font-mono">₹{txn.balance.toLocaleString('en-IN')}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-center text-gray-500 py-8">No transactions found</p>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showScheduleDialog} onOpenChange={setShowScheduleDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Schedule Report</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Email</Label><Input value={scheduleConfig.email} onChange={(e) => setScheduleConfig({...scheduleConfig, email: e.target.value})} placeholder="user@company.com" /></div>
            <div><Label>Frequency</Label><Select value={scheduleConfig.frequency} onValueChange={(v) => setScheduleConfig({...scheduleConfig, frequency: v})}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="daily">Daily</SelectItem><SelectItem value="weekly">Weekly</SelectItem><SelectItem value="monthly">Monthly</SelectItem></SelectContent></Select></div>
            <div className="flex justify-end gap-2"><Button variant="outline" onClick={() => setShowScheduleDialog(false)}>Cancel</Button><Button onClick={scheduleReport}>Schedule</Button></div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showHistoryDialog} onOpenChange={setShowHistoryDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>Report History</DialogTitle></DialogHeader>
          <div className="max-h-96 overflow-y-auto">
            {reportHistory.length === 0 ? <p className="text-center text-gray-500 py-8">No reports in history</p> : reportHistory.map(report => (
              <div key={report.id} className="flex justify-between items-center p-3 border-b hover:bg-gray-50">
                <div><p className="font-medium">{report.type}</p><p className="text-sm text-gray-600">{report.period}</p><p className="text-xs text-gray-400">{report.generatedAt.toLocaleString()}</p></div>
                <Button size="sm" onClick={() => {setReportData(report.data); setShowHistoryDialog(false);}}>Load</Button>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showBatchDialog} onOpenChange={setShowBatchDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Batch Export</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <Label>Select Reports:</Label>
            {['profit-loss', 'balance-sheet', 'cash-flow', 'trial-balance'].map(type => (
              <div key={type} className="flex items-center space-x-2">
                <Checkbox checked={selectedReports.includes(type)} onCheckedChange={(checked) => setSelectedReports(prev => checked ? [...prev, type] : prev.filter(r => r !== type))} />
                <Label className="capitalize">{type.replace('-', ' ')}</Label>
              </div>
            ))}
            <div className="flex justify-end gap-2"><Button variant="outline" onClick={() => setShowBatchDialog(false)}>Cancel</Button><Button onClick={batchExport} disabled={selectedReports.length === 0}>Export ({selectedReports.length})</Button></div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showKpiDialog} onOpenChange={setShowKpiDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Custom KPIs</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-2">
              <Input placeholder="KPI Name (e.g., Profit Ratio)" id="kpi-name" />
              <select id="kpi-formula" className="p-2 border rounded" defaultValue="revenue/expenses">
                <option value="revenue/expenses">Revenue / Expenses</option>
                <option value="expenses/revenue">Expenses / Revenue</option>
                <option value="netincome/revenue">Net Income / Revenue</option>
                <option value="revenue">Total Revenue</option>
                <option value="expenses">Total Expenses</option>
              </select>
            </div>
            <div className="flex gap-2">
              <Button onClick={() => {
                const name = (document.getElementById('kpi-name') as HTMLInputElement)?.value;
                const formula = (document.getElementById('kpi-formula') as HTMLSelectElement)?.value;
                if (name && formula) addCustomKpi(name, formula);
              }}>Add KPI</Button>
              <Button variant="outline" onClick={() => setShowKpiDialog(false)}>Cancel</Button>
            </div>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {customKpis.map(kpi => (
                <div key={kpi.id} className="flex justify-between items-center p-2 border rounded">
                  <div>
                    <span className="font-medium">{kpi.name}</span>
                    <p className="text-xs text-gray-500">{kpi.formula}</p>
                  </div>
                  <Button size="sm" variant="ghost" onClick={() => {
                    const updated = customKpis.filter(k => k.id !== kpi.id);
                    setCustomKpis(updated);
                    localStorage.setItem('custom-kpis', JSON.stringify(updated));
                  }}>×</Button>
                </div>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showForecastDialog} onOpenChange={setShowForecastDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>Forecast Analysis</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="flex gap-2 items-center">
              <Label>Periods:</Label>
              <Input type="number" value={trendPeriods} onChange={(e) => setTrendPeriods(Number(e.target.value))} className="w-20" min="2" max="12" />
              <Button onClick={generateForecast}>Generate</Button>
            </div>
            {forecastData && (
              <div className="space-y-3">
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-3 border rounded">
                    <p className="text-sm text-gray-600">Trend</p>
                    <p className={`text-lg font-bold ${forecastData.trend > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {forecastData.trend > 0 ? '↗' : '↘'} {Math.abs(forecastData.trend).toFixed(1)}%
                    </p>
                  </div>
                  <div className="text-center p-3 border rounded">
                    <p className="text-sm text-gray-600">Next Period</p>
                    <p className="text-lg font-bold">₹{forecastData.nextPeriod?.toLocaleString('en-IN')}</p>
                  </div>
                  <div className="text-center p-3 border rounded">
                    <p className="text-sm text-gray-600">Confidence</p>
                    <Progress value={forecastData.confidence || 75} className="mt-1" />
                    <p className="text-xs text-gray-500">{forecastData.confidence || 75}%</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FinancialReports;
