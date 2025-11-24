"use client";

import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CheckCircle, XCircle, Clock, Eye, ArrowLeft, Search, Filter, AlertCircle, TrendingUp, Calendar, DollarSign } from "lucide-react";
import { Budget } from "@/types/budget";
import { getPendingApprovals, approveBudget, rejectBudget, getAllBudgets } from "@/lib/api/budgetAPI";
import { useRouter } from "next/navigation";
import { toast } from "@/components/ui/use-toast";
import { formatCurrency } from "@/utils/currency";
import { useCurrency } from "@/hooks/useCurrency";

export default function BudgetApprovalsPage() {
  const { displayCurrency, formatAmount } = useCurrency();
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("pending");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"date" | "amount" | "name">("date");
  const [selectedBudgets, setSelectedBudgets] = useState<Set<string>>(new Set());
  const [selectedBudget, setSelectedBudget] = useState<Budget | null>(null);
  const [showApprovalDialog, setShowApprovalDialog] = useState(false);
  const [approvalAction, setApprovalAction] = useState<'approve' | 'reject'>('approve');
  const [comments, setComments] = useState("");
  const [isBulkAction, setIsBulkAction] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetchBudgets();
  }, []);

  const fetchBudgets = async () => {
    try {
      setLoading(true);
      const data = await getAllBudgets();
      const dataArray = Array.isArray(data) ? data : [];
      setBudgets(dataArray);
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
    }
  };

  const filteredBudgets = useMemo(() => {
    let filtered = budgets;

    if (statusFilter !== "all") {
      filtered = filtered.filter(b => b.status === statusFilter);
    }

    if (searchQuery) {
      filtered = filtered.filter(b => 
        b.projectName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.createdBy?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    const sorted = [...filtered].sort((a, b) => {
      if (sortBy === "date") {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      } else if (sortBy === "amount") {
        return b.totalBudget - a.totalBudget;
      } else {
        return a.projectName.localeCompare(b.projectName);
      }
    });

    return sorted;
  }, [budgets, statusFilter, searchQuery, sortBy]);

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

  const getPriorityLevel = (budget: Budget): "high" | "medium" | "low" => {
    if (budget.totalBudget > 100000) return "high";
    if (budget.totalBudget > 50000) return "medium";
    return "low";
  };

  const getDaysOld = (date: string): number => {
    return Math.floor((Date.now() - new Date(date).getTime()) / (1000 * 60 * 60 * 24));
  };

  const submitApproval = async () => {
    try {
      if (isBulkAction) {
        const budgetIds = Array.from(selectedBudgets);
        const promises = budgetIds.map(id => 
          approvalAction === 'approve' 
            ? approveBudget(id, { comments })
            : rejectBudget(id, { comments })
        );
        await Promise.all(promises);
        toast({
          title: "Success",
          description: `${budgetIds.length} budget(s) ${approvalAction === 'approve' ? 'approved' : 'rejected'} successfully`,
        });
        setSelectedBudgets(new Set());
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
    }
  };

  const pendingCount = budgets.filter(b => b.status === "pending").length;
  const approvedCount = budgets.filter(b => b.status === "approved").length;
  const rejectedCount = budgets.filter(b => b.status === "rejected").length;
  const totalPendingAmount = budgets.filter(b => b.status === "pending").reduce((sum, b) => sum + b.totalBudget, 0);
  const pendingBudgets = filteredBudgets.filter(b => b.status === "pending");
  const allPendingSelected = pendingBudgets.length > 0 && selectedBudgets.size === pendingBudgets.length;

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading...</div>;
  }

  return (
      <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => router.push('/dashboard/budgets')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Budgets
          </Button>
          <h1 className="text-3xl font-bold">Budget Approvals</h1>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Approval</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingCount}</div>
            <p className="text-xs text-muted-foreground mt-1">Awaiting review</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{approvedCount}</div>
            <p className="text-xs text-muted-foreground mt-1">Successfully approved</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rejected</CardTitle>
            <XCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{rejectedCount}</div>
            <p className="text-xs text-muted-foreground mt-1">Declined requests</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Amount</CardTitle>
            <DollarSign className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatAmount(totalPendingAmount, displayCurrency)}</div>
            <p className="text-xs text-muted-foreground mt-1">Total value</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search budgets..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 w-64"
            />
          </div>
          
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>

          <Select value={sortBy} onValueChange={(v: any) => setSortBy(v)}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="date">Date (Newest)</SelectItem>
              <SelectItem value="amount">Amount (Highest)</SelectItem>
              <SelectItem value="name">Name (A-Z)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {selectedBudgets.size > 0 && (
          <div className="flex gap-2">
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
          </div>
        )}
      </div>

      {pendingBudgets.length > 0 && (
        <div className="flex items-center gap-2 bg-gray-50 p-3 rounded-lg">
          <Checkbox
            checked={allPendingSelected}
            onCheckedChange={toggleSelectAll}
          />
          <span className="text-sm font-medium">Select all pending budgets</span>
        </div>
      )}

      <div className="space-y-4">
        {filteredBudgets.map((budget) => {
          const priority = getPriorityLevel(budget);
          const daysOld = getDaysOld(budget.createdAt);
          const isSelected = selectedBudgets.has(budget._id);
          
          return (
          <Card key={budget._id} className={`hover:shadow-lg transition-all ${isSelected ? 'ring-2 ring-blue-500' : ''}`}>
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
                        <h3 className="text-lg font-semibold">{budget.projectName}</h3>
                        {priority === "high" && (
                          <Badge variant="destructive" className="text-xs">
                            <AlertCircle className="w-3 h-3 mr-1" />
                            High Priority
                          </Badge>
                        )}
                        {daysOld > 7 && budget.status === "pending" && (
                          <Badge variant="outline" className="text-xs text-orange-600 border-orange-600">
                            <Clock className="w-3 h-3 mr-1" />
                            {daysOld} days old
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

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 bg-gray-50 p-4 rounded-lg">
                    <div>
                      <span className="text-xs text-gray-500 uppercase tracking-wide">Total Budget</span>
                      <p className="font-bold text-lg mt-1">{formatCurrency(budget.totalBudget, budget.currency)}</p>
                    </div>
                    <div>
                      <span className="text-xs text-gray-500 uppercase tracking-wide">Categories</span>
                      <p className="font-bold text-lg mt-1">{budget.categories.length}</p>
                    </div>
                    <div>
                      <span className="text-xs text-gray-500 uppercase tracking-wide">Currency</span>
                      <p className="font-bold text-lg mt-1">{budget.currency}</p>
                    </div>
                    <div>
                      <span className="text-xs text-gray-500 uppercase tracking-wide">Utilization</span>
                      <p className="font-bold text-lg mt-1">{budget.utilizationPercentage || 0}%</p>
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
        <div className="text-center py-12">
          <p className="text-gray-500">No budgets found for approval</p>
        </div>
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
                  `Are you sure you want to ${approvalAction} ${selectedBudgets.size} budget(s)?`
                ) : (
                  `Are you sure you want to ${approvalAction} this budget?`
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
                Comments {approvalAction === 'reject' ? '(Required for rejection)' : '(Optional)'}
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