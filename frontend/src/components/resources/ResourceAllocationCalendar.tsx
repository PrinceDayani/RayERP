'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, ChevronLeft, ChevronRight, Users, Clock, AlertTriangle } from 'lucide-react';
import { format, startOfWeek, endOfWeek, eachDayOfInterval, addWeeks, subWeeks, startOfMonth, endOfMonth, eachWeekOfInterval } from 'date-fns';

interface AllocationData {
  _id: string;
  employee: { _id: string; firstName: string; lastName: string; position: string };
  project: { _id: string; name: string };
  allocatedHours: number;
  startDate: string;
  endDate: string;
  role: string;
  status: 'available' | 'partial' | 'full' | 'over';
}

interface ResourceAllocationCalendarProps {
  allocations: AllocationData[];
  onDragDrop: (allocation: AllocationData, newDate: Date, newEmployee: string) => void;
  onEditAllocation: (allocation: AllocationData) => void;
}

export default function ResourceAllocationCalendar({ 
  allocations, 
  onDragDrop, 
  onEditAllocation 
}: ResourceAllocationCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewType, setViewType] = useState<'week' | 'month'>('week');
  const [draggedItem, setDraggedItem] = useState<AllocationData | null>(null);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'bg-green-100 text-green-800 border-green-200';
      case 'partial': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'full': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'over': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getUtilizationPercentage = (employeeId: string, date: Date) => {
    const dayAllocations = allocations.filter(alloc => 
      alloc.employee._id === employeeId &&
      new Date(alloc.startDate) <= date &&
      new Date(alloc.endDate) >= date
    );
    
    const totalHours = dayAllocations.reduce((sum, alloc) => sum + (alloc.allocatedHours / 5), 0); // Assuming 5-day work week
    return Math.min(Math.round((totalHours / 8) * 100), 150); // Max 150% for over-allocation
  };

  const getStatusFromUtilization = (percentage: number) => {
    if (percentage === 0) return 'available';
    if (percentage < 80) return 'partial';
    if (percentage <= 100) return 'full';
    return 'over';
  };

  const renderWeekView = () => {
    const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });
    const days = eachDayOfInterval({ start: weekStart, end: weekEnd });
    
    const employees = [...new Set(allocations.map(a => a.employee._id))].map(id => 
      allocations.find(a => a.employee._id === id)?.employee
    ).filter(Boolean);

    return (
      <div className="grid grid-cols-8 gap-1 text-sm">
        <div className="p-2 font-medium">Employee</div>
        {days.map(day => (
          <div key={day.toISOString()} className="p-2 font-medium text-center border-b">
            <div>{format(day, 'EEE')}</div>
            <div className="text-xs text-muted-foreground">{format(day, 'dd')}</div>
          </div>
        ))}
        
        {employees.map(employee => (
          <div key={employee?._id} className="contents">
            <div className="p-2 border-r bg-muted/50">
              <div className="font-medium">{employee?.firstName} {employee?.lastName}</div>
              <div className="text-xs text-muted-foreground">{employee?.position}</div>
            </div>
            {days.map(day => {
              const utilization = getUtilizationPercentage(employee?._id || '', day);
              const status = getStatusFromUtilization(utilization);
              const dayAllocations = allocations.filter(alloc => 
                alloc.employee._id === employee?._id &&
                new Date(alloc.startDate) <= day &&
                new Date(alloc.endDate) >= day
              );

              return (
                <div
                  key={`${employee?._id}-${day.toISOString()}`}
                  className={`p-1 min-h-[80px] border ${getStatusColor(status)} relative`}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    if (draggedItem && employee?._id) {
                      onDragDrop(draggedItem, day, employee._id);
                    }
                    setDraggedItem(null);
                  }}
                >
                  <div className="text-xs font-medium mb-1">{utilization}%</div>
                  {dayAllocations.map(alloc => (
                    <div
                      key={alloc._id}
                      draggable
                      onDragStart={() => setDraggedItem(alloc)}
                      onClick={() => onEditAllocation(alloc)}
                      className="text-xs p-1 mb-1 bg-white/80 rounded cursor-move hover:bg-white"
                    >
                      <div className="font-medium truncate">{alloc.project.name}</div>
                      <div className="text-muted-foreground">{alloc.allocatedHours/5}h</div>
                    </div>
                  ))}
                  {status === 'over' && (
                    <AlertTriangle className="absolute top-1 right-1 w-3 h-3 text-red-500" />
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    );
  };

  const renderMonthView = () => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const weeks = eachWeekOfInterval({ start: monthStart, end: monthEnd }, { weekStartsOn: 1 });
    
    return (
      <div className="grid grid-cols-7 gap-1">
        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
          <div key={day} className="p-2 font-medium text-center border-b">
            {day}
          </div>
        ))}
        
        {weeks.map(weekStart => {
          const weekDays = eachDayOfInterval({ 
            start: weekStart, 
            end: endOfWeek(weekStart, { weekStartsOn: 1 }) 
          });
          
          return weekDays.map(day => {
            const dayAllocations = allocations.filter(alloc => 
              new Date(alloc.startDate) <= day && new Date(alloc.endDate) >= day
            );
            
            const totalUtilization = dayAllocations.reduce((sum, alloc) => {
              const empUtil = getUtilizationPercentage(alloc.employee._id, day);
              return Math.max(sum, empUtil);
            }, 0);
            
            const status = getStatusFromUtilization(totalUtilization);
            
            return (
              <div
                key={day.toISOString()}
                className={`p-2 min-h-[100px] border ${getStatusColor(status)}`}
              >
                <div className="font-medium text-sm">{format(day, 'd')}</div>
                <div className="text-xs mt-1">
                  {dayAllocations.length > 0 && (
                    <div className="flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      <span>{dayAllocations.length}</span>
                    </div>
                  )}
                </div>
              </div>
            );
          });
        })}
      </div>
    );
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Resource Allocation Calendar
          </CardTitle>
          <div className="flex items-center gap-2">
            <Select value={viewType} onValueChange={(v: 'week' | 'month') => setViewType(v)}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="week">Week View</SelectItem>
                <SelectItem value="month">Month View</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentDate(viewType === 'week' ? subWeeks(currentDate, 1) : new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="font-medium min-w-[120px] text-center">
              {viewType === 'week' 
                ? `Week of ${format(startOfWeek(currentDate, { weekStartsOn: 1 }), 'MMM dd, yyyy')}`
                : format(currentDate, 'MMMM yyyy')
              }
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentDate(viewType === 'week' ? addWeeks(currentDate, 1) : new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
        
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-200 rounded"></div>
            <span>Available</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-yellow-200 rounded"></div>
            <span>Partially Allocated</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-200 rounded"></div>
            <span>Fully Allocated</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-200 rounded"></div>
            <span>Over-Allocated</span>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        {viewType === 'week' ? renderWeekView() : renderMonthView()}
      </CardContent>
    </Card>
  );
}