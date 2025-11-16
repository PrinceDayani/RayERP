'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Shield, Eye, Download, Search, Filter, Calendar, User, FileText } from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import DataTable, { Column } from '@/components/DataTable';

interface AuditLog {
  id: string;
  timestamp: string;
  user: string;
  action: string;
  module: string;
  recordId: string;
  oldValue?: string;
  newValue?: string;
  ipAddress: string;
  userAgent: string;
  status: 'Success' | 'Failed' | 'Warning';
}

export default function AuditTrailPage() {
  const [auditLogs] = useState<AuditLog[]>([
    {
      id: '1',
      timestamp: '2024-01-15T10:30:00Z',
      user: 'john.doe@company.com',
      action: 'CREATE',
      module: 'Journal Entry',
      recordId: 'JE-2024-001',
      oldValue: '',
      newValue: 'Amount: ₹50,000',
      ipAddress: '192.168.1.100',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      status: 'Success'
    },
    {
      id: '2',
      timestamp: '2024-01-15T09:15:00Z',
      user: 'jane.smith@company.com',
      action: 'UPDATE',
      module: 'Invoice',
      recordId: 'INV-2024-001',
      oldValue: 'Status: Draft',
      newValue: 'Status: Approved',
      ipAddress: '192.168.1.101',
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
      status: 'Success'
    },
    {
      id: '3',
      timestamp: '2024-01-15T08:45:00Z',
      user: 'mike.johnson@company.com',
      action: 'DELETE',
      module: 'Payment',
      recordId: 'PAY-2024-001',
      oldValue: 'Amount: ₹25,000',
      newValue: '',
      ipAddress: '192.168.1.102',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      status: 'Failed'
    }
  ]);

  const [dateRange, setDateRange] = useState('today');
  const [selectedModule, setSelectedModule] = useState('all');
  const [selectedAction, setSelectedAction] = useState('all');

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Success': return 'bg-green-100 text-green-700';
      case 'Failed': return 'bg-red-100 text-red-700';
      case 'Warning': return 'bg-yellow-100 text-yellow-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'CREATE': return 'bg-blue-100 text-blue-700';
      case 'UPDATE': return 'bg-yellow-100 text-yellow-700';
      case 'DELETE': return 'bg-red-100 text-red-700';
      case 'VIEW': return 'bg-gray-100 text-gray-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const columns: Column<AuditLog>[] = [
    {
      key: 'timestamp',
      header: 'Timestamp',
      render: (value) => new Date(value).toLocaleString(),
      sortable: true
    },
    {
      key: 'user',
      header: 'User',
      sortable: true,
      render: (value) => (
        <div className="flex items-center gap-2">
          <User className="w-4 h-4 text-muted-foreground" />
          <span>{value}</span>
        </div>
      )
    },
    {
      key: 'action',
      header: 'Action',
      render: (value) => (
        <Badge className={getActionColor(value)} variant="secondary">
          {value}
        </Badge>
      )
    },
    {
      key: 'module',
      header: 'Module',
      sortable: true
    },
    {
      key: 'recordId',
      header: 'Record ID',
      sortable: true
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
      key: 'ipAddress',
      header: 'IP Address',
      render: (value) => (
        <code className="text-xs bg-muted px-2 py-1 rounded">{value}</code>
      )
    },
    {
      key: 'id',
      header: 'Actions',
      render: (value) => (
        <Button size="sm" variant="outline">
          <Eye className="w-4 h-4" />
        </Button>
      )
    }
  ];

  const stats = {
    totalLogs: auditLogs.length,
    successfulActions: auditLogs.filter(log => log.status === 'Success').length,
    failedActions: auditLogs.filter(log => log.status === 'Failed').length,
    uniqueUsers: new Set(auditLogs.map(log => log.user)).size
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Audit Trail"
        description="Complete activity logs and compliance tracking for all financial operations"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Finance', href: '/dashboard/finance' },
          { label: 'Audit Trail' }
        ]}
        actions={
          <div className="flex gap-2">
            <Button variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Export Logs
            </Button>
            <Button variant="outline">
              <Filter className="w-4 h-4 mr-2" />
              Advanced Filter
            </Button>
          </div>
        }
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Logs</p>
                <p className="text-2xl font-bold">{stats.totalLogs}</p>
              </div>
              <FileText className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Successful Actions</p>
                <p className="text-2xl font-bold">{stats.successfulActions}</p>
              </div>
              <Shield className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Failed Actions</p>
                <p className="text-2xl font-bold">{stats.failedActions}</p>
              </div>
              <Shield className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Users</p>
                <p className="text-2xl font-bold">{stats.uniqueUsers}</p>
              </div>
              <User className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Date Range</label>
              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="week">This Week</SelectItem>
                  <SelectItem value="month">This Month</SelectItem>
                  <SelectItem value="quarter">This Quarter</SelectItem>
                  <SelectItem value="year">This Year</SelectItem>
                  <SelectItem value="custom">Custom Range</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Module</label>
              <Select value={selectedModule} onValueChange={setSelectedModule}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Modules</SelectItem>
                  <SelectItem value="journal-entry">Journal Entry</SelectItem>
                  <SelectItem value="invoice">Invoice</SelectItem>
                  <SelectItem value="payment">Payment</SelectItem>
                  <SelectItem value="voucher">Voucher</SelectItem>
                  <SelectItem value="budget">Budget</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Action</label>
              <Select value={selectedAction} onValueChange={setSelectedAction}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Actions</SelectItem>
                  <SelectItem value="CREATE">Create</SelectItem>
                  <SelectItem value="UPDATE">Update</SelectItem>
                  <SelectItem value="DELETE">Delete</SelectItem>
                  <SelectItem value="VIEW">View</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">User</label>
              <Input placeholder="Search by user..." />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Audit Logs */}
      <Tabs defaultValue="logs" className="space-y-6">
        <TabsList>
          <TabsTrigger value="logs">Audit Logs</TabsTrigger>
          <TabsTrigger value="summary">Summary Report</TabsTrigger>
          <TabsTrigger value="compliance">Compliance</TabsTrigger>
          <TabsTrigger value="security">Security Events</TabsTrigger>
        </TabsList>

        <TabsContent value="logs">
          <DataTable
            data={auditLogs}
            columns={columns}
            title="Audit Logs"
            searchable
            exportable
            onExport={() => console.log('Export audit logs')}
          />
        </TabsContent>

        <TabsContent value="summary">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Activity Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span>Journal Entries</span>
                    <span className="font-bold">45</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Invoice Operations</span>
                    <span className="font-bold">32</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Payment Processing</span>
                    <span className="font-bold">28</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Budget Changes</span>
                    <span className="font-bold">12</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>User Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span>john.doe@company.com</span>
                    <span className="font-bold">25 actions</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>jane.smith@company.com</span>
                    <span className="font-bold">18 actions</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>mike.johnson@company.com</span>
                    <span className="font-bold">12 actions</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="compliance">
          <Card>
            <CardHeader>
              <CardTitle>Compliance Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center p-6 bg-green-50 rounded-lg">
                  <Shield className="w-12 h-12 text-green-600 mx-auto mb-4" />
                  <h3 className="font-semibold text-green-700">SOX Compliance</h3>
                  <p className="text-2xl font-bold text-green-600">98%</p>
                  <p className="text-sm text-muted-foreground">All controls active</p>
                </div>
                <div className="text-center p-6 bg-blue-50 rounded-lg">
                  <Shield className="w-12 h-12 text-blue-600 mx-auto mb-4" />
                  <h3 className="font-semibold text-blue-700">Data Retention</h3>
                  <p className="text-2xl font-bold text-blue-600">100%</p>
                  <p className="text-sm text-muted-foreground">7 years retention</p>
                </div>
                <div className="text-center p-6 bg-purple-50 rounded-lg">
                  <Shield className="w-12 h-12 text-purple-600 mx-auto mb-4" />
                  <h3 className="font-semibold text-purple-700">Access Control</h3>
                  <p className="text-2xl font-bold text-purple-600">95%</p>
                  <p className="text-sm text-muted-foreground">Role-based access</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle>Security Events</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg border-red-200 bg-red-50">
                  <div>
                    <h3 className="font-semibold text-red-700">Failed Login Attempt</h3>
                    <p className="text-sm text-red-600">Multiple failed login attempts detected</p>
                    <p className="text-xs text-muted-foreground">IP: 192.168.1.999 - 2 hours ago</p>
                  </div>
                  <Badge className="bg-red-100 text-red-700">High Risk</Badge>
                </div>
                <div className="flex items-center justify-between p-4 border rounded-lg border-yellow-200 bg-yellow-50">
                  <div>
                    <h3 className="font-semibold text-yellow-700">Unusual Access Pattern</h3>
                    <p className="text-sm text-yellow-600">Access from new location detected</p>
                    <p className="text-xs text-muted-foreground">User: john.doe@company.com - 4 hours ago</p>
                  </div>
                  <Badge className="bg-yellow-100 text-yellow-700">Medium Risk</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}