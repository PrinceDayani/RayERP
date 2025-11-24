'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { AlertTriangle, Clock, Calendar, User, ArrowRight } from 'lucide-react';
import { format } from 'date-fns';

interface ConflictData {
  _id: string;
  employee: {
    _id: string;
    firstName: string;
    lastName: string;
    position: string;
  };
  conflicts: Array<{
    allocation1: {
      _id: string;
      project: { name: string };
      allocatedHours: number;
      startDate: string;
      endDate: string;
      role: string;
    };
    allocation2: {
      _id: string;
      project: { name: string };
      allocatedHours: number;
      startDate: string;
      endDate: string;
      role: string;
    };
    overlapDays: number;
    totalHours: number;
    conflictType: 'time_overlap' | 'over_allocation' | 'skill_mismatch';
    severity: 'low' | 'medium' | 'high' | 'critical';
  }>;
  totalConflicts: number;
  totalOverallocation: number;
}

interface ConflictDetectionProps {
  conflicts: ConflictData[];
  onResolveConflict: (conflictId: string, resolution: 'reassign' | 'adjust_hours' | 'reschedule') => void;
  onViewDetails: (employeeId: string) => void;
}

export default function ConflictDetection({ 
  conflicts, 
  onResolveConflict, 
  onViewDetails 
}: ConflictDetectionProps) {
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getConflictTypeIcon = (type: string) => {
    switch (type) {
      case 'time_overlap': return <Calendar className="w-4 h-4" />;
      case 'over_allocation': return <Clock className="w-4 h-4" />;
      case 'skill_mismatch': return <User className="w-4 h-4" />;
      default: return <AlertTriangle className="w-4 h-4" />;
    }
  };

  const getConflictTypeLabel = (type: string) => {
    switch (type) {
      case 'time_overlap': return 'Time Overlap';
      case 'over_allocation': return 'Over Allocation';
      case 'skill_mismatch': return 'Skill Mismatch';
      default: return 'Unknown';
    }
  };

  const totalConflicts = conflicts.reduce((sum, emp) => sum + emp.totalConflicts, 0);
  const criticalConflicts = conflicts.filter(emp => 
    emp.conflicts.some(c => c.severity === 'critical')
  ).length;

  if (conflicts.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-600">
            <AlertTriangle className="w-5 h-5" />
            No Conflicts Detected
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            All resource allocations are properly scheduled without conflicts.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Alert */}
      <Alert className="border-orange-200 bg-orange-50">
        <AlertTriangle className="h-4 w-4 text-orange-600" />
        <AlertDescription className="text-orange-800">
          <strong>{totalConflicts} conflicts detected</strong> across {conflicts.length} employees.
          {criticalConflicts > 0 && (
            <span className="ml-2 font-medium text-red-600">
              {criticalConflicts} critical conflicts require immediate attention.
            </span>
          )}
        </AlertDescription>
      </Alert>

      {/* Conflicts List */}
      <div className="space-y-4">
        {conflicts.map((employeeConflict) => (
          <Card key={employeeConflict._id} className="border-l-4 border-l-orange-500">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarFallback>
                      {employeeConflict.employee.firstName[0]}{employeeConflict.employee.lastName[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle className="text-lg">
                      {employeeConflict.employee.firstName} {employeeConflict.employee.lastName}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      {employeeConflict.employee.position}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="destructive">
                    {employeeConflict.totalConflicts} Conflicts
                  </Badge>
                  {employeeConflict.totalOverallocation > 0 && (
                    <Badge variant="outline" className="text-red-600">
                      +{employeeConflict.totalOverallocation}h Over
                    </Badge>
                  )}
                </div>
              </div>
            </CardHeader>

            <CardContent>
              <div className="space-y-4">
                {employeeConflict.conflicts.map((conflict, index) => (
                  <div key={index} className="p-4 border rounded-lg bg-muted/30">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        {getConflictTypeIcon(conflict.conflictType)}
                        <span className="font-medium">
                          {getConflictTypeLabel(conflict.conflictType)}
                        </span>
                        <Badge className={getSeverityColor(conflict.severity)}>
                          {conflict.severity.toUpperCase()}
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {conflict.overlapDays} days overlap
                      </div>
                    </div>

                    {/* Conflicting Allocations */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div className="p-3 border rounded bg-white">
                        <h5 className="font-medium text-sm mb-2">
                          {conflict.allocation1.project.name}
                        </h5>
                        <div className="space-y-1 text-xs text-muted-foreground">
                          <div>Role: {conflict.allocation1.role}</div>
                          <div>Hours: {conflict.allocation1.allocatedHours}h/week</div>
                          <div>
                            {format(new Date(conflict.allocation1.startDate), 'MMM dd')} - {' '}
                            {format(new Date(conflict.allocation1.endDate), 'MMM dd, yyyy')}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-center">
                        <ArrowRight className="w-4 h-4 text-muted-foreground" />
                      </div>

                      <div className="p-3 border rounded bg-white">
                        <h5 className="font-medium text-sm mb-2">
                          {conflict.allocation2.project.name}
                        </h5>
                        <div className="space-y-1 text-xs text-muted-foreground">
                          <div>Role: {conflict.allocation2.role}</div>
                          <div>Hours: {conflict.allocation2.allocatedHours}h/week</div>
                          <div>
                            {format(new Date(conflict.allocation2.startDate), 'MMM dd')} - {' '}
                            {format(new Date(conflict.allocation2.endDate), 'MMM dd, yyyy')}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Conflict Details */}
                    <div className="p-3 bg-red-50 border border-red-200 rounded mb-4">
                      <div className="text-sm">
                        <strong>Conflict Details:</strong> Total {conflict.totalHours} hours 
                        allocated during overlapping period. This exceeds the standard 40-hour 
                        work week by {Math.max(0, conflict.totalHours - 40)} hours.
                      </div>
                    </div>

                    {/* Resolution Actions */}
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onResolveConflict(conflict.allocation1._id, 'reassign')}
                      >
                        Reassign Resource
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onResolveConflict(conflict.allocation1._id, 'adjust_hours')}
                      >
                        Adjust Hours
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onResolveConflict(conflict.allocation1._id, 'reschedule')}
                      >
                        Reschedule
                      </Button>
                    </div>
                  </div>
                ))}

                {/* Employee Actions */}
                <div className="flex justify-end pt-4 border-t">
                  <Button
                    variant="outline"
                    onClick={() => onViewDetails(employeeConflict.employee._id)}
                  >
                    View Employee Details
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}