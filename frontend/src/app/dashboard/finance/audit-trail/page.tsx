'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Shield, User, FileText, AlertCircle, Download, Filter, Eye, RefreshCw, Activity } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import PageHeader from '@/components/PageHeader';
import DataTable, { Column } from '@/components/DataTable';
import { apiClient } from '@/lib/api/index';
import { useDebounce } from '@/hooks/useDebounce';
import AuditLogDetailsModal from '@/components/AuditLogDetailsModal';
import AdvancedFilterModal from '@/components/AdvancedFilterModal';
// Simple toast fallback
const toast = {
  error: (message: string) => console.error(message),
  success: (message: string) => console.log(message)
};

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
  sessionId?: string;
  riskLevel?: 'Low' | 'Medium' | 'High' | 'Critical';
  metadata?: Record<string, any>;
}

interface Stats {
  totalLogs: number;
  successfulActions: number;
  failedActions: number;
  uniqueUsers: number;
  topModules: Array<{ module: string; count: number }>;
  topUsers: Array<{ user: string; count: number }>;
  recentActivity: number;
  criticalEvents: number;
}

interface FilterState {
  dateRange: string;
  module: string;
  action: string;
  userSearch: string;
  ipAddress: string;
  status: string;
  riskLevel: string;
}

export default function AuditTrailPage() {
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<FilterState>({
    dateRange: 'all',
    module: 'all',
    action: 'all',
    userSearch: '',
    ipAddress: '',
    status: 'all',
    riskLevel: 'all'
  });
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showAdvancedFilter, setShowAdvancedFilter] = useState(false);
  const [complianceMetrics, setComplianceMetrics] = useState<any>(null);
  const [exporting, setExporting] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState(true);
  const [rateLimited, setRateLimited] = useState(false);

  const debouncedUserSearch = useDebounce(filters.userSearch, 1000);
  const debouncedIpAddress = useDebounce(filters.ipAddress, 1000);

  useEffect(() => {
    if (!rateLimited) {
      const timer = setTimeout(() => fetchAuditLogs(), 300);
      return () => clearTimeout(timer);
    }
  }, [filters.dateRange, filters.module, filters.action, debouncedUserSearch, debouncedIpAddress, filters.status, filters.riskLevel, page, rateLimited]);

  useEffect(() => {
    if (!rateLimited) {
      const timer = setTimeout(() => {
        fetchStats();
        fetchComplianceMetrics();
        checkConnection();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [rateLimited]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (autoRefresh && !rateLimited) {
      interval = setInterval(() => {
        fetchAuditLogs();
        fetchStats();
      }, 60000); // Increased to 60 seconds
    }
    return () => clearInterval(interval);
  }, [autoRefresh, rateLimited]);

  const fetchAuditLogs = useCallback(async () => {
    if (rateLimited) return;
    
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (filters.module !== 'all') params.append('module', filters.module);
      if (filters.action !== 'all') params.append('action', filters.action);
      if (debouncedUserSearch) params.append('user', debouncedUserSearch);
      if (debouncedIpAddress) params.append('ipAddress', debouncedIpAddress);
      if (filters.status !== 'all') params.append('status', filters.status);
      if (filters.riskLevel !== 'all') params.append('riskLevel', filters.riskLevel);
      params.append('page', page.toString());
      params.append('limit', '50');
      
      if (filters.dateRange !== 'all') {
        const now = new Date();
        let startDate: Date;
        
        if (filters.dateRange === 'today') {
          startDate = new Date(now.setHours(0, 0, 0, 0));
        } else if (filters.dateRange === 'week') {
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        } else if (filters.dateRange === 'month') {
          startDate = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
        } else {
          startDate = now;
        }
        
        params.append('startDate', startDate.toISOString());
      }

      console.log('Fetching audit logs with params:', params.toString());
      const response = await apiClient.get(`/audit-trail?${params}`);
      console.log('Full API response:', response);
      console.log('Response data field:', response.data);
      console.log('Is data.data an array?', Array.isArray(response.data));
      console.log('data.data length:', response.data?.length);
      
      // Handle both response formats
      const logs = response.data?.data || response.data || [];
      console.log('Extracted logs:', logs);
      
      setAuditLogs(logs);
      setTotalPages(response.data?.pagination?.pages || 1);
      setRateLimited(false);
    } catch (err: any) {
      console.error('Error fetching audit logs:', err);
      if (err.response?.status === 429) {
        setRateLimited(true);
        setError('Rate limit exceeded. Please wait before making more requests.');
        setTimeout(() => setRateLimited(false), 10000);
      } else {
        const message = err instanceof Error ? err.message : 'Failed to load audit logs';
        setError(message);
      }
      setAuditLogs([]);
    } finally {
      setLoading(false);
    }
  }, [filters, debouncedUserSearch, debouncedIpAddress, page, rateLimited]);

  const fetchStats = useCallback(async () => {
    try {
      const data = await apiClient.get('/audit-trail/stats');
      setStats(data.data);
    } catch (err) {
      console.error('Failed to fetch stats:', err);
      setStats(null);
    }
  }, []);

  const fetchComplianceMetrics = useCallback(async () => {
    try {
      const data = await apiClient.get('/audit-trail/compliance/metrics');
      setComplianceMetrics(data.data);
    } catch (err) {
      console.error('Failed to fetch compliance metrics:', err);
      setComplianceMetrics(null);
    }
  }, []);

  const checkConnection = useCallback(async () => {
    try {
      // Simple connection check using existing API
      await apiClient.get('/health');
      setConnectionStatus(true);
    } catch (err) {
      setConnectionStatus(false);
    }
  }, []);

  const handleExport = useCallback(async (format: 'csv' | 'json' = 'csv') => {
    try {
      setExporting(true);
      const params = new URLSearchParams();
      if (filters.module !== 'all') params.append('module', filters.module);
      if (filters.action !== 'all') params.append('action', filters.action);
      if (debouncedUserSearch) params.append('user', debouncedUserSearch);
      if (debouncedIpAddress) params.append('ipAddress', debouncedIpAddress);
      if (filters.status !== 'all') params.append('status', filters.status);
      if (filters.riskLevel !== 'all') params.append('riskLevel', filters.riskLevel);
      params.append('format', format);
      
      if (filters.dateRange !== 'all') {
        const now = new Date();
        let startDate: Date;
        if (filters.dateRange === 'today') {
          startDate = new Date(now.setHours(0, 0, 0, 0));
        } else if (filters.dateRange === 'week') {
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        } else if (filters.dateRange === 'month') {
          startDate = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
        } else {
          startDate = now;
        }
        params.append('startDate', startDate.toISOString());
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/audit-trail/export?${params}`, {
        headers: {
          'Authorization': `Bearer ${sessionStorage.getItem('auth-token') || localStorage.getItem('token')}`
        }
      });

      if (!response.ok) throw new Error('Export failed');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `audit-logs-${new Date().toISOString().split('T')[0]}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success(`Audit logs exported as ${format.toUpperCase()}`);
    } catch (err) {
      const message = 'Failed to export audit logs';
      setError(message);
      toast.error(message);
    } finally {
      setExporting(false);
    }
  }, [filters, debouncedUserSearch, debouncedIpAddress]);

  const handleViewDetails = useCallback(async (logId: string) => {
    try {
      const data = await apiClient.get(`/audit-trail/${logId}`);
      setSelectedLog(data.data);
      setShowDetailsModal(true);
    } catch (err) {
      const message = 'Failed to load log details';
      setError(message);
      toast.error(message);
    }
  }, []);

  const handleAdvancedFilter = useCallback((newFilters: any) => {
    setFilters({
      module: newFilters.module,
      action: newFilters.action,
      status: newFilters.status,
      userSearch: newFilters.userSearch,
      ipAddress: newFilters.ipAddress,
      riskLevel: newFilters.riskLevel || 'all',
      dateRange: 'all'
    });
    setPage(1);
  }, []);

  const updateFilter = useCallback((key: keyof FilterState, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPage(1);
  }, []);

  const getStatusColor = useCallback((status: string) => {
    switch (status) {
      case 'Success': return 'bg-green-100 text-green-700';
      case 'Failed': return 'bg-red-100 text-red-700';
      case 'Warning': return 'bg-yellow-100 text-yellow-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  }, []);

  const getActionColor = useCallback((action: string) => {
    switch (action) {
      case 'CREATE': return 'bg-blue-100 text-blue-700';
      case 'UPDATE': return 'bg-yellow-100 text-yellow-700';
      case 'DELETE': return 'bg-red-100 text-red-700';
      case 'VIEW': return 'bg-gray-100 text-gray-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  }, []);

  const getRiskColor = useCallback((risk: string) => {
    switch (risk) {
      case 'Critical': return 'bg-red-100 text-red-700 border-red-200';
      case 'High': return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'Medium': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'Low': return 'bg-green-100 text-green-700 border-green-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  }, []);

  const columns: Column<AuditLog>[] = useMemo(() => {
    if (!handleViewDetails || !getStatusColor || !getActionColor || !getRiskColor) return [];
    return [
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
      key: 'riskLevel',
      header: 'Risk',
      render: (value) => value ? (
        <Badge className={getRiskColor(value)} variant="secondary">
          {value}
        </Badge>
      ) : '-'
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
  }, [handleViewDetails, getStatusColor, getActionColor, getRiskColor]);

  const displayStats = useMemo(() => {
    const logs = Array.isArray(auditLogs) ? auditLogs : [];
    const baseStats = {
      totalLogs: logs.length,
      successfulActions: logs.filter(log => log.status === 'Success').length,
      failedActions: logs.filter(log => log.status === 'Failed').length,
      uniqueUsers: new Set(logs.map(log => log.userEmail)).size,
      recentActivity: logs.filter(log => 
        new Date(log.timestamp) > new Date(Date.now() - 24 * 60 * 60 * 1000)
      ).length,
      criticalEvents: logs.filter(log => log.riskLevel === 'Critical').length,
      topModules: [],
      topUsers: []
    };
    return stats ? { ...baseStats, ...stats, topModules: stats.topModules || [], topUsers: stats.topUsers || [] } : baseStats;
  }, [auditLogs, stats]);

  if (loading && (!Array.isArray(auditLogs) || auditLogs.length === 0)) {
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
          <div className="flex gap-2 items-center">
            {!connectionStatus && (
              <Badge variant="destructive" className="mr-2">
                <AlertCircle className="w-3 h-3 mr-1" />
                Offline
              </Badge>
            )}
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={autoRefresh ? 'bg-green-50 border-green-200' : ''}
            >
              <Activity className={`w-4 h-4 mr-2 ${autoRefresh ? 'animate-pulse' : ''}`} />
              {autoRefresh ? 'Auto-Refresh On' : 'Auto-Refresh Off'}
            </Button>
            <Button variant="outline" size="sm" onClick={fetchAuditLogs} disabled={loading || rateLimited}>
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              {rateLimited ? 'Rate Limited' : 'Refresh'}
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleExport('csv')} disabled={exporting}>
              <Download className="w-4 h-4 mr-2" />
              {exporting ? 'Exporting...' : 'Export CSV'}
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleExport('json')} disabled={exporting}>
              <Download className="w-4 h-4 mr-2" />
              Export JSON
            </Button>
            <Button variant="outline" size="sm" onClick={() => setShowAdvancedFilter(true)}>
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Recent Activity (24h)</p>
                <p className="text-2xl font-bold">{displayStats.recentActivity}</p>
              </div>
              <Activity className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Critical Events</p>
                <p className="text-2xl font-bold text-red-600">{displayStats.criticalEvents}</p>
              </div>
              <AlertCircle className="h-8 w-8 text-red-500" />
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
              <Select value={filters.dateRange} onValueChange={(value) => updateFilter('dateRange', value)}>
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
              <Select value={filters.module} onValueChange={(value) => updateFilter('module', value)}>
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
              <Select value={filters.action} onValueChange={(value) => updateFilter('action', value)}>
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
                value={filters.userSearch}
                onChange={(e) => updateFilter('userSearch', e.target.value)}
                aria-label="Search by user email"
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block" htmlFor="status-filter">Status</label>
              <Select value={filters.status} onValueChange={(value) => updateFilter('status', value)}>
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
              <label className="text-sm font-medium mb-2 block" htmlFor="risk-filter">Risk Level</label>
              <Select value={filters.riskLevel} onValueChange={(value) => updateFilter('riskLevel', value)}>
                <SelectTrigger id="risk-filter" aria-label="Select risk level">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Risk Levels</SelectItem>
                  <SelectItem value="Low">Low</SelectItem>
                  <SelectItem value="Medium">Medium</SelectItem>
                  <SelectItem value="High">High</SelectItem>
                  <SelectItem value="Critical">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block" htmlFor="ip-search">IP Address</label>
              <Input 
                id="ip-search"
                placeholder="Search by IP..." 
                value={filters.ipAddress}
                onChange={(e) => updateFilter('ipAddress', e.target.value)}
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
            data={Array.isArray(auditLogs) ? auditLogs : []}
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
                {Array.isArray(auditLogs) && auditLogs.filter(log => log.status === 'Failed').slice(0, 10).map((log) => (
                  <div key={log._id} className="flex items-center justify-between p-4 border rounded-lg border-red-200 bg-red-50">
                    <div>
                      <h3 className="font-semibold text-red-700">{log.action} Failed</h3>
                      <p className="text-sm text-red-600">{log.module} - {log.userEmail}</p>
                      <p className="text-xs text-muted-foreground">IP: {log.ipAddress} - {new Date(log.timestamp).toLocaleString()}</p>
                    </div>
                    <Badge className="bg-red-100 text-red-700">High Risk</Badge>
                  </div>
                ))}
                {(!Array.isArray(auditLogs) || !auditLogs.filter || auditLogs.filter(log => log.status === 'Failed').length === 0) && (
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
          module: filters.module,
          action: filters.action,
          status: filters.status,
          userSearch: filters.userSearch,
          ipAddress: filters.ipAddress,
          riskLevel: filters.riskLevel,
          startDate: '',
          endDate: ''
        }}
      />
    </div>
  );
}
