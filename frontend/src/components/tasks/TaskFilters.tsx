'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Filter, Download, Trash2 } from 'lucide-react';
import { useTaskContext } from '@/contexts/TaskContext';
import { getAllProjects } from '@/lib/api/projectsAPI';
import employeesAPI, { Employee } from '@/lib/api/employeesAPI';
import { exportTasksToCSV } from '@/utils/tasks';

interface Project {
  _id: string;
  name: string;
}

interface TaskFiltersProps {
  onExport?: () => void;
}

export default function TaskFilters({ onExport }: TaskFiltersProps) {
  const { state, actions, computed } = useTaskContext();
  const [showFilters, setShowFilters] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [projectsData, employeesData] = await Promise.all([
        getAllProjects(),
        employeesAPI.getAll()
      ]);
      setProjects(projectsData || []);
      setEmployees(employeesData || []);
    } catch (error) {
      console.error('Error fetching filter data:', error);
    }
  };

  const handleBulkStatusUpdate = async (status: string) => {
    if (state.selectedTasks.length === 0) return;
    await actions.bulkUpdateStatus(status);
  };

  const handleBulkDelete = async () => {
    if (state.selectedTasks.length === 0 || !confirm(`Delete ${state.selectedTasks.length} tasks?`)) return;
    await actions.bulkDelete();
  };

  return (
    <div className="space-y-4">
      {/* Search and Action Bar */}
      <div className="flex flex-wrap gap-4 items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
          <Input
            placeholder="Search tasks..."
            value={state.filters.search}
            onChange={(e) => actions.setFilters({ search: e.target.value })}
            className="pl-10"
          />
        </div>
        
        <Button variant="outline" onClick={() => setShowFilters(!showFilters)}>
          <Filter className="w-4 h-4 mr-2" />
          Filters
        </Button>
        
        <Button variant="outline" onClick={() => onExport ? onExport() : exportTasksToCSV(computed.filteredTasks)}>
          <Download className="w-4 h-4 mr-2" />
          Export
        </Button>
        
        {state.selectedTasks.length > 0 && (
          <div className="flex gap-2 items-center">
            <Badge variant="secondary">{state.selectedTasks.length} selected</Badge>
            <Select onValueChange={handleBulkStatusUpdate}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Update Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todo">To Do</SelectItem>
                <SelectItem value="in-progress">In Progress</SelectItem>
                <SelectItem value="review">Review</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="destructive" size="sm" onClick={handleBulkDelete}>
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>

      {/* Advanced Filters */}
      {showFilters && (
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <Label>Status</Label>
                <Select 
                  value={state.filters.status} 
                  onValueChange={(value) => actions.setFilters({ status: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="todo">To Do</SelectItem>
                    <SelectItem value="in-progress">In Progress</SelectItem>
                    <SelectItem value="review">Review</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label>Priority</Label>
                <Select 
                  value={state.filters.priority} 
                  onValueChange={(value) => actions.setFilters({ priority: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Priority</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label>Project</Label>
                <Select 
                  value={state.filters.project} 
                  onValueChange={(value) => actions.setFilters({ project: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Projects</SelectItem>
                    {projects.map(project => (
                      <SelectItem key={project._id} value={project._id}>
                        {project.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label>Assignee</Label>
                <Select 
                  value={state.filters.assignee} 
                  onValueChange={(value) => actions.setFilters({ assignee: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Assignees</SelectItem>
                    {employees.map(emp => (
                      <SelectItem key={emp._id} value={emp._id}>
                        {`${emp.firstName} ${emp.lastName}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
