'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Shield, User, FileText, AlertCircle, Download, Filter, Eye, Trash2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import PageHeader from '@/components/PageHeader';
import DataTable, { Column } from '@/components/DataTable';
import { apiClient } from '@/lib/api';
import { useDebounce } from '@/hooks/useDebounce';
import AuditLogDetailsModal from '@/components/AuditLogDetailsModal';
import AdvancedFilterModal from '@/components/AdvancedFilterModal';

interface AuditLog {
  _id: string;
  timestamp: string;
  userEmail: string;
  action: string;
  module: string;
  recordId?: string;
  oldValue?: string;
  newValue?: string;
  ipAddress: string;
  userAgent: string;
  status: 'Success' | 'Failed' | 'Warning';
}

interface Stats {
  totalLogs: number;
  successfulActions: number;
  failedActions: number;
  uniqueUsers: number;
  topModules: Array<{ module: string; count: number }>;
  topUsers: Array<{ user: string; count: number }>;
}

export default function AuditTrailPage() {
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState('today');
  const [selectedModule, setSelectedModule] = useState('all');
  const [selectedAction, setSelectedAction] = useState('all');
  const [userSearch, setUserSearch] = useState('');
  const [ipAddress, setIpAddress] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showAdvancedFilter, setShowAdvancedFilter] = useState(false);
  const [complianceMetrics, setComplianceMetrics] = useState<any>(null);
  const [exporting, setExporting] = useState(false);

  const debouncedUserSearch = useDebounce(userSearch, 500);
  const debouncedIpAddress = useDebounce(ipAddress, 500);

  useEffect(() => {
    fetchAuditLogs();
  }, [dateRange, selectedModule, selectedAction, debouncedUserSearch, debouncedIpAddress, statusFilter, page]);

  useEffect(() => {
    fetchStats();
    fetchComplianceMetrics();
  }, []);

  const fetchAuditLogs = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (selectedModule !== 'all') params.append('module', selectedModule);
      if (selectedAction !== 'all') params.append('action', selectedAction);
      if (debouncedUserSearch) params.append('user', debouncedUserSearch);
      if (debouncedIpAddress) params.append('ipAddress', debouncedIpAddress);
      if (statusFilter !== 'all') params.append('status', statusFilter);
      params.append('page', page.toString());
      params.append('limit', '50');
      
      if (dateRange !== 'all') {
        const now = new Date();
        let startDate: Date;
        
        if (dateRange === 'today') {
          startDate = new Date(now.setHours(0, 0, 0, 0));
        } else if (dateRange === 'week') {
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        } else if (dateRange === 'month') {
          startDate = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
        } else {
          startDate = now;
        }
        
        params.append('startDate', startDate.toISOString());
      }

      const data = await apiClient.get(`/api/audit-trail?${params}`);
      setAuditLogs(data.data || []);
      setTotalPages(data.pagination?.pages || 1);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load audit logs';
      setError(message);
      setAuditLogs([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const data = await apiClient.get('/api/audit-trail/stats');
      setStats(data.data);
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    }
  };

  const fetchComplianceMetrics = async () => {
    try {
      const data = await apiClient.get('/api/audit-trail/compliance/metrics');
      setComplianceMetrics(data.data);
    } catch (err) {
      console.error('Failed to fetch compliance metrics:', err);
    }
  };

  const handleExport = async (format: 'csv' | 'json' = 'csv') => {
    try {
      setExporting(true);
      const params = new URLSearchParams();
      if (selectedModule !== 'all') params.append('module', selectedModule);
      if (selectedAction !== 'all') params.append('action', selectedAction);
      if (debouncedUserSearch) params.append('user', debouncedUserSearch);
      if (debouncedIpAddress) params.append('ipAddress', debouncedIpAddress);
      if (statusFilter !== 'all') params.append('status', statusFilter);
      params.append('format', format);
      
      if (dateRange !== 'all') {
        const now = new Date();
        let startDate: Date;
        if (dateRange === 'today') {
          startDate = new Date(now.setHours(0, 0, 0, 0));
        } else if (dateRange === 'week') {
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        } else if (dateRange === 'month') {
          startDate = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
        } else {
          startDate = now;
        }
        params.append('startDate', startDate.toISOString());
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/audit-trail/export?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) throw new Error('Export failed');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `audit-logs-${Date.now()}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      setError('Failed to export audit logs');
    } finally {
      setExporting(false);
    }
  };

  const handleViewDetails = async (logId: string) => {
    try {
      const data = await apiClient.get(`/api/audit-trail/${logId}`);
      setSelectedLog(data.data);
      setShowDetailsModal(true);
    } catch (err) {
      setError('Failed to load log details');
    }
  };

  const handleAdvancedFilter = (filters: any) => {
    setSelectedModule(filters.module);
    setSelectedAction(filters.action);
    setStatusFilter(filters.status);
    setUserSearch(filters.userSearch);
    setIpAddress(filters.ipAddress);
    setDateRange('all');
    setPage(1);
  };

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
      key: 'userEmail',
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
      sortable: true,
      render: (value) => value || '-'
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
      key: '_id',
      header: 'Actions',
      render: (value) => (
        <Button size="sm" variant="outline" onClick={() => handleViewDetails(value)} aria-label="View details">
          <Eye className="w-4 h-4" />
        </Button>
      )
    }
  ];

  const displayStats = stats || {
    totalLogs: auditLogs.length,
    successfulActions: auditLogs.filter(log => log.status === 'Success').length,
    failedActions: auditLogs.filter(log => log.status === 'Failed').length,
    uniqueUsers: new Set(auditLogs.map(log => log.userEmail)).size,
    topModules: [],
    topUsers: []
  };

  if (loading && auditLogs.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading audit logs...</p>
        </div>
      </div>
    );
  }

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
            <Button variant="outline" onClick={() => handleExport('csv')} disabled={exporting}>
              <Download className="w-4 h-4 mr-2" />
              {exporting ? 'Exporting...' : 'Export CSV'}
            </Button>
            <Button variant="outline" onClick={() => handleExport('json')} disabled={exporting}>
              <Download className="w-4 h-4 mr-2" />
              Export JSON
            </Button>
            <Button variant="outline" onClick={() => setShowAdvancedFilter(true)}>
              <Filter className="w-4 h-4 mr-2" />
              Advanced Filter
            </Button>
          </div>
        }
      />

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Logs</p>
                <p className="text-2xl font-bold">{displayStats.totalLogs}</p>
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
                <p className="text-2xl font-bold">{displayStats.successfulActions}</p>
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
                <p className="text-2xl font-bold">{displayStats.failedActions}</p>
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
                <p className="text-2xl font-bold">{displayStats.uniqueUsers}</p>
              </div>
              <User className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block" htmlFor="date-range">Date Range</label>
              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger id="date-range" aria-label="Select date range">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="week">This Week</SelectItem>
                  <SelectItem value="month">This Month</SelectItem>
                  <SelectItem value="all">All Time</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block" htmlFor="module-filter">Module</label>
              <Select value={selectedModule} onValueChange={setSelectedModule}>
                <SelectTrigger id="module-filter" aria-label="Select module">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Modules</SelectItem>
                  <SelectItem value="Journal Entry">Journal Entry</SelectItem>
                  <SelectItem value="Invoice">Invoice</SelectItem>
                  <SelectItem value="Payment">Payment</SelectItem>
                  <SelectItem value="Voucher">Voucher</SelectItem>
                  <SelectItem value="Budget">Budget</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block" htmlFor="action-filter">Action</label>
              <Select value={selectedAction} onValueChange={setSelectedAction}>
                <SelectTrigger id="action-filter" aria-label="Select action">
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
              <label className="text-sm font-medium mb-2 block" htmlFor="user-search">User</label>
              <Input 
                id="user-search"
                placeholder="Search by user..." 
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                aria-label="Search by user email"
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block" htmlFor="status-filter">Status</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger id="status-filter" aria-label="Select status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="Success">Success</SelectItem>
                  <SelectItem value="Failed">Failed</SelectItem>
                  <SelectItem value="Warning">Warning</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block" htmlFor="ip-search">IP Address</label>
              <Input 
                id="ip-search"
                placeholder="Search by IP..." 
                value={ipAddress}
                onChange={(e) => setIpAddress(e.target.value)}
                aria-label="Search by IP address"
              />
            </div>
          </div>
        </CardContent>
      </Card>

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
            exportable={false}
          />
          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1 || loading}
              >
                Previous
              </Button>
              <span className="py-2 px-4 text-sm">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages || loading}
              >
                Next
              </Button>
            </div>
          )}
        </TabsContent>

        <TabsContent value="summary">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Activity by Module</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {displayStats.topModules.length > 0 ? (
                    displayStats.topModules.map((item, idx) => (
                      <div key={idx} className="flex justify-between items-center">
                        <span>{item.module}</span>
                        <span className="font-bold">{item.count}</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-muted-foreground text-sm">No data available</p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Top Users</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {displayStats.topUsers.length > 0 ? (
                    displayStats.topUsers.map((item, idx) => (
                      <div key={idx} className="flex justify-between items-center">
                        <span className="text-sm">{item.user}</span>
                        <span className="font-bold">{item.count} actions</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-muted-foreground text-sm">No data available</p>
                  )}
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
                  <p className="text-2xl font-bold text-green-600">{complianceMetrics?.soxCompliance || 0}%</p>
                  <p className="text-sm text-muted-foreground">
                    {complianceMetrics?.metrics?.failedLogins || 0} failed logins (30d)
                  </p>
                </div>
                <div className="text-center p-6 bg-blue-50 rounded-lg">
                  <Shield className="w-12 h-12 text-blue-600 mx-auto mb-4" />
                  <h3 className="font-semibold text-blue-700">Data Retention</h3>
                  <p className="text-2xl font-bold text-blue-600">{complianceMetrics?.dataRetention || 0}%</p>
                  <p className="text-sm text-muted-foreground">
                    {complianceMetrics?.metrics?.totalLogs || 0} total logs
                  </p>
                </div>
                <div className="text-center p-6 bg-purple-50 rounded-lg">
                  <Shield className="w-12 h-12 text-purple-600 mx-auto mb-4" />
                  <h3 className="font-semibold text-purple-700">Access Control</h3>
                  <p className="text-2xl font-bold text-purple-600">{complianceMetrics?.accessControl || 0}%</p>
                  <p className="text-sm text-muted-foreground">
                    {complianceMetrics?.metrics?.activeUsers || 0} active users (30d)
                  </p>
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
                {auditLogs.filter(log => log.status === 'Failed').slice(0, 10).map((log) => (
                  <div key={log._id} className="flex items-center justify-between p-4 border rounded-lg border-red-200 bg-red-50">
                    <div>
                      <h3 className="font-semibold text-red-700">{log.action} Failed</h3>
                      <p className="text-sm text-red-600">{log.module} - {log.userEmail}</p>
                      <p className="text-xs text-muted-foreground">IP: {log.ipAddress} - {new Date(log.timestamp).toLocaleString()}</p>
                    </div>
                    <Badge className="bg-red-100 text-red-700">High Risk</Badge>
                  </div>
                ))}
                {auditLogs.filter(log => log.status === 'Failed').length === 0 && (
                  <p className="text-center py-8 text-muted-foreground">No security events detected</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <AuditLogDetailsModal
        log={selectedLog}
        open={showDetailsModal}
        onClose={() => {
          setShowDetailsModal(false);
          setSelectedLog(null);
        }}
      />

      <AdvancedFilterModal
        open={showAdvancedFilter}
        onClose={() => setShowAdvancedFilter(false)}
        onApply={handleAdvancedFilter}
        currentFilters={{
          module: selectedModule,
          action: selectedAction,
          status: statusFilter,
          userSearch,
          ipAddress,
          startDate: '',
          endDate: ''
        }}
      />
    </div>
  );
}
