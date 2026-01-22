//path: frontend/src/app/dashboard/projects/create/page.tsx

"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { CalendarIcon, ArrowLeft, Save, X, Users, Building2 } from "lucide-react";
import { createProject, projectsAPI, type Project } from "@/lib/api/projectsAPI";
import { getAllEmployees } from "@/lib/api/index";
import { toast } from "@/components/ui/use-toast";
import { useCurrency } from "@/contexts/CurrencyContext";
import { CurrencySelector } from "@/components/ui/currency-selector";

interface Employee {
  _id: string;
  firstName: string;
  lastName: string;
}

interface Department {
  _id: string;
  name: string;
  description: string;
}

const CreateProjectPage = () => {
  const { isAuthenticated } = useAuth();
  const { currencies, baseCurrency, formatCurrency, getCurrencySymbol } = useCurrency();
  const router = useRouter();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(false);

  const [projectForm, setProjectForm] = useState({
    name: "",
    description: "",
    status: "planning" as Project["status"],
    priority: "medium" as Project["priority"],
    startDate: undefined as Date | undefined,
    endDate: undefined as Date | undefined,
    budget: 0,
    currency: baseCurrency?.code || 'USD',
    manager: "",
    managers: [] as string[],
    team: [] as string[],
    departments: [] as string[],
    client: "",
    tags: [] as string[]
  });

  const [managerSearch, setManagerSearch] = useState("");
  const [teamSearch, setTeamSearch] = useState("");
  const [deptSearch, setDeptSearch] = useState("");
  const [openManagerPopover, setOpenManagerPopover] = useState(false);
  const [openTeamPopover, setOpenTeamPopover] = useState(false);
  const [openDeptPopover, setOpenDeptPopover] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      fetchEmployees();
      fetchDepartments();
    }
  }, [isAuthenticated]);

  const fetchEmployees = async () => {
    try {
      // Use optimized endpoint first, fallback to regular if needed
      try {
        const data = await projectsAPI.getEmployeesMinimal();
        setEmployees(Array.isArray(data) ? data : []);
      } catch {
        const response = await getAllEmployees();
        const data = response?.data || response;
        setEmployees(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error("Error fetching employees:", error);
      setEmployees([]);
    }
  };

  const fetchDepartments = async () => {
    try {
      // Use optimized endpoint first, fallback to regular if needed
      try {
        const data = await projectsAPI.getDepartmentsMinimal();
        setDepartments(Array.isArray(data) ? data : []);
      } catch {
        const token = localStorage.getItem('auth-token');
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/departments`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        setDepartments(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error("Error fetching departments:", error);
      setDepartments([]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!projectForm.name || !projectForm.description) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    if (!projectForm.startDate || !projectForm.endDate) {
      toast({
        title: "Validation Error",
        description: "Please select start and end dates",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      const projectData = {
        name: projectForm.name,
        description: projectForm.description,
        status: projectForm.status,
        priority: projectForm.priority,
        startDate: projectForm.startDate.toISOString(),
        endDate: projectForm.endDate.toISOString(),
        budget: projectForm.budget,
        currency: projectForm.currency,
        client: projectForm.client,
        manager: projectForm.managers[0] || undefined, // Use first manager
        team: projectForm.team,
        departments: projectForm.departments,
        tags: projectForm.tags
      };

      // Use regular project creation API
      const newProject = await createProject(projectData);
      toast({
        title: "Success",
        description: "Project created successfully",
      });
      router.push(`/dashboard/projects/${newProject._id}`);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error?.response?.data?.message || error?.message || "Failed to create project",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleManagerToggle = (employeeId: string) => {
    setProjectForm(prev => ({
      ...prev,
      managers: prev.managers.includes(employeeId)
        ? prev.managers.filter(id => id !== employeeId)
        : [...prev.managers, employeeId]
    }));
  };

  const handleTeamMemberToggle = (employeeId: string) => {
    setProjectForm(prev => ({
      ...prev,
      team: prev.team.includes(employeeId)
        ? prev.team.filter(id => id !== employeeId)
        : [...prev.team, employeeId]
    }));
  };

  const handleDepartmentToggle = (departmentId: string) => {
    setProjectForm(prev => ({
      ...prev,
      departments: prev.departments.includes(departmentId)
        ? prev.departments.filter(id => id !== departmentId)
        : [...prev.departments, departmentId]
    }));
  };

  const filteredManagers = employees.filter(emp => 
    `${emp.firstName} ${emp.lastName}`.toLowerCase().includes(managerSearch.toLowerCase())
  );
  const filteredTeamMembers = employees.filter(emp => 
    `${emp.firstName} ${emp.lastName}`.toLowerCase().includes(teamSearch.toLowerCase())
  );
  const filteredDepartments = departments.filter(dept => 
    dept.name.toLowerCase().includes(deptSearch.toLowerCase())
  );

  if (!isAuthenticated) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Card>
          <CardContent className="pt-6 text-center">
            <h2 className="text-xl font-semibold mb-2">Access Required</h2>
            <p className="text-muted-foreground mb-4">Please log in to create projects</p>
            <Button onClick={() => router.push("/login")}>Login</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container max-w-7xl mx-auto p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.push("/dashboard/projects")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Create New Project</h1>
          <p className="text-sm text-muted-foreground">Fill in the details below</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Project Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Project Name *</Label>
                  <Input id="name" value={projectForm.name} onChange={(e) => setProjectForm({ ...projectForm, name: e.target.value })} placeholder="Enter project name" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="client">Client</Label>
                  <Input id="client" value={projectForm.client} onChange={(e) => setProjectForm({ ...projectForm, client: e.target.value })} placeholder="Client name" />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description *</Label>
                <Textarea id="description" value={projectForm.description} onChange={(e) => setProjectForm({ ...projectForm, description: e.target.value })} placeholder="Describe the project" rows={3} required />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select value={projectForm.status} onValueChange={(value: Project["status"]) => setProjectForm({ ...projectForm, status: value })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
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
                  <Select value={projectForm.priority} onValueChange={(value: Project["priority"]) => setProjectForm({ ...projectForm, priority: value })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="critical">Critical</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Start Date *</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-left font-normal">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {projectForm.startDate ? format(projectForm.startDate, "dd/MM/yyyy") : "DD/MM/YYYY"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="center">
                      <Calendar 
                        mode="single" 
                        selected={projectForm.startDate} 
                        onSelect={(date) => setProjectForm({ ...projectForm, startDate: date })} 
                        initialFocus 
                        className="rounded-md border"
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
                        {projectForm.endDate ? format(projectForm.endDate, "dd/MM/yyyy") : "DD/MM/YYYY"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="center">
                      <Calendar 
                        mode="single" 
                        selected={projectForm.endDate} 
                        onSelect={(date) => setProjectForm({ ...projectForm, endDate: date })} 
                        disabled={(date) => projectForm.startDate ? date < projectForm.startDate : false} 
                        initialFocus 
                        className="rounded-md border"
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="budget">Budget ({getCurrencySymbol(projectForm.currency)})</Label>
                  <div className="flex gap-2">
                    <CurrencySelector 
                      value={projectForm.currency} 
                      onValueChange={(value) => setProjectForm({ ...projectForm, currency: value })} 
                    />
                    <Input id="budget" type="number" value={projectForm.budget} onChange={(e) => setProjectForm({ ...projectForm, budget: parseInt(e.target.value) || 0 })} placeholder="0" min="0" className="flex-1" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Users className="h-4 w-4" />
                Managers *
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Popover open={openManagerPopover} onOpenChange={setOpenManagerPopover}>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start" size="sm">
                    {projectForm.managers.length > 0 ? `${projectForm.managers.length} selected` : "Select"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80 p-0" align="start">
                  <div className="p-2 border-b">
                    <Input placeholder="Search..." value={managerSearch} onChange={(e) => setManagerSearch(e.target.value)} className="h-8" />
                  </div>
                  <div className="max-h-60 overflow-auto p-1">
                    {filteredManagers.map((employee) => (
                      <div key={employee._id} className="flex items-center space-x-2 p-2 rounded cursor-pointer hover:bg-accent" onClick={() => handleManagerToggle(employee._id)}>
                        <Checkbox checked={projectForm.managers.includes(employee._id)} />
                        <span className="text-sm">{employee.firstName} {employee.lastName}</span>
                      </div>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
              {projectForm.managers.length > 0 && (
                <div className="flex gap-1 flex-wrap">
                  {projectForm.managers.map(id => {
                    const emp = employees.find(e => e._id === id);
                    return emp ? <Badge key={id} variant="secondary" className="text-xs">{emp.firstName} {emp.lastName}<X className="ml-1 h-3 w-3 cursor-pointer" onClick={() => handleManagerToggle(id)} /></Badge> : null;
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Users className="h-4 w-4" />
                Team Members
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Popover open={openTeamPopover} onOpenChange={setOpenTeamPopover}>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start" size="sm">
                    {projectForm.team.length > 0 ? `${projectForm.team.length} selected` : "Select"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80 p-0" align="start">
                  <div className="p-2 border-b">
                    <Input placeholder="Search..." value={teamSearch} onChange={(e) => setTeamSearch(e.target.value)} className="h-8" />
                  </div>
                  <div className="max-h-60 overflow-auto p-1">
                    {filteredTeamMembers.map((employee) => (
                      <div key={employee._id} className="flex items-center space-x-2 p-2 rounded cursor-pointer hover:bg-accent" onClick={() => handleTeamMemberToggle(employee._id)}>
                        <Checkbox checked={projectForm.team.includes(employee._id)} />
                        <span className="text-sm">{employee.firstName} {employee.lastName}</span>
                      </div>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
              {projectForm.team.length > 0 && (
                <div className="flex gap-1 flex-wrap">
                  {projectForm.team.map(id => {
                    const emp = employees.find(e => e._id === id);
                    return emp ? <Badge key={id} variant="secondary" className="text-xs">{emp.firstName} {emp.lastName}<X className="ml-1 h-3 w-3 cursor-pointer" onClick={() => handleTeamMemberToggle(id)} /></Badge> : null;
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Building2 className="h-4 w-4" />
                Departments
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Popover open={openDeptPopover} onOpenChange={setOpenDeptPopover}>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start" size="sm">
                    {projectForm.departments.length > 0 ? `${projectForm.departments.length} selected` : "Select"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80 p-0" align="start">
                  <div className="p-2 border-b">
                    <Input placeholder="Search..." value={deptSearch} onChange={(e) => setDeptSearch(e.target.value)} className="h-8" />
                  </div>
                  <div className="max-h-60 overflow-auto p-1">
                    {filteredDepartments.map((department) => (
                      <div key={department._id} className="flex items-center space-x-2 p-2 rounded cursor-pointer hover:bg-accent" onClick={() => handleDepartmentToggle(department._id)}>
                        <Checkbox checked={projectForm.departments.includes(department._id)} />
                        <span className="text-sm">{department.name}</span>
                      </div>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
              {projectForm.departments.length > 0 && (
                <div className="flex gap-1 flex-wrap">
                  {projectForm.departments.map(id => {
                    const dept = departments.find(d => d._id === id);
                    return dept ? <Badge key={id} variant="secondary" className="text-xs">{dept.name}<X className="ml-1 h-3 w-3 cursor-pointer" onClick={() => handleDepartmentToggle(id)} /></Badge> : null;
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={() => router.push("/dashboard/projects")}>Cancel</Button>
          <Button type="submit" disabled={loading}>
            <Save className="h-4 w-4 mr-2" />
            {loading ? "Creating..." : "Create Project"}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default CreateProjectPage;
