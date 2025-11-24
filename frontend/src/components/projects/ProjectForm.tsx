"use client";

import React, { useState, useEffect } from "react";
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
import { type Project } from "@/lib/api/projectsAPI";
import employeesAPI, { type Employee } from "@/lib/api/employeesAPI";
import { toast } from "@/components/ui/use-toast";

interface Department {
  _id: string;
  name: string;
  description: string;
}

interface ProjectFormProps {
  project?: Partial<Project>;
  onSubmit: (data: Partial<Project>) => void;
  onCancel: () => void;
  loading?: boolean;
  submitText?: string;
}

const ProjectForm: React.FC<ProjectFormProps> = ({
  project,
  onSubmit,
  onCancel,
  loading = false,
  submitText = "Save Project",
}) => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loadingEmployees, setLoadingEmployees] = useState(true);
  const [formData, setFormData] = useState({
    name: project?.name || "",
    description: project?.description || "",
    status: project?.status || "planning",
    priority: project?.priority || "medium",
    budget: project?.budget?.toString() || "",
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

  useEffect(() => {
    fetchEmployees();
    fetchDepartments();
  }, []);

  useEffect(() => {
    if (project?.departments) {
      const deptIds = Array.isArray(project.departments) 
        ? project.departments.map(dept => typeof dept === 'object' && (dept as any)._id ? (dept as any)._id : dept)
        : [];
      setSelectedDepartments(deptIds.filter(Boolean));
    }
  }, [project?.departments]);

  const fetchEmployees = async () => {
    setLoadingEmployees(true);
    try {
      const response = await employeesAPI.getAll();
      console.log('Employees API response:', response);
      const employeeList = response.data || response || [];
      console.log('Processed employees:', employeeList);
      setEmployees(Array.isArray(employeeList) ? employeeList : []);
    } catch (error) {
      console.error('Error fetching employees:', error);
      toast({
        title: "Error",
        description: "Failed to load employees",
        variant: "destructive",
      });
    } finally {
      setLoadingEmployees(false);
    }
  };

  const fetchDepartments = async () => {
    try {
      const token = localStorage.getItem('auth-token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/departments`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) {
        console.error('Departments API error:', response.status, response.statusText);
        return;
      }
      const data = await response.json();
      console.log('Departments API response:', data);
      console.log('Project departments:', project?.departments);
      const deptList = data?.data || data;
      setDepartments(Array.isArray(deptList) ? deptList : []);
    } catch (error) {
      console.error('Error fetching departments:', error);
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
      progress: formData.progress ? Math.min(Math.max(parseInt(formData.progress), 0), 100) : 0,
      client: formData.client.trim() || undefined,
      manager: formData.manager || undefined,
      team: selectedTeam.length > 0 ? selectedTeam : [],
      departments: selectedDepartments.length > 0 ? selectedDepartments : [],
      tags: tags.length > 0 ? tags : [],
    };

    onSubmit(projectData);
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
          <Input
            id="budget"
            type="number"
            value={formData.budget}
            onChange={(e) => handleInputChange("budget", e.target.value)}
            placeholder="Enter project budget"
            min="0"
            step="0.01"
          />
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
            <SelectValue placeholder="Select project manager" />
          </SelectTrigger>
          <SelectContent>
            {employees.map((employee) => (
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
          {loadingEmployees ? (
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
            <p className="text-sm text-muted-foreground">No departments available</p>
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
