"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { SearchIcon, FilterIcon, DownloadIcon } from "lucide-react";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { getActivityLogs, ActivityLog } from "@/lib/api/activityAPI";

  interface ActivityLogsProps {
  isLoading: boolean;
}

export function ActivityLogs({ isLoading }: ActivityLogsProps) {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<ActivityLog[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [actionFilter, setActionFilter] = useState("all");

  const [resourceFilter, setResourceFilter] = useState("all");
  const [dateRange, setDateRange] = useState({ start: "", end: "" });
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [stats, setStats] = useState<any>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const logsPerPage = 20;

  // Fetch logs and stats
  const fetchData = async () => {
    try {
      const filters = {
        action: actionFilter !== 'all' ? actionFilter : undefined,
        resource: resourceFilter !== 'all' ? resourceFilter : undefined,
        startDate: dateRange.start || undefined,
        endDate: dateRange.end || undefined,
        page: currentPage,
        limit: logsPerPage
      };
      
      const response = await getActivityLogs(filters);
      const logsData = response.data || [];
      const pagination = response.pagination || {};
      
      setLogs(logsData);
      setFilteredLogs(logsData);
      setTotalPages(pagination.pages || 1);
    } catch (error) {
      console.error("Failed to fetch data:", error);
      setLogs([]);
      setFilteredLogs([]);
      setTotalPages(1);
    }
  };

  useEffect(() => {
    if (!isLoading) {
      fetchData();
    }
  }, [isLoading, actionFilter, resourceFilter, dateRange, currentPage]);

  // Auto-refresh
  useEffect(() => {
    if (!autoRefresh) return;
    
    const interval = setInterval(() => {
      if (!isLoading) fetchData();
    }, 30000); // Refresh every 30 seconds
    
    return () => clearInterval(interval);
  }, [autoRefresh, isLoading, actionFilter, resourceFilter, dateRange, currentPage]);

  // Generate mock logs for demo
  const generateMockLogs = (count: number): ActivityLog[] => {
    const actions = ["login", "logout", "create", "update", "delete", "view", "export", "import", "approve", "reject"];
    const resources = ["user", "product", "order", "customer", "inventory", "system", "settings", "report"];
    const users = ["admin@example.com", "john@example.com", "jane@example.com", "manager@example.com"];
    const ipAddresses = ["192.168.1.1", "10.0.0.1", "172.16.0.1", "127.0.0.1", "45.123.45.67"];
    
    return Array.from({ length: count }, (_, i) => {
      const action = actions[Math.floor(Math.random() * actions.length)];
      const resource = resources[Math.floor(Math.random() * resources.length)];
      const userName = users[Math.floor(Math.random() * users.length)];
      const ipAddress = ipAddresses[Math.floor(Math.random() * ipAddresses.length)];
      
      // Generate a timestamp within the last 30 days
      const date = new Date();
      date.setDate(date.getDate() - Math.floor(Math.random() * 30));
      
      return {
        _id: (i + 1).toString(),
        action,
        resource,
        details: `${action} ${resource} operation completed`,
        user: {
          _id: `user-${i}`,
          name: userName.split('@')[0],
          email: userName
        },
        timestamp: date.toISOString(),
        ipAddress,
      };
    }).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  };

  // Apply filters when search term or filters change
  useEffect(() => {
    let filtered = logs;

    if (searchTerm) {
      filtered = filtered.filter(
        (log) =>
          log.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
          log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
          log.resource.toLowerCase().includes(searchTerm.toLowerCase()) ||
          log.details.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (log.ipAddress && log.ipAddress.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    if (actionFilter !== "all") {
      filtered = filtered.filter((log) => log.action === actionFilter);
    }

    // Remove status filter since ActivityLog doesn't have status field

    setFilteredLogs(filtered);
    setTotalPages(Math.ceil(filtered.length / logsPerPage));
    setCurrentPage(1); // Reset to first page when filters change
  }, [searchTerm, actionFilter, logs]);

  const getCurrentPageLogs = () => {
    const startIndex = (currentPage - 1) * logsPerPage;
    const endIndex = startIndex + logsPerPage;
    return filteredLogs.slice(startIndex, endIndex);
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return new Intl.DateTimeFormat("en-US", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      }).format(date);
    } catch (error) {
      return dateString;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "success":
        return <Badge className="bg-green-500">Success</Badge>;
      case "error":
        return <Badge className="bg-red-500">Error</Badge>;
      case "warning":
        return <Badge className="bg-yellow-500">Warning</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getActionBadge = (action: string) => {
    switch (action) {
      case "login":
      case "logout":
        return <Badge className="bg-blue-500">{action}</Badge>;
      case "create":
        return <Badge className="bg-green-500">{action}</Badge>;
      case "update":
        return <Badge className="bg-orange-500">{action}</Badge>;
      case "delete":
        return <Badge className="bg-red-500">{action}</Badge>;
      case "approve":
        return <Badge className="bg-emerald-500">{action}</Badge>;
      case "reject":
        return <Badge className="bg-rose-500">{action}</Badge>;
      default:
        return <Badge className="bg-slate-500">{action}</Badge>;
    }
  };

  const exportLogs = () => {
    // Convert logs to CSV
    const headers = ["Timestamp", "User", "Action", "Resource", "Status", "Details", "IP Address"];
    const csvContent = [
      headers.join(","),
      ...filteredLogs.map((log) => [
        formatDate(log.timestamp),
        log.user,
        log.action,
        log.resource,
        log.status || 'success',
        `"${log.details.replace(/"/g, '""')}"`, // Escape quotes
        log.ipAddress || 'N/A',
      ].join(",")),
    ].join("\n");

    // Create and download the file
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `activity-logs-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-10 w-32" />
        </div>
        <Skeleton className="h-72 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 w-full sm:w-auto">
          <div className="relative w-full sm:w-64">
            <SearchIcon className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search logs..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Select value={actionFilter} onValueChange={setActionFilter}>
              <SelectTrigger className="w-full sm:w-[130px]">
                <div className="flex items-center">
                  <FilterIcon className="mr-2 h-4 w-4 text-muted-foreground" />
                  <span>{actionFilter === "all" ? "All Actions" : actionFilter}</span>
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Actions</SelectItem>
                <SelectItem value="login">Login</SelectItem>
                <SelectItem value="logout">Logout</SelectItem>
                <SelectItem value="create">Create</SelectItem>
                <SelectItem value="update">Update</SelectItem>
                <SelectItem value="delete">Delete</SelectItem>
                <SelectItem value="view">View</SelectItem>
                <SelectItem value="export">Export</SelectItem>
                <SelectItem value="import">Import</SelectItem>
                <SelectItem value="approve">Approve</SelectItem>
                <SelectItem value="reject">Reject</SelectItem>
              </SelectContent>
            </Select>
            

            
            <Select value={resourceFilter} onValueChange={setResourceFilter}>
              <SelectTrigger className="w-full sm:w-[130px]">
                <span>{resourceFilter === "all" ? "All Resources" : resourceFilter}</span>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Resources</SelectItem>
                <SelectItem value="user">User</SelectItem>
                <SelectItem value="role">Role</SelectItem>
                <SelectItem value="auth">Auth</SelectItem>
                <SelectItem value="system">System</SelectItem>
                <SelectItem value="task">Task</SelectItem>
                <SelectItem value="project">Project</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <div className="flex gap-2">
          <Button 
            variant={autoRefresh ? "default" : "outline"} 
            onClick={() => setAutoRefresh(!autoRefresh)}
            size="sm"
          >
            {autoRefresh ? "Live" : "Paused"}
          </Button>
          <Button variant="outline" onClick={exportLogs} className="w-full sm:w-auto">
            <DownloadIcon className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <div className="bg-blue-50 p-3 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{stats.totalLogs || 0}</div>
            <div className="text-sm text-blue-600">Total Logs</div>
          </div>
          <div className="bg-green-50 p-3 rounded-lg">
            <div className="text-2xl font-bold text-green-600">{stats.successRate || 0}%</div>
            <div className="text-sm text-green-600">Success Rate</div>
          </div>
          <div className="bg-red-50 p-3 rounded-lg">
            <div className="text-2xl font-bold text-red-600">{stats.errorCount || 0}</div>
            <div className="text-sm text-red-600">Errors Today</div>
          </div>
          <div className="bg-purple-50 p-3 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">{stats.activeUsers || 0}</div>
            <div className="text-sm text-purple-600">Active Users</div>
          </div>
        </div>
      )}
      
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Timestamp</TableHead>
              <TableHead>User</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Resource</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Details</TableHead>
              <TableHead>IP Address</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {getCurrentPageLogs().length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-6 text-muted-foreground">
                  No logs found matching your filters
                </TableCell>
              </TableRow>
            ) : (
              getCurrentPageLogs().map((log) => (
                <TableRow key={log._id} className="group hover:bg-muted/50">
                  <TableCell className="font-mono text-xs">
                    {formatDate(log.timestamp)}
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{log.user}</div>
                  </TableCell>
                  <TableCell>{getActionBadge(log.action)}</TableCell>
                  <TableCell className="capitalize">{log.resource}</TableCell>
                  <TableCell>{getStatusBadge(log.status || 'success')}</TableCell>
                  <TableCell className="max-w-xs truncate" title={log.details}>
                    {log.details}
                  </TableCell>
                  <TableCell className="font-mono">{log.ipAddress || 'N/A'}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
              />
            </PaginationItem>
            
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNumber;
              if (totalPages <= 5) {
                pageNumber = i + 1;
              } else if (currentPage <= 3) {
                pageNumber = i + 1;
              } else if (currentPage >= totalPages - 2) {
                pageNumber = totalPages - 4 + i;
              } else {
                pageNumber = currentPage - 2 + i;
              }
              
              return (
                <PaginationItem key={pageNumber}>
                  <PaginationLink
                    onClick={() => setCurrentPage(pageNumber)}
                    isActive={currentPage === pageNumber}
                  >
                    {pageNumber}
                  </PaginationLink>
                </PaginationItem>
              );
            })}
            
            <PaginationItem>
              <PaginationNext
                onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </div>
  );
}