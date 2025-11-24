'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { resourceApi } from '@/lib/api/resources';
import { employeesAPI } from '@/lib/api/employeesAPI';
import { projectsAPI } from '@/lib/api/projectsAPI';
import { departmentApi } from '@/lib/api/departments';
import ResourceAllocationForm from '@/components/resources/ResourceAllocationForm';
import CapacityPlanningView from '@/components/resources/CapacityPlanningView';
import EnhancedSkillMatrix from '@/components/resources/EnhancedSkillMatrix';
import ResourceAllocationCalendar from '@/components/resources/ResourceAllocationCalendar';
import AllocationFilters from '@/components/resources/AllocationFilters';
import AllocationSummaryPanel from '@/components/resources/AllocationSummaryPanel';
import ConflictDetection from '@/components/resources/ConflictDetection';
import ResourceGanttChart from '@/components/resources/ResourceGanttChart';
import InlineAllocationEditor from '@/components/resources/InlineAllocationEditor';
import ExportAllocationData from '@/components/resources/ExportAllocationData';
import ProjectSkillMatchView from '@/components/resources/ProjectSkillMatchView';
import { Plus, AlertTriangle, Calendar, BarChart3, Users } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

export default function ResourceManagementPage() {
  const [showForm, setShowForm] = useState(false);
  const [allocations, setAllocations] = useState<any[]>([]);
  const [capacityData, setCapacityData] = useState<any[]>([]);
  const [skillMatrix, setSkillMatrix] = useState<{ matrix: any[]; allSkills: any[] }>({ matrix: [], allSkills: [] });
  const [employees, setEmployees] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [conflicts, setConflicts] = useState<any[]>([]);
  const [ganttTasks, setGanttTasks] = useState<any[]>([]);
  const [employeeSummary, setEmployeeSummary] = useState<any[]>([]);
  const [editingAllocation, setEditingAllocation] = useState<any>(null);
  const [activeFilters, setActiveFilters] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [projectMatches, setProjectMatches] = useState<any[]>([]);
  const [loadingMatches, setLoadingMatches] = useState(false);

  useEffect(() => {
    loadData();
    loadEmployeesAndProjects();
    loadDepartments();
  }, []);

  useEffect(() => {
    if (allocations.length > 0) {
      detectConflicts();
      generateEmployeeSummary();
      generateGanttData();
    }
  }, [allocations]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [allocRes, capacityRes, skillRes] = await Promise.all([
        resourceApi.getResourceAllocations(activeFilters),
        resourceApi.getCapacityPlanning({ 
          startDate: new Date().toISOString(), 
          endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() 
        }),
        resourceApi.getSkillMatrix()
      ]);
      setAllocations(allocRes?.data || []);
      setCapacityData(capacityRes?.data || []);
      setSkillMatrix(skillRes?.data || { matrix: [], allSkills: [] });
    } catch (error) {
      console.error('Failed to load resource data:', error);
      toast({ title: 'Error', description: 'Failed to load resource data', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const loadEmployeesAndProjects = async () => {
    try {
      const [empRes, projRes] = await Promise.all([
        employeesAPI.getAll({ status: 'active' }),
        projectsAPI.getAll({ status: 'active' })
      ]);
      setEmployees(Array.isArray(empRes?.data) ? empRes.data : Array.isArray(empRes) ? empRes : []);
      setProjects(Array.isArray(projRes?.data) ? projRes.data : Array.isArray(projRes) ? projRes : []);
    } catch (error) {
      console.error('Failed to load employees and projects:', error);
      setEmployees([]);
      setProjects([]);
    }
  };

  const loadProjectMatches = async (projectId: string) => {
    if (!projectId) {
      setProjectMatches([]);
      return;
    }
    
    try {
      setLoadingMatches(true);
      const response = await resourceApi.getProjectSkillMatch(projectId);
      setProjectMatches(response?.data || []);
    } catch (error) {
      console.error('Failed to load project matches:', error);
      setProjectMatches([]);
      toast({ title: 'Error', description: 'Failed to load project skill matches', variant: 'destructive' });
    } finally {
      setLoadingMatches(false);
    }
  };

  const loadDepartments = async () => {
    try {
      const deptRes = await departmentApi.getAll();
      setDepartments(Array.isArray(deptRes?.data) ? deptRes.data : []);
    } catch (error) {
      console.error('Failed to load departments:', error);
      setDepartments([]);
    }
  };

  const detectConflicts = async () => {
    try {
      const conflictPromises = employees.map(emp => 
        resourceApi.detectResourceConflicts({
          employeeId: emp._id,
          startDate: new Date().toISOString(),
          endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString()
        })
      );
      const conflictResults = await Promise.all(conflictPromises);
      const detectedConflicts = conflictResults
        .map((result, index) => ({ ...result.data, employee: employees[index] }))
        .filter(conflict => conflict.hasConflict);
      setConflicts(detectedConflicts);
    } catch (error) {
      console.error('Failed to detect conflicts:', error);
    }
  };

  const generateEmployeeSummary = () => {
    const summary = employees.map(emp => {
      const empAllocations = allocations.filter(alloc => alloc.employee._id === emp._id);
      const totalHours = 40; // Standard work week
      const bookedHours = empAllocations.reduce((sum, alloc) => sum + alloc.allocatedHours, 0);
      const utilizationPercentage = Math.round((bookedHours / totalHours) * 100);
      
      let status = 'available';
      if (utilizationPercentage > 100) status = 'over';
      else if (utilizationPercentage >= 80) status = 'full';
      else if (utilizationPercentage > 0) status = 'partial';

      return {
        _id: emp._id,
        name: `${emp.firstName} ${emp.lastName}`,
        position: emp.position,
        department: emp.department?.name,
        totalHours,
        bookedHours,
        freeHours: Math.max(0, totalHours - bookedHours),
        utilizationPercentage,
        allocations: empAllocations.map(alloc => ({
          project: alloc.project.name,
          hours: alloc.allocatedHours,
          role: alloc.role
        })),
        conflicts: conflicts.filter(c => c.employee._id === emp._id).length,
        status
      };
    });
    setEmployeeSummary(summary);
  };

  const generateGanttData = () => {
    const tasks = projects.map(project => {
      const projectAllocations = allocations.filter(alloc => alloc.project._id === project._id);
      return {
        _id: project._id,
        name: project.name,
        startDate: project.startDate || new Date().toISOString(),
        endDate: project.endDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        progress: project.progress || 0,
        resources: projectAllocations.map(alloc => ({
          employee: alloc.employee,
          allocatedHours: alloc.allocatedHours,
          role: alloc.role
        })),
        dependencies: [],
        status: project.status || 'in_progress',
        project: { _id: project._id, name: project.name, color: project.color }
      };
    });
    setGanttTasks(tasks);
  };

  const handleAllocate = async (data: any) => {
    try {
      await resourceApi.allocateResource(data);
      setShowForm(false);
      loadData();
      toast({ title: 'Success', description: 'Resource allocated successfully' });
    } catch (error) {
      console.error('Failed to allocate resource:', error);
      toast({ title: 'Error', description: 'Failed to allocate resource', variant: 'destructive' });
    }
  };

  const handleDragDrop = async (allocation: any, newDate: Date, newEmployeeId: string) => {
    try {
      await resourceApi.updateResourceAllocation(allocation._id, {
        employee: newEmployeeId as any,
        startDate: newDate.toISOString()
      });
      loadData();
      toast({ title: 'Success', description: 'Allocation updated successfully' });
    } catch (error) {
      console.error('Failed to update allocation:', error);
      toast({ title: 'Error', description: 'Failed to update allocation', variant: 'destructive' });
    }
  };

  const handleEditAllocation = (allocation: any) => {
    setEditingAllocation(allocation);
  };

  const handleSaveAllocation = async (updatedAllocation: any) => {
    try {
      await resourceApi.updateResourceAllocation(updatedAllocation._id, updatedAllocation);
      setEditingAllocation(null);
      loadData();
      toast({ title: 'Success', description: 'Allocation updated successfully' });
    } catch (error) {
      console.error('Failed to update allocation:', error);
      toast({ title: 'Error', description: 'Failed to update allocation', variant: 'destructive' });
    }
  };

  const handleResolveConflict = async (conflictId: string, resolution: string) => {
    // Implementation for conflict resolution
    toast({ title: 'Info', description: `Conflict resolution: ${resolution}` });
  };

  const handleExport = async (options: any) => {
    try {
      // Implementation for export functionality
      toast({ title: 'Success', description: `Data exported as ${options.format.toUpperCase()}` });
    } catch (error) {
      console.error('Export failed:', error);
      toast({ title: 'Error', description: 'Export failed', variant: 'destructive' });
    }
  };

  const filterOptions = {
    projects,
    employees,
    departments,
    roles: [...new Set(allocations.map(a => a.role))]
  };

  const conflictCount = conflicts.reduce((sum, c) => sum + c.totalConflicts, 0);
  const overAllocatedCount = employeeSummary.filter(emp => emp.status === 'over').length;

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Resource Management</h1>
          <div className="flex items-center gap-4 mt-2">
            {conflictCount > 0 && (
              <Badge variant="destructive" className="flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />
                {conflictCount} Conflicts
              </Badge>
            )}
            {overAllocatedCount > 0 && (
              <Badge variant="outline" className="text-orange-600">
                {overAllocatedCount} Over-allocated
              </Badge>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <ExportAllocationData
            onExport={handleExport}
            departments={departments}
            projects={projects}
            employees={employees}
          />
          <Button onClick={() => setShowForm(!showForm)}>
            <Plus className="w-4 h-4 mr-2" />
            Allocate Resource
          </Button>
        </div>
      </div>

      {/* Filters */}
      <AllocationFilters
        filters={filterOptions}
        onFilterChange={(filters) => {
          setActiveFilters(filters);
          loadData();
        }}
        activeFilters={activeFilters}
      />

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>New Resource Allocation</CardTitle>
          </CardHeader>
          <CardContent>
            <ResourceAllocationForm
              employees={employees}
              projects={projects}
              onSubmit={handleAllocate}
              onCancel={() => setShowForm(false)}
            />
          </CardContent>
        </Card>
      )}

      {editingAllocation && (
        <InlineAllocationEditor
          allocation={editingAllocation}
          employees={employees}
          projects={projects}
          onSave={handleSaveAllocation}
          onCancel={() => setEditingAllocation(null)}
          onDelete={async () => {
            try {
              await resourceApi.deleteResourceAllocation(editingAllocation._id);
              setEditingAllocation(null);
              loadData();
              toast({ title: 'Success', description: 'Allocation deleted successfully' });
            } catch (error) {
              toast({ title: 'Error', description: 'Failed to delete allocation', variant: 'destructive' });
            }
          }}
        />
      )}

      {/* Conflicts Alert */}
      {conflicts.length > 0 && (
        <ConflictDetection
          conflicts={conflicts}
          onResolveConflict={handleResolveConflict}
          onViewDetails={(employeeId) => {
            // Navigate to employee details
          }}
        />
      )}

      <Tabs defaultValue="capacity" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="capacity" className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Capacity
          </TabsTrigger>
          <TabsTrigger value="skills" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            Skill Matrix
          </TabsTrigger>
          <TabsTrigger value="match" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            Project Match
          </TabsTrigger>
          <TabsTrigger value="allocation" className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            Allocation
          </TabsTrigger>
        </TabsList>

        <TabsContent value="capacity">
          <div className="space-y-6">
            <CapacityPlanningView data={capacityData} />
            <AllocationSummaryPanel
              employees={employeeSummary}
              onEmployeeClick={(employeeId) => {
                // Navigate to employee details
              }}
              onReassign={(employeeId) => {
                // Open reassignment dialog
              }}
            />
          </div>
        </TabsContent>

        <TabsContent value="skills">
          <EnhancedSkillMatrix matrix={skillMatrix.matrix} allSkills={skillMatrix.allSkills} />
        </TabsContent>

        <TabsContent value="match">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Project Skill Matching</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <label className="text-sm font-medium">Select Project:</label>
                    <Select 
                      value={selectedProject} 
                      onValueChange={(value) => {
                        setSelectedProject(value);
                        if (value) {
                          setLoadingMatches(true);
                          loadProjectMatches(value);
                        } else {
                          setProjectMatches([]);
                        }
                      }}
                      disabled={projects.length === 0}
                    >
                      <SelectTrigger className="min-w-[200px]">
                        <SelectValue placeholder={projects.length === 0 ? "No projects available" : "Choose a project..."} />
                      </SelectTrigger>
                      <SelectContent>
                        {projects.map((project) => (
                          <SelectItem key={project._id} value={project._id}>
                            {project.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {loadingMatches && (
                    <div className="text-center py-4">
                      <div className="text-sm text-muted-foreground">Loading project matches...</div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
            {selectedProject && projectMatches.length > 0 && (
              <ProjectSkillMatchView matches={projectMatches} />
            )}
            {selectedProject && !loadingMatches && projectMatches.length === 0 && (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center py-8 text-muted-foreground">
                    No skill matching data available for this project. The project may not have required skills defined.
                  </div>
                </CardContent>
              </Card>
            )}
            {!selectedProject && (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center py-8 text-muted-foreground">
                    Select a project above to analyze skill matching for team members.
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="allocation">
          <div className="space-y-6">
            <Tabs defaultValue="calendar" className="space-y-4">
              <TabsList>
                <TabsTrigger value="calendar">Calendar View</TabsTrigger>
                <TabsTrigger value="gantt">Gantt Chart</TabsTrigger>
                <TabsTrigger value="list">List View</TabsTrigger>
              </TabsList>

              <TabsContent value="calendar">
                <ResourceAllocationCalendar
                  allocations={allocations}
                  onDragDrop={handleDragDrop}
                  onEditAllocation={handleEditAllocation}
                />
              </TabsContent>

              <TabsContent value="gantt">
                <ResourceGanttChart
                  tasks={ganttTasks}
                  onTaskClick={(taskId) => {
                    // Navigate to task details
                  }}
                  onResourceClick={(employeeId) => {
                    // Navigate to employee details
                  }}
                  onExport={() => handleExport({ format: 'pdf' })}
                />
              </TabsContent>

              <TabsContent value="list">
                <Card>
                  <CardHeader>
                    <CardTitle>Resource Allocations</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {allocations.map((alloc: any) => (
                        <div 
                          key={alloc._id} 
                          className="p-4 border rounded hover:bg-muted/50 cursor-pointer transition-colors"
                          onClick={() => handleEditAllocation(alloc)}
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <div className="font-medium">{alloc.employee?.firstName} {alloc.employee?.lastName}</div>
                              <div className="text-sm text-muted-foreground">{alloc.project?.name}</div>
                              <div className="text-xs text-muted-foreground mt-1">
                                {new Date(alloc.startDate).toLocaleDateString()} - {new Date(alloc.endDate).toLocaleDateString()}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="font-medium">{alloc.allocatedHours}h/week</div>
                              <div className="text-sm text-muted-foreground">{alloc.role}</div>
                              <Badge variant={alloc.allocatedHours > 40 ? 'destructive' : 'secondary'} className="mt-1">
                                {Math.round((alloc.allocatedHours / 40) * 100)}%
                              </Badge>
                            </div>
                          </div>
                        </div>
                      ))}
                      {allocations.length === 0 && (
                        <div className="text-center py-8 text-muted-foreground">
                          No allocations found. Create your first allocation above.
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
