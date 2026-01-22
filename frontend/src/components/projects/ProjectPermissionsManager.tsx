"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Settings, User, Shield, Search, CheckCircle, Circle, Minus, FileText, Users, DollarSign, BarChart3, FolderOpen, Clipboard } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { Input } from '@/components/ui/input';

interface Employee {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
}

interface ProjectPermission {
  _id: string;
  employee: Employee;
  permissions: string[];
  createdAt: string;
}

interface ProjectPermissionsManagerProps {
  projectId?: string;
  employees?: Employee[];
  selectedTeam?: string[];
  onPermissionsChange?: (permissions: { [employeeId: string]: string[] }) => void;
  initialPermissions?: { [employeeId: string]: string[] };
}

const PERMISSION_CATEGORIES = {
  project: {
    label: 'Project Management',
    icon: FolderOpen,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    permissions: [
      { value: 'project.view', label: 'View', description: 'Can view project details', icon: Circle },
      { value: 'project.edit', label: 'Edit', description: 'Can modify project information', icon: FileText },
      { value: 'project.delete', label: 'Delete', description: 'Can delete project', icon: Minus }
    ]
  },
  tasks: {
    label: 'Task Management',
    icon: Clipboard,
    color: 'text-green-600', 
    bgColor: 'bg-green-50',
    permissions: [
      { value: 'tasks.view', label: 'View', description: 'Can view tasks', icon: Circle },
      { value: 'tasks.create', label: 'Create', description: 'Can create new tasks', icon: CheckCircle },
      { value: 'tasks.edit', label: 'Edit', description: 'Can modify existing tasks', icon: FileText },
      { value: 'tasks.delete', label: 'Delete', description: 'Can delete tasks', icon: Minus },
      { value: 'tasks.assign', label: 'Assign', description: 'Can assign tasks to others', icon: Users }
    ]
  },
  files: {
    label: 'File Management',
    icon: FolderOpen,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    permissions: [
      { value: 'files.view', label: 'View', description: 'Can view and download files', icon: Circle },
      { value: 'files.upload', label: 'Upload', description: 'Can upload new files', icon: CheckCircle },
      { value: 'files.edit', label: 'Edit', description: 'Can modify file details', icon: FileText },
      { value: 'files.delete', label: 'Delete', description: 'Can delete files', icon: Minus }
    ]
  },
  team: {
    label: 'Team Management',
    icon: Users,
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
    permissions: [
      { value: 'team.view', label: 'View', description: 'Can view team members', icon: Circle },
      { value: 'team.add', label: 'Add', description: 'Can add team members', icon: CheckCircle },
      { value: 'team.remove', label: 'Remove', description: 'Can remove team members', icon: Minus }
    ]
  },
  budget: {
    label: 'Budget Management',
    icon: DollarSign,
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-50',
    permissions: [
      { value: 'budget.view', label: 'View', description: 'Can view budget information', icon: Circle },
      { value: 'budget.edit', label: 'Edit', description: 'Can modify budget', icon: FileText },
      { value: 'budget.approve', label: 'Approve', description: 'Can approve budget changes', icon: CheckCircle }
    ]
  },
  reports: {
    label: 'Reports & Analytics',
    icon: BarChart3,
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-50',
    permissions: [
      { value: 'reports.view', label: 'View', description: 'Can view reports', icon: Circle },
      { value: 'reports.export', label: 'Export', description: 'Can export reports', icon: FileText },
      { value: 'reports.create', label: 'Create', description: 'Can create custom reports', icon: CheckCircle }
    ]
  }
};

const BULK_PERMISSION_TEMPLATES = [
  {
    name: 'Viewer',
    description: 'Can only view project content',
    permissions: ['project.view', 'tasks.view', 'files.view', 'team.view', 'budget.view', 'reports.view']
  },
  {
    name: 'Contributor', 
    description: 'Can view and contribute to project',
    permissions: ['project.view', 'tasks.view', 'tasks.create', 'tasks.edit', 'files.view', 'files.upload', 'team.view', 'budget.view', 'reports.view']
  },
  {
    name: 'Team Lead',
    description: 'Can manage tasks and team members',
    permissions: ['project.view', 'project.edit', 'tasks.view', 'tasks.create', 'tasks.edit', 'tasks.delete', 'tasks.assign', 'files.view', 'files.upload', 'files.edit', 'team.view', 'team.add', 'budget.view', 'reports.view', 'reports.export']
  },
  {
    name: 'Project Manager',
    description: 'Full project management access',
    permissions: Object.values(PERMISSION_CATEGORIES).flatMap(cat => cat.permissions.map(p => p.value))
  }
];

const ProjectPermissionsManager: React.FC<ProjectPermissionsManagerProps> = ({
  projectId,
  employees: propEmployees = [],
  selectedTeam = [],
  onPermissionsChange,
  initialPermissions = {}
}) => {
  const [permissions, setPermissions] = useState<{ [employeeId: string]: string[] }>(initialPermissions);
  const [employees, setEmployees] = useState<Employee[]>(propEmployees);
  const [bulkTemplate, setBulkTemplate] = useState<string>('');
  const [showBulkOptions, setShowBulkOptions] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (propEmployees.length === 0) {
      loadEmployees();
    } else {
      setEmployees(propEmployees);
    }
  }, [propEmployees]);

  useEffect(() => {
    if (projectId) {
      loadProjectPermissions();
    }
  }, [projectId]);

  useEffect(() => {
    onPermissionsChange?.(permissions);
  }, [permissions, onPermissionsChange]);

  const loadEmployees = async () => {
    try {
      const token = localStorage.getItem('auth-token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/employees`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setEmployees(Array.isArray(data) ? data : data.data || []);
      }
    } catch (error) {
      console.error('Error loading employees:', error);
    }
  };

  const loadProjectPermissions = async () => {
    if (!projectId) return;
    
    try {
      const token = localStorage.getItem('auth-token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/projects/${projectId}/permissions`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        const permissionsMap: { [key: string]: string[] } = {};
        
        data.data.forEach((perm: ProjectPermission) => {
          permissionsMap[perm.employee._id] = perm.permissions;
        });
        
        setPermissions(permissionsMap);
      }
    } catch (error) {
      console.error('Error loading project permissions:', error);
    }
  };

  const applyTemplate = (templateName: string, employeeId: string) => {
    const template = BULK_PERMISSION_TEMPLATES.find(t => t.name === templateName);
    if (!template) return;

    setPermissions(prev => ({
      ...prev,
      [employeeId]: [...template.permissions]
    }));
    
    toast({
      title: "Success",
      description: `Applied ${template.name} template`
    });
  };

  const toggleCategoryPermissions = (category: string, employeeId: string) => {
    const categoryPerms = PERMISSION_CATEGORIES[category as keyof typeof PERMISSION_CATEGORIES].permissions.map(p => p.value);
    const currentPerms = permissions[employeeId] || [];
    const hasAllCategoryPerms = categoryPerms.every(perm => currentPerms.includes(perm));
    
    setPermissions(prev => ({
      ...prev,
      [employeeId]: hasAllCategoryPerms 
        ? currentPerms.filter(p => !categoryPerms.includes(p))
        : [...new Set([...currentPerms, ...categoryPerms])]
    }));
  };

  const togglePermission = (permission: string, employeeId: string) => {
    setPermissions(prev => {
      const currentPerms = prev[employeeId] || [];
      return {
        ...prev,
        [employeeId]: currentPerms.includes(permission)
          ? currentPerms.filter(p => p !== permission)
          : [...currentPerms, permission]
      };
    });
  };

  const removeAllPermissions = (employeeId: string) => {
    setPermissions(prev => {
      const newPerms = { ...prev };
      delete newPerms[employeeId];
      return newPerms;
    });
  };

  const getEmployeeName = (employeeId: string) => {
    const employee = employees.find(emp => emp._id === employeeId);
    return employee ? `${employee.firstName} ${employee.lastName}` : 'Unknown Employee';
  };

  const getPermissionLabel = (permissionValue: string) => {
    for (const category of Object.values(PERMISSION_CATEGORIES)) {
      const perm = category.permissions.find(p => p.value === permissionValue);
      if (perm) return perm.label;
    }
    return permissionValue;
  };

  const teamMembers = employees.filter(emp => selectedTeam.includes(emp._id));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Project Permissions
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Responsive Bulk Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <Label className="text-sm font-medium">Team Member Permissions</Label>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setShowBulkOptions(!showBulkOptions)}
            className="w-full sm:w-auto"
          >
            Bulk Actions
          </Button>
        </div>
        
        {showBulkOptions && (
          <Card className="p-3 sm:p-4 bg-muted/50">
            <div className="space-y-3">
              <Label className="text-sm font-medium">Apply Template to All Team Members</Label>
              <div className="flex flex-col sm:flex-row gap-2">
                <select 
                  value={bulkTemplate} 
                  onChange={(e) => setBulkTemplate(e.target.value)}
                  className="flex-1 p-2 border rounded text-sm"
                >
                  <option value="">Select permission template...</option>
                  {BULK_PERMISSION_TEMPLATES.map(template => (
                    <option key={template.name} value={template.name}>
                      {template.name} - {template.description}
                    </option>
                  ))}
                </select>
                <Button 
                  onClick={() => {
                    if (!bulkTemplate) return;
                    const template = BULK_PERMISSION_TEMPLATES.find(t => t.name === bulkTemplate);
                    if (!template) return;
                    const newPermissions = { ...permissions };
                    teamMembers.forEach(employee => {
                      newPermissions[employee._id] = [...template.permissions];
                    });
                    setPermissions(newPermissions);
                    setBulkTemplate('');
                    setShowBulkOptions(false);
                    toast({ title: "Success", description: `Applied ${template.name} to all members` });
                  }} 
                  disabled={!bulkTemplate}
                  className="w-full sm:w-auto"
                >
                  Apply
                </Button>
              </div>
            </div>
          </Card>
        )}

        {teamMembers.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Shield className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p className="text-base">No team members assigned</p>
            <p className="text-sm">Add team members to set permissions</p>
          </div>
        ) : (
          <div className="space-y-3">
            {teamMembers.map(employee => {
              const employeePerms = permissions[employee._id] || [];
              return (
                <div key={employee._id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 border rounded-lg gap-3">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <User className="h-4 w-4 text-gray-600" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium truncate">{employee.firstName} {employee.lastName}</p>
                      <p className="text-sm text-muted-foreground">
                        {employeePerms.length} permission{employeePerms.length !== 1 ? 's' : ''} assigned
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3">
                    {employeePerms.length > 0 && (
                      <div className="flex flex-wrap gap-1 max-w-full sm:max-w-48">
                        {employeePerms.slice(0, 2).map(perm => (
                          <Badge key={perm} variant="secondary" className="text-xs">
                            {getPermissionLabel(perm)}
                          </Badge>
                        ))}
                        {employeePerms.length > 2 && (
                          <Badge variant="outline" className="text-xs">
                            +{employeePerms.length - 2} more
                          </Badge>
                        )}
                      </div>
                    )}
                    
                    <Sheet>
                      <SheetTrigger asChild>
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="w-full sm:w-auto flex-shrink-0"
                        >
                          <Settings className="h-4 w-4 mr-1" />
                          <span className="hidden sm:inline">Set Permissions</span>
                          <span className="sm:hidden">Permissions</span>
                        </Button>
                      </SheetTrigger>
                      <SheetContent className="w-full sm:w-[500px] md:w-[600px] lg:w-[700px] overflow-y-auto">
                        <SheetHeader className="pb-4 sm:pb-6">
                          <SheetTitle className="flex flex-col sm:flex-row sm:items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                              <User className="h-5 w-5 text-white" />
                            </div>
                            <div className="text-left">
                              <div className="font-semibold">{employee.firstName} {employee.lastName}</div>
                              <div className="text-sm text-muted-foreground break-all">{employee.email}</div>
                            </div>
                          </SheetTitle>
                        </SheetHeader>
                        
                        <div className="space-y-4 sm:space-y-6">
                          {/* Quick Templates - Responsive Grid */}
                          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-3 sm:p-4">
                            <Label className="text-sm font-medium mb-3 block">Quick Templates</Label>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              {BULK_PERMISSION_TEMPLATES.map(template => {
                                const employeePerms = permissions[employee._id] || [];
                                const isActive = template.permissions.every(p => employeePerms.includes(p)) && 
                                               employeePerms.length === template.permissions.length;
                                return (
                                  <Button
                                    key={template.name}
                                    variant={isActive ? "default" : "outline"}
                                    size="sm"
                                    onClick={() => applyTemplate(template.name, employee._id)}
                                    className="justify-start h-auto p-3 text-left"
                                  >
                                    <div>
                                      <div className="font-medium text-xs">{template.name}</div>
                                      <div className="text-xs opacity-70 hidden sm:block">{template.description}</div>
                                    </div>
                                  </Button>
                                );
                              })}
                            </div>
                          </div>

                          {/* Search */}
                          <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                              placeholder="Search permissions..."
                              value={searchTerm}
                              onChange={(e) => setSearchTerm(e.target.value)}
                              className="pl-10"
                            />
                          </div>

                          {/* Permission Categories - Responsive Layout */}
                          <div className="space-y-3 sm:space-y-4">
                            {Object.entries(PERMISSION_CATEGORIES)
                              .filter(([_, category]) => 
                                !searchTerm || 
                                category.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                category.permissions.some(p => 
                                  p.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                  p.description.toLowerCase().includes(searchTerm.toLowerCase())
                                )
                              )
                              .map(([categoryKey, category]) => {
                                const employeePerms = permissions[employee._id] || [];
                                const categoryPerms = category.permissions.map(p => p.value);
                                const hasAllCategoryPerms = categoryPerms.every(perm => employeePerms.includes(perm));
                                const hasSomeCategoryPerms = categoryPerms.some(perm => employeePerms.includes(perm));
                                const CategoryIcon = category.icon;
                                
                                return (
                                  <div key={categoryKey} className={`border-2 rounded-xl p-3 sm:p-4 transition-all ${
                                    hasAllCategoryPerms ? 'border-green-200 bg-green-50' : 
                                    hasSomeCategoryPerms ? 'border-yellow-200 bg-yellow-50' : 
                                    'border-gray-200 hover:border-gray-300'
                                  }`}>
                                    <div className="flex items-center justify-between mb-3 sm:mb-4">
                                      <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                                        <div className={`w-6 h-6 sm:w-8 sm:h-8 rounded-lg ${category.bgColor} flex items-center justify-center flex-shrink-0`}>
                                          <CategoryIcon className={`h-3 w-3 sm:h-4 sm:w-4 ${category.color}`} />
                                        </div>
                                        <div className="flex items-center gap-2 min-w-0 flex-1">
                                          <input
                                            type="checkbox"
                                            checked={hasAllCategoryPerms}
                                            ref={(el) => {
                                              if (el) el.indeterminate = hasSomeCategoryPerms && !hasAllCategoryPerms;
                                            }}
                                            onChange={() => toggleCategoryPermissions(categoryKey, employee._id)}
                                            className="w-4 h-4 rounded border-2 flex-shrink-0"
                                          />
                                          <Label className="font-semibold text-sm sm:text-base cursor-pointer truncate" 
                                                 onClick={() => toggleCategoryPermissions(categoryKey, employee._id)}>
                                            {category.label}
                                          </Label>
                                        </div>
                                      </div>
                                      <Badge 
                                        variant={hasAllCategoryPerms ? "default" : hasSomeCategoryPerms ? "secondary" : "outline"}
                                        className="font-medium text-xs flex-shrink-0"
                                      >
                                        {employeePerms.filter(p => categoryPerms.includes(p)).length}/{categoryPerms.length}
                                      </Badge>
                                    </div>
                                    
                                    <div className="grid gap-2 sm:gap-3 ml-8 sm:ml-11">
                                      {category.permissions
                                        .filter(permission => 
                                          !searchTerm || 
                                          permission.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                          permission.description.toLowerCase().includes(searchTerm.toLowerCase())
                                        )
                                        .map(permission => {
                                          const PermissionIcon = permission.icon;
                                          const isChecked = employeePerms.includes(permission.value);
                                          return (
                                            <div key={permission.value} 
                                                 className={`flex items-start gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg border transition-all cursor-pointer ${
                                                   isChecked ? 'bg-blue-50 border-blue-200' : 'bg-white border-gray-200 hover:border-gray-300'
                                                 }`}
                                                 onClick={() => togglePermission(permission.value, employee._id)}
                                            >
                                              <input
                                                type="checkbox"
                                                id={`${employee._id}-${permission.value}`}
                                                checked={isChecked}
                                                onChange={() => togglePermission(permission.value, employee._id)}
                                                className="w-4 h-4 rounded mt-0.5 flex-shrink-0"
                                              />
                                              <PermissionIcon className={`h-4 w-4 mt-0.5 flex-shrink-0 ${
                                                isChecked ? 'text-blue-600' : 'text-gray-400'
                                              }`} />
                                              <div className="flex-1 min-w-0">
                                                <Label 
                                                  htmlFor={`${employee._id}-${permission.value}`} 
                                                  className="font-medium cursor-pointer block text-sm"
                                                >
                                                  {permission.label}
                                                </Label>
                                                <p className="text-xs sm:text-sm text-muted-foreground mt-1 break-words">
                                                  {permission.description}
                                                </p>
                                              </div>
                                            </div>
                                          );
                                        })}
                                    </div>
                                  </div>
                                );
                              })}
                          </div>
                          
                          {/* Action Buttons - Responsive */}
                          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-4 border-t">
                            <Button 
                              onClick={() => toast({ title: "Success", description: "Permissions saved successfully" })}
                              className="flex-1 order-2 sm:order-1"
                            >
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Save Changes
                            </Button>
                            <Button 
                              variant="outline" 
                              onClick={() => removeAllPermissions(employee._id)}
                              className="order-1 sm:order-2"
                            >
                              Clear All
                            </Button>
                          </div>
                        </div>
                      </SheetContent>
                    </Sheet>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        
        {/* Info Section - Responsive */}
        <div className="bg-muted/50 rounded-lg p-3 sm:p-4 mt-4">
          <h4 className="font-medium mb-2 text-sm sm:text-base">Permission Guidelines</h4>
          <ul className="text-xs sm:text-sm text-muted-foreground space-y-1">
            <li>• Permissions are specific to this project only</li>
            <li>• Project managers always have full permissions</li>
            <li>• Changes are saved when you update the project</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProjectPermissionsManager;