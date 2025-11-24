'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Filter, X, Calendar as CalendarIcon, Search } from 'lucide-react';
import { format } from 'date-fns';

interface FilterOptions {
  projects: Array<{ _id: string; name: string }>;
  employees: Array<{ _id: string; firstName: string; lastName: string; position: string; department?: string }>;
  departments: Array<{ _id: string; name: string }>;
  roles: string[];
}

interface AllocationFiltersProps {
  filters: FilterOptions;
  onFilterChange: (filters: any) => void;
  activeFilters: any;
}

export default function AllocationFilters({ filters, onFilterChange, activeFilters }: AllocationFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({});

  const handleFilterChange = (key: string, value: any) => {
    const newFilters = { ...activeFilters, [key]: value };
    if (!value || value === '') {
      delete newFilters[key];
    }
    onFilterChange(newFilters);
  };

  const handleDateRangeChange = (range: { from?: Date; to?: Date }) => {
    setDateRange(range);
    if (range.from && range.to) {
      onFilterChange({
        ...activeFilters,
        startDate: format(range.from, 'yyyy-MM-dd'),
        endDate: format(range.to, 'yyyy-MM-dd')
      });
    }
  };

  const clearAllFilters = () => {
    setDateRange({});
    onFilterChange({});
  };

  const getActiveFilterCount = () => {
    return Object.keys(activeFilters).length;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filters
            {getActiveFilterCount() > 0 && (
              <Badge variant="secondary">{getActiveFilterCount()}</Badge>
            )}
          </CardTitle>
          <div className="flex items-center gap-2">
            {getActiveFilterCount() > 0 && (
              <Button variant="ghost" size="sm" onClick={clearAllFilters}>
                <X className="w-4 h-4 mr-1" />
                Clear All
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? 'Collapse' : 'Expand'}
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className={`space-y-4 ${!isExpanded ? 'hidden' : ''}`}>
        {/* Search */}
        <div>
          <Label>Search</Label>
          <div className="relative">
            <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search employees, projects, or roles..."
              value={activeFilters.search || ''}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Date Range */}
        <div>
          <Label>Date Range</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-full justify-start text-left font-normal">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateRange.from ? (
                  dateRange.to ? (
                    <>
                      {format(dateRange.from, "LLL dd, y")} -{" "}
                      {format(dateRange.to, "LLL dd, y")}
                    </>
                  ) : (
                    format(dateRange.from, "LLL dd, y")
                  )
                ) : (
                  <span>Pick a date range</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                initialFocus
                mode="range"
                defaultMonth={dateRange.from}
                selected={dateRange}
                onSelect={handleDateRangeChange}
                numberOfMonths={2}
              />
            </PopoverContent>
          </Popover>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Project Filter */}
          <div>
            <Label>Project</Label>
            <Select
              value={activeFilters.projectId || 'all'}
              onValueChange={(value) => handleFilterChange('projectId', value === 'all' ? '' : value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="All Projects" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Projects</SelectItem>
                {filters.projects.map((project) => (
                  <SelectItem key={project._id} value={project._id}>
                    {project.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Employee Filter */}
          <div>
            <Label>Employee</Label>
            <Select
              value={activeFilters.employeeId || 'all'}
              onValueChange={(value) => handleFilterChange('employeeId', value === 'all' ? '' : value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="All Employees" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Employees</SelectItem>
                {filters.employees.map((employee) => (
                  <SelectItem key={employee._id} value={employee._id}>
                    {employee.firstName} {employee.lastName} - {employee.position}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Department Filter */}
          <div>
            <Label>Department</Label>
            <Select
              value={activeFilters.department || 'all'}
              onValueChange={(value) => handleFilterChange('department', value === 'all' ? '' : value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="All Departments" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Departments</SelectItem>
                {filters.departments.map((dept) => (
                  <SelectItem key={dept._id} value={dept.name}>
                    {dept.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Role Filter */}
          <div>
            <Label>Role</Label>
            <Select
              value={activeFilters.role || 'all'}
              onValueChange={(value) => handleFilterChange('role', value === 'all' ? '' : value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="All Roles" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                {filters.roles.map((role) => (
                  <SelectItem key={role} value={role}>
                    {role}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Allocation Status Filter */}
          <div>
            <Label>Allocation Status</Label>
            <Select
              value={activeFilters.status || 'all'}
              onValueChange={(value) => handleFilterChange('status', value === 'all' ? '' : value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="available">Available</SelectItem>
                <SelectItem value="partial">Partially Allocated</SelectItem>
                <SelectItem value="full">Fully Allocated</SelectItem>
                <SelectItem value="over">Over-Allocated</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Utilization Range */}
          <div>
            <Label>Utilization %</Label>
            <div className="flex gap-2">
              <Input
                type="number"
                placeholder="Min %"
                value={activeFilters.minUtilization || ''}
                onChange={(e) => handleFilterChange('minUtilization', e.target.value)}
                className="w-20"
              />
              <Input
                type="number"
                placeholder="Max %"
                value={activeFilters.maxUtilization || ''}
                onChange={(e) => handleFilterChange('maxUtilization', e.target.value)}
                className="w-20"
              />
            </div>
          </div>
        </div>

        {/* Active Filters Display */}
        {getActiveFilterCount() > 0 && (
          <div>
            <Label>Active Filters:</Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {Object.entries(activeFilters).map(([key, value]) => (
                <Badge key={key} variant="secondary" className="flex items-center gap-1">
                  {key}: {String(value)}
                  <X
                    className="w-3 h-3 cursor-pointer"
                    onClick={() => handleFilterChange(key, '')}
                  />
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}