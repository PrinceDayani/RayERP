"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CheckCircle, XCircle, Clock, Eye, MessageSquare } from "lucide-react";
import { Budget } from "@/types/budget";
import Layout from "@/components/Layout";

export default function BudgetApprovalsPage() {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [filteredBudgets, setFilteredBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("pending");
  const [selectedBudget, setSelectedBudget] = useState<Budget | null>(null);
  const [showApprovalDialog, setShowApprovalDialog] = useState(false);
  const [approvalAction, setApprovalAction] = useState<'approve' | 'reject'>('approve');
  const [comments, setComments] = useState("");

  useEffect(() => {
    fetchBudgets();
  }, []);

  useEffect(() => {
    filterBudgets();
  }, [budgets, statusFilter]);

  const fetchBudgets = async () => {
    try {
      const mockBudgets = [
        {
          _id: '1',
          projectId: 'proj1',
          projectName: 'Mobile App Development',
          totalBudget: 75000,
          currency: 'USD',
          status: 'pending' as const,
          categories: [
            {
              _id: 'cat1',
              name: 'Development',
              type: 'labor' as const,
              allocatedAmount: 50000,
              spentAmount: 0,
              items: []
            }
          ],
          approvals: [],
          createdBy: 'Jane Smith',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ];
      setBudgets(mockBudgets);
    } catch (error) {
      console.error("Error fetching budgets:", error);
    } finally {
      setLoading(false);
    }
  };

  const filterBudgets = () => {
    let filtered = budgets;

    if (statusFilter !== "all") {
      filtered = filtered.filter(budget => budget.status === statusFilter);
    }

    setFilteredBudgets(filtered);
  };

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
    setShowApprovalDialog(true);
  };

  const submitApproval = async () => {
    if (!selectedBudget) return;

    try {
      const response = await fetch(`/api/budgets/${selectedBudget._id}/${approvalAction}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ comments })
      });

      if (response.ok) {
        fetchBudgets();
        setShowApprovalDialog(false);
        setComments("");
        setSelectedBudget(null);
      }
    } catch (error) {
      console.error("Error submitting approval:", error);
    }
  };

  const pendingCount = budgets.filter(b => b.status === "pending").length;
  const approvedCount = budgets.filter(b => b.status === "approved").length;
  const rejectedCount = budgets.filter(b => b.status === "rejected").length;

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading...</div>;
  }

  return (
    <Layout>
      <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Budget Approvals</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Approval</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingCount}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{approvedCount}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rejected</CardTitle>
            <XCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{rejectedCount}</div>
          </CardContent>
        </Card>
      </div>

      <div className="flex gap-4 items-center">
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
      </div>

      <div className="space-y-4">
        {filteredBudgets.map((budget) => (
          <Card key={budget._id} className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold">{budget.projectName}</h3>
                  <p className="text-sm text-gray-600">Created by: {budget.createdBy}</p>
                  <p className="text-sm text-gray-600">
                    Created: {new Date(budget.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusIcon(budget.status)}
                  <Badge className={getStatusColor(budget.status)}>
                    {budget.status.charAt(0).toUpperCase() + budget.status.slice(1)}
                  </Badge>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div>
                  <span className="text-sm text-gray-600">Total Budget</span>
                  <p className="font-semibold">{budget.currency} {budget.totalBudget.toLocaleString()}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-600">Categories</span>
                  <p className="font-semibold">{budget.categories.length}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-600">Currency</span>
                  <p className="font-semibold">{budget.currency}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-600">Status</span>
                  <p className="font-semibold capitalize">{budget.status}</p>
                </div>
              </div>

              {budget.approvals && budget.approvals.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-sm font-medium mb-2">Approval History</h4>
                  <div className="space-y-2">
                    {budget.approvals.map((approval) => (
                      <div key={approval._id} className="flex items-center gap-2 text-sm">
                        {getStatusIcon(approval.status)}
                        <span className="font-medium">{approval.userName}</span>
                        <span className="text-gray-600">
                          {approval.status === 'approved' ? 'approved' : 
                           approval.status === 'rejected' ? 'rejected' : 'pending'}
                        </span>
                        {approval.comments && (
                          <span className="text-gray-500">- {approval.comments}</span>
                        )}
                        {approval.approvedAt && (
                          <span className="text-gray-400 ml-auto">
                            {new Date(approval.approvedAt).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  <Eye className="w-4 h-4 mr-1" />
                  View Details
                </Button>
                {budget.status === "pending" && (
                  <>
                    <Button 
                      size="sm" 
                      className="bg-green-600 hover:bg-green-700"
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
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredBudgets.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">No budgets found for approval</p>
        </div>
      )}

      <Dialog open={showApprovalDialog} onOpenChange={setShowApprovalDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {approvalAction === 'approve' ? 'Approve Budget' : 'Reject Budget'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-600">
                {approvalAction === 'approve' 
                  ? 'Are you sure you want to approve this budget?' 
                  : 'Are you sure you want to reject this budget?'
                }
              </p>
              {selectedBudget && (
                <p className="font-medium">{selectedBudget.projectName}</p>
              )}
            </div>
            <div>
              <label className="text-sm font-medium">Comments (Optional)</label>
              <Textarea
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                placeholder="Add your comments..."
                rows={3}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowApprovalDialog(false)}>
                Cancel
              </Button>
              <Button 
                onClick={submitApproval}
                className={approvalAction === 'approve' ? 'bg-green-600 hover:bg-green-700' : ''}
                variant={approvalAction === 'reject' ? 'destructive' : 'default'}
              >
                {approvalAction === 'approve' ? 'Approve' : 'Reject'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      </div>
    </Layout>
  );
}