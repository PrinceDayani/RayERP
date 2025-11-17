'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Search, Eye, Edit, Trash2, DollarSign, TrendingUp, Clock, CheckCircle, XCircle, Send, RefreshCw } from 'lucide-react';
import { getAllBudgets, createBudget, deleteBudget, submitForApproval, getBudgetAnalytics, getPendingApprovals, syncProjectBudgets } from '@/lib/api/budgetAPI';
import { Budget } from '@/types/budget';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

export default function BudgetsPage() {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [filteredBudgets, setFilteredBudgets] = useState<Budget[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newBudget, setNewBudget] = useState({
    projectName: '',
    totalBudget: '',
    currency: 'INR',
    budgetType: 'project'
  });
  const router = useRouter();
  const { user } = useAuth();

  useEffect(() => {
    fetchBudgets();
    fetchAnalytics();
  }, []);

  useEffect(() => {
    filterBudgets();
  }, [budgets, searchQuery, statusFilter]);

  const fetchBudgets = async () => {
    try {
      const allBudgets = await getAllBudgets();
      const pendingBudgets = await getPendingApprovals();
      const combined = [...allBudgets, ...pendingBudgets.filter(pb => !allBudgets.find(ab => ab._id === pb._id))];
      setBudgets(combined);
    } catch (error) {
      console.error('Error fetching budgets:', error);
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

  const filterBudgets = () => {
    let filtered = budgets;

    if (searchQuery) {
      filtered = filtered.filter(budget =>
        budget.projectName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        budget.currency.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(budget => budget.status === statusFilter);
    }

    setFilteredBudgets(filtered);
  };

  const handleCreateBudget = async () => {
    try {
      await createBudget({
        projectId: '',
        projectName: newBudget.projectName,
        totalBudget: Number(newBudget.totalBudget),
        currency: newBudget.currency,
        categories: []
      });
      setShowCreateDialog(false);
      setNewBudget({ projectName: '', totalBudget: '', currency: 'INR', budgetType: 'project' });
      fetchBudgets();
    } catch (error) {
      console.error('Error creating budget:', error);
    }
  };

  const handleSubmitForApproval = async (budgetId: string) => {
    try {
      await submitForApproval(budgetId);
      fetchBudgets();
    } catch (error) {
      console.error('Error submitting for approval:', error);
    }
  };

  const handleDeleteBudget = async (budgetId: string) => {
    if (confirm('Are you sure you want to delete this budget?')) {
      try {
        await deleteBudget(budgetId);
        fetchBudgets();
      } catch (error) {
        console.error('Error deleting budget:', error);
      }
    }
  };

  const handleSyncBudgets = async () => {
    try {
      const result = await syncProjectBudgets();
      alert(`Successfully synced ${result.syncedCount} project budgets`);
      fetchBudgets();
    } catch (error: any) {
      console.error('Error syncing budgets:', error);
      if (error.response?.status === 403) {
        alert('You do not have permission to sync budgets. Admin/Manager role required.');
      } else {
        alert('Failed to sync budgets');
      }
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'draft': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'pending': return <Clock className="w-4 h-4 text-yellow-600" />;
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
          <h1 className="text-3xl font-bold">Budget Management</h1>
          <div className="flex gap-2">
            {(user?.role === 'root' || user?.role === 'super_admin' || user?.role === 'admin' || user?.role === 'manager') && (
              <Button variant="outline" onClick={handleSyncBudgets}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Sync Projects
              </Button>
            )}
            <Button variant="outline" onClick={() => router.push('/dashboard/budgets/approved')}>
              <CheckCircle className="w-4 h-4 mr-2" />
              Approved
            </Button>
            <Button onClick={() => router.push('/dashboard/budgets/approvals')}>
              <Clock className="w-4 h-4 mr-2" />
              Approvals
            </Button>
            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Budget
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Budget</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Project Name</label>
                    <Input
                      value={newBudget.projectName}
                      onChange={(e) => setNewBudget({ ...newBudget, projectName: e.target.value })}
                      placeholder="Enter project name"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Total Budget</label>
                    <Input
                      type="number"
                      value={newBudget.totalBudget}
                      onChange={(e) => setNewBudget({ ...newBudget, totalBudget: e.target.value })}
                      placeholder="Enter total budget"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Currency</label>
                    <Select value={newBudget.currency} onValueChange={(value) => setNewBudget({ ...newBudget, currency: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="INR">INR</SelectItem>
                        <SelectItem value="USD">USD</SelectItem>
                        <SelectItem value="EUR">EUR</SelectItem>
                        <SelectItem value="GBP">GBP</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setShowCreateDialog(false)}>Cancel</Button>
                    <Button onClick={handleCreateBudget}>Create</Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {analytics && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Budgets</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics.summary.totalBudgets}</div>
                <p className="text-xs text-muted-foreground">
                  ₹{analytics.summary.totalBudgetAmount.toLocaleString()}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending Approval</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics.summary.pendingApprovals}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Approved</CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics.summary.approvedBudgets}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">₹{analytics.summary.totalSpent.toLocaleString()}</div>
              </CardContent>
            </Card>
          </div>
        )}

        <div className="flex gap-4 items-center">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search budgets..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-4">
          {filteredBudgets.map((budget) => (
            <Card key={budget._id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold">{budget.projectName}</h3>
                    <p className="text-sm text-gray-600">
                      Created: {new Date(budget.createdAt).toLocaleDateString()}
                    </p>
                    <p className="text-sm text-gray-600">
                      Fiscal Year: {budget.fiscalYear} | Type: {budget.budgetType}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(budget.status)}
                    <Badge className={getStatusColor(budget.status)}>
                      {budget.status.charAt(0).toUpperCase() + budget.status.slice(1)}
                    </Badge>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
                  <div>
                    <span className="text-sm text-gray-600">Project</span>
                    <p className="font-semibold">{typeof budget.projectId === 'object' ? budget.projectId?.name : 'N/A'}</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">Total Budget</span>
                    <p className="font-semibold">{budget.currency} {budget.totalBudget.toLocaleString()}</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">Spent</span>
                    <p className="font-semibold">{budget.currency} {budget.actualSpent.toLocaleString()}</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">Remaining</span>
                    <p className="font-semibold">{budget.currency} {budget.remainingBudget.toLocaleString()}</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">Utilization</span>
                    <p className="font-semibold">{budget.utilizationPercentage.toFixed(1)}%</p>
                  </div>
                </div>

                {budget.approvals && budget.approvals.length > 0 && (
                  <div className="mb-4 p-3 bg-gray-50 rounded">
                    <h4 className="text-sm font-medium mb-2">Approval History</h4>
                    <div className="space-y-1">
                      {budget.approvals.slice(0, 2).map((approval, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-sm">
                          {getStatusIcon(approval.status)}
                          <span className="font-medium">{approval.userName}</span>
                          <span className="text-gray-600 capitalize">{approval.status}</span>
                          {approval.approvedAt && (
                            <span className="text-gray-400 text-xs ml-auto">
                              {new Date(approval.approvedAt).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      ))}
                      {budget.approvals.length > 2 && (
                        <p className="text-xs text-gray-500">+{budget.approvals.length - 2} more</p>
                      )}
                    </div>
                  </div>
                )}

                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => router.push(`/dashboard/budgets/${budget._id}`)}>
                    <Eye className="w-4 h-4 mr-1" />
                    View Details
                  </Button>
                  {budget.status === 'draft' && (
                    <>
                      <Button variant="outline" size="sm" onClick={() => router.push(`/dashboard/budgets/${budget._id}/edit`)}>
                        <Edit className="w-4 h-4 mr-1" />
                        Edit
                      </Button>
                      <Button size="sm" onClick={() => handleSubmitForApproval(budget._id)}>
                        <Send className="w-4 h-4 mr-1" />
                        Submit
                      </Button>
                      <Button variant="destructive" size="sm" onClick={() => handleDeleteBudget(budget._id)}>
                        <Trash2 className="w-4 h-4 mr-1" />
                        Delete
                      </Button>
                    </>
                  )}
                  {budget.status === 'pending' && (
                    <Button size="sm" onClick={() => router.push('/dashboard/budgets/approvals')}>
                      <CheckCircle className="w-4 h-4 mr-1" />
                      Review Approval
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredBudgets.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No budgets found</p>
          </div>
        )}
      </div>
  );
}