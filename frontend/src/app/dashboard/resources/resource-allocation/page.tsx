"use client";

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PageLoader } from '@/components/PageLoader';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, Users, Clock, AlertCircle, CheckCircle, ArrowLeft, AlertTriangle } from 'lucide-react';
import { resourceApi } from '@/lib/api/resources';
import { getProjectsMinimal } from '@/lib/api/projectsAPI';
import type { CapacityPlan } from '@/types/resource';

const WEEKLY_CAPACITY_HOURS = 40;

interface MonthColumn {
  key: string;
  label: string;
  start: Date;
  end: Date;
}

const monthColumns = (timeRange: string): MonthColumn[] => {
  const now = new Date();
  const count = timeRange === '6months' ? 6 : timeRange === '1year' ? 12 : 3;

  return Array.from({ length: count }, (_, i) => {
    const start = new Date(now.getFullYear(), now.getMonth() + i, 1);
    const end = new Date(start.getFullYear(), start.getMonth() + 1, 0);
    return {
      key: `${start.getFullYear()}-${start.getMonth()}`,
      label: start.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
      start,
      end
    };
  });
};

const initialsOf = (name?: string): string =>
  (name || '').split(' ').slice(0, 2).map(p => p[0]).join('').toUpperCase();

export default function ResourceAllocationPage() {
  const router = useRouter();
  const [plans, setPlans] = useState<CapacityPlan[]>([]);
  const [activeProjectCount, setActiveProjectCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  const [timeRange, setTimeRange] = useState('3months');

  const months = useMemo(() => monthColumns(timeRange), [timeRange]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      // One capacity call covering the whole visible range. It returns every
      // active employee with their real allocations, bridging Employee -> User
      // server-side, so the months grid can be derived without inventing any of it.
      const [capacityResponse, projects] = await Promise.all([
        resourceApi.getCapacityPlanning({
          startDate: months[0].start.toISOString(),
          endDate: months[months.length - 1].end.toISOString()
        }),
        getProjectsMinimal().catch(() => [])
      ]);

      setPlans(Array.isArray(capacityResponse.data) ? capacityResponse.data : []);
      setActiveProjectCount(
        (Array.isArray(projects) ? projects : []).filter((p: any) => p.status === 'active').length
      );
      setError(null);
    } catch (err: any) {
      // Staffing decisions get made from this grid, so a failed load must show
      // as a failure rather than as an empty or invented schedule.
      console.error('Error fetching resource allocation data:', err);
      setPlans([]);
      setError(err?.response?.data?.message || err?.message || 'Could not load resource allocation data.');
    } finally {
      setLoading(false);
    }
  }, [months]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const departments = useMemo(
    () => [...new Set(plans.map(p => p.employee.department).filter((d): d is string => !!d && d.trim() !== ''))],
    [plans]
  );

  const visiblePlans = useMemo(
    () => plans.filter(p => selectedDepartment === 'all' || p.employee.department === selectedDepartment),
    [plans, selectedDepartment]
  );

  // Hours booked against a person in a given month, from their real allocations.
  const monthAllocations = (plan: CapacityPlan, month: MonthColumn) =>
    plan.allocations.filter(alloc => {
      const start = new Date(alloc.startDate);
      const end = new Date(alloc.endDate);
      return start <= month.end && end >= month.start;
    });

  const monthWorkload = (plan: CapacityPlan, month: MonthColumn): number => {
    const hours = monthAllocations(plan, month).reduce((sum, alloc) => sum + (alloc.hours || 0), 0);
    const capacity = plan.capacity || WEEKLY_CAPACITY_HOURS;
    return capacity > 0 ? Math.round((hours / capacity) * 100) : 0;
  };

  const currentMonth = months[0];
  const isFreeNow = (plan: CapacityPlan) => monthWorkload(plan, currentMonth) === 0;

  const getWorkloadColor = (workload: number) => {
    if (workload === 0) return 'bg-muted text-muted-foreground';
    if (workload <= 50) return 'bg-green-200 text-green-900 dark:bg-green-900/40 dark:text-green-200';
    if (workload <= 80) return 'bg-yellow-200 text-yellow-900 dark:bg-yellow-900/40 dark:text-yellow-200';
    if (workload <= 100) return 'bg-orange-200 text-orange-900 dark:bg-orange-900/40 dark:text-orange-200';
    return 'bg-red-200 text-red-900 dark:bg-red-900/40 dark:text-red-200';
  };

  if (loading) {
    return <PageLoader text="Loading resource allocation..." />;
  }

  const header = (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => router.push('/dashboard/employees')}>
          <ArrowLeft className="w-4 h-4 mr-2" /> Back
        </Button>
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
            Resource Allocation
          </h1>
          <p className="text-muted-foreground mt-1">Track employee workload and availability</p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="All Departments" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Departments</SelectItem>
            {departments.map(dept => (
              <SelectItem key={dept} value={dept}>{dept}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="3months">3 Months</SelectItem>
            <SelectItem value="6months">6 Months</SelectItem>
            <SelectItem value="1year">1 Year</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );

  if (error) {
    return (
      <div className="space-y-6">
        {header}
        <Card className="border-red-200 dark:border-red-900">
          <CardContent className="p-12 text-center space-y-3">
            <AlertTriangle className="h-8 w-8 mx-auto text-red-500" />
            <p className="font-medium">Resource data unavailable</p>
            <p className="text-sm text-muted-foreground">{error}</p>
            <Button variant="outline" onClick={fetchData}>Try again</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const freeNowCount = visiblePlans.filter(isFreeNow).length;
  const overallocatedCount = visiblePlans.filter(p => monthWorkload(p, currentMonth) > 100).length;

  return (
    <div className="space-y-6">
      {header}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="card-modern border-l-4 border-l-blue-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Employees</p>
                <p className="text-2xl font-bold tabular-nums">{visiblePlans.length}</p>
              </div>
              <Users className="h-6 w-6 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card className="card-modern border-l-4 border-l-green-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Free this month</p>
                <p className="text-2xl font-bold tabular-nums">{freeNowCount}</p>
              </div>
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card className="card-modern border-l-4 border-l-orange-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Overallocated</p>
                <p className="text-2xl font-bold tabular-nums">{overallocatedCount}</p>
              </div>
              <AlertCircle className="h-6 w-6 text-orange-600" />
            </div>
          </CardContent>
        </Card>
        <Card className="card-modern border-l-4 border-l-purple-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Projects</p>
                <p className="text-2xl font-bold tabular-nums">{activeProjectCount}</p>
              </div>
              <Calendar className="h-6 w-6 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="card-modern">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-primary" />
            Employee Workload Timeline
          </CardTitle>
        </CardHeader>
        <CardContent>
          {visiblePlans.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
              <p className="font-medium">No employees to show</p>
              <p className="text-sm text-muted-foreground mt-1">
                {selectedDepartment === 'all'
                  ? 'No active employee records were returned for this period.'
                  : `No active employees in ${selectedDepartment}.`}
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <div className="min-w-[800px]">
                  <div className="grid grid-cols-[200px_1fr] gap-4 mb-4">
                    <div className="font-semibold text-sm">Employee</div>
                    <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${months.length}, 1fr)` }}>
                      {months.map(month => (
                        <div key={month.key} className="text-center text-xs font-medium text-muted-foreground">
                          {month.label}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3">
                    {visiblePlans.map(plan => (
                      <div
                        key={plan.employee._id}
                        className="grid grid-cols-[200px_1fr] gap-4 items-center py-3 border-b border-border/50"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-8 h-8 bg-gradient-to-br from-primary/20 to-primary/10 rounded-lg flex items-center justify-center shrink-0">
                            <span className="text-primary font-semibold text-xs">
                              {initialsOf(plan.employee.name)}
                            </span>
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-sm truncate">{plan.employee.name}</p>
                            <p className="text-xs text-muted-foreground truncate">
                              {plan.employee.position || plan.employee.department || '—'}
                            </p>
                          </div>
                        </div>
                        <div
                          className="grid gap-2"
                          style={{ gridTemplateColumns: `repeat(${months.length}, 1fr)` }}
                        >
                          {months.map(month => {
                            const workload = monthWorkload(plan, month);
                            const allocations = monthAllocations(plan, month);
                            const projectNames = allocations
                              .map(a => (typeof a.project === 'object' ? a.project?.name : undefined))
                              .filter(Boolean)
                              .join(', ');

                            return (
                              <div
                                key={month.key}
                                className={`h-12 rounded-md flex items-center justify-center text-xs font-medium ${getWorkloadColor(workload)}`}
                                title={
                                  workload > 0
                                    ? `${month.label}: ${workload}%${projectNames ? ` — ${projectNames}` : ''}`
                                    : `${month.label}: free`
                                }
                              >
                                {workload > 0 ? `${workload}%` : 'Free'}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-6 flex flex-wrap items-center gap-6 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-muted rounded" />
                  <span>Free (0%)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-green-200 dark:bg-green-900/40 rounded" />
                  <span>Light (1–50%)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-yellow-200 dark:bg-yellow-900/40 rounded" />
                  <span>Moderate (51–80%)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-orange-200 dark:bg-orange-900/40 rounded" />
                  <span>Heavy (81–100%)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-red-200 dark:bg-red-900/40 rounded" />
                  <span>Over (&gt;100%)</span>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Card className="card-modern">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            Available Employees
          </CardTitle>
        </CardHeader>
        <CardContent>
          {freeNowCount === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
              <p className="text-muted-foreground">Everyone has work booked this month</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {visiblePlans.filter(isFreeNow).map(plan => (
                <Card
                  key={plan.employee._id}
                  role="button"
                  tabIndex={0}
                  className="hover:shadow-md transition-shadow cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                  onClick={() => router.push(`/dashboard/employees/${plan.employee._id}`)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      router.push(`/dashboard/employees/${plan.employee._id}`);
                    }
                  }}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-primary/20 to-primary/10 rounded-xl flex items-center justify-center shrink-0">
                        <span className="text-primary font-semibold">{initialsOf(plan.employee.name)}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold truncate">{plan.employee.name}</h3>
                        <p className="text-sm text-muted-foreground truncate">
                          {plan.employee.position || plan.employee.department || '—'}
                        </p>
                        <Badge variant="secondary" className="mt-1 bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-200">
                          Available
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
