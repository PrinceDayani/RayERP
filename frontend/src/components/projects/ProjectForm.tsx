"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, X, ClipboardList, BarChart3 } from "lucide-react";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { type Project, type MinimalUser, type ProjectCategory, PROJECT_CATEGORIES, projectsAPI } from "@/lib/api/projectsAPI";
import { getContacts, type Contact } from "@/lib/api/contactsAPI";
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
  project?: Partial<Project> & { projectType?: 'instruction' | 'reporting' };
  projectId?: string;
  onSubmit: (data: Partial<Project>) => void;
  onCancel: () => void;
  loading?: boolean;
  submitText?: string;
}

// Cache for assignable users and departments
let usersCache: MinimalUser[] | null = null;
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
  const [users, setUsers] = useState<MinimalUser[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loadingData, setLoadingData] = useState(false);
  const [formData, setFormData] = useState({
    name: project?.name || "",
    description: project?.description || "",
    projectType: (project as any)?.projectType || "instruction",
    status: project?.status || "planning",
    priority: project?.priority || "medium",
    budget: project?.budget?.toString() || "",
    currency: (project as any)?.currency || 'INR',
    progress: project?.progress?.toString() || "0",
    client: project?.client || "",
    jobNumber: project?.jobNumber || "",
    projectCategory: (project?.projectCategory || "other") as ProjectCategory,
    clientContact:
      typeof project?.clientContact === "object" && project?.clientContact
        ? project.clientContact._id
        : (project?.clientContact as string) || "",
    siteAddress: project?.siteLocation?.address || "",
    siteCity: project?.siteLocation?.city || "",
    siteState: project?.siteLocation?.state || "",
    sitePincode: project?.siteLocation?.pincode || "",
    siteCountry: project?.siteLocation?.country || "",
  });
  const [clients, setClients] = useState<Contact[]>([]);
  const [actualStartDate, setActualStartDate] = useState<Date | undefined>(
    project?.actualStartDate ? new Date(project.actualStartDate) : undefined
  );
  const [actualEndDate, setActualEndDate] = useState<Date | undefined>(
    project?.actualEndDate ? new Date(project.actualEndDate) : undefined
  );
  const [selectedManagers, setSelectedManagers] = useState<string[]>(
    Array.isArray(project?.managers) 
      ? project.managers.map(manager => typeof manager === 'object' ? (manager as any)._id : manager)
      : []
  );
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
  const [projectPermissions, setProjectPermissions] = useState<{ [userId: string]: string[] }>({});

  // Managers are picked from the same assignable-user list.
  const managerOptions = useMemo(() => 
    users.filter(user => user.name),
    [users]
  );

  useEffect(() => {
    loadCachedData();
  }, []);

  // Only contacts flagged as clients are offered, so the picker does not list
  // every vendor in the contact book.
  useEffect(() => {
    getContacts()
      .then(all => setClients(all.filter(c => c.isCustomer || c.contactType === 'client')))
      .catch(() => setClients([]));
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
    if (usersCache && departmentsCache && (now - cacheTimestamp) < CACHE_DURATION) {
      setUsers(usersCache);
      setDepartments(departmentsCache);
      return;
    }

    setLoadingData(true);
    try {
      // Load both in parallel
      const [usersResponse, departmentsResponse] = await Promise.allSettled([
        fetchUsers(),
        fetchDepartments()
      ]);

      if (usersResponse.status === 'fulfilled') {
        usersCache = usersResponse.value;
        setUsers(usersResponse.value);
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

  // Project.team and Project.managers ref User, so the picker must be sourced
  // from the User rail - Employee ids here break project access checks.
  const fetchUsers = async (): Promise<MinimalUser[]> => {
    try {
      const list = await projectsAPI.getUsersMinimal();
      return Array.isArray(list) ? list : [];
    } catch (error) {
      console.error('Error fetching assignable users:', error);
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
      projectType: formData.projectType,
      status: formData.status,
      priority: formData.priority,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      budget: formData.budget ? parseFloat(formData.budget) : 0,
      currency: formData.currency.toUpperCase(),
      progress: formData.progress ? Math.min(Math.max(parseInt(formData.progress), 0), 100) : 0,
      client: formData.client.trim() || undefined,
      jobNumber: formData.jobNumber.trim() || undefined,
      projectCategory: formData.projectCategory,
      clientContact: formData.clientContact || null,
      siteLocation: {
        address: formData.siteAddress.trim() || undefined,
        city: formData.siteCity.trim() || undefined,
        state: formData.siteState.trim() || undefined,
        pincode: formData.sitePincode.trim() || undefined,
        country: formData.siteCountry.trim() || undefined,
      },
      actualStartDate: actualStartDate ? actualStartDate.toISOString() : null,
      actualEndDate: actualEndDate ? actualEndDate.toISOString() : null,
      managers: selectedManagers.length > 0 ? selectedManagers : [],
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

  const handleTeamToggle = (userId: string) => {
    setSelectedTeam(prev => 
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
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

      {/* Project Type Selection */}
      <div className="space-y-2">
        <Label>Project Type</Label>
        <div className="grid grid-cols-2 gap-3">
          <div
            className={`relative cursor-pointer rounded-lg border-2 p-3 transition-all ${
              formData.projectType === 'instruction'
                ? 'border-primary bg-primary/5'
                : 'border-muted hover:border-muted-foreground/30'
            }`}
            onClick={() => handleInputChange("projectType", "instruction")}
          >
            <div className="flex items-center gap-2">
              <ClipboardList className={`h-4 w-4 ${formData.projectType === 'instruction' ? 'text-primary' : 'text-muted-foreground'}`} />
              <div>
                <p className="font-medium text-sm">Instruction-Based</p>
                <p className="text-xs text-muted-foreground">Tasks assigned top-down, progress by task completion</p>
              </div>
            </div>
            {formData.projectType === 'instruction' && (
              <div className="absolute top-2 right-2 h-2.5 w-2.5 rounded-full bg-primary" />
            )}
          </div>
          <div
            className={`relative cursor-pointer rounded-lg border-2 p-3 transition-all ${
              formData.projectType === 'reporting'
                ? 'border-primary bg-primary/5'
                : 'border-muted hover:border-muted-foreground/30'
            }`}
            onClick={() => handleInputChange("projectType", "reporting")}
          >
            <div className="flex items-center gap-2">
              <BarChart3 className={`h-4 w-4 ${formData.projectType === 'reporting' ? 'text-primary' : 'text-muted-foreground'}`} />
              <div>
                <p className="font-medium text-sm">Reporting-Based</p>
                <p className="text-xs text-muted-foreground">Employees report progress, tracked by financial outcome</p>
              </div>
            </div>
            {formData.projectType === 'reporting' && (
              <div className="absolute top-2 right-2 h-2.5 w-2.5 rounded-full bg-primary" />
            )}
          </div>
        </div>
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
                selectedDate={startDate}
                onSelect={setStartDate}
                disabled={undefined}
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
                selectedDate={endDate}
                onSelect={setEndDate}
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

        <div className="space-y-2">
          <Label htmlFor="clientContact">Client Contact</Label>
          <Select
            value={formData.clientContact || "none"}
            onValueChange={(value) => handleInputChange("clientContact", value === "none" ? "" : value)}
          >
            <SelectTrigger id="clientContact">
              <SelectValue placeholder="Link a contact" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Not linked</SelectItem>
              {clients.map((contact) => (
                <SelectItem key={contact._id} value={contact._id!}>
                  {contact.company ? `${contact.name} — ${contact.company}` : contact.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            Links the project to the contact book so the client address travels with it.
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="jobNumber">Job Number</Label>
          <Input
            id="jobNumber"
            value={formData.jobNumber}
            onChange={(e) => handleInputChange("jobNumber", e.target.value)}
            placeholder={project ? "" : "Assigned automatically"}
          />
          <p className="text-xs text-muted-foreground">
            {project
              ? "Must stay unique across the job register."
              : "Leave blank to take the next number in the register."}
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="projectCategory">Project Type</Label>
          <Select
            value={formData.projectCategory}
            onValueChange={(value) => handleInputChange("projectCategory", value)}
          >
            <SelectTrigger id="projectCategory">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PROJECT_CATEGORIES.map((category) => (
                <SelectItem key={category} value={category} className="capitalize">
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Project Location</Label>
        <Input
          value={formData.siteAddress}
          onChange={(e) => handleInputChange("siteAddress", e.target.value)}
          placeholder="Site address"
        />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
          <Input
            value={formData.siteCity}
            onChange={(e) => handleInputChange("siteCity", e.target.value)}
            placeholder="City"
          />
          <Input
            value={formData.siteState}
            onChange={(e) => handleInputChange("siteState", e.target.value)}
            placeholder="State"
          />
          <Input
            value={formData.sitePincode}
            onChange={(e) => handleInputChange("sitePincode", e.target.value)}
            placeholder="Pincode"
          />
          <Input
            value={formData.siteCountry}
            onChange={(e) => handleInputChange("siteCountry", e.target.value)}
            placeholder="Country"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Actual Start Date</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-full justify-start text-left font-normal">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {actualStartDate ? format(actualStartDate, "PPP") : "Not started"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={actualStartDate}
                selectedDate={actualStartDate}
                onSelect={setActualStartDate}
                disabled={undefined}
              />
              {actualStartDate && (
                <div className="p-2 border-t">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="w-full"
                    onClick={() => setActualStartDate(undefined)}
                  >
                    Clear
                  </Button>
                </div>
              )}
            </PopoverContent>
          </Popover>
        </div>

        <div className="space-y-2">
          <Label>Actual End Date</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-full justify-start text-left font-normal">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {actualEndDate ? format(actualEndDate, "PPP") : "Not finished"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={actualEndDate}
                selectedDate={actualEndDate}
                onSelect={setActualEndDate}
                disabled={undefined}
              />
              {actualEndDate && (
                <div className="p-2 border-t">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="w-full"
                    onClick={() => setActualEndDate(undefined)}
                  >
                    Clear
                  </Button>
                </div>
              )}
            </PopoverContent>
          </Popover>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Project Managers</Label>
        <div className="border rounded-md p-3 max-h-40 overflow-y-auto">
          {loadingData ? (
            <p className="text-sm text-muted-foreground">Loading users...</p>
          ) : managerOptions.length > 0 ? (
            <div className="space-y-2">
              {managerOptions.map((user) => (
                <div key={user._id} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id={`manager-${user._id}`}
                    checked={selectedManagers.includes(user._id)}
                    onChange={() => {
                      setSelectedManagers(prev => 
                        prev.includes(user._id)
                          ? prev.filter(id => id !== user._id)
                          : [...prev, user._id]
                      );
                    }}
                    className="rounded"
                  />
                  <Label htmlFor={`manager-${user._id}`} className="text-sm font-normal cursor-pointer">
                    {user.name}
                  </Label>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No users available</p>
          )}
        </div>
        {selectedManagers.length > 0 && (
          <p className="text-sm text-muted-foreground">
            {selectedManagers.length} manager{selectedManagers.length !== 1 ? 's' : ''} selected
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label>Team Members</Label>
        <div className="border rounded-md p-3 max-h-40 overflow-y-auto">
          {loadingData ? (
            <p className="text-sm text-muted-foreground">Loading users...</p>
          ) : users.length > 0 ? (
            <div className="space-y-2">
              {users.map((user) => (
                <div key={user._id} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id={`team-${user._id}`}
                    checked={selectedTeam.includes(user._id)}
                    onChange={() => handleTeamToggle(user._id)}
                    className="rounded"
                  />
                  <Label htmlFor={`team-${user._id}`} className="text-sm font-normal cursor-pointer">
                    {user.name}
                  </Label>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No users available</p>
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
          users={users}
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
