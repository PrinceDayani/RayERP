"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, X } from "lucide-react";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { type Project, projectsAPI } from "@/lib/api/projectsAPI";
import employeesAPI, { type Employee } from "@/lib/api/employeesAPI";
import { toast } from "@/components/ui/use-toast";
import { CURRENCY_CONFIG } from '@/config/currency.config';
import { useGlobalCurrency } from '@/hooks/useGlobalCurrency';
import ProjectPermissionsManager from './ProjectPermissionsManager';

interface Department {
  _id: string;
  name: string;
  description: string;
}

interface ProjectFormProps {
  project?: Partial<Project>;
  projectId?: string;
  onSubmit: (data: Partial<Project>) => void;
  onCancel: () => void;
  loading?: boolean;
  submitText?: string;
}

// Cache for employees and departments
let employeesCache: Employee[] | null = null;
let departmentsCache: Department[] | null = null;
let cacheTimestamp = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

const ProjectForm: React.FC<ProjectFormProps> = ({
  project,
  projectId,
  onSubmit,
  onCancel,
  loading = false,
  submitText = "Save Project",
}) => {
  const { formatAmount } = useGlobalCurrency();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loadingData, setLoadingData] = useState(false);
  const [formData, setFormData] = useState({
    name: project?.name || "",
    description: project?.description || "",
    status: project?.status || "planning",
    priority: project?.priority || "medium",
    budget: project?.budget?.toString() || "",
    currency: (project as any)?.currency || 'INR',
    progress: project?.progress?.toString() || "0",
    client: project?.client || "",
    manager: typeof project?.manager === 'object' && project.manager ? (project.manager as any)._id : project?.manager || "",
  });
  const [startDate, setStartDate] = useState<Date | undefined>(
    project?.startDate ? new Date(project.startDate) : undefined
  );
  const [endDate, setEndDate] = useState<Date | undefined>(
    project?.endDate ? new Date(project.endDate) : undefined
  );
  const [selectedTeam, setSelectedTeam] = useState<string[]>(
    Array.isArray(project?.team) 
      ? project.team.map(member => typeof member === 'object' ? (member as any)._id : member)
      : []
  );
  const [tags, setTags] = useState<string[]>(project?.tags || []);
  const [newTag, setNewTag] = useState("");
  const [selectedDepartments, setSelectedDepartments] = useState<string[]>(
    Array.isArray(project?.departments) 
      ? project.departments.map(dept => typeof dept === 'object' ? (dept as any)._id : dept)
      : []
  );
  const [instructions, setInstructions] = useState<Array<{title: string, content: string, type: string, priority: string}>>(
    (project as any)?.instructions || []
  );
  const [newInstruction, setNewInstruction] = useState({ title: '', content: '', type: 'general', priority: 'medium' });
  const [projectPermissions, setProjectPermissions] = useState<{ [employeeId: string]: string[] }>({});

  // Memoized filtered employees for manager selection
  const managerOptions = useMemo(() => 
    employees.filter(emp => emp.firstName && emp.lastName),
    [employees]
  );

  useEffect(() => {
    loadCachedData();
  }, []);

  useEffect(() => {
    if (project?.departments) {
      const deptIds = Array.isArray(project.departments) 
        ? project.departments.map(dept => typeof dept === 'object' && (dept as any)._id ? (dept as any)._id : dept)
        : [];
      setSelectedDepartments(deptIds.filter(Boolean));
    }
  }, [project?.departments]);

  const loadCachedData = async () => {
    const now = Date.now();
    
    // Check if cache is still valid
    if (employeesCache && departmentsCache && (now - cacheTimestamp) < CACHE_DURATION) {
      setEmployees(employeesCache);
      setDepartments(departmentsCache);
      return;
    }

    setLoadingData(true);
    try {
      // Load both in parallel
      const [employeesResponse, departmentsResponse] = await Promise.allSettled([
        fetchEmployees(),
        fetchDepartments()
      ]);

      if (employeesResponse.status === 'fulfilled') {
        employeesCache = employeesResponse.value;
        setEmployees(employeesResponse.value);
      }

      if (departmentsResponse.status === 'fulfilled') {
        departmentsCache = departmentsResponse.value;
        setDepartments(departmentsResponse.value);
      }

      cacheTimestamp = now;
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoadingData(false);
    }
  };

  const fetchEmployees = async (): Promise<Employee[]> => {
    try {
      const response = await employeesAPI.getAll();
      const employeeList = response.data || response || [];
      return Array.isArray(employeeList) ? employeeList : [];
    } catch (error) {
      console.error('Error fetching employees:', error);
      return [];
    }
  };

  const fetchDepartments = async (): Promise<Department[]> => {
    try {
      const token = localStorage.getItem('auth-token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/departments`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      return Array.isArray(data?.data || data) ? (data?.data || data) : [];
    } catch (error) {
      console.error('Error fetching departments:', error);
      return [];
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast({
        title: "Error",
        description: "Project name is required",
        variant: "destructive",
      });
      return;
    }
    
    if (!formData.description.trim()) {
      toast({
        title: "Error",
        description: "Project description is required",
        variant: "destructive",
      });
      return;
    }
    
    if (!startDate || !endDate) {
      toast({
        title: "Error",
        description: "Start and end dates are required",
        variant: "destructive",
      });
      return;
    }
    
    if (endDate < startDate) {
      toast({
        title: "Error",
        description: "End date must be after start date",
        variant: "destructive",
      });
      return;
    }

    const projectData = {
      name: formData.name.trim(),
      description: formData.description.trim(),
      status: formData.status,
      priority: formData.priority,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      budget: formData.budget ? parseFloat(formData.budget) : 0,
      currency: formData.currency.toUpperCase(),
      progress: formData.progress ? Math.min(Math.max(parseInt(formData.progress), 0), 100) : 0,
      client: formData.client.trim() || undefined,
      manager: formData.manager || undefined,
      team: selectedTeam.length > 0 ? selectedTeam : [],
      departments: selectedDepartments.length > 0 ? selectedDepartments : [],
      tags: tags.length > 0 ? tags : [],
      instructions: instructions.filter(inst => inst.title.trim() && inst.content.trim()),
      projectPermissions: Object.keys(projectPermissions).length > 0 ? projectPermissions : undefined,
    };

    onSubmit(projectData);
  };

  // Use fast creation API by default
  const handleFastSubmit = async (projectData: any) => {
    try {
      // Use the regular create API since we integrated fast routes
      await projectsAPI.create(projectData);
    } catch (error) {
      throw error;
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleTeamToggle = (employeeId: string) => {
    setSelectedTeam(prev => 
      prev.includes(employeeId)
        ? prev.filter(id => id !== employeeId)
        : [...prev, employeeId]
    );
  };

  const handleDepartmentToggle = (departmentId: string) => {
    setSelectedDepartments(prev => 
      prev.includes(departmentId)
        ? prev.filter(id => id !== departmentId)
        : [...prev, departmentId]
    );
  };

  const handleAddTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags(prev => [...prev, newTag.trim()]);
      setNewTag("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(prev => prev.filter(tag => tag !== tagToRemove));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    }
  };

  const handleAddInstruction = () => {
    if (newInstruction.title.trim() && newInstruction.content.trim()) {
      setInstructions(prev => [...prev, { ...newInstruction }]);
      setNewInstruction({ title: '', content: '', type: 'general', priority: 'medium' });
    }
  };

  const handleRemoveInstruction = (index: number) => {
    setInstructions(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="name">Project Name *</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => handleInputChange("name", e.target.value)}
          placeholder="Enter project name"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description *</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => handleInputChange("description", e.target.value)}
          placeholder="Describe the project goals and objectives"
          rows={4}
          required
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label>Status</Label>
          <Select value={formData.status} onValueChange={(value) => handleInputChange("status", value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="planning">Planning</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="on-hold">On Hold</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Priority</Label>
          <Select value={formData.priority} onValueChange={(value) => handleInputChange("priority", value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="critical">Critical</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="progress">Progress (%)</Label>
          <Input
            id="progress"
            type="number"
            value={formData.progress}
            onChange={(e) => handleInputChange("progress", e.target.value)}
            placeholder="0"
            min="0"
            max="100"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Start Date *</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-full justify-start text-left font-normal">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {startDate ? format(startDate, "PPP") : "Pick a date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={startDate}
                onSelect={setStartDate}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        <div className="space-y-2">
          <Label>End Date *</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-full justify-start text-left font-normal">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {endDate ? format(endDate, "PPP") : "Pick a date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={endDate}
                onSelect={setEndDate}
                initialFocus
                disabled={(date) => startDate ? date < startDate : false}
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="budget">Budget</Label>
          <div className="flex gap-2">
            <Select value={formData.currency} onValueChange={(value) => handleInputChange("currency", value)}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CURRENCY_CONFIG.supported.slice(0, 10).map((currency) => (
                  <SelectItem key={currency.code} value={currency.code}>
                    {currency.symbol} {currency.code} - {currency.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              id="budget"
              type="number"
              value={formData.budget}
              onChange={(e) => handleInputChange("budget", e.target.value)}
              placeholder="Enter project budget"
              min="0"
              step="0.01"
              className="flex-1"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="client">Client</Label>
          <Input
            id="client"
            value={formData.client}
            onChange={(e) => handleInputChange("client", e.target.value)}
            placeholder="Enter client name"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Project Manager</Label>
        <Select value={formData.manager} onValueChange={(value) => handleInputChange("manager", value)}>
          <SelectTrigger>
            <SelectValue placeholder={loadingData ? "Loading..." : "Select project manager"} />
          </SelectTrigger>
          <SelectContent>
            {managerOptions.map((employee) => (
              <SelectItem key={employee._id} value={employee._id}>
                {`${employee.firstName} ${employee.lastName}`}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Team Members</Label>
        <div className="border rounded-md p-3 max-h-40 overflow-y-auto">
          {loadingData ? (
            <p className="text-sm text-muted-foreground">Loading employees...</p>
          ) : employees.length > 0 ? (
            <div className="space-y-2">
              {employees.map((employee) => (
                <div key={employee._id} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id={`team-${employee._id}`}
                    checked={selectedTeam.includes(employee._id)}
                    onChange={() => handleTeamToggle(employee._id)}
                    className="rounded"
                  />
                  <Label htmlFor={`team-${employee._id}`} className="text-sm font-normal cursor-pointer">
                    {employee.firstName} {employee.lastName}
                  </Label>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No employees available</p>
          )}
        </div>
        {selectedTeam.length > 0 && (
          <p className="text-sm text-muted-foreground">
            {selectedTeam.length} team member{selectedTeam.length !== 1 ? 's' : ''} selected
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label>Departments</Label>
        <div className="border rounded-md p-3 max-h-40 overflow-y-auto">
          {departments.length > 0 ? (
            <div className="space-y-2">
              {departments.map((department) => (
                <div key={department._id} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id={`dept-${department._id}`}
                    checked={selectedDepartments.includes(department._id)}
                    onChange={() => handleDepartmentToggle(department._id)}
                    className="rounded"
                  />
                  <Label htmlFor={`dept-${department._id}`} className="text-sm font-normal cursor-pointer">
                    {department.name}
                  </Label>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              {loadingData ? "Loading departments..." : "No departments available"}
            </p>
          )}
        </div>
        {selectedDepartments.length > 0 && (
          <p className="text-sm text-muted-foreground">
            {selectedDepartments.length} department{selectedDepartments.length !== 1 ? 's' : ''} selected
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label>Tags</Label>
        <div className="flex gap-2">
          <Input
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Add a tag"
            className="flex-1"
          />
          <Button type="button" onClick={handleAddTag} variant="outline">
            Add
          </Button>
        </div>
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {tags.map((tag, index) => (
              <Badge key={index} variant="secondary" className="flex items-center gap-1">
                {tag}
                <X 
                  className="h-3 w-3 cursor-pointer hover:text-red-500" 
                  onClick={() => handleRemoveTag(tag)}
                />
              </Badge>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-4">
        <Label>Project Instructions</Label>
        <div className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Input
              placeholder="Instruction title"
              value={newInstruction.title}
              onChange={(e) => setNewInstruction(prev => ({ ...prev, title: e.target.value }))}
            />
            <div className="flex gap-2">
              <Select value={newInstruction.type} onValueChange={(value) => setNewInstruction(prev => ({ ...prev, type: value }))}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">General</SelectItem>
                  <SelectItem value="task">Task</SelectItem>
                  <SelectItem value="milestone">Milestone</SelectItem>
                  <SelectItem value="safety">Safety</SelectItem>
                  <SelectItem value="quality">Quality</SelectItem>
                </SelectContent>
              </Select>
              <Select value={newInstruction.priority} onValueChange={(value) => setNewInstruction(prev => ({ ...prev, priority: value }))}>
                <SelectTrigger className="w-24">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex gap-2">
            <Textarea
              placeholder="Instruction content"
              value={newInstruction.content}
              onChange={(e) => setNewInstruction(prev => ({ ...prev, content: e.target.value }))}
              rows={2}
              className="flex-1"
            />
            <Button type="button" onClick={handleAddInstruction} variant="outline">
              Add
            </Button>
          </div>
          {instructions.length > 0 && (
            <div className="space-y-2 max-h-40 overflow-y-auto border rounded-md p-3">
              {instructions.map((instruction, index) => (
                <div key={index} className="flex items-start justify-between gap-2 p-2 bg-muted rounded">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium text-sm">{instruction.title}</h4>
                      <Badge variant="outline" className="text-xs">{instruction.type}</Badge>
                      <Badge variant="secondary" className="text-xs">{instruction.priority}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2">{instruction.content}</p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveInstruction(index)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Project Permissions Section */}
      {selectedTeam.length > 0 && (
        <ProjectPermissionsManager
          projectId={projectId}
          employees={employees}
          selectedTeam={selectedTeam}
          onPermissionsChange={setProjectPermissions}
          initialPermissions={projectPermissions}
        />
      )}

      <div className="flex gap-4 pt-4">
        <Button type="submit" disabled={loading}>
          {loading ? "Saving..." : submitText}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
};

export default ProjectForm;
