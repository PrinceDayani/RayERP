'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Briefcase, Calculator, FileText, TrendingUp, BarChart3, Coins, Receipt, Building2, Users, BookOpen, FolderOpen, Banknote, Repeat, PieChart, Wallet, FileSpreadsheet, ChevronRight, Plus, Globe, Scale, Clock, Lock, Shield, Zap, CheckCircle, FileCheck } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useCurrency } from '@/contexts/CurrencyContext';

const API_URL = process.env.NEXT_PUBLIC_API_URL  || process.env.BACKEND_URL;

export default function FinancePage() {
  const router = useRouter();
  const { currency, symbol, formatAmount, formatCompact } = useCurrency();
  const [stats, setStats] = useState({ accounts: 0, entries: 0, vouchers: 0 });

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
        entries: entriesData.pagination?.total || 0,
        vouchers: 0
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const coreModules = [
    { title: 'Master Ledger', description: 'All entries across all accounts', icon: BookOpen, path: '/dashboard/finance/master-ledger', color: 'from-indigo-500 to-indigo-600', stat: `${stats.entries} entries`, badge: 'New' },
    { title: 'Chart of Accounts', description: 'Account structure & hierarchy', icon: FolderOpen, path: '/dashboard/finance/chart-of-accounts', color: 'from-blue-500 to-blue-600', stat: `${stats.accounts} accounts` },
    { title: 'Journal Entries', description: 'Record financial transactions', icon: FileText, path: '/dashboard/finance/journal-entry', color: 'from-green-500 to-green-600', stat: 'Create new' },
    { title: 'Vouchers', description: 'Payment, Receipt, Contra, Sales, Purchase', icon: Receipt, path: '/dashboard/finance/vouchers', color: 'from-purple-500 to-purple-600', stat: '8 types', badge: 'Complete' },
    { title: 'Account Ledger', description: 'Transaction history by account', icon: BookOpen, path: '/dashboard/finance/account-ledger', color: 'from-cyan-500 to-cyan-600', stat: 'View ledger' }
  ];

  const transactionModules = [
    { title: 'Bank Reconciliation', description: 'Match bank statements with books', icon: Banknote, path: '/dashboard/finance/bank-reconciliation', color: 'from-emerald-500 to-emerald-600', badge: 'Available' },
    { title: 'Recurring Entries', description: 'Automate repetitive journal entries', icon: Repeat, path: '/dashboard/finance/recurring-entries', color: 'from-violet-500 to-violet-600', badge: 'Available' },
    { title: 'Bill-wise Details', description: 'Invoice-level tracking & payments', icon: Wallet, path: '/dashboard/finance/bills', color: 'from-pink-500 to-pink-600', badge: 'Available' }
  ];

  const reportModules = [
    { title: 'Advanced Reports', description: 'P&L, Balance Sheet, Cash Flow', icon: FileSpreadsheet, path: '/dashboard/finance/reports', color: 'from-sky-500 to-sky-600', badge: 'Available' },
    { title: 'Trial Balance', description: 'Verify account balances', icon: BarChart3, path: '/dashboard/finance/trial-balance', color: 'from-orange-500 to-orange-600', badge: 'Available' },
    { title: 'Profit & Loss', description: 'Income statement analysis', icon: PieChart, path: '/dashboard/finance/profit-loss', color: 'from-indigo-500 to-indigo-600', badge: 'Available' },
    { title: 'Balance Sheet', description: 'Financial position statement', icon: FileText, path: '/dashboard/finance/balance-sheet', color: 'from-teal-500 to-teal-600', badge: 'Available' },
    { title: 'Cash Flow', description: 'Cash movement analysis', icon: Coins, path: '/dashboard/finance/cash-flow', color: 'from-blue-500 to-blue-600', badge: 'Available' }
  ];

  const managementModules = [
    { title: 'Cost Centers', description: 'Department/project allocation', icon: Building2, path: '/dashboard/finance/cost-centers', color: 'from-amber-500 to-amber-600', badge: 'Available' },
    { title: 'GL Budgets', description: 'Budget tracking & variance analysis', icon: TrendingUp, path: '/dashboard/finance/gl-budgets', color: 'from-teal-500 to-teal-600', badge: 'Available' },
    { title: 'Interest Calculations', description: 'Calculate & post interest entries', icon: Coins, path: '/dashboard/finance/interest', color: 'from-rose-500 to-rose-600', badge: 'Available' },
    { title: 'Project Ledger', description: 'Project-wise financial tracking', icon: Briefcase, path: '/dashboard/finance/project-ledger', color: 'from-purple-500 to-purple-600', badge: 'Available' },
    { title: 'Payments', description: 'Payment processing & tracking', icon: Wallet, path: '/dashboard/finance/payments', color: 'from-green-500 to-green-600', badge: 'Available' },
    { title: 'Invoices', description: 'Invoice management', icon: Receipt, path: '/dashboard/finance/invoices', color: 'from-cyan-500 to-cyan-600', badge: 'Available' }
  ];

  const advancedModules = [
    { title: 'Multi-Currency', description: 'Foreign exchange & currency conversion', icon: Globe, path: '/dashboard/finance/multi-currency', color: 'from-blue-500 to-indigo-600', badge: 'New' },
    { title: 'Tax Management', description: 'GST, VAT, TDS & tax reports', icon: Scale, path: '/dashboard/finance/tax-management', color: 'from-red-500 to-pink-600', badge: 'New' },
    { title: 'Aging Analysis', description: 'Receivables & payables aging', icon: Clock, path: '/dashboard/finance/aging-analysis', color: 'from-yellow-500 to-orange-600', badge: 'New' },
    { title: 'Year-End Closing', description: 'Financial year management', icon: Lock, path: '/dashboard/finance/year-end', color: 'from-gray-500 to-slate-600', badge: 'New' }
  ];

  const complianceModules = [
    { title: 'Audit Trail', description: 'Complete activity & compliance logs', icon: Shield, path: '/dashboard/finance/audit-trail', color: 'from-purple-500 to-violet-600', badge: 'New' },
    { title: 'Approval Workflows', description: 'Multi-level entry approvals', icon: CheckCircle, path: '/dashboard/finance/approvals', color: 'from-green-500 to-emerald-600', badge: 'New' },
    { title: 'Document Manager', description: 'Attach invoices & receipts', icon: FileCheck, path: '/dashboard/finance/documents', color: 'from-cyan-500 to-blue-600', badge: 'New' },
    { title: 'Smart Alerts', description: 'AI fraud detection & duplicates', icon: Zap, path: '/dashboard/finance/smart-alerts', color: 'from-orange-500 to-red-600', badge: 'AI' }
  ];

  const ModuleCard = ({ module, size = 'normal' }: any) => {
    const Icon = module.icon;
    return (
      <Card 
        className="group cursor-pointer hover:shadow-xl transition-all duration-300 bg-card border-border overflow-hidden"
        onClick={() => {
          console.log('Navigating to:', module.path);
          router.push(module.path);
        }}
      >
        <div className={`absolute inset-0 bg-gradient-to-br ${module.color} opacity-0 group-hover:opacity-5 transition-opacity pointer-events-none`} />
        <CardContent className={`relative ${size === 'large' ? 'p-8' : 'p-6'}`}>
          <div className="flex items-start justify-between mb-4">
            <div className={`p-3 rounded-xl bg-gradient-to-br ${module.color} shadow-lg`}>
              <Icon className="w-6 h-6 text-white" />
            </div>
            {module.badge && <Badge variant="secondary">{module.badge}</Badge>}
            {module.stat && <span className="text-xs text-muted-foreground font-medium">{module.stat}</span>}
          </div>
          <h3 className={`font-semibold mb-2 text-foreground ${size === 'large' ? 'text-xl' : 'text-lg'}`}>{module.title}</h3>
          <p className="text-sm text-muted-foreground mb-3">{module.description}</p>
          <div className="flex items-center text-sm font-medium text-primary group-hover:text-primary/80">
            Open <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="min-h-screen bg-background p-6 space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-4xl font-bold text-foreground">Finance & Accounting</h1>
            <Badge variant="outline" className="text-sm">
              <Globe className="w-3 h-3 mr-1" />
              {symbol} {currency}
            </Badge>
          </div>
          <p className="text-muted-foreground mt-2">Complete financial management system • Currency: {currency}</p>
        </div>
        <Button size="lg" onClick={() => router.push('/dashboard/finance/journal-entry')} className="bg-primary hover:bg-primary/90">
          <Plus className="w-5 h-5 mr-2" />
          New Entry
        </Button>
      </div>

      <Card className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground border-0 cursor-pointer hover:shadow-2xl transition-all" onClick={() => router.push('/dashboard/finance/manage')}>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <h2 className="text-2xl font-bold">🚀 Finance Management Hub</h2>
                <Badge className="bg-background text-foreground">Recommended</Badge>
              </div>
              <p className="text-primary-foreground/90">All accounting features in ONE place - Superior UX, Faster workflow</p>
              <p className="text-sm text-primary-foreground/70 mt-2">Chart of Accounts • Journal Entries • Ledger View • Reports • Advanced Tools</p>
            </div>
            <ChevronRight className="w-12 h-12" />
          </div>
        </CardContent>
      </Card>

      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-foreground">Core Accounting</h2>
          <Badge variant="outline">Essential</Badge>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          {coreModules.map((module) => <ModuleCard key={module.path} module={module} />)}
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-foreground">Transaction Management</h2>
          <Badge variant="outline">Operations</Badge>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {transactionModules.map((module) => <ModuleCard key={module.path} module={module} size="large" />)}
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-foreground">Advanced Features</h2>
          <Badge className="bg-primary text-primary-foreground">Enterprise</Badge>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {advancedModules.map((module) => <ModuleCard key={module.path} module={module} />)}
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-foreground">Compliance & Security</h2>
          <Badge variant="outline">Audit Ready</Badge>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {complianceModules.map((module) => <ModuleCard key={module.path} module={module} />)}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-foreground">Reports & Analysis</h2>
            <Badge variant="outline">Insights</Badge>
          </div>
          <div className="grid grid-cols-1 gap-6">
            {reportModules.map((module) => <ModuleCard key={module.path} module={module} />)}
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-foreground">Management Tools</h2>
            <Badge variant="outline">Advanced</Badge>
          </div>
          <div className="grid grid-cols-1 gap-6">
            {managementModules.map((module) => <ModuleCard key={module.path} module={module} />)}
          </div>
        </div>
      </div>

      <Card className="bg-muted border-border">
        <CardContent className="p-8">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-2xl font-bold mb-2 text-foreground">📚 Documentation & Support</h3>
              <p className="text-muted-foreground">Complete guides for all accounting features • API documentation • Video tutorials</p>
            </div>
            <Button variant="secondary" size="lg" onClick={() => window.open('/docs/UNIFIED_GENERAL_LEDGER.md', '_blank')}>View Docs</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
