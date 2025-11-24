'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Clock, User, AlertTriangle, TrendingUp, TrendingDown } from 'lucide-react';

interface EmployeeSummary {
  _id: string;
  name: string;
  position: string;
  department?: string;
  totalHours: number;
  bookedHours: number;
  freeHours: number;
  utilizationPercentage: number;
  allocations: Array<{
    project: string;
    hours: number;
    role: string;
  }>;
  conflicts: number;
  status: 'available' | 'partial' | 'full' | 'over';
}

interface AllocationSummaryPanelProps {
  employees: EmployeeSummary[];
  onEmployeeClick: (employeeId: string) => void;
  onReassign: (employeeId: string) => void;
}

export default function AllocationSummaryPanel({ 
  employees, 
  onEmployeeClick, 
  onReassign 
}: AllocationSummaryPanelProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'bg-green-100 text-green-800';
      case 'partial': return 'bg-yellow-100 text-yellow-800';
      case 'full': return 'bg-blue-100 text-blue-800';
      case 'over': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getUtilizationColor = (percentage: number) => {
    if (percentage > 100) return 'bg-red-500';
    if (percentage >= 80) return 'bg-blue-500';
    if (percentage >= 50) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getTrendIcon = (percentage: number) => {
    if (percentage > 100) return <TrendingUp className="w-4 h-4 text-red-500" />;
    if (percentage >= 80) return <TrendingUp className="w-4 h-4 text-blue-500" />;
    return <TrendingDown className="w-4 h-4 text-green-500" />;
  };

  const overAllocatedCount = employees.filter(emp => emp.status === 'over').length;
  const fullyAllocatedCount = employees.filter(emp => emp.status === 'full').length;
  const availableCount = employees.filter(emp => emp.status === 'available').length;
  const totalConflicts = employees.reduce((sum, emp) => sum + emp.conflicts, 0);

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Available</p>
                <p className="text-2xl font-bold text-green-600">{availableCount}</p>
              </div>
              <User className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Fully Allocated</p>
                <p className="text-2xl font-bold text-blue-600">{fullyAllocatedCount}</p>
              </div>
              <Clock className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Over-Allocated</p>
                <p className="text-2xl font-bold text-red-600">{overAllocatedCount}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Conflicts</p>
                <p className="text-2xl font-bold text-orange-600">{totalConflicts}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Employee List */}
      <Card>
        <CardHeader>
          <CardTitle>Employee Allocation Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {employees.map((employee) => (
              <div
                key={employee._id}
                className="p-4 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                onClick={() => onEmployeeClick(employee._id)}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarFallback>
                        {employee.name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h4 className="font-medium">{employee.name}</h4>
                      <p className="text-sm text-muted-foreground">
                        {employee.position}
                        {employee.department && ` • ${employee.department}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={getStatusColor(employee.status)}>
                      {employee.status.charAt(0).toUpperCase() + employee.status.slice(1)}
                    </Badge>
                    {employee.conflicts > 0 && (
                      <Badge variant="destructive">
                        {employee.conflicts} Conflicts
                      </Badge>
                    )}
                    {getTrendIcon(employee.utilizationPercentage)}
                  </div>
                </div>

                {/* Utilization Progress */}
                <div className="mb-3">
                  <div className="flex justify-between text-sm mb-1">
                    <span>Utilization</span>
                    <span className="font-medium">{employee.utilizationPercentage}%</span>
                  </div>
                  <Progress 
                    value={Math.min(employee.utilizationPercentage, 100)} 
                    className="h-2"
                  />
                  {employee.utilizationPercentage > 100 && (
                    <div className="text-xs text-red-600 mt-1">
                      Over-allocated by {employee.utilizationPercentage - 100}%
                    </div>
                  )}
                </div>

                {/* Hours Breakdown */}
                <div className="grid grid-cols-3 gap-4 text-sm mb-3">
                  <div>
                    <p className="text-muted-foreground">Total Hours</p>
                    <p className="font-medium">{employee.totalHours}h</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Booked Hours</p>
                    <p className="font-medium">{employee.bookedHours}h</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Free Hours</p>
                    <p className="font-medium">{employee.freeHours}h</p>
                  </div>
                </div>

                {/* Current Allocations */}
                {employee.allocations.length > 0 && (
                  <div className="mb-3">
                    <p className="text-sm font-medium mb-2">Current Allocations:</p>
                    <div className="flex flex-wrap gap-2">
                      {employee.allocations.map((alloc, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {alloc.project} ({alloc.hours}h) - {alloc.role}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation();
                      onEmployeeClick(employee._id);
                    }}
                  >
                    View Details
                  </Button>
                  {(employee.status === 'over' || employee.conflicts > 0) && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        onReassign(employee._id);
                      }}
                    >
                      Reassign
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}