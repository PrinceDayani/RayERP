'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Briefcase, Calculator, FileText, TrendingUp, BarChart3, Coins, Receipt, Building2, BookOpen, FolderOpen, Banknote, Repeat, PieChart, Wallet, FileSpreadsheet, ChevronRight, Plus, Globe, Scale, Clock, Lock, Shield, Zap, CheckCircle, FileCheck, ArrowUpRight, Activity } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useFinanceShortcuts } from '@/hooks/useFinanceShortcuts';
import FinancePermissionGuard from '@/components/FinancePermissionGuard';

const API_URL = process.env.NEXT_PUBLIC_API_URL || process.env.BACKEND_URL;

function FinancePageContent() {
  const router = useRouter();
  const { baseCurrency, getCurrencySymbol } = useCurrency();
  const currency = baseCurrency?.code || 'INR';
  const symbol = baseCurrency?.symbol || '₹';
  const [stats, setStats] = useState({ accounts: 0, entries: 0 });
  const [loading, setLoading] = useState(true);

  useFinanceShortcuts();

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('auth-token');
      const [accountsRes, entriesRes] = await Promise.all([
        fetch(`${API_URL}/api/general-ledger/accounts`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_URL}/api/general-ledger/journal-entries?limit=1`, { headers: { Authorization: `Bearer ${token}` } })
      ]);
      const accountsData = await accountsRes.json();
      const entriesData = await entriesRes.json();
      setStats({
        accounts: accountsData.accounts?.length || 0,
        entries: entriesData.pagination?.total || 0
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const quickActions = [
    { title: 'New Journal Entry', icon: Plus, path: '/dashboard/finance/journal-entry', color: 'bg-blue-500 hover:bg-blue-600' },
    { title: 'Create Invoice', icon: FileText, path: '/dashboard/finance/invoices/create', color: 'bg-green-500 hover:bg-green-600' },
    { title: 'Record Payment', icon: Wallet, path: '/dashboard/finance/invoices', color: 'bg-purple-500 hover:bg-purple-600' },
    { title: 'View Reports', icon: BarChart3, path: '/dashboard/finance/reports', color: 'bg-orange-500 hover:bg-orange-600' }
  ];

  const modules = {
    core: [
      { title: 'Account Management', description: 'Universal account creation & management', icon: Building2, path: '/dashboard/finance/accounts', color: 'emerald', stat: `${stats.accounts}`, statLabel: 'accounts', badge: 'Enhanced' },
      { title: 'Chart of Accounts', description: 'Account structure & hierarchy', icon: FolderOpen, path: '/dashboard/finance/chart-of-accounts', color: 'blue', stat: `${stats.accounts}`, statLabel: 'accounts' },
      { title: 'Master Ledger', description: 'All entries across all accounts', icon: BookOpen, path: '/dashboard/finance/master-ledger', color: 'indigo', stat: `${stats.entries}`, statLabel: 'entries', badge: 'New' },
      { title: 'Journal Entries', description: 'Record financial transactions', icon: FileText, path: '/dashboard/finance/journal-entry', color: 'green' },
      { title: 'Vouchers', description: 'Payment, Receipt, Contra, Sales, Purchase', icon: Receipt, path: '/dashboard/finance/vouchers', color: 'purple', badge: 'Complete' },
      { title: 'Account Ledger', description: 'Individual account transactions', icon: BookOpen, path: '/dashboard/finance/account-ledger', color: 'cyan' }
    ],
    reports: [
      { title: 'Advanced Reports', description: 'P&L, Balance Sheet, Cash Flow + 6 more', icon: FileSpreadsheet, path: '/dashboard/finance/reports', color: 'sky', badge: 'Enterprise' },
      { title: 'Trial Balance', description: 'Verify account balances', icon: BarChart3, path: '/dashboard/finance/trial-balance', color: 'orange' },
      { title: 'Profit & Loss', description: 'Income statement analysis', icon: PieChart, path: '/dashboard/finance/profit-loss', color: 'indigo' },
      { title: 'Balance Sheet', description: 'Financial position statement', icon: FileText, path: '/dashboard/finance/balance-sheet', color: 'teal' },
      { title: 'Cash Flow', description: 'Cash movement analysis', icon: Coins, path: '/dashboard/finance/cash-flow', color: 'blue' }
    ],
    transactions: [
      { title: 'Invoices & Payments', description: 'Unified invoice & payment management', icon: Wallet, path: '/dashboard/finance/invoices', color: 'green', badge: 'Unified' },
      { title: 'Reference Payments', description: 'Pay against JE references (Tally-style)', icon: FileText, path: '/dashboard/finance/references', color: 'blue', badge: 'New' },
      { title: 'Invoice Analytics', description: 'Invoice performance insights', icon: TrendingUp, path: '/dashboard/finance/invoices/analytics', color: 'blue' },
      { title: 'Bank Reconciliation', description: 'Match bank statements with books', icon: Banknote, path: '/dashboard/finance/bank-reconciliation', color: 'emerald' },
      { title: 'Recurring Entries', description: 'Automate repetitive journal entries', icon: Repeat, path: '/dashboard/finance/recurring-entries', color: 'violet' },
      { title: 'Bill-wise Details', description: 'Invoice-level tracking & payments', icon: Wallet, path: '/dashboard/finance/bills', color: 'pink' }
    ],
    management: [
      { title: 'Sales Reports', description: 'Track & analyze all sales', icon: TrendingUp, path: '/dashboard/finance/sales-reports', color: 'cyan', badge: 'New' },
      { title: 'Cost Centers', description: 'Department/project allocation', icon: Building2, path: '/dashboard/finance/cost-centers', color: 'amber' },
      { title: 'GL Budgets', description: 'Budget tracking & variance analysis', icon: TrendingUp, path: '/dashboard/finance/gl-budgets', color: 'teal' },
      { title: 'Interest Calculations', description: 'Calculate & post interest entries', icon: Coins, path: '/dashboard/finance/interest', color: 'rose' },
      { title: 'Project Ledger', description: 'Project-wise financial tracking', icon: Briefcase, path: '/dashboard/finance/project-ledger', color: 'purple' }
    ],
    advanced: [
      { title: 'Multi-Currency', description: 'Foreign exchange & currency conversion', icon: Globe, path: '/dashboard/finance/multi-currency', color: 'blue', badge: 'New' },
      { title: 'Currency Settings', description: 'Configure currency preferences', icon: Globe, path: '/dashboard/finance/currency-settings', color: 'indigo' },
      { title: 'Tax Management', description: 'GST, VAT, TDS & tax reports', icon: Scale, path: '/dashboard/finance/tax-management', color: 'red', badge: 'New' },
      { title: 'Aging Analysis', description: 'Receivables & payables aging', icon: Clock, path: '/dashboard/finance/aging-analysis', color: 'yellow', badge: 'New' },
      { title: 'Year-End Closing', description: 'Financial year management', icon: Lock, path: '/dashboard/finance/year-end', color: 'slate' }
    ],
    compliance: [
      { title: 'Audit Trail', description: 'Complete activity & compliance logs', icon: Shield, path: '/dashboard/finance/audit-trail', color: 'purple', badge: 'New' },
      { title: 'Approval Workflows', description: 'Multi-level entry approvals', icon: CheckCircle, path: '/dashboard/finance/approvals', color: 'green', badge: 'New' },
      { title: 'Document Manager', description: 'Attach invoices & receipts', icon: FileCheck, path: '/dashboard/finance/documents', color: 'cyan', badge: 'New' },
      { title: 'Smart Alerts', description: 'AI fraud detection & duplicates', icon: Zap, path: '/dashboard/finance/smart-alerts', color: 'orange', badge: 'AI' }
    ]
  };

  const colorMap: any = {
    blue: 'from-blue-500 to-blue-600', green: 'from-green-500 to-green-600', indigo: 'from-indigo-500 to-indigo-600',
    purple: 'from-purple-500 to-purple-600', orange: 'from-orange-500 to-orange-600', sky: 'from-sky-500 to-sky-600',
    teal: 'from-teal-500 to-teal-600', emerald: 'from-emerald-500 to-emerald-600', amber: 'from-amber-500 to-amber-600',
    red: 'from-red-500 to-red-600', yellow: 'from-yellow-500 to-yellow-600', cyan: 'from-cyan-500 to-cyan-600',
    violet: 'from-violet-500 to-violet-600', pink: 'from-pink-500 to-pink-600', rose: 'from-rose-500 to-rose-600',
    slate: 'from-slate-500 to-slate-600'
  };

  const ModuleCard = ({ module }: any) => {
    const Icon = module.icon;
    return (
      <Card className="group cursor-pointer hover:shadow-lg hover:border-primary/50 transition-all duration-200" onClick={() => router.push(module.path)}>
        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-3">
            <div className={`p-2 rounded-lg bg-gradient-to-br ${colorMap[module.color]} shadow-sm`}>
              <Icon className="w-4 h-4 text-white" />
            </div>
            {module.badge && <Badge variant="secondary" className="text-xs h-5">{module.badge}</Badge>}
          </div>
          <h3 className="font-semibold text-sm mb-1 text-foreground group-hover:text-primary transition-colors">{module.title}</h3>
          <p className="text-xs text-muted-foreground mb-2 line-clamp-2">{module.description}</p>
          {module.stat && (
            <div className="flex items-baseline gap-1 mb-2">
              <span className="text-xl font-bold text-foreground">{module.stat}</span>
              <span className="text-xs text-muted-foreground">{module.statLabel}</span>
            </div>
          )}
          <div className="flex items-center text-xs font-medium text-primary opacity-0 group-hover:opacity-100 transition-opacity">
            Open <ChevronRight className="w-3 h-3 ml-0.5" />
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">Finance & Accounting</h1>
            <Badge variant="outline"><Globe className="w-3 h-3 mr-1" />{symbol} {currency}</Badge>
          </div>
          <p className="text-sm text-muted-foreground">Complete financial management system</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Total Accounts</p>
                <p className="text-2xl font-bold">{loading ? '...' : stats.accounts}</p>
              </div>
              <div className="p-2 bg-blue-500/10 rounded-lg"><FolderOpen className="w-5 h-5 text-blue-500" /></div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-green-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Journal Entries</p>
                <p className="text-2xl font-bold">{loading ? '...' : stats.entries}</p>
              </div>
              <div className="p-2 bg-green-500/10 rounded-lg"><FileText className="w-5 h-5 text-green-500" /></div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-purple-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Quick Actions</p>
                <p className="text-2xl font-bold">{quickActions.length}</p>
              </div>
              <div className="p-2 bg-purple-500/10 rounded-lg"><Activity className="w-5 h-5 text-purple-500" /></div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        {quickActions.map((action) => {
          const Icon = action.icon;
          return (
            <Button key={action.path} onClick={() => router.push(action.path)} className={`${action.color} text-white h-auto py-3 justify-start shadow-md hover:shadow-lg transition-all`}>
              <Icon className="w-4 h-4 mr-2" />
              <span className="text-sm font-medium">{action.title}</span>
              <ArrowUpRight className="w-3 h-3 ml-auto" />
            </Button>
          );
        })}
      </div>

      {/* Featured Hub */}
      <Card className="bg-gradient-to-r from-primary via-primary to-primary/90 text-primary-foreground border-0 cursor-pointer hover:shadow-xl transition-all" onClick={() => router.push('/dashboard/finance/manage')}>
        <CardContent className="p-5">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h2 className="text-xl font-bold">⚡ Finance Management Hub</h2>
                <Badge className="bg-white text-primary text-xs">Recommended</Badge>
              </div>
              <p className="text-sm text-primary-foreground/90 mb-1">All accounting features in ONE place - Superior UX, Faster workflow</p>
              <p className="text-xs text-primary-foreground/70">Chart of Accounts • Journal Entries • Ledger View • Reports • Advanced Tools</p>
            </div>
            <ChevronRight className="w-8 h-8 opacity-80" />
          </div>
        </CardContent>
      </Card>

      {/* Core Accounting */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold">Core Accounting</h2>
          <Badge variant="outline" className="text-xs">Essential</Badge>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {modules.core.map((module) => <ModuleCard key={module.path} module={module} />)}
        </div>
      </div>

      {/* Reports & Analysis */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold">Reports & Analysis</h2>
          <Badge variant="outline" className="text-xs">Insights</Badge>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {modules.reports.map((module) => <ModuleCard key={module.path} module={module} />)}
        </div>
      </div>

      {/* Transaction Management */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold">Transaction Management</h2>
          <Badge variant="outline" className="text-xs">Operations</Badge>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {modules.transactions.map((module) => <ModuleCard key={module.path} module={module} />)}
        </div>
      </div>

      {/* Management Tools */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold">Management Tools</h2>
          <Badge variant="outline" className="text-xs">Advanced</Badge>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {modules.management.map((module) => <ModuleCard key={module.path} module={module} />)}
        </div>
      </div>

      {/* Advanced Features */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold">Advanced Features</h2>
          <Badge className="bg-primary text-primary-foreground text-xs">Enterprise</Badge>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {modules.advanced.map((module) => <ModuleCard key={module.path} module={module} />)}
        </div>
      </div>

      {/* Compliance & Security */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold">Compliance & Security</h2>
          <Badge variant="outline" className="text-xs">Audit Ready</Badge>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {modules.compliance.map((module) => <ModuleCard key={module.path} module={module} />)}
        </div>
      </div>
    </div>
  );
}

export default function FinancePage() {
  return (
    <FinancePermissionGuard>
      <FinancePageContent />
    </FinancePermissionGuard>
  );
}
