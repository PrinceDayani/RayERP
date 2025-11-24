'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Download, FileSpreadsheet, FileText, Calendar as CalendarIcon, Settings } from 'lucide-react';
import { format } from 'date-fns';

interface ExportOptions {
  format: 'excel' | 'pdf' | 'csv';
  dateRange: { from?: Date; to?: Date };
  includeFields: {
    employee: boolean;
    project: boolean;
    hours: boolean;
    dates: boolean;
    role: boolean;
    status: boolean;
    utilization: boolean;
    conflicts: boolean;
  };
  groupBy: 'employee' | 'project' | 'department' | 'none';
  filters: {
    department?: string;
    project?: string;
    employee?: string;
    status?: string;
  };
}

interface ExportAllocationDataProps {
  onExport: (options: ExportOptions) => Promise<void>;
  departments: Array<{ _id: string; name: string }>;
  projects: Array<{ _id: string; name: string }>;
  employees: Array<{ _id: string; firstName: string; lastName: string }>;
}

export default function ExportAllocationData({
  onExport,
  departments,
  projects,
  employees
}: ExportAllocationDataProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [options, setOptions] = useState<ExportOptions>({
    format: 'excel',
    dateRange: {},
    includeFields: {
      employee: true,
      project: true,
      hours: true,
      dates: true,
      role: true,
      status: true,
      utilization: true,
      conflicts: false
    },
    groupBy: 'employee',
    filters: {}
  });

  const handleExport = async () => {
    setIsExporting(true);
    try {
      await onExport(options);
      setIsOpen(false);
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const updateIncludeField = (field: keyof ExportOptions['includeFields'], value: boolean) => {
    setOptions(prev => ({
      ...prev,
      includeFields: {
        ...prev.includeFields,
        [field]: value
      }
    }));
  };

  const updateFilter = (key: keyof ExportOptions['filters'], value: string) => {
    setOptions(prev => ({
      ...prev,
      filters: {
        ...prev.filters,
        [key]: value || undefined
      }
    }));
  };

  const getFormatIcon = (format: string) => {
    switch (format) {
      case 'excel': return <FileSpreadsheet className="w-4 h-4 text-green-600" />;
      case 'pdf': return <FileText className="w-4 h-4 text-red-600" />;
      case 'csv': return <FileText className="w-4 h-4 text-blue-600" />;
      default: return <Download className="w-4 h-4" />;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="flex items-center gap-2">
          <Download className="w-4 h-4" />
          Export Data
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Export Allocation Data
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Export Format */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Export Format</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                {(['excel', 'pdf', 'csv'] as const).map((format) => (
                  <div
                    key={format}
                    className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                      options.format === format
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setOptions(prev => ({ ...prev, format }))}
                  >
                    <div className="flex flex-col items-center gap-2">
                      {getFormatIcon(format)}
                      <span className="font-medium capitalize">{format}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Date Range */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Date Range</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>From Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-left font-normal">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {options.dateRange.from ? format(options.dateRange.from, "PPP") : "Select date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={options.dateRange.from}
                        onSelect={(date) => setOptions(prev => ({
                          ...prev,
                          dateRange: { ...prev.dateRange, from: date }
                        }))}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div>
                  <Label>To Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-left font-normal">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {options.dateRange.to ? format(options.dateRange.to, "PPP") : "Select date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={options.dateRange.to}
                        onSelect={(date) => setOptions(prev => ({
                          ...prev,
                          dateRange: { ...prev.dateRange, to: date }
                        }))}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Include Fields */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Include Fields</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                {Object.entries(options.includeFields).map(([field, checked]) => (
                  <div key={field} className="flex items-center space-x-2">
                    <Checkbox
                      id={field}
                      checked={checked}
                      onCheckedChange={(value) => updateIncludeField(field as keyof ExportOptions['includeFields'], !!value)}
                    />
                    <Label htmlFor={field} className="capitalize">
                      {field.replace(/([A-Z])/g, ' $1').trim()}
                    </Label>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Group By */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Group By</CardTitle>
            </CardHeader>
            <CardContent>
              <Select
                value={options.groupBy}
                onValueChange={(value: ExportOptions['groupBy']) => 
                  setOptions(prev => ({ ...prev, groupBy: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No Grouping</SelectItem>
                  <SelectItem value="employee">Group by Employee</SelectItem>
                  <SelectItem value="project">Group by Project</SelectItem>
                  <SelectItem value="department">Group by Department</SelectItem>
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Filters</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Department</Label>
                  <Select
                    value={options.filters.department || ''}
                    onValueChange={(value) => updateFilter('department', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All Departments" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Departments</SelectItem>
                      {departments.map((dept) => (
                        <SelectItem key={dept._id} value={dept._id}>
                          {dept.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Project</Label>
                  <Select
                    value={options.filters.project || ''}
                    onValueChange={(value) => updateFilter('project', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All Projects" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Projects</SelectItem>
                      {projects.map((proj) => (
                        <SelectItem key={proj._id} value={proj._id}>
                          {proj.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Employee</Label>
                  <Select
                    value={options.filters.employee || ''}
                    onValueChange={(value) => updateFilter('employee', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All Employees" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Employees</SelectItem>
                      {employees.map((emp) => (
                        <SelectItem key={emp._id} value={emp._id}>
                          {emp.firstName} {emp.lastName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Status</Label>
                  <Select
                    value={options.filters.status || ''}
                    onValueChange={(value) => updateFilter('status', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All Statuses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Statuses</SelectItem>
                      <SelectItem value="planned">Planned</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="on_hold">On Hold</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Export Actions */}
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleExport} disabled={isExporting}>
              {isExporting ? (
                <>Exporting...</>
              ) : (
                <>
                  <Download className="w-4 h-4 mr-2" />
                  Export {options.format.toUpperCase()}
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
