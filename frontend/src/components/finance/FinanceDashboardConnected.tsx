'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  DollarSign, 
  TrendingUp, 
  FileText, 
  AlertCircle, 
  CheckCircle,
  RefreshCw,
  Wifi,
  WifiOff
} from 'lucide-react';
import { testBackendConnection, getFinanceStats, getBudgetAnalytics } from '@/utils/connectionTest';

const API_URL = process.env.NEXT_PUBLIC_API_URL  || process.env.BACKEND_URL;

interface FinanceStats {
  accounts: number;
  entries: number;
  vouchers: number;
  budgets: number;
}

interface BudgetAnalytics {
  departmentBudgets: {
    total: number;
    spent: number;
    remaining: number;
    utilization: number;
    count: number;
  };
  glBudgets: {
    total: number;
    actual: number;
    variance: number;
    utilization: number;
    count: number;
  };
  statINRistribution: {
    draft: number;
    approved: number;
    active: number;
  };
  topSpendingDepartments: Array<{
    department: string;
    allocated: number;
    spent: number;
    utilization: number;
  }>;
}

interface ConnectionStatus {
  connected: boolean;
  message: string;
  lastChecked: Date;
}

export default function FinanceDashboardConnected() {
  const [stats, setStats] = useState<FinanceStats>({ accounts: 0, entries: 0, vouchers: 0, budgets: 0 });
  const [budgetAnalytics, setBudgetAnalytics] = useState<BudgetAnalytics | null>(null);
  const [connection, setConnection] = useState<ConnectionStatus>({
    connected: false,
    message: 'Checking connection...',
    lastChecked: new Date()
  });
  const [loading, setLoading] = useState(true);

  const checkConnection = async () => {
    setLoading(true);
    const result = await testBackendConnection();
    setConnection({
      connected: result.success,
      message: result.success ? 'Connected to backend' : result.error || 'Connection failed',
      lastChecked: new Date()
    });

    if (result.success) {
      const financeStats = await getFinanceStats();
      setStats(financeStats);
      
      const budgetData = await getBudgetAnalytics();
      setBudgetAnalytics(budgetData);
    }
    setLoading(false);
  };

  useEffect(() => {
    checkConnection();
    // Check connection every 30 seconds
    const interval = setInterval(checkConnection, 30000);
    return () => clearInterval(interval);
  }, []);

  const quickActions = [
    {
      title: 'New Journal Entry',
      description: 'Record a financial transaction',
      icon: FileText,
      action: () => window.location.href = '/dashboard/finance/journal-entry',
      color: 'bg-blue-500'
    },
    {
      title: 'View Accounts',
      description: 'Manage chart of accounts',
      icon: DollarSign,
      action: () => window.location.href = '/dashboard/finance/chart-of-accounts',
      color: 'bg-green-500'
    },
    {
      title: 'Financial Reports',
      description: 'Generate P&L, Balance Sheet',
      icon: TrendingUp,
      action: () => window.location.href = '/dashboard/finance/reports',
      color: 'bg-purple-500'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Connection Status */}
      <Alert className={connection.connected ? 'border-green-500' : 'border-red-500'}>
        <div className="flex items-center gap-2">
          {connection.connected ? (
            <Wifi className="h-4 w-4 text-green-500" />
          ) : (
            <WifiOff className="h-4 w-4 text-red-500" />
          )}
          <AlertDescription className="flex-1">
            {connection.message} - Last checked: {connection.lastChecked.toLocaleTimeString()}
          </AlertDescription>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={checkConnection}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </Alert>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Accounts</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.accounts}</div>
            <p className="text-xs text-muted-foreground">
              Chart of accounts entries
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Journal Entries</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.entries}</div>
            <p className="text-xs text-muted-foreground">
              Total transactions recorded
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Budgets</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.budgets}</div>
            <p className="text-xs text-muted-foreground">
              Department & GL budgets
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Budget Analytics */}
      {budgetAnalytics && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Department Budgets</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Total Allocated</span>
                  <span className="font-bold">₹{budgetAnalytics.departmentBudgets.total.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Total Spent</span>
                  <span className="font-bold">₹{budgetAnalytics.departmentBudgets.spent.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Remaining</span>
                  <span className="font-bold text-green-600">₹{budgetAnalytics.departmentBudgets.remaining.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Utilization</span>
                  <Badge variant={budgetAnalytics.departmentBudgets.utilization > 90 ? 'destructive' : 'default'}>
                    {budgetAnalytics.departmentBudgets.utilization.toFixed(1)}%
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>GL Budgets</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Total Budget</span>
                  <span className="font-bold">₹{budgetAnalytics.glBudgets.total.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Actual</span>
                  <span className="font-bold">₹{budgetAnalytics.glBudgets.actual.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Variance</span>
                  <span className={`font-bold ${budgetAnalytics.glBudgets.variance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    ₹{budgetAnalytics.glBudgets.variance.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Utilization</span>
                  <Badge variant={budgetAnalytics.glBudgets.utilization > 90 ? 'destructive' : 'default'}>
                    {budgetAnalytics.glBudgets.utilization.toFixed(1)}%
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {quickActions.map((action, index) => {
              const Icon = action.icon;
              return (
                <Button
                  key={index}
                  variant="outline"
                  className="h-auto p-4 flex flex-col items-start space-y-2"
                  onClick={action.action}
                  disabled={!connection.connected}
                >
                  <div className={`p-2 rounded-md ${action.color} text-white`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="text-left">
                    <div className="font-medium">{action.title}</div>
                    <div className="text-sm text-muted-foreground">{action.description}</div>
                  </div>
                </Button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* API Endpoints Status */}
      <Card>
        <CardHeader>
          <CardTitle>API Endpoints</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span>Backend Health</span>
              <Badge variant={connection.connected ? 'default' : 'destructive'}>
                {API_URL}/api/health
              </Badge>
            </div>
            <div className="flex justify-between items-center">
              <span>General Ledger</span>
              <Badge variant="outline">{API_URL}/api/general-ledger</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span>Integrated Finance</span>
              <Badge variant="outline">{API_URL}/api/integrated-finance</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}