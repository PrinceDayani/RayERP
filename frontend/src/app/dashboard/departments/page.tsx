"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Plus, Building, Search, Filter, Loader2, Users, MapPin, X, Download, FileText, Clock, TrendingUp, Undo, Redo } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SectionLoader } from '@/components/PageLoader';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { departmentApi, Department, DepartmentStats } from "@/lib/api/departments";
import { useGlobalCurrency } from "@/hooks/useGlobalCurrency";
import { usePermissions } from "@/hooks/usePermissions";
import { PERMISSIONS } from "@/lib/permissions";
import CurrencySwitcher from "@/components/budget/CurrencySwitcher";
import { BulkOperations } from "@/components/departments/BulkOperations";
import { AdvancedFilters } from "@/components/departments/AdvancedFilters";
import { ExportData } from "@/components/departments/ExportData";
import { useUndoRedo } from "@/hooks/useUndoRedo";

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
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const { state: filterState, setState: setFilterState, undo, redo, canUndo, canRedo } = useUndoRedo({ search: "", status: "all" });

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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-2">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-[#970E2C] via-[#800020] to-[#970E2C] bg-clip-text text-transparent">
            Department Management
          </h1>
          <p className="text-muted-foreground mt-2 text-base">Manage your organizational structure and teams</p>
        </div>
        <div className="flex items-center gap-3">
          <Button size="sm" variant="ghost" onClick={undo} disabled={!canUndo}>
            <Undo className="w-4 h-4" />
          </Button>
          <Button size="sm" variant="ghost" onClick={redo} disabled={!canRedo}>
            <Redo className="w-4 h-4" />
          </Button>
          <ExportData filters={{ search: searchQuery, status: statusFilter }} module="departments" />
          <CurrencySwitcher />
          <Button
            onClick={() => router.push("/dashboard/departments/new")}
            className="h-11 bg-gradient-to-r from-[#970E2C] to-[#800020] hover:from-[#800020] hover:to-[#970E2C] text-white shadow-lg shadow-[#970E2C]/20 transition-all"
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
            <Card className="group relative overflow-hidden border-0 shadow-lg shadow-[#970E2C]/10 hover:shadow-xl hover:shadow-[#970E2C]/20 transition-all duration-300 hover:-translate-y-1">
              <div className="absolute inset-0 bg-gradient-to-br from-[#970E2C]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <CardContent className="p-6 relative">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-[#970E2C] uppercase tracking-wide">
                      Total Departments
                    </p>
                    <p className="text-4xl font-bold mt-3 bg-gradient-to-r from-[#970E2C] to-[#800020] bg-clip-text text-transparent">{stats.total}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="secondary" className="text-xs bg-[#970E2C]/10 text-[#970E2C] border-[#970E2C]/20">
                        {stats.active} Active
                      </Badge>
                    </div>
                  </div>
                  <div className="p-4 rounded-2xl bg-gradient-to-br from-[#970E2C] to-[#800020] shadow-lg shadow-[#970E2C]/30">
                    <Building className="h-7 w-7 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Total Employees */}
            <Card className="group relative overflow-hidden border-0 shadow-lg shadow-[#970E2C]/10 hover:shadow-xl hover:shadow-[#970E2C]/20 transition-all duration-300 hover:-translate-y-1">
              <div className="absolute inset-0 bg-gradient-to-br from-[#970E2C]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <CardContent className="p-6 relative">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-[#970E2C] uppercase tracking-wide">
                      Total Employees
                    </p>
                    <p className="text-4xl font-bold mt-3 bg-gradient-to-r from-[#970E2C] to-[#800020] bg-clip-text text-transparent">{stats.totalEmployees}</p>
                    <p className="text-xs text-muted-foreground mt-2">Across all departments</p>
                  </div>
                  <div className="p-4 rounded-2xl bg-gradient-to-br from-[#970E2C] to-[#800020] shadow-lg shadow-[#970E2C]/30">
                    <Users className="h-7 w-7 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Total Budget */}
            <Card className="group relative overflow-hidden border-0 shadow-lg shadow-[#970E2C]/10 hover:shadow-xl hover:shadow-[#970E2C]/20 transition-all duration-300 hover:-translate-y-1">
              <div className="absolute inset-0 bg-gradient-to-br from-[#970E2C]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <CardContent className="p-6 relative">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-[#970E2C] uppercase tracking-wide">
                      Total Budget
                    </p>
                    <p className="text-4xl font-bold mt-3 bg-gradient-to-r from-[#970E2C] to-[#800020] bg-clip-text text-transparent">{formatAmount(stats.totalBudget)}</p>
                    <p className="text-xs text-muted-foreground mt-2">Annual allocation</p>
                  </div>
                  <div className="p-4 rounded-2xl bg-gradient-to-br from-[#970E2C] to-[#800020] shadow-lg shadow-[#970E2C]/30">
                    <TrendingUp className="h-7 w-7 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Avg Team Size */}
            <Card className="group relative overflow-hidden border-0 shadow-lg shadow-[#970E2C]/10 hover:shadow-xl hover:shadow-[#970E2C]/20 transition-all duration-300 hover:-translate-y-1">
              <div className="absolute inset-0 bg-gradient-to-br from-[#970E2C]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <CardContent className="p-6 relative">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-[#970E2C] uppercase tracking-wide">
                      Avg. Team Size
                    </p>
                    <p className="text-4xl font-bold mt-3 bg-gradient-to-r from-[#970E2C] to-[#800020] bg-clip-text text-transparent">{stats.avgTeamSize}</p>
                    <p className="text-xs text-muted-foreground mt-2">Employees per dept</p>
                  </div>
                  <div className="p-4 rounded-2xl bg-gradient-to-br from-[#970E2C] to-[#800020] shadow-lg shadow-[#970E2C]/30">
                    <Users className="h-7 w-7 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Search and Filters Card */}
        <Card className="glass-morphism">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Filter className="h-5 w-5 text-[#970E2C]" />
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
                  className="hover:bg-[#970E2C]/10 hover:text-[#970E2C]"
                >
                  <X className="w-4 h-4 mr-1" />
                  Clear All
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <AdvancedFilters
              onFilterChange={(filters) => {
                setSearchQuery(filters.search || "");
                setStatusFilter(filters.status || "all");
                setFilterState(filters);
                fetchData();
              }}
              module="departments"
            />
          </CardContent>
        </Card>

        {/* Tabs with Tables */}
        <Tabs defaultValue="all" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3 h-12 bg-muted/50 p-1 rounded-xl border border-border/50">
            <TabsTrigger value="all" className="rounded-lg font-medium text-sm data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#970E2C] data-[state=active]:to-[#800020] data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-[#970E2C]/20 hover:bg-background/50 transition-all">
              All Departments ({filteredDepartments.length})
            </TabsTrigger>
            <TabsTrigger value="active" className="rounded-lg font-medium text-sm data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#970E2C] data-[state=active]:to-[#800020] data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-[#970E2C]/20 hover:bg-background/50 transition-all">
              Active ({activeDepartments.length})
            </TabsTrigger>
            <TabsTrigger value="inactive" className="rounded-lg font-medium text-sm data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#970E2C] data-[state=active]:to-[#800020] data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-[#970E2C]/20 hover:bg-background/50 transition-all">
              Inactive ({inactiveDepartments.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all">
            {loading ? (
              <SectionLoader />
            ) : filteredDepartments.length === 0 ? (
              <Card className="glass-morphism">
                <CardContent className="py-16 text-center">
                  <div className="w-20 h-20 bg-gradient-to-br from-[#970E2C]/20 to-[#970E2C]/10 rounded-3xl flex items-center justify-center mx-auto mb-6">
                    <Building className="w-10 h-10 text-[#970E2C]" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">No departments found</h3>
                  <p className="text-muted-foreground mb-6">Get started by creating your first department</p>
                  <Button onClick={() => router.push("/dashboard/departments/new")} className="bg-gradient-to-r from-[#970E2C] to-[#800020] hover:from-[#800020] hover:to-[#970E2C] text-white shadow-lg shadow-[#970E2C]/20">
                    <Plus className="w-4 h-4 mr-2" />
                    Create First Department
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <Card className="glass-morphism overflow-hidden">
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-gradient-to-r from-muted/80 to-muted/50 border-b border-border">
                          <th className="text-left p-4 font-semibold text-sm text-foreground w-12">
                            <Checkbox
                              checked={selectedIds.length === filteredDepartments.length && filteredDepartments.length > 0}
                              onCheckedChange={(checked) => {
                                setSelectedIds(checked ? filteredDepartments.map(d => d._id) : []);
                              }}
                            />
                          </th>
                          <th className="text-left p-4 font-semibold text-sm text-foreground">Department</th>
                          <th className="text-left p-4 font-semibold text-sm text-foreground">Manager</th>
                          <th className="text-left p-4 font-semibold text-sm text-foreground">Location</th>
                          <th className="text-left p-4 font-semibold text-sm text-foreground">Employees</th>
                          <th className="text-left p-4 font-semibold text-sm text-foreground">Budget</th>
                          <th className="text-left p-4 font-semibold text-sm text-foreground">Status</th>
                          <th className="text-left p-4 font-semibold text-sm text-foreground">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredDepartments.map((dept) => (
                          <tr key={dept._id} className="border-b border-border/50 hover:bg-[#970E2C]/5 transition-colors cursor-pointer group">
                            <td className="p-4">
                              <Checkbox
                                checked={selectedIds.includes(dept._id)}
                                onCheckedChange={(checked) => {
                                  setSelectedIds(prev =>
                                    checked ? [...prev, dept._id] : prev.filter(id => id !== dept._id)
                                  );
                                }}
                              />
                            </td>
                            <td className="p-4">
                              <div className="flex items-center gap-3">
                                <div className="w-11 h-11 bg-gradient-to-br from-[#970E2C]/20 to-[#970E2C]/10 rounded-xl flex items-center justify-center group-hover:from-[#970E2C]/30 group-hover:to-[#970E2C]/20 transition-all">
                                  <Building className="w-5 h-5 text-[#970E2C]" />
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
                            <td className="p-4">
                              <Badge variant="secondary" className="font-medium">{dept.employeeCount || 0}</Badge>
                            </td>
                            <td className="p-4 text-foreground font-medium">{formatAmount(dept.budget)}</td>
                            <td className="p-4">
                              <Badge variant={dept.status === "active" ? "default" : "secondary"} className={dept.status === "active" ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300 border-green-200" : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300 border-yellow-200"}>
                                {dept.status}
                              </Badge>
                            </td>
                            <td className="p-4">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => router.push(`/dashboard/departments/${dept._id}`)}
                                className="hover:bg-[#970E2C] hover:text-white hover:border-[#970E2C] transition-all"
                              >
                                View Details
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="active">
            <Card className="glass-morphism overflow-hidden">
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gradient-to-r from-muted/80 to-muted/50 border-b border-border">
                        <th className="text-left p-4 font-semibold text-sm text-foreground">Department</th>
                        <th className="text-left p-4 font-semibold text-sm text-foreground">Manager</th>
                        <th className="text-left p-4 font-semibold text-sm text-foreground">Location</th>
                        <th className="text-left p-4 font-semibold text-sm text-foreground">Employees</th>
                        <th className="text-left p-4 font-semibold text-sm text-foreground">Budget</th>
                        <th className="text-left p-4 font-semibold text-sm text-foreground">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {activeDepartments.map((dept) => (
                        <tr key={dept._id} className="border-b border-border/50 hover:bg-[#970E2C]/5 transition-colors cursor-pointer group">
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              <div className="w-11 h-11 bg-gradient-to-br from-[#970E2C]/20 to-[#970E2C]/10 rounded-xl flex items-center justify-center group-hover:from-[#970E2C]/30 group-hover:to-[#970E2C]/20 transition-all">
                                <Building className="w-5 h-5 text-[#970E2C]" />
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
                          <td className="p-4">
                            <Badge variant="secondary" className="font-medium">{dept.employeeCount || 0}</Badge>
                          </td>
                          <td className="p-4 text-foreground font-medium">{formatAmount(dept.budget)}</td>
                          <td className="p-4">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => router.push(`/dashboard/departments/${dept._id}`)}
                              className="hover:bg-[#970E2C] hover:text-white hover:border-[#970E2C] transition-all"
                            >
                              View Details
                            </Button>
                          </td>
                        </tr>
                      ))}
                      {activeDepartments.length === 0 && (
                        <tr>
                          <td colSpan={6} className="text-center text-muted-foreground py-12">
                            <Building className="w-12 h-12 mx-auto mb-3 text-muted-foreground/50" />
                            <p>No active departments</p>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="inactive">
            <Card className="glass-morphism overflow-hidden">
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gradient-to-r from-muted/80 to-muted/50 border-b border-border">
                        <th className="text-left p-4 font-semibold text-sm text-foreground">Department</th>
                        <th className="text-left p-4 font-semibold text-sm text-foreground">Manager</th>
                        <th className="text-left p-4 font-semibold text-sm text-foreground">Location</th>
                        <th className="text-left p-4 font-semibold text-sm text-foreground">Employees</th>
                        <th className="text-left p-4 font-semibold text-sm text-foreground">Budget</th>
                        <th className="text-left p-4 font-semibold text-sm text-foreground">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {inactiveDepartments.map((dept) => (
                        <tr key={dept._id} className="border-b border-border/50 hover:bg-[#970E2C]/5 transition-colors cursor-pointer group">
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              <div className="w-11 h-11 bg-gradient-to-br from-[#970E2C]/20 to-[#970E2C]/10 rounded-xl flex items-center justify-center group-hover:from-[#970E2C]/30 group-hover:to-[#970E2C]/20 transition-all">
                                <Building className="w-5 h-5 text-[#970E2C]" />
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
                          <td className="p-4">
                            <Badge variant="secondary" className="font-medium">{dept.employeeCount || 0}</Badge>
                          </td>
                          <td className="p-4 text-foreground font-medium">{formatAmount(dept.budget)}</td>
                          <td className="p-4">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => router.push(`/dashboard/departments/${dept._id}`)}
                              className="hover:bg-[#970E2C] hover:text-white hover:border-[#970E2C] transition-all"
                            >
                              View Details
                            </Button>
                          </td>
                        </tr>
                      ))}
                      {inactiveDepartments.length === 0 && (
                        <tr>
                          <td colSpan={6} className="text-center text-muted-foreground py-12">
                            <Building className="w-12 h-12 mx-auto mb-3 text-muted-foreground/50" />
                            <p>No inactive departments</p>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
      
      <BulkOperations
        selectedIds={selectedIds}
        onClearSelection={() => setSelectedIds([])}
        onRefresh={fetchData}
      />
    </div>
  );
}
