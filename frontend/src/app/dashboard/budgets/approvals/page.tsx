"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckCircle, XCircle, Clock, Eye, ArrowLeft, Search, Filter, AlertCircle, TrendingUp, Calendar, Coins, RefreshCw, Users, FileText, Timer, Zap, BarChart3, Download, Bell } from "lucide-react";
import { Budget } from "@/types/budget";
import { getPendingApprovals, approveBudget, rejectBudget, getAllBudgets } from "@/lib/api/budgetAPI";
import { useRouter } from "next/navigation";
import { toast } from "@/components/ui/use-toast";
import { formatCurrency } from "@/utils/currency";
import { useCurrency } from "@/hooks/useCurrency";
import BudgetAnalytics from "@/components/budget/BudgetAnalytics";

export default function BudgetApprovalsPage() {
  const { displayCurrency, formatAmount } = useCurrency();
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [statusFilter, setStatusFilter] = useState("pending");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"date" | "amount" | "name" | "priority">("priority");
  const [selectedBudgets, setSelectedBudgets] = useState<Set<string>>(new Set());
  const [selectedBudget, setSelectedBudget] = useState<Budget | null>(null);
  const [showApprovalDialog, setShowApprovalDialog] = useState(false);
  const [showBulkProgress, setShowBulkProgress] = useState(false);
  const [bulkProgress, setBulkProgress] = useState(0);
  const [approvalAction, setApprovalAction] = useState<'approve' | 'reject'>('approve');
  const [comments, setComments] = useState("");
  const [isBulkAction, setIsBulkAction] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const router = useRouter();

  const getPriorityLevel = (budget: Budget): "high" | "medium" | "low" => {
    if (budget.totalBudget > 100000) return "high";
    if (budget.totalBudget > 50000) return "medium";
    return "low";
  };

  const getDaysOld = (date: string): number => {
    return Math.floor((Date.now() - new Date(date).getTime()) / (1000 * 60 * 60 * 24));
  };

  useEffect(() => {
    fetchBudgets();
    const interval = setInterval(fetchBudgets, 30000); // Auto-refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchBudgets = useCallback(async (showRefresh = false) => {
    try {
      if (showRefresh) setRefreshing(true);
      else setLoading(true);
      
      const data = await getAllBudgets();
      const dataArray = Array.isArray(data) ? data : [];
      setBudgets(dataArray);
      
      if (showRefresh) {
        toast({
          title: "Refreshed",
          description: "Budget data updated successfully",
        });
      }
    } catch (error) {
      console.error("Error fetching budgets:", error);
      toast({
        title: "Error",
        description: "Failed to fetch budgets",
        variant: "destructive",
      });
      setBudgets([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const filteredBudgets = useMemo(() => {
    let filtered = budgets;

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter(b => b.status === statusFilter);
    }

    // Priority filter
    if (priorityFilter !== "all") {
      filtered = filtered.filter(b => {
        const priority = getPriorityLevel(b);
        return priority === priorityFilter;
      });
    }

    // Type filter
    if (typeFilter !== "all") {
      filtered = filtered.filter(b => b.budgetType === typeFilter);
    }

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(b => 
        b.projectName?.toLowerCase().includes(query) ||
        b.departmentName?.toLowerCase().includes(query) ||
        b.createdBy?.toLowerCase().includes(query) ||
        b.currency?.toLowerCase().includes(query)
      );
    }

    // Sorting
    const sorted = [...filtered].sort((a, b) => {
      if (sortBy === "date") {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      } else if (sortBy === "amount") {
        return b.totalBudget - a.totalBudget;
      } else if (sortBy === "priority") {
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        const aPriority = getPriorityLevel(a);
        const bPriority = getPriorityLevel(b);
        return priorityOrder[bPriority] - priorityOrder[aPriority];
      } else {
        return (a.projectName || a.departmentName || '').localeCompare(b.projectName || b.departmentName || '');
      }
    });

    return sorted;
  }, [budgets, statusFilter, priorityFilter, typeFilter, searchQuery, sortBy]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved": return "bg-green-100 text-green-800";
      case "pending": return "bg-yellow-100 text-yellow-800";
      case "rejected": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "approved": return <CheckCircle className="w-4 h-4 text-green-600" />;
      case "pending": return <Clock className="w-4 h-4 text-yellow-600" />;
      case "rejected": return <XCircle className="w-4 h-4 text-red-600" />;
      default: return <Clock className="w-4 h-4 text-gray-600" />;
    }
  };

  const handleApprovalAction = (budget: Budget, action: 'approve' | 'reject') => {
    setSelectedBudget(budget);
    setApprovalAction(action);
    setIsBulkAction(false);
    setShowApprovalDialog(true);
  };

  const handleBulkApprovalAction = (action: 'approve' | 'reject') => {
    if (selectedBudgets.size === 0) {
      toast({
        title: "No Selection",
        description: "Please select budgets to process",
        variant: "destructive",
      });
      return;
    }
    setApprovalAction(action);
    setIsBulkAction(true);
    setShowApprovalDialog(true);
  };

  const toggleBudgetSelection = (budgetId: string) => {
    const newSelection = new Set(selectedBudgets);
    if (newSelection.has(budgetId)) {
      newSelection.delete(budgetId);
    } else {
      newSelection.add(budgetId);
    }
    setSelectedBudgets(newSelection);
  };

  const toggleSelectAll = () => {
    if (selectedBudgets.size === filteredBudgets.filter(b => b.status === "pending").length) {
      setSelectedBudgets(new Set());
    } else {
      const pendingIds = filteredBudgets.filter(b => b.status === "pending").map(b => b._id);
      setSelectedBudgets(new Set(pendingIds));
    }
  };

  const submitApproval = async () => {
    try {
      if (isBulkAction) {
        const budgetIds = Array.from(selectedBudgets);
        setShowBulkProgress(true);
        setBulkProgress(0);
        
        let completed = 0;
        for (const id of budgetIds) {
          try {
            if (approvalAction === 'approve') {
              await approveBudget(id, { comments });
            } else {
              await rejectBudget(id, { comments });
            }
            completed++;
            setBulkProgress((completed / budgetIds.length) * 100);
          } catch (error) {
            console.error(`Error processing budget ${id}:`, error);
          }
        }
        
        toast({
          title: "Bulk Action Complete",
          description: `${completed}/${budgetIds.length} budget(s) ${approvalAction === 'approve' ? 'approved' : 'rejected'} successfully`,
        });
        setSelectedBudgets(new Set());
        setShowBulkProgress(false);
      } else {
        if (!selectedBudget) return;
        if (approvalAction === 'approve') {
          await approveBudget(selectedBudget._id, { comments });
          toast({
            title: "Success",
            description: "Budget approved successfully",
          });
        } else {
          await rejectBudget(selectedBudget._id, { comments });
          toast({
            title: "Success",
            description: "Budget rejected successfully",
          });
        }
        setSelectedBudget(null);
      }
      
      await fetchBudgets();
      setShowApprovalDialog(false);
      setComments("");
    } catch (error: any) {
      console.error("Error submitting approval:", error);
      toast({
        title: "Error",
        description: error?.response?.data?.message || error?.message || "Failed to process approval",
        variant: "destructive",
      });
      setShowBulkProgress(false);
    }
  };

  // Enhanced metrics
  const pendingCount = budgets.filter(b => b.status === "pending").length;
  const approvedCount = budgets.filter(b => b.status === "approved").length;
  const rejectedCount = budgets.filter(b => b.status === "rejected").length;
  const draftCount = budgets.filter(b => b.status === "draft").length;
  const totalPendingAmount = budgets.filter(b => b.status === "pending").reduce((sum, b) => sum + b.totalBudget, 0);
  const highPriorityCount = budgets.filter(b => b.status === "pending" && getPriorityLevel(b) === "high").length;
  const urgentCount = budgets.filter(b => b.status === "pending" && getDaysOld(b.createdAt) > 7).length;
  const avgApprovalTime = budgets.filter(b => b.status === "approved").length > 0 ? 
    budgets.filter(b => b.status === "approved").reduce((sum, b) => sum + getDaysOld(b.createdAt), 0) / approvedCount : 0;
  
  const pendingBudgets = filteredBudgets.filter(b => b.status === "pending");
  const allPendingSelected = pendingBudgets.length > 0 && selectedBudgets.size === pendingBudgets.length;
  
  // Priority distribution
  const priorityStats = {
    high: budgets.filter(b => b.status === "pending" && getPriorityLevel(b) === "high").length,
    medium: budgets.filter(b => b.status === "pending" && getPriorityLevel(b) === "medium").length,
    low: budgets.filter(b => b.status === "pending" && getPriorityLevel(b) === "low").length
  };

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-64 space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <p className="text-gray-600">Loading budget approvals...</p>
      </div>
    );
  }

  return (
      <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => router.push('/dashboard/budgets')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Budgets
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Budget Approvals</h1>
            <p className="text-gray-600 mt-1">Manage and process budget approval requests</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => fetchBudgets(true)}
            disabled={refreshing}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          {pendingCount > 0 && (
            <Badge variant="destructive" className="animate-pulse">
              <Bell className="w-3 h-3 mr-1" />
              {pendingCount} pending
            </Badge>
          )}
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="workflow">Workflow</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="border-l-4 border-l-yellow-500">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending Approval</CardTitle>
                <Clock className="h-4 w-4 text-yellow-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{pendingCount}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {highPriorityCount} high priority
                </p>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-green-500">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Approved</CardTitle>
                <CheckCircle className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{approvedCount}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Avg: {avgApprovalTime.toFixed(1)} days
                </p>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-red-500">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Rejected</CardTitle>
                <XCircle className="h-4 w-4 text-red-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{rejectedCount}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {urgentCount} overdue
                </p>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-blue-500">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending Value</CardTitle>
                <Coins className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatAmount(totalPendingAmount, displayCurrency)}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {draftCount} in draft
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <BudgetAnalytics 
            budgets={budgets}
            displayCurrency={displayCurrency}
            formatAmount={formatAmount}
          />
        </TabsContent>

        <TabsContent value="workflow" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Users className="w-5 h-5" />
                Approval Workflow Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500">
                <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Workflow integration coming soon</p>
                <p className="text-sm">Multi-level approval system with role-based routing</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search budgets, departments, creators..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 w-80"
            />
          </div>
          
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
            </SelectContent>
          </Select>

          <Select value={priorityFilter} onValueChange={setPriorityFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priority</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="low">Low</SelectItem>
            </SelectContent>
          </Select>

          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="project">Project</SelectItem>
              <SelectItem value="department">Department</SelectItem>
              <SelectItem value="special">Special</SelectItem>
            </SelectContent>
          </Select>

          <Select value={sortBy} onValueChange={(v: any) => setSortBy(v)}>
            <SelectTrigger className="w-44">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="priority">Priority</SelectItem>
              <SelectItem value="date">Date (Newest)</SelectItem>
              <SelectItem value="amount">Amount (Highest)</SelectItem>
              <SelectItem value="name">Name (A-Z)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          {selectedBudgets.size > 0 && (
            <>
              <Badge variant="outline" className="px-3 py-1">
                {selectedBudgets.size} selected
              </Badge>
              <Button 
                size="sm" 
                className="bg-green-600 hover:bg-green-700"
                onClick={() => handleBulkApprovalAction('approve')}
              >
                <CheckCircle className="w-4 h-4 mr-1" />
                Approve All
              </Button>
              <Button 
                size="sm" 
                variant="destructive"
                onClick={() => handleBulkApprovalAction('reject')}
              >
                <XCircle className="w-4 h-4 mr-1" />
                Reject All
              </Button>
            </>
          )}
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-1" />
            Export
          </Button>
        </div>
      </div>

      {pendingBudgets.length > 0 && (
        <div className="flex items-center justify-between bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-200">
          <div className="flex items-center gap-3">
            <Checkbox
              checked={allPendingSelected}
              onCheckedChange={toggleSelectAll}
            />
            <span className="text-sm font-medium">Select all {pendingBudgets.length} pending budgets</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Clock className="w-4 h-4" />
            <span>{urgentCount} overdue • {highPriorityCount} high priority</span>
          </div>
        </div>
      )}

      {showBulkProgress && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <div className="flex justify-between text-sm mb-2">
                  <span>Processing bulk action...</span>
                  <span>{Math.round(bulkProgress)}%</span>
                </div>
                <Progress value={bulkProgress} className="h-2" />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="space-y-4">
        {filteredBudgets.map((budget) => {
          const priority = getPriorityLevel(budget);
          const daysOld = getDaysOld(budget.createdAt);
          const isSelected = selectedBudgets.has(budget._id);
          
          return (
          <Card key={budget._id} className={`hover:shadow-lg transition-all duration-200 ${isSelected ? 'ring-2 ring-blue-500 bg-blue-50' : ''} ${priority === 'high' ? 'border-l-4 border-l-red-500' : priority === 'medium' ? 'border-l-4 border-l-yellow-500' : 'border-l-4 border-l-green-500'}`}>
            <CardContent className="p-6">
              <div className="flex gap-4">
                {budget.status === "pending" && (
                  <div className="flex items-start pt-1">
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => toggleBudgetSelection(budget._id)}
                    />
                  </div>
                )}
                
                <div className="flex-1">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-lg font-semibold">{budget.projectName || budget.departmentName}</h3>
                        <Badge variant="outline" className="text-xs capitalize">
                          {budget.budgetType}
                        </Badge>
                        {priority === "high" && (
                          <Badge variant="destructive" className="text-xs animate-pulse">
                            <AlertCircle className="w-3 h-3 mr-1" />
                            High Priority
                          </Badge>
                        )}
                        {priority === "medium" && (
                          <Badge variant="secondary" className="text-xs">
                            Medium Priority
                          </Badge>
                        )}
                        {daysOld > 7 && budget.status === "pending" && (
                          <Badge variant="outline" className="text-xs text-orange-600 border-orange-600 animate-pulse">
                            <Clock className="w-3 h-3 mr-1" />
                            {daysOld} days overdue
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <span>Created by: {budget.createdBy || 'Unknown'}</span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(budget.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(budget.status)}
                      <Badge className={getStatusColor(budget.status)}>
                        {budget.status.charAt(0).toUpperCase() + budget.status.slice(1)}
                      </Badge>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4 bg-gradient-to-r from-gray-50 to-gray-100 p-4 rounded-lg">
                    <div>
                      <span className="text-xs text-gray-500 uppercase tracking-wide">Total Budget</span>
                      <p className="font-bold text-lg mt-1">{formatCurrency(budget.totalBudget, budget.currency)}</p>
                    </div>
                    <div>
                      <span className="text-xs text-gray-500 uppercase tracking-wide">Categories</span>
                      <p className="font-bold text-lg mt-1">{budget.categories?.length || 0}</p>
                    </div>
                    <div>
                      <span className="text-xs text-gray-500 uppercase tracking-wide">Currency</span>
                      <p className="font-bold text-lg mt-1">{budget.currency}</p>
                    </div>
                    <div>
                      <span className="text-xs text-gray-500 uppercase tracking-wide">Utilization</span>
                      <div className="flex items-center gap-2 mt-1">
                        <p className="font-bold text-lg">{budget.utilizationPercentage || 0}%</p>
                        <div className="w-12 h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-blue-500 transition-all duration-300" 
                            style={{ width: `${Math.min(budget.utilizationPercentage || 0, 100)}%` }}
                          />
                        </div>
                      </div>
                    </div>
                    <div>
                      <span className="text-xs text-gray-500 uppercase tracking-wide">Priority</span>
                      <p className={`font-bold text-lg mt-1 capitalize ${
                        priority === 'high' ? 'text-red-600' : 
                        priority === 'medium' ? 'text-yellow-600' : 'text-green-600'
                      }`}>{priority}</p>
                    </div>
                  </div>

                  {budget.approvals && budget.approvals.length > 0 && (
                    <div className="mb-4 border-t pt-4">
                      <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                        <TrendingUp className="w-4 h-4" />
                        Approval History
                      </h4>
                      <div className="space-y-2">
                        {budget.approvals.map((approval) => (
                          <div key={approval._id} className="flex items-start gap-3 text-sm bg-white p-3 rounded border">
                            <div className="mt-0.5">{getStatusIcon(approval.status)}</div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className="font-semibold">{approval.userName}</span>
                                <Badge variant="outline" className="text-xs">
                                  {approval.status === 'approved' ? 'Approved' : 
                                   approval.status === 'rejected' ? 'Rejected' : 'Pending'}
                                </Badge>
                              </div>
                              {approval.comments && (
                                <p className="text-gray-600 mt-1">{approval.comments}</p>
                              )}
                              {approval.approvedAt && (
                                <span className="text-xs text-gray-400 mt-1 block">
                                  {new Date(approval.approvedAt).toLocaleString()}
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2 flex-wrap">
                    <Button variant="outline" size="sm" onClick={() => router.push(`/dashboard/budgets/${budget._id}`)}>
                      <Eye className="w-4 h-4 mr-1" />
                      View Details
                    </Button>
                    {budget.status === "pending" && (
                      <>
                        <Button 
                          size="sm" 
                          className="bg-green-600 hover:bg-green-700 text-white"
                          onClick={() => handleApprovalAction(budget, 'approve')}
                        >
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Approve
                        </Button>
                        <Button 
                          size="sm" 
                          variant="destructive"
                          onClick={() => handleApprovalAction(budget, 'reject')}
                        >
                          <XCircle className="w-4 h-4 mr-1" />
                          Reject
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )})}
      </div>

      {filteredBudgets.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <FileText className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-semibold mb-2">No budgets found</h3>
            <p className="text-gray-500 mb-4">No budgets match your current filters</p>
            <Button variant="outline" onClick={() => {
              setStatusFilter("all");
              setPriorityFilter("all");
              setTypeFilter("all");
              setSearchQuery("");
            }}>
              Clear Filters
            </Button>
          </CardContent>
        </Card>
      )}

      <Dialog open={showApprovalDialog} onOpenChange={setShowApprovalDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {approvalAction === 'approve' ? (
                <><CheckCircle className="w-5 h-5 text-green-600" /> Approve Budget{isBulkAction ? 's' : ''}</>
              ) : (
                <><XCircle className="w-5 h-5 text-red-600" /> Reject Budget{isBulkAction ? 's' : ''}</>
              )}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-700 mb-2">
                {isBulkAction ? (
                  `Are you sure you want to ${approvalAction} ${selectedBudgets.size} budget(s)? This action cannot be undone.`
                ) : (
                  `Are you sure you want to ${approvalAction} this budget? This action will be recorded in the audit trail.`
                )}
              </p>
              {selectedBudget && !isBulkAction && (
                <div className="mt-2">
                  <p className="font-semibold text-base">{selectedBudget.projectName}</p>
                  <p className="text-sm text-gray-600">{formatCurrency(selectedBudget.totalBudget, selectedBudget.currency)}</p>
                </div>
              )}
              {isBulkAction && (
                <Badge variant="outline" className="mt-2">
                  {selectedBudgets.size} budget(s) selected
                </Badge>
              )}
            </div>
            <div>
              <label className="text-sm font-semibold block mb-2">
                {approvalAction === 'reject' ? (
                  <span className="text-red-600">Rejection Reason (Required)</span>
                ) : (
                  <span>Approval Comments (Optional)</span>
                )}
              </label>
              <Textarea
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                placeholder="Add your comments..."
                rows={4}
                className="resize-none"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => {
                setShowApprovalDialog(false);
                setComments("");
              }}>
                Cancel
              </Button>
              <Button 
                onClick={submitApproval}
                className={approvalAction === 'approve' ? 'bg-green-600 hover:bg-green-700 text-white' : ''}
                variant={approvalAction === 'reject' ? 'destructive' : 'default'}
                disabled={approvalAction === 'reject' && !comments.trim()}
              >
                {approvalAction === 'approve' ? 'Confirm Approval' : 'Confirm Rejection'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      </div>
  );
}
