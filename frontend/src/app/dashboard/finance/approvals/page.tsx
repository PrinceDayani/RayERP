'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CheckCircle, Clock, X, Eye, ThumbsUp, ThumbsDown } from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import DataTable, { Column } from '@/components/DataTable';

interface ApprovalRequest {
  id: string;
  type: 'Journal Entry' | 'Payment' | 'Invoice' | 'Budget' | 'Expense';
  title: string;
  amount: number;
  requestedBy: string;
  requestDate: string;
  status: 'Pending' | 'Approved' | 'Rejected' | 'Under Review';
  priority: 'High' | 'Medium' | 'Low';
  description: string;
}

export default function ApprovalsPage() {
  const [approvals] = useState<ApprovalRequest[]>([
    {
      id: '1',
      type: 'Payment',
      title: 'Vendor Payment - ABC Supplies',
      amount: 50000,
      requestedBy: 'John Doe',
      requestDate: '2024-01-15',
      status: 'Pending',
      priority: 'High',
      description: 'Payment for office supplies and equipment'
    },
    {
      id: '2',
      type: 'Journal Entry',
      title: 'Depreciation Entry - Q4 2023',
      amount: 25000,
      requestedBy: 'Jane Smith',
      requestDate: '2024-01-14',
      status: 'Under Review',
      priority: 'Medium',
      description: 'Quarterly depreciation for fixed assets'
    },
    {
      id: '3',
      type: 'Budget',
      title: 'Marketing Budget Revision',
      amount: 100000,
      requestedBy: 'Mike Johnson',
      requestDate: '2024-01-13',
      status: 'Approved',
      priority: 'High',
      description: 'Increase marketing budget for Q1 campaigns'
    }
  ]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Approved': return 'bg-green-100 text-green-700';
      case 'Rejected': return 'bg-red-100 text-red-700';
      case 'Pending': return 'bg-yellow-100 text-yellow-700';
      case 'Under Review': return 'bg-blue-100 text-blue-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'High': return 'bg-red-100 text-red-700';
      case 'Medium': return 'bg-yellow-100 text-yellow-700';
      case 'Low': return 'bg-green-100 text-green-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const handleApprove = (id: string) => {
    console.log('Approve:', id);
  };

  const handleReject = (id: string) => {
    console.log('Reject:', id);
  };

  const columns: Column<ApprovalRequest>[] = [
    {
      key: 'type',
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
      sortable: true
    },
    {
      key: 'requestDate',
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
      key: 'id',
      header: 'Actions',
      render: (value, row) => (
        <div className="flex gap-2">
          <Button size="sm" variant="outline">
            <Eye className="w-4 h-4" />
          </Button>
          {row.status === 'Pending' && (
            <>
              <Button size="sm" onClick={() => handleApprove(value)} className="bg-green-600 hover:bg-green-700">
                <ThumbsUp className="w-4 h-4" />
              </Button>
              <Button size="sm" variant="destructive" onClick={() => handleReject(value)}>
                <ThumbsDown className="w-4 h-4" />
              </Button>
            </>
          )}
        </div>
      )
    }
  ];

  const pendingApprovals = approvals.filter(a => a.status === 'Pending');
  const underReviewApprovals = approvals.filter(a => a.status === 'Under Review');

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

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Pending Approvals</p>
                <p className="text-2xl font-bold">{pendingApprovals.length}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Under Review</p>
                <p className="text-2xl font-bold">{underReviewApprovals.length}</p>
              </div>
              <Eye className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Approved Today</p>
                <p className="text-2xl font-bold">5</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Amount</p>
                <p className="text-2xl font-bold">₹1.75L</p>
              </div>
              <ThumbsUp className="h-8 w-8 text-purple-500" />
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
          <Card>
            <CardHeader>
              <CardTitle>Approval History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h3 className="font-semibold">Office Rent Payment</h3>
                    <p className="text-sm text-muted-foreground">Approved by Finance Manager</p>
                  </div>
                  <div className="text-right">
                    <Badge className="bg-green-100 text-green-700">Approved</Badge>
                    <p className="text-sm text-muted-foreground mt-1">2 hours ago</p>
                  </div>
                </div>
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h3 className="font-semibold">Equipment Purchase</h3>
                    <p className="text-sm text-muted-foreground">Rejected by CFO</p>
                  </div>
                  <div className="text-right">
                    <Badge className="bg-red-100 text-red-700">Rejected</Badge>
                    <p className="text-sm text-muted-foreground mt-1">1 day ago</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}