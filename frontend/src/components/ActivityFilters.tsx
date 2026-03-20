"use client";

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Filter, Search, X, Settings } from 'lucide-react';

interface ActivityFiltersProps {
  filter: string;
  actionFilter: string;
  statusFilter: string;
  categoryFilter: string;
  userNameFilter: string;
  projectNameFilter: string;
  startDate: string;
  endDate: string;
  showAdvancedFilters: boolean;
  ipAddressFilter: string;
  minDurationFilter: string;
  maxDurationFilter: string;
  sessionIdFilter: string;
  userAgentFilter: string;
  onFilterChange: (filter: string) => void;
  onActionFilterChange: (filter: string) => void;
  onStatusFilterChange: (filter: string) => void;
  onCategoryFilterChange: (filter: string) => void;
  onUserNameFilterChange: (filter: string) => void;
  onProjectNameFilterChange: (filter: string) => void;
  onStartDateChange: (date: string) => void;
  onEndDateChange: (date: string) => void;
  onToggleAdvancedFilters: () => void;
  onIpAddressFilterChange: (filter: string) => void;
  onMinDurationFilterChange: (filter: string) => void;
  onMaxDurationFilterChange: (filter: string) => void;
  onSessionIdFilterChange: (filter: string) => void;
  onUserAgentFilterChange: (filter: string) => void;
  onClearAllFilters: () => void;
  onQuickFilter: (preset: string) => void;
}

export function ActivityFilters({
  filter,
  actionFilter,
  statusFilter,
  categoryFilter,
  userNameFilter,
  projectNameFilter,
  startDate,
  endDate,
  showAdvancedFilters,
  ipAddressFilter,
  minDurationFilter,
  maxDurationFilter,
  sessionIdFilter,
  userAgentFilter,
  onFilterChange,
  onActionFilterChange,
  onStatusFilterChange,
  onCategoryFilterChange,
  onUserNameFilterChange,
  onProjectNameFilterChange,
  onStartDateChange,
  onEndDateChange,
  onToggleAdvancedFilters,
  onIpAddressFilterChange,
  onMinDurationFilterChange,
  onMaxDurationFilterChange,
  onSessionIdFilterChange,
  onUserAgentFilterChange,
  onClearAllFilters,
  onQuickFilter,
}: ActivityFiltersProps) {
  const hasActiveFilters = 
    filter !== 'all' || 
    actionFilter !== 'all' || 
    statusFilter !== 'all' || 
    categoryFilter !== 'all' || 
    userNameFilter || 
    projectNameFilter || 
    startDate || 
    endDate || 
    ipAddressFilter || 
    minDurationFilter || 
    maxDurationFilter || 
    sessionIdFilter || 
    userAgentFilter;

  return (
    <Card className="bg-card border border-border">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">Filters</CardTitle>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => onQuickFilter('today')}>
              Today
            </Button>
            <Button variant="outline" size="sm" onClick={() => onQuickFilter('yesterday')}>
              Yesterday
            </Button>
            <Button variant="outline" size="sm" onClick={() => onQuickFilter('week')}>
              This Week
            </Button>
            <Button variant="outline" size="sm" onClick={() => onQuickFilter('month')}>
              This Month
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            <Select value={filter} onValueChange={onFilterChange}>
              <SelectTrigger>
                <SelectValue placeholder="Resource Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="project">Projects</SelectItem>
                <SelectItem value="task">Tasks</SelectItem>
                <SelectItem value="file">Files</SelectItem>
                <SelectItem value="comment">Comments</SelectItem>
                <SelectItem value="employee">Employees</SelectItem>
                <SelectItem value="budget">Budget</SelectItem>
                <SelectItem value="user">Users</SelectItem>
                <SelectItem value="auth">Authentication</SelectItem>
                <SelectItem value="system">System</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={actionFilter} onValueChange={onActionFilterChange}>
              <SelectTrigger>
                <SelectValue placeholder="Action" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Actions</SelectItem>
                <SelectItem value="create">Create</SelectItem>
                <SelectItem value="update">Update</SelectItem>
                <SelectItem value="delete">Delete</SelectItem>
                <SelectItem value="view">View</SelectItem>
                <SelectItem value="login">Login</SelectItem>
                <SelectItem value="logout">Logout</SelectItem>
                <SelectItem value="share">Share</SelectItem>
                <SelectItem value="upload">Upload</SelectItem>
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={onStatusFilterChange}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="success">Success</SelectItem>
                <SelectItem value="error">Error</SelectItem>
                <SelectItem value="warning">Warning</SelectItem>
              </SelectContent>
            </Select>

            <Select value={categoryFilter} onValueChange={onCategoryFilterChange}>
              <SelectTrigger>
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="user">User</SelectItem>
                <SelectItem value="system">System</SelectItem>
                <SelectItem value="security">Security</SelectItem>
                <SelectItem value="project">Project</SelectItem>
                <SelectItem value="data">Data</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-wrap gap-3">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by user name..."
                  value={userNameFilter}
                  onChange={(e) => onUserNameFilterChange(e.target.value)}
                  className="pl-10"
                  aria-label="Search activities by user name"
                />
              </div>
            </div>
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by project name..."
                  value={projectNameFilter}
                  onChange={(e) => onProjectNameFilterChange(e.target.value)}
                  className="pl-10"
                  aria-label="Search activities by project name"
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Input
                type="date"
                value={startDate}
                onChange={(e) => onStartDateChange(e.target.value)}
                className="w-[160px]"
                aria-label="Start date"
              />
              <span className="text-muted-foreground text-sm">to</span>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => onEndDateChange(e.target.value)}
                className="w-[160px]"
                aria-label="End date"
              />
            </div>

            {hasActiveFilters && (
              <Button variant="outline" onClick={onClearAllFilters}>
                <X className="h-4 w-4 mr-2" />
                Clear Filters
              </Button>
            )}
          </div>

          <div className="flex items-center justify-between pt-3 border-t">
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggleAdvancedFilters}
              className="gap-2"
            >
              <Settings className="h-4 w-4" />
              {showAdvancedFilters ? 'Hide' : 'Show'} Advanced Filters
            </Button>
          </div>

          {showAdvancedFilters && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pt-3 border-t">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">IP Address</label>
                <Input
                  placeholder="Filter by IP..."
                  value={ipAddressFilter}
                  onChange={(e) => onIpAddressFilterChange(e.target.value)}
                  className="h-9"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Min Duration (ms)</label>
                <Input
                  type="number"
                  placeholder="e.g., 1000"
                  value={minDurationFilter}
                  onChange={(e) => onMinDurationFilterChange(e.target.value)}
                  className="h-9"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Max Duration (ms)</label>
                <Input
                  type="number"
                  placeholder="e.g., 5000"
                  value={maxDurationFilter}
                  onChange={(e) => onMaxDurationFilterChange(e.target.value)}
                  className="h-9"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Session ID</label>
                <Input
                  placeholder="Filter by session..."
                  value={sessionIdFilter}
                  onChange={(e) => onSessionIdFilterChange(e.target.value)}
                  className="h-9"
                />
              </div>
              <div className="md:col-span-2">
                <label className="text-xs font-medium text-muted-foreground mb-1 block">User Agent</label>
                <Input
                  placeholder="Filter by browser/device..."
                  value={userAgentFilter}
                  onChange={(e) => onUserAgentFilterChange(e.target.value)}
                  className="h-9"
                />
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
