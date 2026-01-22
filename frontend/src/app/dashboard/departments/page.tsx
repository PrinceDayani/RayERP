"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Plus, Building, Search, Filter, Loader2, Users, MapPin, X, Download, FileText, Clock, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { departmentApi, Department, DepartmentStats } from "@/lib/api/departments";
import { useGlobalCurrency } from "@/hooks/useGlobalCurrency";
import { usePermissions } from "@/hooks/usePermissions";
import { PERMISSIONS } from "@/lib/permissions";

export default function DepartmentsPage() {
  const router = useRouter();
  const { formatAmount } = useGlobalCurrency();
  const { toast } = useToast();
  const { hasPermission } = usePermissions();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [stats, setStats] = useState<DepartmentStats | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, [searchQuery, statusFilter]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [deptResponse, statsResponse] = await Promise.all([
        departmentApi.getAll(searchQuery, statusFilter),
        departmentApi.getStats(),
      ]);
      setDepartments(deptResponse.data.data || []);
      setStats(statsResponse.data.data);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to fetch departments",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredDepartments = departments.filter((dept) => {
    const matchesStatus = statusFilter === "all" || dept.status === statusFilter;
    return matchesStatus;
  });

  const activeDepartments = filteredDepartments.filter((d) => d.status === "active");
  const inactiveDepartments = filteredDepartments.filter((d) => d.status === "inactive");

  const handleExport = () => {
    const csv = [
      ["Department", "Manager", "Location", "Budget", "Employees", "Status"],
      ...filteredDepartments.map((dept) => [
        dept.name,
        dept.manager?.name || "N/A",
        dept.location,
        dept.budget,
        dept.employeeCount || 0,
        dept.status,
      ]),
    ]
      .map((row) => row.join(","))
      .join("\\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `departments-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    toast({ title: "Success", description: "Departments exported successfully" });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
            Department Management
          </h1>
          <p className="text-muted-foreground mt-1">Manage your organizational structure and teams</p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            onClick={handleExport}
            variant="outline"
          >
            <Download className="w-4 h-4 mr-2" /> Export CSV
          </Button>
          <Button
            onClick={() => router.push("/dashboard/departments/new")}
            className="btn-primary-gradient"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Department
          </Button>
        </div>
      </div>

      <div className="space-y-6">
        {/* Premium Animated Statistics Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total Departments */}
            <Card className="card-modern hover-lift border-l-4 border-l-blue-500">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Total Departments
                    </p>
                    <p className="text-3xl font-bold text-foreground">{stats.total}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="secondary" className="text-xs bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300">
                        {stats.active} Active
                      </Badge>
                    </div>
                  </div>
                  <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-xl">
                    <Building className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Total Employees - Green Gradient */}
            <Card className="card-modern hover-lift border-l-4 border-l-green-500">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Total Employees
                    </p>
                    <p className="text-3xl font-bold text-foreground">{stats.totalEmployees}</p>
                    <p className="text-xs text-muted-foreground mt-1">Across all departments</p>
                  </div>
                  <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-xl">
                    <Users className="h-6 w-6 text-green-600 dark:text-green-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Total Budget - Purple Gradient */}
            <Card className="card-modern hover-lift border-l-4 border-l-purple-500">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Total Budget
                    </p>
                    <p className="text-3xl font-bold text-foreground">{formatAmount(stats.totalBudget)}</p>
                    <p className="text-xs text-muted-foreground mt-1">Annual allocation</p>
                  </div>
                  <div className="p-3 bg-purple-100 dark:bg-purple-900/20 rounded-xl">
                    <TrendingUp className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Avg Team Size - Orange Gradient */}
            <Card className="card-modern hover-lift border-l-4 border-l-orange-500">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Avg. Team Size
                    </p>
                    <p className="text-3xl font-bold text-foreground">{stats.avgTeamSize}</p>
                    <p className="text-xs text-muted-foreground mt-1">Employees per dept</p>
                  </div>
                  <div className="p-3 bg-orange-100 dark:bg-orange-900/20 rounded-xl">
                    <Users className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Search and Filters Card */}
        <Card className="card-modern">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5 text-primary" />
                Search & Filter
              </CardTitle>
              {(searchQuery || statusFilter !== "all") && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSearchQuery("");
                    setStatusFilter("all");
                  }}
                >
                  <X className="w-4 h-4 mr-1" />
                  Clear All
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search departments, managers, locations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {(searchQuery || statusFilter !== "all") && (
              <div className="mt-3 text-sm text-muted-foreground">
                Showing {filteredDepartments.length} of {departments.length} departments
              </div>
            )}
          </CardContent>
        </Card>

        {/* Tabs with Tables */}
        <Tabs defaultValue="all" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3 h-12 bg-muted/80 p-1 rounded-xl border border-border/50">
            <TabsTrigger value="all" className="rounded-lg font-medium text-sm data-[state=active]:bg-[#800020] data-[state=active]:text-white data-[state=active]:shadow-sm data-[state=active]:border data-[state=active]:border-[#800020] hover:bg-background/50 transition-all">
              All Departments ({filteredDepartments.length})
            </TabsTrigger>
            <TabsTrigger value="active" className="rounded-lg font-medium text-sm data-[state=active]:bg-[#800020] data-[state=active]:text-white data-[state=active]:shadow-sm data-[state=active]:border data-[state=active]:border-[#800020] hover:bg-background/50 transition-all">
              Active ({activeDepartments.length})
            </TabsTrigger>
            <TabsTrigger value="inactive" className="rounded-lg font-medium text-sm data-[state=active]:bg-[#800020] data-[state=active]:text-white data-[state=active]:shadow-sm data-[state=active]:border data-[state=active]:border-[#800020] hover:bg-background/50 transition-all">
              Inactive ({inactiveDepartments.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all">
            {loading ? (
              <div className="flex justify-center items-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : filteredDepartments.length === 0 ? (
              <Card className="card-modern">
                <CardContent className="py-12 text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-primary/20 to-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Building className="w-8 h-8 text-primary" />
                  </div>
                  <p className="text-muted-foreground mb-4">No departments found</p>
                  <Button onClick={() => router.push("/dashboard/departments/new")} className="btn-primary-gradient">
                    <Plus className="w-4 h-4 mr-2" />
                    Create First Department
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <Card className="card-modern">
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <div className="table-modern rounded-xl overflow-hidden">
                      <table className="w-full">
                        <thead>
                          <tr className="bg-muted/50">
                            <th className="text-left p-4 font-semibold text-muted-foreground">Department</th>
                            <th className="text-left p-4 font-semibold text-muted-foreground">Manager</th>
                            <th className="text-left p-4 font-semibold text-muted-foreground">Location</th>
                            <th className="text-left p-4 font-semibold text-muted-foreground">Employees</th>
                            <th className="text-left p-4 font-semibold text-muted-foreground">Budget</th>
                            <th className="text-left p-4 font-semibold text-muted-foreground">Status</th>
                            <th className="text-left p-4 font-semibold text-muted-foreground">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredDepartments.map((dept) => (
                            <tr key={dept._id} className="table-row-hover border-b border-border/50 cursor-pointer">
                              <td className="p-4">
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 bg-gradient-to-br from-primary/20 to-primary/10 rounded-lg flex items-center justify-center">
                                    <Building className="w-5 h-5 text-primary" />
                                  </div>
                                  <span className="font-semibold text-foreground">{dept.name}</span>
                                </div>
                              </td>
                              <td className="p-4 text-foreground">{dept.manager?.name || "No manager"}</td>
                              <td className="p-4">
                                <div className="flex items-center gap-1 text-muted-foreground">
                                  <MapPin className="w-3 h-3" />
                                  {dept.location}
                                </div>
                              </td>
                              <td className="p-4 text-foreground font-medium">{dept.employeeCount || 0}</td>
                              <td className="p-4 text-foreground font-medium">{formatAmount(dept.budget)}</td>
                              <td className="p-4">
                                <Badge variant={dept.status === "active" ? "default" : "secondary"} className={dept.status === "active" ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300" : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300"}>
                                  {dept.status}
                                </Badge>
                              </td>
                              <td className="p-4">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => router.push(`/dashboard/departments/${dept._id}`)}
                                  className="hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200"
                                >
                                  View Details
                                </Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="active">
            <Card className="card-modern">
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <div className="table-modern rounded-xl overflow-hidden">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-muted/50">
                          <th className="text-left p-4 font-semibold text-muted-foreground">Department</th>
                          <th className="text-left p-4 font-semibold text-muted-foreground">Manager</th>
                          <th className="text-left p-4 font-semibold text-muted-foreground">Location</th>
                          <th className="text-left p-4 font-semibold text-muted-foreground">Employees</th>
                          <th className="text-left p-4 font-semibold text-muted-foreground">Budget</th>
                          <th className="text-left p-4 font-semibold text-muted-foreground">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {activeDepartments.map((dept) => (
                          <tr key={dept._id} className="table-row-hover border-b border-border/50 cursor-pointer">
                            <td className="p-4">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-gradient-to-br from-primary/20 to-primary/10 rounded-lg flex items-center justify-center">
                                  <Building className="w-5 h-5 text-primary" />
                                </div>
                                <span className="font-semibold text-foreground">{dept.name}</span>
                              </div>
                            </td>
                            <td className="p-4 text-foreground">{dept.manager?.name || "No manager"}</td>
                            <td className="p-4">
                              <div className="flex items-center gap-1 text-muted-foreground">
                                <MapPin className="w-3 h-3" />
                                {dept.location}
                              </div>
                            </td>
                            <td className="p-4 text-foreground font-medium">{dept.employeeCount || 0}</td>
                            <td className="p-4 text-foreground font-medium">{formatAmount(dept.budget)}</td>
                            <td className="p-4">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => router.push(`/dashboard/departments/${dept._id}`)}
                                className="hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200"
                              >
                                View Details
                              </Button>
                            </td>
                          </tr>
                        ))}
                        {activeDepartments.length === 0 && (
                          <tr>
                            <td colSpan={6} className="text-center text-muted-foreground py-8">
                              No active departments
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="inactive">
            <Card className="card-modern">
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <div className="table-modern rounded-xl overflow-hidden">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-muted/50">
                          <th className="text-left p-4 font-semibold text-muted-foreground">Department</th>
                          <th className="text-left p-4 font-semibold text-muted-foreground">Manager</th>
                          <th className="text-left p-4 font-semibold text-muted-foreground">Location</th>
                          <th className="text-left p-4 font-semibold text-muted-foreground">Employees</th>
                          <th className="text-left p-4 font-semibold text-muted-foreground">Budget</th>
                          <th className="text-left p-4 font-semibold text-muted-foreground">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {inactiveDepartments.map((dept) => (
                          <tr key={dept._id} className="table-row-hover border-b border-border/50 cursor-pointer">
                            <td className="p-4">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-gradient-to-br from-primary/20 to-primary/10 rounded-lg flex items-center justify-center">
                                  <Building className="w-5 h-5 text-primary" />
                                </div>
                                <span className="font-semibold text-foreground">{dept.name}</span>
                              </div>
                            </td>
                            <td className="p-4 text-foreground">{dept.manager?.name || "No manager"}</td>
                            <td className="p-4">
                              <div className="flex items-center gap-1 text-muted-foreground">
                                <MapPin className="w-3 h-3" />
                                {dept.location}
                              </div>
                            </td>
                            <td className="p-4 text-foreground font-medium">{dept.employeeCount || 0}</td>
                            <td className="p-4 text-foreground font-medium">{formatAmount(dept.budget)}</td>
                            <td className="p-4">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => router.push(`/dashboard/departments/${dept._id}`)}
                                className="hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200"
                              >
                                View Details
                              </Button>
                            </td>
                          </tr>
                        ))}
                        {inactiveDepartments.length === 0 && (
                          <tr>
                            <td colSpan={6} className="text-center text-muted-foreground py-8">
                              No inactive departments
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
