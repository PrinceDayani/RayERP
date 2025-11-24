'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Save, X, Calendar as CalendarIcon, AlertTriangle, Clock } from 'lucide-react';
import { format } from 'date-fns';

interface AllocationData {
  _id: string;
  employee: { _id: string; firstName: string; lastName: string; position: string };
  project: { _id: string; name: string };
  allocatedHours: number;
  startDate: string;
  endDate: string;
  role: string;
  status: string;
}

interface InlineAllocationEditorProps {
  allocation: AllocationData;
  employees: Array<{ _id: string; firstName: string; lastName: string; position: string }>;
  projects: Array<{ _id: string; name: string }>;
  onSave: (updatedAllocation: Partial<AllocationData>) => void;
  onCancel: () => void;
  onDelete?: () => void;
  conflicts?: Array<{ type: string; message: string }>;
}

export default function InlineAllocationEditor({
  allocation,
  employees,
  projects,
  onSave,
  onCancel,
  onDelete,
  conflicts = []
}: InlineAllocationEditorProps) {
  const [formData, setFormData] = useState({
    employee: allocation.employee._id,
    project: allocation.project._id,
    allocatedHours: allocation.allocatedHours,
    startDate: new Date(allocation.startDate),
    endDate: new Date(allocation.endDate),
    role: allocation.role,
    status: allocation.status
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isValidating, setIsValidating] = useState(false);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.employee) newErrors.employee = 'Employee is required';
    if (!formData.project) newErrors.project = 'Project is required';
    if (formData.allocatedHours <= 0) newErrors.allocatedHours = 'Hours must be greater than 0';
    if (formData.allocatedHours > 60) newErrors.allocatedHours = 'Hours cannot exceed 60 per week';
    if (!formData.role.trim()) newErrors.role = 'Role is required';
    if (formData.startDate >= formData.endDate) newErrors.dateRange = 'End date must be after start date';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (!validateForm()) return;

    setIsValidating(true);
    
    const selectedEmployee = employees.find(e => e._id === formData.employee);
    const selectedProject = projects.find(p => p._id === formData.project);
    
    const updatedAllocation = {
      _id: allocation._id,
      employee: selectedEmployee || allocation.employee,
      project: selectedProject || allocation.project,
      allocatedHours: formData.allocatedHours,
      startDate: format(formData.startDate, 'yyyy-MM-dd'),
      endDate: format(formData.endDate, 'yyyy-MM-dd'),
      role: formData.role,
      status: formData.status
    };

    onSave(updatedAllocation);
  };

  const getUtilizationWarning = () => {
    if (formData.allocatedHours > 40) {
      return {
        type: 'warning',
        message: `${formData.allocatedHours}h/week exceeds standard 40h work week`
      };
    }
    if (formData.allocatedHours > 50) {
      return {
        type: 'error',
        message: `${formData.allocatedHours}h/week may cause burnout`
      };
    }
    return null;
  };

  const utilizationWarning = getUtilizationWarning();

  return (
    <Card className="border-2 border-blue-200 bg-blue-50/30">
      <CardContent className="p-4">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <h4 className="font-medium">Edit Allocation</h4>
            <div className="flex items-center gap-2">
              <Button size="sm" onClick={handleSave} disabled={isValidating}>
                <Save className="w-4 h-4 mr-1" />
                Save
              </Button>
              <Button size="sm" variant="outline" onClick={onCancel}>
                <X className="w-4 h-4 mr-1" />
                Cancel
              </Button>
              {onDelete && (
                <Button size="sm" variant="destructive" onClick={onDelete}>
                  Delete
                </Button>
              )}
            </div>
          </div>

          {/* Conflicts Alert */}
          {conflicts.length > 0 && (
            <div className="p-3 bg-red-50 border border-red-200 rounded">
              <div className="flex items-center gap-2 text-red-800 font-medium mb-2">
                <AlertTriangle className="w-4 h-4" />
                Conflicts Detected
              </div>
              {conflicts.map((conflict, index) => (
                <div key={index} className="text-sm text-red-700">
                  • {conflict.message}
                </div>
              ))}
            </div>
          )}

          {/* Form Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Employee */}
            <div>
              <Label>Employee</Label>
              <Select
                value={formData.employee}
                onValueChange={(value) => setFormData({ ...formData, employee: value })}
              >
                <SelectTrigger className={errors.employee ? 'border-red-500' : ''}>
                  <SelectValue placeholder="Select employee" />
                </SelectTrigger>
                <SelectContent>
                  {employees.map((emp) => (
                    <SelectItem key={emp._id} value={emp._id}>
                      {emp.firstName} {emp.lastName} - {emp.position}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.employee && (
                <p className="text-sm text-red-600 mt-1">{errors.employee}</p>
              )}
            </div>

            {/* Project */}
            <div>
              <Label>Project</Label>
              <Select
                value={formData.project}
                onValueChange={(value) => setFormData({ ...formData, project: value })}
              >
                <SelectTrigger className={errors.project ? 'border-red-500' : ''}>
                  <SelectValue placeholder="Select project" />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((proj) => (
                    <SelectItem key={proj._id} value={proj._id}>
                      {proj.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.project && (
                <p className="text-sm text-red-600 mt-1">{errors.project}</p>
              )}
            </div>

            {/* Role */}
            <div>
              <Label>Role</Label>
              <Input
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className={errors.role ? 'border-red-500' : ''}
                placeholder="e.g., Developer, Designer"
              />
              {errors.role && (
                <p className="text-sm text-red-600 mt-1">{errors.role}</p>
              )}
            </div>

            {/* Allocated Hours */}
            <div>
              <Label className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Hours/Week
              </Label>
              <Input
                type="number"
                min="1"
                max="60"
                value={formData.allocatedHours}
                onChange={(e) => setFormData({ ...formData, allocatedHours: +e.target.value })}
                className={errors.allocatedHours ? 'border-red-500' : ''}
              />
              {errors.allocatedHours && (
                <p className="text-sm text-red-600 mt-1">{errors.allocatedHours}</p>
              )}
              {utilizationWarning && (
                <div className={`text-sm mt-1 ${
                  utilizationWarning.type === 'error' ? 'text-red-600' : 'text-yellow-600'
                }`}>
                  {utilizationWarning.message}
                </div>
              )}
            </div>

            {/* Start Date */}
            <div>
              <Label>Start Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={`w-full justify-start text-left font-normal ${
                      errors.dateRange ? 'border-red-500' : ''
                    }`}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(formData.startDate, "PPP")}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={formData.startDate}
                    onSelect={(date) => date && setFormData({ ...formData, startDate: date })}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* End Date */}
            <div>
              <Label>End Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={`w-full justify-start text-left font-normal ${
                      errors.dateRange ? 'border-red-500' : ''
                    }`}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(formData.endDate, "PPP")}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={formData.endDate}
                    onSelect={(date) => date && setFormData({ ...formData, endDate: date })}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              {errors.dateRange && (
                <p className="text-sm text-red-600 mt-1">{errors.dateRange}</p>
              )}
            </div>
          </div>

          {/* Status and Quick Actions */}
          <div className="flex items-center justify-between pt-4 border-t">
            <div className="flex items-center gap-4">
              <div>
                <Label>Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => setFormData({ ...formData, status: value })}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="planned">Planned</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="on_hold">On Hold</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="text-sm text-muted-foreground">
                Duration: {Math.ceil((formData.endDate.getTime() - formData.startDate.getTime()) / (1000 * 60 * 60 * 24))} days
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Badge variant="outline">
                {formData.allocatedHours}h/week
              </Badge>
              <Badge variant={formData.allocatedHours > 40 ? 'destructive' : 'secondary'}>
                {Math.round((formData.allocatedHours / 40) * 100)}% utilization
              </Badge>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
