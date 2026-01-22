'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SectionLoader } from '@/components/PageLoader';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CheckCircle, Clock, Eye, ThumbsUp, ThumbsDown, Loader2, AlertCircle, Download, TrendingUp, Banknote, BarChart3, Bell, Search } from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import DataTable, { Column } from '@/components/DataTable';
import { approvalsAPI, ApprovalRequest as ApiApprovalRequest, ApprovalStats } from '@/lib/api/approvalsAPI';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import ApprovalFilters from '@/components/approvals/ApprovalFilters';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function ApprovalsPage() {
  const [approvals, setApprovals] = useState<ApiApprovalRequest[]>([]);
  const [stats, setStats] = useState<ApprovalStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedApproval, setSelectedApproval] = useState<ApiApprovalRequest | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [filters, setFilters] = useState<any>({});
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [approvalReason, setApprovalReason] = useState('');
  const { toast } = useToast();

  const approvalReasons = [
    'Budget approved',
    'Within policy limits',
    'Vendor verified',
    'Emergency purchase',
    'Pre-approved by management'
  ];

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async (appliedFilters = {}) => {
    try {
      setLoading(true);
      setError(null);
      const [approvalsRes, statsRes] = await Promise.all([
        approvalsAPI.getAll(appliedFilters),
        approvalsAPI.getStats()
      ]);
      setApprovals(approvalsRes.data);
      setStats(statsRes.data);
    } catch (err: any) {
      setError(err.message || 'Failed to load approvals');
      toast({
        title: 'Error',
        description: err.message || 'Failed to load approvals',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'APPROVED': return 'bg-green-100 text-green-700';
      case 'REJECTED': return 'bg-red-100 text-red-700';
      case 'PENDING': return 'bg-yellow-100 text-yellow-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'HIGH': return 'bg-red-100 text-red-700';
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-700';
      case 'LOW': return 'bg-green-100 text-green-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const handleApprove = async (approval: ApiApprovalRequest) => {
    try {
      setActionLoading(true);
      await approvalsAPI.approve(approval._id, approvalReason || undefined);
      toast({
        title: 'Success',
        description: 'Approval request approved successfully'
      });
      setApprovalReason('');
      await loadData(filters);
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.message || 'Failed to approve request',
        variant: 'destructive'
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!selectedApproval || !rejectReason.trim()) {
      toast({
        title: 'Error',
        description: 'Please provide a rejection reason',
        variant: 'destructive'
      });
      return;
    }

    try {
      setActionLoading(true);
      await approvalsAPI.reject(selectedApproval._id, rejectReason);
      toast({
        title: 'Success',
        description: 'Approval request rejected successfully'
      });
      setShowRejectModal(false);
      setRejectReason('');
      setSelectedApproval(null);
      await loadData(filters);
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.message || 'Failed to reject request',
        variant: 'destructive'
      });
    } finally {
      setActionLoading(false);
    }
  };

  const openRejectModal = (approval: ApiApprovalRequest) => {
    setSelectedApproval(approval);
    setShowRejectModal(true);
  };

  const openDetailModal = async (approval: ApiApprovalRequest) => {
    try {
      const detail = await approvalsAPI.getById(approval._id);
      setSelectedApproval(detail.data);
      setShowDetailModal(true);
    } catch (err: any) {
      toast({
        title: 'Error',
        description: 'Failed to load approval details',
        variant: 'destructive'
      });
    }
  };

  const handleBulkApprove = async () => {
    if (selectedItems.size === 0) return;
    try {
      setActionLoading(true);
      for (const id of selectedItems) {
        await approvalsAPI.approve(id);
      }
      toast({ title: 'Success', description: `${selectedItems.size} approvals approved` });
      setSelectedItems(new Set());
      await loadData(filters);
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleExport = () => {
    const csv = [
      ['Type', 'Title', 'Amount', 'Requested By', 'Status', 'Priority', 'Date'],
      ...approvals.map(a => [
        a.entityType,
        a.title,
        a.amount,
        a.requestedBy?.name || '',
        a.status,
        a.priority,
        new Date(a.requestedAt).toLocaleDateString()
      ])
    ].map(row => row.join(',')).join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `approvals-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const handleReminder = async (id: string) => {
    try {
      await approvalsAPI.sendReminder(id);
      toast({ title: 'Success', description: 'Reminder sent to approver' });
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      loadData(filters);
      return;
    }
    try {
      const result = await approvalsAPI.search(searchQuery);
      setApprovals(result.data);
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
  };

  const columns: Column<ApiApprovalRequest>[] = [
    {
      key: 'entityType',
      header: 'Type',
      render: (value) => (
        <Badge variant="outline">{value}</Badge>
      )
    },
    {
      key: 'title',
      header: 'Title',
      sortable: true
    },
    {
      key: 'amount',
      header: 'Amount',
      render: (value) => `₹${value.toLocaleString()}`,
      sortable: true
    },
    {
      key: 'requestedBy',
      header: 'Requested By',
      render: (value: any) => value?.name || 'N/A',
      sortable: true
    },
    {
      key: 'requestedAt',
      header: 'Request Date',
      render: (value) => new Date(value).toLocaleDateString(),
      sortable: true
    },
    {
      key: 'priority',
      header: 'Priority',
      render: (value) => (
        <Badge className={getPriorityColor(value)} variant="secondary">
          {value}
        </Badge>
      )
    },
    {
      key: 'status',
      header: 'Status',
      render: (value) => (
        <Badge className={getStatusColor(value)} variant="secondary">
          {value}
        </Badge>
      )
    },
    {
      key: '_id',
      header: 'Actions',
      render: (value, row) => (
        <div className="flex gap-1">
          <Button size="sm" variant="outline" onClick={() => openDetailModal(row)} disabled={actionLoading}>
            <Eye className="w-4 h-4" />
          </Button>
          {row.status === 'PENDING' && (
            <>
              <Button 
                size="sm" 
                onClick={() => handleApprove(row)} 
                className="bg-green-600 hover:bg-green-700"
                disabled={actionLoading}
              >
                <ThumbsUp className="w-4 h-4" />
              </Button>
              <Button 
                size="sm" 
                variant="destructive" 
                onClick={() => openRejectModal(row)}
                disabled={actionLoading}
              >
                <ThumbsDown className="w-4 h-4" />
              </Button>
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => handleReminder(row._id)}
                disabled={actionLoading}
              >
                <Bell className="w-4 h-4" />
              </Button>
            </>
          )}
        </div>
      )
    }
  ];

  const pendingApprovals = approvals.filter(a => a.status === 'PENDING' && a.currentLevel === 1);
  const underReviewApprovals = approvals.filter(a => a.status === 'PENDING' && a.currentLevel > 1);

  if (loading) {
    return <SectionLoader />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Approval Workflows"
        description="Manage financial approval requests and workflows"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Finance', href: '/dashboard/finance' },
          { label: 'Approvals' }
        ]}
      />

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Action Bar */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-2 flex-1">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by ID or title..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              className="pl-10"
            />
          </div>
          <Button variant="outline" onClick={handleSearch}>
            Search
          </Button>
        </div>
        <ApprovalFilters
          onFilterChange={(f) => {
            setFilters(f);
            loadData(f);
          }}
          onReset={() => {
            setFilters({});
            setSearchQuery('');
            loadData();
          }}
        />
        <div className="flex gap-2">
          {selectedItems.size > 0 && (
            <Button onClick={handleBulkApprove} disabled={actionLoading}>
              <ThumbsUp className="w-4 h-4 mr-2" />
              Approve ({selectedItems.size})
            </Button>
          )}
          <Button variant="outline" onClick={handleExport}>
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Button variant="outline" onClick={() => setShowAnalytics(!showAnalytics)}>
            <BarChart3 className="w-4 h-4 mr-2" />
            Analytics
          </Button>
        </div>
      </div>

      {/* Approval Reason Dropdown */}
      {approvals.some(a => a.status === 'PENDING') && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <Label>Quick Approval Reason:</Label>
              <Select value={approvalReason} onValueChange={setApprovalReason}>
                <SelectTrigger className="w-64">
                  <SelectValue placeholder="Select reason (optional)" />
                </SelectTrigger>
                <SelectContent>
                  {approvalReasons.map(reason => (
                    <SelectItem key={reason} value={reason}>{reason}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {approvalReason && (
                <Button variant="ghost" size="sm" onClick={() => setApprovalReason('')}>Clear</Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Analytics Panel */}
      {showAnalytics && (
        <Card>
          <CardHeader>
            <CardTitle>Approval Analytics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <Label>Approval Rate</Label>
                <div className="mt-2">
                  <Progress 
                    value={approvals.length > 0 ? (approvals.filter(a => a.status === 'APPROVED').length / approvals.length) * 100 : 0} 
                    className="h-2" 
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    {approvals.length > 0 ? Math.round((approvals.filter(a => a.status === 'APPROVED').length / approvals.length) * 100) : 0}% approved
                  </p>
                </div>
              </div>
              <div>
                <Label>Avg. Approval Time</Label>
                <p className="text-2xl font-bold mt-2">
                  {approvals.filter(a => a.completedAt && a.requestedAt).length > 0
                    ? Math.round(
                        approvals
                          .filter(a => a.completedAt && a.requestedAt)
                          .reduce((sum, a) => {
                            const diff = new Date(a.completedAt!).getTime() - new Date(a.requestedAt).getTime();
                            return sum + diff / (1000 * 60 * 60);
                          }, 0) / approvals.filter(a => a.completedAt).length
                      )
                    : 0}h
                </p>
                <p className="text-sm text-muted-foreground">Average time to approve</p>
              </div>
              <div>
                <Label>Total Requests</Label>
                <p className="text-2xl font-bold mt-2">{approvals.length}</p>
                <p className="text-sm text-muted-foreground">
                  {approvals.filter(a => a.status === 'PENDING').length} pending
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold">{stats?.pending || 0}</p>
              </div>
              <Clock className="h-6 w-6 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground">Under Review</p>
                <p className="text-2xl font-bold">{stats?.underReview || 0}</p>
              </div>
              <Eye className="h-6 w-6 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground">Approved Today</p>
                <p className="text-2xl font-bold">{stats?.approvedToday || 0}</p>
              </div>
              <CheckCircle className="h-6 w-6 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground">Total Amount</p>
                <p className="text-xl font-bold">₹{((stats?.totalAmount || 0) / 100000).toFixed(1)}L</p>
              </div>
              <Banknote className="h-6 w-6 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground">Approval Rate</p>
                <p className="text-2xl font-bold">
                  {approvals.length > 0 ? Math.round((approvals.filter(a => a.status === 'APPROVED').length / approvals.length) * 100) : 0}%
                </p>
              </div>
              <TrendingUp className="h-6 w-6 text-green-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Approval Tabs */}
      <Tabs defaultValue="pending" className="space-y-6">
        <TabsList>
          <TabsTrigger value="pending">Pending ({pendingApprovals.length})</TabsTrigger>
          <TabsTrigger value="review">Under Review ({underReviewApprovals.length})</TabsTrigger>
          <TabsTrigger value="all">All Requests</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        <TabsContent value="pending">
          <DataTable
            data={pendingApprovals}
            columns={columns}
            title="Pending Approvals"
            searchable
          />
        </TabsContent>

        <TabsContent value="review">
          <DataTable
            data={underReviewApprovals}
            columns={columns}
            title="Under Review"
            searchable
          />
        </TabsContent>

        <TabsContent value="all">
          <DataTable
            data={approvals}
            columns={columns}
            title="All Approval Requests"
            searchable
            exportable
          />
        </TabsContent>

        <TabsContent value="history">
          <DataTable
            data={approvals.filter(a => a.status === 'APPROVED' || a.status === 'REJECTED')}
            columns={columns}
            title="Approval History"
            searchable
            exportable
          />
        </TabsContent>
      </Tabs>

      {/* Detail Modal with Timeline */}
      <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Approval Details & Timeline</DialogTitle>
          </DialogHeader>
          {selectedApproval && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Type</Label>
                  <p className="font-medium">{selectedApproval.entityType}</p>
                </div>
                <div>
                  <Label>Status</Label>
                  <Badge className={getStatusColor(selectedApproval.status)}>{selectedApproval.status}</Badge>
                </div>
                <div>
                  <Label>Amount</Label>
                  <p className="font-medium">₹{selectedApproval.amount.toLocaleString()}</p>
                </div>
                <div>
                  <Label>Priority</Label>
                  <Badge className={getPriorityColor(selectedApproval.priority)}>{selectedApproval.priority}</Badge>
                </div>
                <div>
                  <Label>Requested By</Label>
                  <p className="font-medium">{selectedApproval.requestedBy?.name}</p>
                </div>
                <div>
                  <Label>Requested At</Label>
                  <p className="font-medium">{new Date(selectedApproval.requestedAt).toLocaleString()}</p>
                </div>
              </div>
              <div>
                <Label>Title</Label>
                <p className="font-medium">{selectedApproval.title}</p>
              </div>
              {selectedApproval.description && (
                <div>
                  <Label>Description</Label>
                  <p>{selectedApproval.description}</p>
                </div>
              )}
              <div>
                <Label>Approval Timeline</Label>
                <div className="space-y-2 mt-2">
                  {selectedApproval.approvalLevels.map((level, idx) => (
                    <div key={level.level} className="flex items-start gap-3 p-3 border rounded">
                      <div className="flex flex-col items-center">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          level.status === 'APPROVED' ? 'bg-green-500' :
                          level.status === 'REJECTED' ? 'bg-red-500' :
                          level.status === 'PENDING' ? 'bg-yellow-500' : 'bg-gray-300'
                        } text-white font-bold`}>
                          {level.level}
                        </div>
                        {idx < selectedApproval.approvalLevels.length - 1 && (
                          <div className="w-0.5 h-8 bg-gray-300 my-1" />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{level.approverRole}</p>
                        {level.approvedBy && (
                          <p className="text-sm text-muted-foreground">
                            {level.status === 'APPROVED' ? 'Approved' : 'Rejected'} by {level.approvedBy.name} on {new Date(level.approvedAt!).toLocaleString()}
                          </p>
                        )}
                        {level.comments && <p className="text-sm italic mt-1">{level.comments}</p>}
                        {level.status === 'PENDING' && <p className="text-sm text-yellow-600">Awaiting approval</p>}
                      </div>
                      <Badge className={getStatusColor(level.status)}>{level.status}</Badge>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Reject Modal */}
      <Dialog open={showRejectModal} onOpenChange={setShowRejectModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Approval Request</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this request.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="reason">Rejection Reason *</Label>
              <Textarea
                id="reason"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Enter reason for rejection..."
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRejectModal(false)} disabled={actionLoading}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleReject} disabled={actionLoading || !rejectReason.trim()}>
              {actionLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Reject
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
