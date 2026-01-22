"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PageLoader } from '@/components/PageLoader';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, Users, Clock, AlertCircle, CheckCircle, ArrowLeft } from 'lucide-react';
import { employeesAPI } from '@/lib/api/employeesAPI';
import { getAllProjects } from '@/lib/api/projectsAPI';
import { resourceApi } from '@/lib/api/resources';

interface Employee {
  _id: string;
  firstName: string;
  lastName: string;
  department: string;
  position: string;
  status: string;
}

interface Project {
  _id: string;
  name: string;
  startDate: string;
  endDate: string;
  status: string;
}

interface ResourceAllocation {
  _id: string;
  employee: Employee;
  project: Project;
  startDate: string;
  endDate: string;
  allocation: number;
  role: string;
}

export default function ResourceAllocationPage() {
  const router = useRouter();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [allocations, setAllocations] = useState<ResourceAllocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  const [timeRange, setTimeRange] = useState('3months');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [employeesData, projectsData] = await Promise.all([
        employeesAPI.getAll(),
        getAllProjects()
      ]);

      console.log('Fetched data:', { employeesData, projectsData });

      const employees = Array.isArray(employeesData) ? employeesData : employeesData?.data || [];
      const projects = projectsData || [];

      // Create allocations from project team assignments
      const projectAllocations = [];
      projects.forEach(project => {
        if (project.team && project.team.length > 0) {
          project.team.forEach(teamMember => {
            let employeeId, employee;
            if (typeof teamMember === 'string') {
              employeeId = teamMember;
              employee = employees.find(emp => emp._id === employeeId);
            } else if (teamMember._id) {
              employeeId = teamMember._id;
              employee = teamMember;
            } else {
              return;
            }

            if (employee || employeeId) {
              projectAllocations.push({
                _id: `${project._id}-${employeeId}`,
                employee: employee || { _id: employeeId, firstName: 'Unknown', lastName: 'Employee' },
                project: project,
                startDate: project.startDate || new Date().toISOString(),
                endDate: project.endDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
                allocation: 50,
                role: 'Team Member'
              });
            }
          });
        }
      });

      console.log('Created project allocations:', projectAllocations);
      setEmployees(employees);
      setProjects(projects);
      setAllocations(projectAllocations);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTimeRangeMonths = () => {
    const now = new Date();
    const months = [];
    const monthCount = timeRange === '6months' ? 6 : timeRange === '1year' ? 12 : 3;
    
    for (let i = 0; i < monthCount; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() + i, 1);
      months.push({
        key: `${date.getFullYear()}-${date.getMonth()}`,
        label: date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        date
      });
    }
    return months;
  };

  const getEmployeeAllocations = (employeeId: string) => {
    return allocations.filter(alloc => {
      const empId = typeof alloc.employee === 'object' ? alloc.employee._id : alloc.employee;
      return empId === employeeId;
    });
  };

  const isEmployeeBusy = (employeeId: string, month: Date) => {
    const empAllocations = getEmployeeAllocations(employeeId);
    return empAllocations.some(alloc => {
      const start = new Date(alloc.startDate);
      const end = new Date(alloc.endDate);
      const monthStart = new Date(month.getFullYear(), month.getMonth(), 1);
      const monthEnd = new Date(month.getFullYear(), month.getMonth() + 1, 0);
      return start <= monthEnd && end >= monthStart;
    });
  };

  const getEmployeeWorkload = (employeeId: string, month: Date) => {
    const empAllocations = getEmployeeAllocations(employeeId);
    let totalAllocation = 0;
    
    empAllocations.forEach(alloc => {
      const start = new Date(alloc.startDate);
      const end = new Date(alloc.endDate);
      const monthStart = new Date(month.getFullYear(), month.getMonth(), 1);
      const monthEnd = new Date(month.getFullYear(), month.getMonth() + 1, 0);
      if (start <= monthEnd && end >= monthStart) {
        totalAllocation += alloc.allocation || 50; // Default 50% if not specified
      }
    });
    
    return Math.min(totalAllocation, 100);
  };

  const getWorkloadColor = (workload: number) => {
    if (workload === 0) return 'bg-gray-200 text-gray-700';
    if (workload <= 50) return 'bg-green-200 text-green-800';
    if (workload <= 80) return 'bg-yellow-200 text-yellow-800';
    return 'bg-red-200 text-red-800';
  };

  const filteredEmployees = employees.filter(emp => 
    selectedDepartment === 'all' || emp.department === selectedDepartment
  );

  const departments = [...new Set(employees.map(emp => emp.department))];
  const months = getTimeRangeMonths();

  if (loading) {
    return <PageLoader text="Loading resource allocation..." />;
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
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
              {departments.filter(dept => dept && dept.trim() !== '').map(dept => (
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

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="card-modern border-l-4 border-l-blue-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Employees</p>
                <p className="text-2xl font-bold">{filteredEmployees.length}</p>
              </div>
              <Users className="h-6 w-6 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card className="card-modern border-l-4 border-l-green-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Available Now</p>
                <p className="text-2xl font-bold">
                  {filteredEmployees.filter(emp => !isEmployeeBusy(emp._id, new Date())).length}
                </p>
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
                <p className="text-2xl font-bold">
                  {filteredEmployees.filter(emp => getEmployeeWorkload(emp._id, new Date()) > 100).length}
                </p>
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
                <p className="text-2xl font-bold">{projects.filter(p => p.status === 'active').length}</p>
              </div>
              <Calendar className="h-6 w-6 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Resource Allocation Chart */}
      <Card className="card-modern">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-primary" />
            Employee Workload Timeline
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <div className="min-w-[800px]">
              {/* Header */}
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

              {/* Employee Rows */}
              <div className="space-y-3">
                {filteredEmployees.map(employee => (
                  <div key={employee._id} className="grid grid-cols-[200px_1fr] gap-4 items-center py-3 border-b border-border/50">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gradient-to-br from-primary/20 to-primary/10 rounded-lg flex items-center justify-center">
                        <span className="text-primary font-semibold text-xs">
                          {employee.firstName.charAt(0)}{employee.lastName.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-sm">{employee.firstName} {employee.lastName}</p>
                        <p className="text-xs text-muted-foreground">{employee.position}</p>
                      </div>
                    </div>
                    <div className="relative h-12 bg-gray-100 rounded-lg overflow-hidden">
                      {months.map(month => {
                        const workload = getEmployeeWorkload(employee._id, month.date);
                        const empAllocations = getEmployeeAllocations(employee._id).filter(alloc => {
                          const start = new Date(alloc.startDate);
                          const end = new Date(alloc.endDate);
                          const monthStart = new Date(month.date.getFullYear(), month.date.getMonth(), 1);
                          const monthEnd = new Date(month.date.getFullYear(), month.date.getMonth() + 1, 0);
                          return start <= monthEnd && end >= monthStart;
                        });
                        const widthPercent = 100 / months.length;
                        const leftPercent = (months.indexOf(month) * widthPercent);

                        return (
                          <div 
                            key={month.key} 
                            className={`absolute h-full flex items-center justify-center text-xs font-medium ${getWorkloadColor(workload)}`}
                            style={{ 
                              left: `${leftPercent}%`, 
                              width: `${widthPercent}%`,
                              borderRight: months.indexOf(month) < months.length - 1 ? '1px solid rgba(0,0,0,0.1)' : 'none'
                            }}
                            title={`${month.label}: ${workload > 0 ? `${workload}%` : 'Free'}${empAllocations.length > 0 ? ` - ${empAllocations.map(a => {
                              const projectName = typeof a.project === 'object' ? a.project.name : 'Unknown Project';
                              return projectName;
                            }).join(', ')}` : ''}`}
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

          {/* Legend */}
          <div className="mt-6 flex items-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-gray-200 rounded"></div>
              <span>Free (0%)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-200 rounded"></div>
              <span>Light (1-50%)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-yellow-200 rounded"></div>
              <span>Moderate (51-80%)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-red-200 rounded"></div>
              <span>Heavy (81-100%)</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Available Employees */}
      <Card className="card-modern">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            Available Employees
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredEmployees
              .filter(emp => !isEmployeeBusy(emp._id, new Date()))
              .map(employee => (
                <Card key={employee._id} className="hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => router.push(`/dashboard/employees/${employee._id}`)}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-primary/20 to-primary/10 rounded-xl flex items-center justify-center">
                        <span className="text-primary font-semibold">
                          {employee.firstName.charAt(0)}{employee.lastName.charAt(0)}
                        </span>
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold">{employee.firstName} {employee.lastName}</h3>
                        <p className="text-sm text-muted-foreground">{employee.position}</p>
                        <Badge variant="secondary" className="mt-1 bg-green-100 text-green-800">
                          Available
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>
          {filteredEmployees.filter(emp => !isEmployeeBusy(emp._id, new Date())).length === 0 && (
            <div className="text-center py-8">
              <Users className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
              <p className="text-muted-foreground">All employees are currently assigned to projects</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}