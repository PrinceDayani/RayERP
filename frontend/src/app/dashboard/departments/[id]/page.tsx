"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Building, Users, MapPin, Wallet, Activity, FolderOpen, Loader2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SectionLoader } from '@/components/PageLoader';
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { departmentApi, Employee, Department } from "@/lib/api/departments";
import { DepartmentStats } from "../_components/DepartmentStats";
import { useGlobalCurrency } from "@/hooks/useGlobalCurrency";
import CurrencySwitcher from "@/components/budget/CurrencySwitcher";

export default function DepartmentOverviewPage() {
  const params = useParams();
  const { toast } = useToast();
  const { formatAmount } = useGlobalCurrency();
  const [department, setDepartment] = useState<Department | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [activityLogs, setActivityLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [params.id]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [deptRes, empRes, projRes, logsRes] = await Promise.allSettled([
        departmentApi.getById(params.id as string),
        departmentApi.getEmployees(params.id as string),
        departmentApi.getProjects(params.id as string),
        departmentApi.getActivityLogs(params.id as string, { limit: 10 }),
      ]);

      if (deptRes.status === "fulfilled") {
        const dept = deptRes.value.data?.data || deptRes.value.data;
        console.log("Department loaded:", dept); // Debug log
        setDepartment(dept);
      }

      if (empRes.status === "fulfilled") {
        const emps = Array.isArray(empRes.value.data)
          ? empRes.value.data
          : empRes.value.data?.data || [];
        setEmployees(emps);
      }

      if (projRes.status === "fulfilled") {
        const projs = Array.isArray(projRes.value.data)
          ? projRes.value.data
          : projRes.value.data?.data || [];
        setProjects(projs);
      }

      if (logsRes.status === "fulfilled") {
        setActivityLogs(logsRes.value.data?.logs || []);
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to load department data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading && !department) {
    return <SectionLoader />;
  }

  if (!department) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <p className="text-muted-foreground">Department not found</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
            {department.name}
          </h1>
          <p className="text-muted-foreground mt-1">{department.description}</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant={department.status === "active" ? "default" : "secondary"} className={department.status === "active" ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300" : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300"}>
            {department.status}
          </Badge>
          <CurrencySwitcher />
        </div>
      </div>

      {/* Statistics Overview */}
      <DepartmentStats
        employees={employees.length}
        projects={projects.length}
        budget={department.budget}
        efficiency={89}
        goals={0}
        completedGoals={0}
      />

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Department Information */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="card-modern">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2">
                <Building className="w-5 h-5 text-primary" />
                Department Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="w-4 h-4 text-muted-foreground" />
                  <span className="font-medium">Location:</span>
                  <span>{department.location}</span>
                </div>

                <div className="flex items-center gap-2 text-sm">
                  <Wallet className="w-4 h-4 text-muted-foreground" />
                  <span className="font-medium">Budget:</span>
                  <span>{formatAmount(department.budget)}</span>
                </div>

                <div className="flex items-center gap-2 text-sm col-span-2">
                  <Users className="w-4 h-4 text-muted-foreground" />
                  <span className="font-medium">Manager:</span>
                  <span>{department.manager?.name || "No manager assigned"}</span>
                  {department.manager?.email && (
                    <span className="text-muted-foreground">({department.manager.email})</span>
                  )}
                </div>
              </div>

              <div className="pt-2 border-t">
                <p className="text-sm text-muted-foreground">{department.description}</p>
              </div>
            </CardContent>
          </Card>

          {/* Active Projects with Table */}
          <Card className="card-modern">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2">
                <FolderOpen className="w-5 h-5 text-primary" />
                Active Projects
              </CardTitle>
              <CardDescription>
                {projects.length} active project{projects.length !== 1 ? "s" : ""}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {projects.length === 0 ? (
                <div className="text-center py-8">
                  <FolderOpen className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                  <p className="text-muted-foreground">No active projects</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Project</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Priority</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {projects.slice(0, 5).map((project: any, index: number) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">
                          {project.name || `Project ${index + 1}`}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{project.status || "In Progress"}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              project.priority === "high"
                                ? "destructive"
                                : project.priority === "low"
                                  ? "secondary"
                                  : "default"
                            }
                          >
                            {project.priority || "Medium"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                    {projects.length > 5 && (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center text-muted-foreground">
                          +{projects.length - 5} more projects
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card className="card-modern">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-primary" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              {activityLogs.length === 0 ? (
                <div className="text-center py-8">
                  <Activity className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                  <p className="text-muted-foreground">No recent activity</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {activityLogs.map((log: any, index: number) => (
                    <div key={index} className="flex items-start gap-3 p-3 border-l-2 border-primary">
                      <div className="flex-1">
                        <p className="text-sm font-medium">{log.action || "Activity"}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {log.user || "System"} • {log.timestamp || "Recently"}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Stats */}
          <Card className="card-modern">
            <CardHeader className="pb-4">
              <CardTitle className="text-sm">Quick Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Active Status</span>
                <Badge variant={department.status === "active" ? "default" : "secondary"}>
                  {department.status}
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Team Size</span>
                <span className="font-bold">{employees.length}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Active Projects</span>
                <span className="font-bold">{projects.length}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Permissions</span>
                <span className="font-bold">{department.permissions?.length || 0}</span>
              </div>
            </CardContent>
          </Card>

          {/* Team Members Preview with Table */}
          <Card className="card-modern">
            <CardHeader className="pb-4">
              <CardTitle className="text-sm flex items-center gap-2">
                <Users className="w-4 h-4 text-primary" />
                Team Members
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {employees.length === 0 ? (
                <div className="text-center py-4 px-6">
                  <Users className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">No team members</p>
                </div>
              ) : (
                <Table>
                  <TableBody>
                    {employees.slice(0, 5).map((emp) => (
                      <TableRow key={emp._id}>
                        <TableCell className="py-3">
                          <div>
                            <p className="text-sm font-medium">
                              {emp.firstName} {emp.lastName}
                            </p>
                            <p className="text-xs text-muted-foreground">{emp.position}</p>
                          </div>
                        </TableCell>
                        <TableCell className="py-3">
                          <Badge variant="outline" className="text-xs">
                            {emp.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                    {employees.length > 5 && (
                      <TableRow>
                        <TableCell colSpan={2} className="text-center text-muted-foreground text-xs py-2">
                          +{employees.length - 5} more
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}