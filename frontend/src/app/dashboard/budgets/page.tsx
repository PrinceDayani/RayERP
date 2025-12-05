'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Plus, Search, Eye, Edit, Trash2, Coins, TrendingUp, Clock, CheckCircle, XCircle, Send, RefreshCw, Download, Filter, BarChart3, Copy, Star, Command, TrendingDown, AlertTriangle, Activity, DollarSign, PieChart, FileText, Users, Calendar, Target } from 'lucide-react';
import { getAllBudgets, createBudget, requestBudgetDeletion, approveBudgetDeletion, submitForApproval, sendToReview, getBudgetAnalytics, getPendingApprovals, syncProjectBudgets } from '@/lib/api/budgetAPI';
import BudgetCreateDialog from '@/components/budget/BudgetCreateDialog';
import api from '@/lib/api';
import { Budget } from '@/types/budget';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { initializeSocket, disconnectSocket, getSocket } from '@/lib/socket';
import { formatCurrency, formatCurrencySmart } from '@/utils/currency';
import NumberFormatSwitcher from '@/components/budget/NumberFormatSwitcher';
import { toast } from '@/components/ui/use-toast';
import auditLogger from '@/lib/auditLog';
import { useCurrency } from '@/hooks/useCurrency';

export default function BudgetsPage() {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState<'date' | 'amount' | 'name' | 'utilization'>('date');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [quickView, setQuickView] = useState<Budget | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const { displayCurrency, setDisplayCurrency, convertCurrency, formatAmount: formatCurrencyAmount } = useCurrency();
  const [projects, setProjects] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [pendingApprovals, setPendingApprovals] = useState<Budget[]>([]);
  const router = useRouter();
  const { user } = useAuth();
  const isDirector = user?.role?.name === 'Director' || user?.role?.name === 'Root';
  const hasApprovePermission = user?.permissions?.includes('budgets.approve') || user?.permissions?.includes('*');

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        if (e.key === 'k') {
          e.preventDefault();
          document.getElementById('search-input')?.focus();
        } else if (e.key === 'n') {
          e.preventDefault();
          setShowCreateDialog(true);
        } else if (e.key === '/') {
          e.preventDefault();
          setShowShortcuts(true);
        }
      }
    };
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  // Load favorites from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('budget-favorites');
    if (saved) setFavorites(new Set(JSON.parse(saved)));
  }, []);

  const toggleFavorite = useCallback((id: string) => {
    setFavorites(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      localStorage.setItem('budget-favorites', JSON.stringify([...next]));
      return next;
    });
  }, []);

  const formatAmount = useCallback((amount: number, currency: string) => {
    return formatCurrencyAmount(amount, currency);
  }, [formatCurrencyAmount]);

  const duplicateBudget = useCallback(async (budget: Budget) =>{
    try {
      await createBudget({
        projectId: '',
        projectName: `${budget.projectName} (Copy)`,
        budgetType: budget.budgetType || 'special',
        totalBudget: budget.totalBudget,
        currency: budget.currency,
        categories: budget.categories.map(c => ({
          name: c.name,
          type: c.type,
          allocatedAmount: c.allocatedAmount,
          items: c.items.map(i => ({
            name: i.name,
            description: i.description,
            quantity: i.quantity,
            unitCost: i.unitCost
          }))
        }))
      });
      // Audit log
      if (user) {
        auditLogger.logBudgetCreated(
          user._id,
          user.name,
          'duplicated',
          { originalBudget: budget.projectName, action: 'duplicate' }
        );
      }
      
      toast({ title: 'Success', description: 'Budget duplicated successfully' });
      fetchBudgets();
    } catch (error: any) {
      toast({ title: 'Error', description: 'Failed to duplicate budget', variant: 'destructive' });
    }
  }, []);

  useEffect(() => {
    fetchBudgets();
    fetchAnalytics();
    fetchProjects();
    fetchDepartments();
    fetchPendingApprovals();

    // Setup Socket.IO for real-time updates
    const initSocket = async () => {
      const socket = await initializeSocket();
      if (!socket) return;
      
      socket.on('budget:created', () => {
        fetchBudgets();
        fetchAnalytics();
      });
      
      socket.on('budget:updated', () => {
        fetchBudgets();
        fetchAnalytics();
      });
      
      socket.on('budget:deleted', () => {
        fetchBudgets();
        fetchAnalytics();
      });
      
      socket.on('budget:approved', () => {
        fetchBudgets();
        fetchPendingApprovals();
        fetchAnalytics();
      });
      
      socket.on('budget:rejected', () => {
        fetchBudgets();
        fetchPendingApprovals();
        fetchAnalytics();
      });
    };

    initSocket();

    return () => {
      disconnectSocket();
    };
  }, []);

  const fetchPendingApprovals = async () => {
    try {
      const data = await getPendingApprovals();
      setPendingApprovals(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching pending approvals:', error);
    }
  };

  const fetchProjects = async () => {
    console.log('🚀 fetchProjects CALLED');
    try {
      console.log('\n=== FRONTEND: Fetching projects ===');
      console.log('API URL:', process.env.NEXT_PUBLIC_API_URL);
      console.log('Calling: /projects');
      
      const response = await api.get('/projects');
      
      console.log('✅ Response status:', response.status);
      console.log('✅ Response data type:', typeof response.data);
      console.log('✅ Response data is Array?:', Array.isArray(response.data));
      console.log('✅ Response data length:', Array.isArray(response.data) ? response.data.length : 'N/A');
      console.log('✅ Response data:', response.data);
      console.log('=== END FRONTEND REQUEST ===\n');
      
      const projectsData = Array.isArray(response.data) ? response.data : (response.data?.data || response.data || []);
      console.log('📦 projectsData after extraction:', projectsData);
      console.log('📦 projectsData length:', projectsData.length);
      
      if (!Array.isArray(projectsData)) {
        console.error('❌ projectsData is not an array!', projectsData);
        setProjects([]);
        toast({
          title: 'Error',
          description: 'Invalid projects data format received from server.',
          variant: 'destructive'
        });
        return;
      }
      
      if (projectsData.length === 0) {
        console.warn('⚠️ No projects found in database');
        toast({
          title: 'No Projects',
          description: 'No projects found. Create a project first or use Department/Special budget types.',
          variant: 'default'
        });
      }
      
      const transformedProjects = projectsData.map((p: any) => {
        console.log('🔄 Transforming project:', p);
        return {
          _id: p._id || p.id,
          name: p.name || p.projectName || 'Unnamed Project'
        };
      });
      console.log('✅ Transformed projects:', transformedProjects);
      
      setProjects(transformedProjects);
      console.log('✅ Projects state set with', transformedProjects.length, 'projects');
    } catch (error: any) {
      console.error('❌ Error fetching projects:', error);
      console.error('❌ Error message:', error?.message);
      console.error('❌ Error status:', error?.response?.status);
      console.error('❌ Error response data:', error?.response?.data);
      console.error('❌ Full error response:', JSON.stringify(error?.response, null, 2));
      toast({
        title: 'Error Loading Projects',
        description: error?.response?.data?.message || 'Failed to load projects. You can still create Department or Special budgets.',
        variant: 'destructive'
      });
      setProjects([]);
    }
  };

  const fetchDepartments = async () => {
    try {
      const response = await api.get('/departments');
      const deptData = response.data?.data || response.data || [];
      const transformedDepts = deptData.map((d: any) => ({
        _id: d._id || d.id,
        name: d.name || 'Unnamed Department'
      }));
      setDepartments(transformedDepts);
    } catch (error) {
      console.error('Error fetching departments:', error);
      setDepartments([]);
    }
  };



  const fetchBudgets = async () => {
    try {
      const allBudgets = await getAllBudgets();
      const pendingBudgets = await getPendingApprovals();
      
      const allBudgetsArray = Array.isArray(allBudgets) ? allBudgets : [];
      const pendingBudgetsArray = Array.isArray(pendingBudgets) ? pendingBudgets : [];
      const combined = [...allBudgetsArray, ...pendingBudgetsArray.filter(pb => !allBudgetsArray.find(ab => ab._id === pb._id))];
      
      setBudgets(combined);
    } catch (error) {
      console.error('Error fetching budgets:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch budgets',
        variant: 'destructive',
      });
      setBudgets([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchAnalytics = async () => {
    try {
      const data = await getBudgetAnalytics();
      setAnalytics(data);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    }
  };

  const filteredBudgets = useMemo(() => {
    let filtered = budgets;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(budget =>
        budget.projectName.toLowerCase().includes(query) ||
        budget.currency.toLowerCase().includes(query) ||
        budget.totalBudget.toString().includes(query)
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(budget => budget.status === statusFilter);
    }

    // Favorites first
    const sorted = [...filtered].sort((a, b) => {
      const aFav = favorites.has(a._id) ? 1 : 0;
      const bFav = favorites.has(b._id) ? 1 : 0;
      if (aFav !== bFav) return bFav - aFav;

      if (sortBy === 'date') {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      } else if (sortBy === 'amount') {
        return b.totalBudget - a.totalBudget;
      } else if (sortBy === 'name') {
        return a.projectName.localeCompare(b.projectName);
      } else if (sortBy === 'utilization') {
        const aUtil = a.utilizationPercentage || 0;
        const bUtil = b.utilizationPercentage || 0;
        return bUtil - aUtil;
      }
      return 0;
    });

    return sorted;
  }, [budgets, searchQuery, statusFilter, sortBy, favorites]);

  const stats = useMemo(() => {
    // Only approved budgets can have utilization
    const approvedBudgets = filteredBudgets.filter(b => b.status === 'approved');
    
    const total = filteredBudgets.reduce((sum, b) => {
      const converted = convertCurrency(b.totalBudget, b.currency, displayCurrency);
      return sum + converted;
    }, 0);
    
    const spent = approvedBudgets.reduce((sum, b) => {
      const s = b.categories.reduce((cs, c) => cs + c.spentAmount, 0);
      const converted = convertCurrency(s, b.currency, displayCurrency);
      return sum + converted;
    }, 0);
    
    const remaining = total - spent;
    const avgUtilization = total > 0 ? (spent / total) * 100 : 0;
    
    // Risk analysis - only for approved budgets
    const overBudget = approvedBudgets.filter(b => {
      const s = b.categories.reduce((cs, c) => cs + c.spentAmount, 0);
      return s > b.totalBudget;
    }).length;
    
    const highUtilization = approvedBudgets.filter(b => {
      const s = b.categories.reduce((cs, c) => cs + c.spentAmount, 0);
      const util = b.totalBudget > 0 ? (s / b.totalBudget) * 100 : 0;
      return util >= 80 && util < 100;
    }).length;

    // Status breakdown
    const byStatus = {
      draft: filteredBudgets.filter(b => b.status === 'draft').length,
      pending: filteredBudgets.filter(b => b.status === 'pending').length,
      approved: filteredBudgets.filter(b => b.status === 'approved').length,
      rejected: filteredBudgets.filter(b => b.status === 'rejected').length,
    };

    return {
      total,
      spent,
      remaining,
      avgUtilization,
      overBudget,
      highUtilization,
      byStatus,
      healthScore: Math.max(0, 100 - (overBudget * 20) - (highUtilization * 10))
    };
  }, [filteredBudgets, displayCurrency, convertCurrency]);

  const exportToCSV = () => {
    const headers = ['Project Name', 'Total Budget', 'Spent', 'Remaining', 'Utilization %', 'Status', 'Created Date'];
    const rows = filteredBudgets.map(b => {
      const spent = b.status === 'approved' ? b.categories.reduce((sum, cat) => sum + cat.spentAmount, 0) : 0;
      const remaining = b.totalBudget - spent;
      const util = b.status === 'approved' && b.totalBudget > 0 ? ((spent / b.totalBudget) * 100).toFixed(1) : '0';
      return [
        b.projectName,
        b.totalBudget,
        spent,
        remaining,
        util,
        b.status,
        new Date(b.createdAt).toLocaleDateString()
      ];
    });
    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `budgets_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    
    // Audit log
    if (user) {
      auditLogger.logBudgetExported(user._id, user.name, 'CSV', filteredBudgets.length);
    }
    
    toast({ title: 'Success', description: 'Budgets exported successfully' });
  };



  const handleSubmitForApproval = async (budgetId: string) => {
    const budget = budgets.find(b => b._id === budgetId);
    if (!budget) return;
    
    const permission = canSubmitBudget(budget);
    if (!permission.allowed) {
      toast({
        title: 'Cannot Submit',
        description: permission.reason,
        variant: 'destructive',
      });
      return;
    }
    
    try {
      await submitForApproval(budgetId);
      
      // Audit log
      if (user) {
        auditLogger.logBudgetSubmitted(user._id, user.name, budgetId);
      }
      
      toast({ title: 'Success', description: 'Budget submitted for approval' });
      fetchBudgets();
    } catch (error: any) {
      console.error('Error submitting for approval:', error);
      toast({
        title: 'Error',
        description: error?.response?.data?.message || 'Failed to submit budget',
        variant: 'destructive',
      });
    }
  };

  const canDeleteBudget = (budget: Budget) => {
    // Only draft budgets can be deleted
    if (budget.status !== 'draft') {
      return { allowed: false, reason: `Cannot delete ${budget.status} budget` };
    }
    // Check user permissions
    const allowedRoles = ['Root', 'Super Admin', 'Admin', 'Manager'];
    if (!user || !allowedRoles.includes(user.role.name)) {
      return { allowed: false, reason: 'Insufficient permissions' };
    }
    return { allowed: true, reason: '' };
  };

  const canEditBudget = (budget: Budget) => {
    // Only draft budgets can be edited
    if (budget.status !== 'draft') {
      return { allowed: false, reason: `Cannot edit ${budget.status} budget` };
    }
    const allowedRoles = ['Root', 'Super Admin', 'Admin', 'Manager'];
    if (!user || !allowedRoles.includes(user.role.name)) {
      return { allowed: false, reason: 'Insufficient permissions' };
    }
    return { allowed: true, reason: '' };
  };

  const canSubmitBudget = (budget: Budget) => {
    if (budget.status !== 'draft') {
      return { allowed: false, reason: 'Budget already submitted' };
    }
    if (budget.categories.length === 0) {
      return { allowed: false, reason: 'Add at least one category before submitting' };
    }
    return { allowed: true, reason: '' };
  };

  const handleRequestDeletion = async (budgetId: string) => {
    const budget = budgets.find(b => b._id === budgetId);
    if (!budget) return;
    
    if (budget.status !== 'draft') {
      toast({
        title: 'Cannot Delete',
        description: 'Only draft budgets can be deleted',
        variant: 'destructive',
      });
      return;
    }
    
    if (confirm('Request deletion approval from Director?')) {
      try {
        await requestBudgetDeletion(budgetId);
        toast({ title: 'Success', description: 'Deletion request submitted for Director approval' });
        fetchBudgets();
      } catch (error: any) {
        toast({
          title: 'Error',
          description: error?.response?.data?.message || 'Failed to request deletion',
          variant: 'destructive',
        });
      }
    }
  };

  const handleApproveDeletion = async (budgetId: string) => {
    if (confirm('Approve this budget deletion?')) {
      try {
        await approveBudgetDeletion(budgetId);
        toast({ title: 'Success', description: 'Budget deleted successfully' });
        fetchBudgets();
      } catch (error: any) {
        toast({
          title: 'Error',
          description: error?.response?.data?.message || 'Failed to approve deletion',
          variant: 'destructive',
        });
      }
    }
  };

  const handleSyncBudgets = async () => {
    try {
      const result = await syncProjectBudgets();
      toast({
        title: 'Success',
        description: `Successfully synced ${result.syncedCount} project budgets`,
      });
      fetchBudgets();
    } catch (error: any) {
      console.error('Error syncing budgets:', error);
      toast({
        title: 'Error',
        description: error.response?.status === 403 
          ? 'You do not have permission to sync budgets'
          : 'Failed to sync budgets',
        variant: 'destructive',
      });
    }
  };

  const getUtilizationColor = (percentage: number) => {
    if (percentage >= 90) return 'text-red-600';
    if (percentage >= 75) return 'text-orange-600';
    if (percentage >= 50) return 'text-yellow-600';
    return 'text-green-600';
  };

  const getUtilizationBgColor = (percentage: number) => {
    if (percentage >= 90) return 'bg-red-500';
    if (percentage >= 75) return 'bg-orange-500';
    if (percentage >= 50) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'in-review': return 'bg-blue-100 text-blue-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'draft': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'pending': return <Clock className="w-4 h-4 text-yellow-600" />;
      case 'in-review': return <Eye className="w-4 h-4 text-blue-600" />;
      case 'rejected': return <XCircle className="w-4 h-4 text-red-600" />;
      default: return <Clock className="w-4 h-4 text-gray-600" />;
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading...</div>;
  }

  return (
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Budget Dashboard</h1>
            <p className="text-sm text-muted-foreground mt-1">Comprehensive budget management, analytics & approvals</p>
          </div>
          <div className="flex gap-2">
            <NumberFormatSwitcher />
            <Select value={displayCurrency} onValueChange={setDisplayCurrency}>
              <SelectTrigger className="w-24">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="USD">USD $</SelectItem>
                <SelectItem value="INR">INR ₹</SelectItem>
                <SelectItem value="EUR">EUR €</SelectItem>
                <SelectItem value="GBP">GBP £</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="ghost" size="icon" onClick={() => setShowShortcuts(true)} title="Keyboard shortcuts">
              <Command className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={exportToCSV}>
              <Download className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={() => router.push('/dashboard/budgets/analytics')}>
              <BarChart3 className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={() => router.push('/dashboard/budgets/comparison')}>
              Compare
            </Button>
            <Button variant="outline" size="sm" onClick={() => router.push('/dashboard/budgets/consolidation')}>
              Consolidation
            </Button>
            <Button variant="outline" size="sm" onClick={() => router.push('/dashboard/budgets/rollover')}>
              Rollover
            </Button>
            <Button variant="outline" size="sm" onClick={() => router.push('/dashboard/budgets/custom-reports')}>
              Custom Reports
            </Button>
            {(user?.role.name === 'Root' || user?.role.name === 'Super Admin' || user?.role.name === 'Admin' || user?.role.name === 'Manager') && (
              <Button variant="outline" size="sm" onClick={handleSyncBudgets}>
                <RefreshCw className="w-4 h-4" />
              </Button>
            )}
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create Budget
            </Button>
            <BudgetCreateDialog
              open={showCreateDialog}
              onOpenChange={setShowCreateDialog}
              onSuccess={fetchBudgets}
              projects={projects}
              departments={departments}
            />
          </div>
        </div>

        {/* Main Dashboard Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="approvals">
              Approvals {pendingApprovals.length > 0 && <Badge className="ml-2" variant="destructive">{pendingApprovals.length}</Badge>}
            </TabsTrigger>
            <TabsTrigger value="budgets">All Budgets</TabsTrigger>
          </TabsList>

          {/* OVERVIEW TAB */}
          <TabsContent value="overview" className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Budget</CardTitle>
              <Coins className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatAmount(stats.total, displayCurrency)}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {filteredBudgets.length} budget{filteredBudgets.length !== 1 ? 's' : ''}
              </p>
              <Progress value={Math.min((stats.spent / stats.total) * 100, 100)} className="mt-2 h-1" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Spent vs Remaining</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatAmount(stats.spent, displayCurrency)}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {formatAmount(stats.remaining, displayCurrency)} remaining
              </p>
              <div className="flex items-center gap-2 mt-2">
                <Progress value={stats.avgUtilization} className="h-1 flex-1" />
                <span className="text-xs font-medium">{stats.avgUtilization.toFixed(0)}%</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Budget Health</CardTitle>
              {stats.healthScore >= 80 ? (
                <TrendingUp className="h-4 w-4 text-green-600" />
              ) : stats.healthScore >= 60 ? (
                <Activity className="h-4 w-4 text-yellow-600" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-600" />
              )}
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.healthScore.toFixed(0)}%</div>
              <p className="text-xs text-muted-foreground mt-1">
                {stats.overBudget > 0 && `${stats.overBudget} over budget`}
                {stats.overBudget > 0 && stats.highUtilization > 0 && ' • '}
                {stats.highUtilization > 0 && `${stats.highUtilization} at risk`}
                {stats.overBudget === 0 && stats.highUtilization === 0 && 'All budgets healthy'}
              </p>
              <Progress 
                value={stats.healthScore} 
                className="mt-2 h-1"
              />
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setActiveTab('approvals')}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Approvals</CardTitle>
              <Clock className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pendingApprovals.length}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {stats.byStatus.pending} pending • {stats.byStatus.draft} drafts
              </p>
              {pendingApprovals.length > 0 && (
                <Button variant="link" className="p-0 h-auto mt-2 text-xs" onClick={(e) => { e.stopPropagation(); setActiveTab('approvals'); }}>
                  Review now →
                </Button>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Target className="h-4 w-4" />
                Budget Distribution
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Approved</span>
                <span className="font-semibold">{stats.byStatus.approved}</span>
              </div>
              <Progress value={(stats.byStatus.approved / budgets.length) * 100} className="h-1" />
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Pending</span>
                <span className="font-semibold">{stats.byStatus.pending}</span>
              </div>
              <Progress value={(stats.byStatus.pending / budgets.length) * 100} className="h-1" />
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Draft</span>
                <span className="font-semibold">{stats.byStatus.draft}</span>
              </div>
              <Progress value={(stats.byStatus.draft / budgets.length) * 100} className="h-1" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <PieChart className="h-4 w-4" />
                Top Categories
              </CardTitle>
            </CardHeader>
            <CardContent>
              {budgets.length > 0 ? (
                <div className="space-y-2">
                  {Array.from(new Set(budgets.flatMap(b => b.categories.map(c => c.name)))).slice(0, 4).map((cat, idx) => (
                    <div key={idx} className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground truncate">{cat}</span>
                      <span className="font-semibold">{budgets.filter(b => b.categories.some(c => c.name === cat)).length}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No categories yet</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Created Today</span>
                  <span className="font-semibold">
                    {budgets.filter(b => new Date(b.createdAt).toDateString() === new Date().toDateString()).length}
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">This Week</span>
                  <span className="font-semibold">
                    {budgets.filter(b => {
                      const weekAgo = new Date();
                      weekAgo.setDate(weekAgo.getDate() - 7);
                      return new Date(b.createdAt) > weekAgo;
                    }).length}
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">This Month</span>
                  <span className="font-semibold">
                    {budgets.filter(b => new Date(b.createdAt).getMonth() === new Date().getMonth()).length}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Budgets */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Budgets</CardTitle>
            <CardDescription>Latest budget activities</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {budgets.slice(0, 5).map((budget) => {
                const spent = budget.status === 'approved' ? budget.categories.reduce((sum, cat) => sum + cat.spentAmount, 0) : 0;
                const util = budget.totalBudget > 0 ? (spent / budget.totalBudget) * 100 : 0;
                return (
                  <div key={budget._id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 cursor-pointer" onClick={() => router.push(`/dashboard/budgets/${budget._id}`)}>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium">{budget.projectName || budget.departmentName}</h4>
                        <Badge variant="outline" className="text-xs">{budget.budgetType}</Badge>
                        <Badge className={getStatusColor(budget.status)}>{budget.status}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {formatAmount(convertCurrency(budget.totalBudget, budget.currency, displayCurrency), displayCurrency)}
                      </p>
                    </div>
                    {budget.status === 'approved' && (
                      <div className="text-right">
                        <div className="text-sm font-semibold">{util.toFixed(0)}%</div>
                        <Progress value={util} className="w-20 h-1 mt-1" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
          </TabsContent>

          {/* ANALYTICS TAB */}
          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium">Total Allocated</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{formatAmount(stats.total, displayCurrency)}</div>
                  <p className="text-xs text-muted-foreground mt-2">Across {budgets.length} budgets</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{formatAmount(stats.spent, displayCurrency)}</div>
                  <p className="text-xs text-muted-foreground mt-2">{stats.avgUtilization.toFixed(1)}% utilization</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium">Available</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{formatAmount(stats.remaining, displayCurrency)}</div>
                  <p className="text-xs text-muted-foreground mt-2">Ready to allocate</p>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Budget by Type</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {['project', 'department', 'special'].map(type => {
                      const count = budgets.filter(b => b.budgetType === type).length;
                      const total = budgets.filter(b => b.budgetType === type).reduce((sum, b) => sum + convertCurrency(b.totalBudget, b.currency, displayCurrency), 0);
                      return (
                        <div key={type}>
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-sm capitalize">{type}</span>
                            <span className="text-sm font-semibold">{formatAmount(total, displayCurrency)}</span>
                          </div>
                          <Progress value={(total / stats.total) * 100} className="h-2" />
                          <p className="text-xs text-muted-foreground mt-1">{count} budget{count !== 1 ? 's' : ''}</p>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Utilization Analysis</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {[
                      { label: 'Over Budget', color: 'bg-red-500', count: stats.overBudget },
                      { label: 'High (80-100%)', color: 'bg-orange-500', count: stats.highUtilization },
                      { label: 'Medium (50-80%)', color: 'bg-yellow-500', count: budgets.filter(b => {
                        const s = b.categories.reduce((cs, c) => cs + c.spentAmount, 0);
                        const u = b.totalBudget > 0 ? (s / b.totalBudget) * 100 : 0;
                        return u >= 50 && u < 80;
                      }).length },
                      { label: 'Low (<50%)', color: 'bg-green-500', count: budgets.filter(b => {
                        const s = b.categories.reduce((cs, c) => cs + c.spentAmount, 0);
                        const u = b.totalBudget > 0 ? (s / b.totalBudget) * 100 : 0;
                        return u < 50;
                      }).length }
                    ].map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className={`w-3 h-3 rounded-full ${item.color}`} />
                          <span className="text-sm">{item.label}</span>
                        </div>
                        <span className="font-semibold">{item.count}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Budget Performance</CardTitle>
                <CardDescription>Top performing budgets by utilization</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {budgets
                    .filter(b => b.status === 'approved')
                    .sort((a, b) => {
                      const aSpent = a.categories.reduce((s, c) => s + c.spentAmount, 0);
                      const bSpent = b.categories.reduce((s, c) => s + c.spentAmount, 0);
                      const aUtil = a.totalBudget > 0 ? (aSpent / a.totalBudget) * 100 : 0;
                      const bUtil = b.totalBudget > 0 ? (bSpent / b.totalBudget) * 100 : 0;
                      return bUtil - aUtil;
                    })
                    .slice(0, 5)
                    .map((budget) => {
                      const spent = budget.categories.reduce((s, c) => s + c.spentAmount, 0);
                      const util = budget.totalBudget > 0 ? (spent / budget.totalBudget) * 100 : 0;
                      return (
                        <div key={budget._id} className="flex items-center gap-4">
                          <div className="flex-1">
                            <div className="font-medium text-sm">{budget.projectName || budget.departmentName}</div>
                            <div className="text-xs text-muted-foreground">{formatAmount(convertCurrency(budget.totalBudget, budget.currency, displayCurrency), displayCurrency)}</div>
                          </div>
                          <div className="flex items-center gap-2 w-32">
                            <Progress value={util} className="flex-1 h-2" />
                            <span className="text-sm font-semibold w-12 text-right">{util.toFixed(0)}%</span>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* APPROVALS TAB */}
          <TabsContent value="approvals" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Pending Approvals</CardTitle>
                <CardDescription>Budgets awaiting your approval</CardDescription>
              </CardHeader>
              <CardContent>
                {pendingApprovals.length === 0 ? (
                  <div className="text-center py-8">
                    <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-3" />
                    <p className="text-muted-foreground">No pending approvals</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {pendingApprovals.map((budget) => (
                      <Card key={budget._id} className="border-yellow-200 bg-yellow-50/30">
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start mb-3">
                            <div>
                              <h4 className="font-semibold">{budget.projectName || budget.departmentName}</h4>
                              <p className="text-sm text-muted-foreground">
                                Submitted {new Date(budget.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                            <Badge variant="outline" className="bg-yellow-100">
                              <Clock className="w-3 h-3 mr-1" />
                              Pending
                            </Badge>
                          </div>
                          <div className="grid grid-cols-3 gap-4 mb-4">
                            <div>
                              <span className="text-xs text-muted-foreground">Total Budget</span>
                              <p className="font-semibold">{formatCurrency(budget.totalBudget, budget.currency)}</p>
                            </div>
                            <div>
                              <span className="text-xs text-muted-foreground">Categories</span>
                              <p className="font-semibold">{budget.categories.length}</p>
                            </div>
                            <div>
                              <span className="text-xs text-muted-foreground">Type</span>
                              <p className="font-semibold capitalize">{budget.budgetType}</p>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button size="sm" onClick={() => router.push(`/dashboard/budgets/${budget._id}`)}>
                              <Eye className="w-4 h-4 mr-2" />
                              Review
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => router.push(`/dashboard/budgets/${budget._id}`)}>
                              View Details
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Approval History</CardTitle>
                <CardDescription>Recently approved or rejected budgets</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {budgets
                    .filter(b => b.status === 'approved' || b.status === 'rejected')
                    .slice(0, 5)
                    .map((budget) => (
                      <div key={budget._id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          {budget.status === 'approved' ? (
                            <CheckCircle className="h-5 w-5 text-green-600" />
                          ) : (
                            <XCircle className="h-5 w-5 text-red-600" />
                          )}
                          <div>
                            <div className="font-medium">{budget.projectName || budget.departmentName}</div>
                            <div className="text-sm text-muted-foreground">
                              {formatCurrency(budget.totalBudget, budget.currency)}
                            </div>
                          </div>
                        </div>
                        <Badge className={getStatusColor(budget.status)}>
                          {budget.status}
                        </Badge>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ALL BUDGETS TAB */}
          <TabsContent value="budgets" className="space-y-6">
        {(stats.overBudget > 0 || stats.highUtilization > 0) && (
          <Card className="border-orange-200 bg-orange-50/50">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-orange-600 mt-0.5" />
                <div className="flex-1">
                  <h3 className="font-semibold text-orange-900">Budget Alerts</h3>
                  <p className="text-sm text-orange-800 mt-1">
                    {stats.overBudget > 0 && `${stats.overBudget} budget${stats.overBudget !== 1 ? 's are' : ' is'} over budget. `}
                    {stats.highUtilization > 0 && `${stats.highUtilization} budget${stats.highUtilization !== 1 ? 's are' : ' is'} at 80%+ utilization and may need attention.`}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
              <div className="flex gap-2">
                <Button variant={statusFilter === 'all' ? 'default' : 'outline'} size="sm" onClick={() => setStatusFilter('all')}>All</Button>
                <Button variant={statusFilter === 'draft' ? 'default' : 'outline'} size="sm" onClick={() => setStatusFilter('draft')}>Draft</Button>
                <Button variant={statusFilter === 'in-review' ? 'default' : 'outline'} size="sm" onClick={() => setStatusFilter('in-review')}>In Review</Button>
                <Button variant={statusFilter === 'pending' ? 'default' : 'outline'} size="sm" onClick={() => setStatusFilter('pending')}>Pending</Button>
                <Button variant={statusFilter === 'approved' ? 'default' : 'outline'} size="sm" onClick={() => setStatusFilter('approved')}>Approved</Button>
                <Button variant={statusFilter === 'rejected' ? 'default' : 'outline'} size="sm" onClick={() => setStatusFilter('rejected')}>Rejected</Button>
              </div>
              <div className="flex gap-2 flex-1 md:flex-initial">
                <div className="relative flex-1 md:w-64">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="search-input"
                    placeholder="Search budgets... (Ctrl+K)"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-8"
                  />
                </div>
                <Select value={sortBy} onValueChange={(v: any) => setSortBy(v)}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="date">Newest First</SelectItem>
                    <SelectItem value="amount">Highest Amount</SelectItem>
                    <SelectItem value="name">Name (A-Z)</SelectItem>
                    <SelectItem value="utilization">Utilization</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          {filteredBudgets.map((budget) => {
            const actualSpent = budget.status === 'approved' ? budget.categories.reduce((sum, cat) => sum + cat.spentAmount, 0) : 0;
            const remainingBudget = budget.totalBudget - actualSpent;
            const utilizationPercentage = budget.status === 'approved' && budget.totalBudget > 0 ? (actualSpent / budget.totalBudget) * 100 : 0;
            const isFavorite = favorites.has(budget._id);

            return (
              <Card key={budget._id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 -ml-2"
                          onClick={() => toggleFavorite(budget._id)}
                        >
                          <Star className={`h-4 w-4 ${isFavorite ? 'fill-yellow-400 text-yellow-400' : ''}`} />
                        </Button>
                        <h3 className="text-lg font-semibold cursor-pointer hover:text-primary" onClick={() => setQuickView(budget)}>
                          {budget.departmentName || budget.projectName || 'Special Budget'}
                        </h3>
                        <Badge variant="outline" className="text-xs capitalize">
                          {budget.budgetType}
                        </Badge>
                        {budget.currency !== displayCurrency && (
                          <Badge variant="outline" className="text-xs">
                            {budget.currency}
                          </Badge>
                        )}
                        {budget.deleteApprovalStatus === 'pending' && (
                          <Badge variant="destructive" className="text-xs">
                            Deletion Pending
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Created {new Date(budget.createdAt).toLocaleDateString()} • {budget.categories.length} categories
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(budget.status)}
                      <Badge className={getStatusColor(budget.status)}>
                        {budget.status.charAt(0).toUpperCase() + budget.status.slice(1)}
                      </Badge>
                    </div>
                  </div>

                  <div className="space-y-3 mb-4">
                    {budget.status === 'approved' ? (
                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-sm text-muted-foreground">Budget Utilization</span>
                          <span className="text-sm font-semibold">{utilizationPercentage.toFixed(1)}%</span>
                        </div>
                        <Progress 
                          value={Math.min(utilizationPercentage, 100)} 
                          className="h-2"
                        />
                        <div className="flex justify-between items-center mt-1 text-xs text-muted-foreground">
                          <span>{formatAmount(convertCurrency(actualSpent, budget.currency, displayCurrency), displayCurrency)} spent</span>
                          <span>{formatAmount(convertCurrency(remainingBudget, budget.currency, displayCurrency), displayCurrency)} remaining</span>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-muted/50 p-3 rounded-lg text-center">
                        <p className="text-sm text-muted-foreground">
                          {budget.status === 'draft' && 'Budget not submitted yet'}
                          {budget.status === 'pending' && 'Awaiting approval - No spending allowed'}
                          {budget.status === 'rejected' && 'Budget rejected - Cannot be used'}
                        </p>
                      </div>
                    )}
                    <div className="grid grid-cols-3 gap-4 pt-2 border-t">
                      <div>
                        <span className="text-xs text-muted-foreground">Total Budget</span>
                        <p className="text-base font-semibold">{formatAmount(convertCurrency(budget.totalBudget, budget.currency, displayCurrency), displayCurrency)}</p>
                        {budget.currency !== displayCurrency && (
                          <p className="text-xs text-muted-foreground">{formatCurrency(budget.totalBudget, budget.currency)}</p>
                        )}
                      </div>
                      <div>
                        <span className="text-xs text-muted-foreground">Categories</span>
                        <p className="text-base font-semibold">{budget.categories.length}</p>
                      </div>
                      <div>
                        <span className="text-xs text-muted-foreground">Original</span>
                        <p className="text-base font-semibold">{budget.currency}</p>
                      </div>
                    </div>
                  </div>

                  {budget.approvals && budget.approvals.length > 0 && (
                    <div className="mb-4 p-3 bg-muted/50 rounded-lg">
                      <h4 className="text-sm font-medium mb-2">Recent Approvals</h4>
                      <div className="space-y-1">
                        {budget.approvals.slice(0, 2).map((approval, idx) => (
                          <div key={idx} className="flex items-center gap-2 text-sm">
                            {getStatusIcon(approval.status)}
                            <span className="font-medium">{approval.userName}</span>
                            <span className="text-muted-foreground capitalize">{approval.status}</span>
                            {approval.approvedAt && (
                              <span className="text-muted-foreground text-xs ml-auto">
                                {new Date(approval.approvedAt).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                        ))}
                        {budget.approvals.length > 2 && (
                          <p className="text-xs text-muted-foreground">+{budget.approvals.length - 2} more</p>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2 flex-wrap">
                    <Button variant="outline" size="sm" onClick={() => router.push(`/dashboard/budgets/${budget._id}`)}>
                      <Eye className="w-4 h-4 mr-2" />
                      View Details
                    </Button>
                    {budget.status === 'draft' && !budget.deleteApprovalStatus && (
                      <>
                        {canEditBudget(budget).allowed && (
                          <Button variant="outline" size="sm" onClick={() => router.push(`/dashboard/budgets/${budget._id}/edit`)}>
                            <Edit className="w-4 h-4 mr-2" />
                            Edit
                          </Button>
                        )}
                        <Button variant="outline" size="sm" onClick={() => duplicateBudget(budget)}>
                          <Copy className="w-4 h-4 mr-2" />
                          Duplicate
                        </Button>
                        <Button 
                          variant="outline"
                          size="sm" 
                          onClick={async () => {
                            try {
                              await sendToReview(budget._id);
                              toast({ title: 'Success', description: 'Budget sent to review' });
                              fetchBudgets();
                            } catch (error: any) {
                              toast({ title: 'Error', description: 'Failed to send to review', variant: 'destructive' });
                            }
                          }}
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          Send to Review
                        </Button>
                        <Button 
                          size="sm" 
                          onClick={() => handleSubmitForApproval(budget._id)}
                          disabled={!canSubmitBudget(budget).allowed}
                          title={!canSubmitBudget(budget).allowed ? canSubmitBudget(budget).reason : ''}
                        >
                          <Send className="w-4 h-4 mr-2" />
                          Submit
                        </Button>
                        {canDeleteBudget(budget).allowed && (
                          <Button variant="destructive" size="sm" onClick={() => handleRequestDeletion(budget._id)}>
                            <Trash2 className="w-4 h-4 mr-2" />
                            Request Delete
                          </Button>
                        )}
                      </>
                    )}
                    {budget.status === 'in-review' && (
                      <>
                        <Button variant="outline" size="sm" onClick={() => router.push(`/dashboard/budgets/${budget._id}`)}>
                          <Eye className="w-4 h-4 mr-2" />
                          Review
                        </Button>
                        <Button 
                          size="sm" 
                          onClick={() => handleSubmitForApproval(budget._id)}
                        >
                          <Send className="w-4 h-4 mr-2" />
                          Submit for Approval
                        </Button>
                      </>
                    )}
                    {budget.deleteApprovalStatus === 'pending' && (isDirector || hasApprovePermission) && (
                      <Button variant="destructive" size="sm" onClick={() => handleApproveDeletion(budget._id)}>
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Approve Deletion
                      </Button>
                    )}
                    {budget.status === 'pending' && (
                      <Button size="sm" onClick={() => router.push('/dashboard/budgets/approvals')}>
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Review Approval
                      </Button>
                    )}
                    {budget.status === 'approved' && (
                      <Button variant="outline" size="sm" onClick={() => duplicateBudget(budget)}>
                        <Copy className="w-4 h-4 mr-2" />
                        Duplicate
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {filteredBudgets.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No budgets found</p>
          </div>
        )}
          </TabsContent>
        </Tabs>

        {/* End of Main Content */}

        {/* Keyboard Shortcuts Dialog */}
        <Dialog open={showShortcuts} onOpenChange={setShowShortcuts}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Keyboard Shortcuts</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm">Search budgets</span>
                <kbd className="px-2 py-1 text-xs bg-muted rounded">Ctrl + K</kbd>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Create new budget</span>
                <kbd className="px-2 py-1 text-xs bg-muted rounded">Ctrl + N</kbd>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Show shortcuts</span>
                <kbd className="px-2 py-1 text-xs bg-muted rounded">Ctrl + /</kbd>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Export to CSV</span>
                <kbd className="px-2 py-1 text-xs bg-muted rounded">Click export button</kbd>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Quick View Dialog */}
        <Dialog open={!!quickView} onOpenChange={() => setQuickView(null)}>
          <DialogContent className="max-w-2xl">
            {quickView && (
              <>
                <DialogHeader>
                  <DialogTitle>{quickView.projectName}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="grid grid-cols-4 gap-4">
                    <div>
                      <div className="text-xs text-muted-foreground">Total Budget</div>
                      <div className="text-lg font-bold">{formatCurrency(quickView.totalBudget, quickView.currency)}</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">Spent</div>
                      <div className="text-lg font-bold">
                        {formatCurrency(quickView.categories.reduce((s, c) => s + c.spentAmount, 0), quickView.currency)}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">Remaining</div>
                      <div className="text-lg font-bold">
                        {formatCurrency(
                          quickView.totalBudget - quickView.categories.reduce((s, c) => s + c.spentAmount, 0),
                          quickView.currency
                        )}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">Status</div>
                      <Badge className="mt-1">{quickView.status}</Badge>
                    </div>
                  </div>

                  {quickView.categories.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold mb-2">Categories</h4>
                      <div className="space-y-2">
                        {quickView.categories.map((cat, idx) => (
                          <div key={idx} className="flex justify-between items-center p-2 bg-muted rounded">
                            <span className="text-sm">{cat.name}</span>
                            <div className="text-right">
                              <div className="text-sm font-semibold">{formatCurrency(cat.allocatedAmount, quickView.currency)}</div>
                              <div className="text-xs text-muted-foreground">
                                {cat.spentAmount > 0 ? `${((cat.spentAmount / cat.allocatedAmount) * 100).toFixed(0)}% used` : 'Not used'}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2 justify-end">
                    <Button variant="outline" onClick={() => setQuickView(null)}>Close</Button>
                    <Button onClick={() => {
                      router.push(`/dashboard/budgets/${quickView._id}`);
                      setQuickView(null);
                    }}>
                      View Full Details
                    </Button>
                  </div>
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>
  );
}
