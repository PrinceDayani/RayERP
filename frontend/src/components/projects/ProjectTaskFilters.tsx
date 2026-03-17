"use client";

import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Search, X, Filter } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface ProjectTaskFiltersProps {
  filters: {
    search: string;
    status: string;
    priority: string;
    assignee: string;
    taskType: string;
    assignmentType: string;
    overdue: boolean;
  };
  onFilterChange: (filters: any) => void;
  employees: Array<{ _id: string; firstName: string; lastName: string }>;
}

export default function ProjectTaskFilters({ filters, onFilterChange, employees }: ProjectTaskFiltersProps) {
  const handleReset = () => {
    onFilterChange({
      search: '',
      status: 'all',
      priority: 'all',
      assignee: 'all',
      taskType: 'all',
      assignmentType: 'all',
      overdue: false
    });
  };

  const activeFiltersCount = Object.entries(filters).filter(([key, value]) => {
    if (key === 'overdue') return value === true;
    if (key === 'search') return value !== '';
    return value !== '' && value !== 'all';
  }).length;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Filter className="h-4 w-4 text-muted-foreground" />
        <h3 className="font-medium">Filters</h3>
        {activeFiltersCount > 0 && (
          <Badge variant="secondary">{activeFiltersCount} active</Badge>
        )}
        {activeFiltersCount > 0 && (
          <Button variant="ghost" size="sm" onClick={handleReset}>
            <X className="h-4 w-4 mr-1" />
            Clear All
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search tasks..."
            value={filters.search}
            onChange={(e) => onFilterChange({ ...filters, search: e.target.value })}
            className="pl-9"
          />
        </div>

        {/* Status */}
        <Select value={filters.status} onValueChange={(value) => onFilterChange({ ...filters, status: value })}>
          <SelectTrigger>
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="todo">To Do</SelectItem>
            <SelectItem value="in-progress">In Progress</SelectItem>
            <SelectItem value="review">Review</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="blocked">Blocked</SelectItem>
          </SelectContent>
        </Select>

        {/* Priority */}
        <Select value={filters.priority} onValueChange={(value) => onFilterChange({ ...filters, priority: value })}>
          <SelectTrigger>
            <SelectValue placeholder="All Priorities" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Priorities</SelectItem>
            <SelectItem value="low">Low</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="critical">Critical</SelectItem>
          </SelectContent>
        </Select>

        {/* Assignee */}
        <Select value={filters.assignee} onValueChange={(value) => onFilterChange({ ...filters, assignee: value })}>
          <SelectTrigger>
            <SelectValue placeholder="All Assignees" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Assignees</SelectItem>
            {employees.map((emp) => (
              <SelectItem key={emp._id} value={emp._id}>
                {emp.firstName} {emp.lastName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Task Type */}
        <Select value={filters.taskType} onValueChange={(value) => onFilterChange({ ...filters, taskType: value })}>
          <SelectTrigger>
            <SelectValue placeholder="All Types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="individual">Individual</SelectItem>
            <SelectItem value="project">Project</SelectItem>
          </SelectContent>
        </Select>

        {/* Assignment Type */}
        <Select value={filters.assignmentType} onValueChange={(value) => onFilterChange({ ...filters, assignmentType: value })}>
          <SelectTrigger>
            <SelectValue placeholder="All Assignment Types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Assignment Types</SelectItem>
            <SelectItem value="assigned">Assigned</SelectItem>
            <SelectItem value="self-assigned">Self-Assigned</SelectItem>
          </SelectContent>
        </Select>

        {/* Overdue */}
        <Select value={filters.overdue ? "true" : "false"} onValueChange={(value) => onFilterChange({ ...filters, overdue: value === "true" })}>
          <SelectTrigger>
            <SelectValue placeholder="All Tasks" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="false">All Tasks</SelectItem>
            <SelectItem value="true">Overdue Only</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
