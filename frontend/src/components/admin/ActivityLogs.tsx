"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { SearchIcon, FilterIcon, DownloadIcon, Activity, ChevronDownIcon } from "lucide-react";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { getActivityLogs, ActivityLog } from "@/lib/api/activityAPI";
import adminAPI from "@/lib/api/adminAPI";

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
        user: userName.split('@')[0],
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
<<<<<<< HEAD
        (log) =>
          (typeof log.user === 'string' ? log.user : log.user?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
          log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
          log.resource.toLowerCase().includes(searchTerm.toLowerCase()) ||
          log.details.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (log.ipAddress && log.ipAddress.toLowerCase().includes(searchTerm.toLowerCase()))
=======
        (log) => {
          const userName = typeof log.user === 'string' ? log.user : (log.user?.name || log.user?.email || '');
          return userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
            log.resource.toLowerCase().includes(searchTerm.toLowerCase()) ||
            log.details.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (log.ipAddress && log.ipAddress.toLowerCase().includes(searchTerm.toLowerCase()));
        }
>>>>>>> 9bf2e563046dd1d8fcf20bff1baa39d54de0eadc
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
        return (
          <Badge className="bg-gradient-to-r from-emerald-500 to-green-500 text-white border-0 shadow-md">
            <div className="w-2 h-2 bg-white rounded-full mr-2" />
            Success
          </Badge>
        );
      case "error":
        return (
          <Badge className="bg-gradient-to-r from-red-500 to-rose-500 text-white border-0 shadow-md">
            <div className="w-2 h-2 bg-white rounded-full mr-2" />
            Error
          </Badge>
        );
      case "warning":
        return (
          <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0 shadow-md">
            <div className="w-2 h-2 bg-white rounded-full mr-2" />
            Warning
          </Badge>
        );
      default:
        return <Badge className="bg-gradient-to-r from-slate-400 to-slate-500 text-white border-0">{status}</Badge>;
    }
  };

  const getActionBadge = (action: string) => {
    const badgeClasses = "text-white border-0 shadow-md font-medium";
    switch (action) {
      case "login":
      case "logout":
        return <Badge className={`bg-gradient-to-r from-blue-500 to-indigo-500 ${badgeClasses}`}>{action}</Badge>;
      case "create":
        return <Badge className={`bg-gradient-to-r from-emerald-500 to-green-500 ${badgeClasses}`}>{action}</Badge>;
      case "update":
        return <Badge className={`bg-gradient-to-r from-amber-500 to-orange-500 ${badgeClasses}`}>{action}</Badge>;
      case "delete":
        return <Badge className={`bg-gradient-to-r from-red-500 to-rose-500 ${badgeClasses}`}>{action}</Badge>;
      case "approve":
        return <Badge className={`bg-gradient-to-r from-emerald-600 to-green-600 ${badgeClasses}`}>{action}</Badge>;
      case "reject":
        return <Badge className={`bg-gradient-to-r from-rose-500 to-pink-500 ${badgeClasses}`}>{action}</Badge>;
      case "view":
        return <Badge className={`bg-gradient-to-r from-cyan-500 to-blue-500 ${badgeClasses}`}>{action}</Badge>;
      case "export":
      case "import":
        return <Badge className={`bg-gradient-to-r from-purple-500 to-violet-500 ${badgeClasses}`}>{action}</Badge>;
      default:
        return <Badge className={`bg-gradient-to-r from-slate-500 to-slate-600 ${badgeClasses}`}>{action}</Badge>;
    }
  };

<<<<<<< HEAD
  const exportLogs = async (format: 'text' | 'pdf' | 'excel') => {
    try {
      const blob = await adminAPI.exportLogs(format);
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `activity-logs-${new Date().toISOString().slice(0, 10)}.${format === 'excel' ? 'csv' : format === 'pdf' ? 'pdf' : 'txt'}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export failed:', error);
      alert('Export failed. Please try again.');
    }
=======
  const exportLogs = () => {
    // Convert logs to CSV
    const headers = ["Timestamp", "User", "Action", "Resource", "Status", "Details", "IP Address"];
    const csvContent = [
      headers.join(","),
      ...filteredLogs.map((log) => {
        const userName = typeof log.user === 'string' ? log.user : (log.user?.name || log.user?.email || 'Unknown');
        return [
          formatDate(log.timestamp),
          userName,
          log.action,
          log.resource,
          log.status || 'success',
          `"${log.details.replace(/"/g, '""')}"`, // Escape quotes
          log.ipAddress || 'N/A',
        ].join(",");
      }),
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
>>>>>>> 9bf2e563046dd1d8fcf20bff1baa39d54de0eadc
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
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full lg:w-auto">
          <div className="relative w-full sm:w-80">
            <SearchIcon className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search logs by user, action, or details..."
              className="pl-10 h-12 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm border-slate-200/50 dark:border-slate-700/50 focus:bg-white dark:focus:bg-slate-800 transition-all duration-200"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Select value={actionFilter} onValueChange={setActionFilter}>
              <SelectTrigger className="w-full sm:w-[150px] h-12 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm border-slate-200/50 dark:border-slate-700/50">
                <div className="flex items-center">
                  <FilterIcon className="mr-2 h-4 w-4 text-slate-400" />
                  <span className="font-medium">{actionFilter === "all" ? "All Actions" : actionFilter}</span>
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
              <SelectTrigger className="w-full sm:w-[150px] h-12 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm border-slate-200/50 dark:border-slate-700/50">
                <span className="font-medium">{resourceFilter === "all" ? "All Resources" : resourceFilter}</span>
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
        
        <div className="flex gap-3">
          <Button 
            variant={autoRefresh ? "default" : "outline"} 
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`h-12 px-4 ${
              autoRefresh 
                ? "bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 text-white border-0 shadow-lg" 
                : "bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm border-slate-200/50 dark:border-slate-700/50 hover:bg-white dark:hover:bg-slate-800"
            } transition-all duration-200`}
          >
            <div className={`w-2 h-2 rounded-full mr-2 ${
              autoRefresh ? "bg-white animate-pulse" : "bg-slate-400"
            }`} />
            {autoRefresh ? "Live" : "Paused"}
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="outline" 
                className="h-12 px-4 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm border-slate-200/50 dark:border-slate-700/50 hover:bg-white dark:hover:bg-slate-800 transition-all duration-200"
              >
                <DownloadIcon className="mr-2 h-4 w-4" />
                Export Logs
                <ChevronDownIcon className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => exportLogs('text')}>
                <DownloadIcon className="mr-2 h-4 w-4" />
                Export as Text
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => exportLogs('pdf')}>
                <DownloadIcon className="mr-2 h-4 w-4" />
                Export as PDF
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => exportLogs('excel')}>
                <DownloadIcon className="mr-2 h-4 w-4" />
                Export as Excel
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
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
      
      <div className="rounded-2xl border-0 shadow-xl bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-700 border-b border-slate-200/50 dark:border-slate-700/50">
              <TableHead className="font-semibold text-slate-700 dark:text-slate-300 py-4">Timestamp</TableHead>
              <TableHead className="font-semibold text-slate-700 dark:text-slate-300 py-4">User</TableHead>
              <TableHead className="font-semibold text-slate-700 dark:text-slate-300 py-4">Action</TableHead>
              <TableHead className="font-semibold text-slate-700 dark:text-slate-300 py-4">Resource</TableHead>
              <TableHead className="font-semibold text-slate-700 dark:text-slate-300 py-4">Status</TableHead>
              <TableHead className="font-semibold text-slate-700 dark:text-slate-300 py-4">Details</TableHead>
              <TableHead className="font-semibold text-slate-700 dark:text-slate-300 py-4">IP Address</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {getCurrentPageLogs().length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-12">
                  <div className="flex flex-col items-center space-y-3">
                    <div className="w-16 h-16 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center">
                      <Activity className="h-8 w-8 text-slate-400" />
                    </div>
                    <div className="text-slate-500 dark:text-slate-400 font-medium">No activity logs found</div>
                    <div className="text-sm text-slate-400 dark:text-slate-500">Try adjusting your search filters</div>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              getCurrentPageLogs().map((log, index) => (
                <TableRow 
                  key={log._id} 
                  className="group hover:bg-slate-50/50 dark:hover:bg-slate-700/30 transition-colors duration-200 border-b border-slate-100/50 dark:border-slate-700/50 fade-in-up"
                  style={{
                    animationDelay: `${index * 30}ms`
                  }}
                >
                  <TableCell className="font-mono text-xs text-slate-600 dark:text-slate-400 py-4">
                    {formatDate(log.timestamp)}
                  </TableCell>
                  <TableCell className="py-4">
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center text-white font-semibold text-xs">
<<<<<<< HEAD
                        {(typeof log.user === 'string' ? log.user : log.user?.name || 'U').charAt(0).toUpperCase()}
                      </div>
                      <div className="font-medium text-slate-900 dark:text-slate-100">{typeof log.user === 'string' ? log.user : log.user?.name || 'Unknown'}</div>
=======
                        {(() => {
                          const userName = typeof log.user === 'string' ? log.user : (log.user?.name || log.user?.email || 'U');
                          return userName.charAt(0).toUpperCase();
                        })()}
                      </div>
                      <div className="font-medium text-slate-900 dark:text-slate-100">
                        {typeof log.user === 'string' ? log.user : (log.user?.name || log.user?.email || 'Unknown')}
                      </div>
>>>>>>> 9bf2e563046dd1d8fcf20bff1baa39d54de0eadc
                    </div>
                  </TableCell>
                  <TableCell className="py-4">{getActionBadge(log.action)}</TableCell>
                  <TableCell className="capitalize py-4">
                    <Badge className="bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 border-0">
                      {log.resource}
                    </Badge>
                  </TableCell>
                  <TableCell className="py-4">{getStatusBadge(log.status || 'success')}</TableCell>
                  <TableCell className="max-w-xs truncate py-4 text-slate-600 dark:text-slate-400" title={log.details}>
                    {log.details}
                  </TableCell>
                  <TableCell className="font-mono text-xs text-slate-500 dark:text-slate-500 py-4">
                    {log.ipAddress || 'N/A'}
                  </TableCell>
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