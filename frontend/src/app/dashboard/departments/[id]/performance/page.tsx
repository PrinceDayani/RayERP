"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import {
    BarChart3,
    TrendingUp,
    TrendingDown,
    Users,
    Target,
    Award,
    Activity,
    Loader2,
    Shield,
    Zap,
} from "lucide-react";
import { SectionLoader } from '@/components/PageLoader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { departmentApi, Department } from "@/lib/api/departments";

export default function DepartmentPerformancePage() {
    const params = useParams();
    const { toast } = useToast();
    const [department, setDepartment] = useState<Department | null>(null);
    const [loading, setLoading] = useState(true);

    // Performance data - to be loaded from API
    const [performanceMetrics, setPerformanceMetrics] = useState<any>(null);
    const [goals, setGoals] = useState<any[]>([]);
    const [resourceUtilization, setResourceUtilization] = useState<any>(null);
    const [complianceStatus, setComplianceStatus] = useState<any>(null);

    useEffect(() => {
        loadDepartment();
        loadPerformanceData();
    }, [params.id]);

    const loadDepartment = async () => {
        try {
            setLoading(true);
            const response = await departmentApi.getById(params.id as string);
            setDepartment(response.data);
        } catch (error: any) {
            toast({
                title: "Error",
                description: "Failed to load department",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    const loadPerformanceData = async () => {
        try {
            const [metricsRes, goalsRes, resourcesRes, complianceRes] = await Promise.allSettled([
                departmentApi.getPerformanceMetrics(params.id as string).catch(() => ({ data: null })),
                departmentApi.getGoals(params.id as string).catch(() => ({ data: [] })),
                departmentApi.getResourceUtilization(params.id as string).catch(() => ({ data: null })),
                departmentApi.getComplianceStatus(params.id as string).catch(() => ({ data: null })),
            ]);

            if (metricsRes.status === 'fulfilled') {
                setPerformanceMetrics(metricsRes.value.data?.data || metricsRes.value.data || null);
            }

            if (goalsRes.status === 'fulfilled') {
                setGoals(Array.isArray(goalsRes.value.data) ? goalsRes.value.data : goalsRes.value.data?.data || []);
            }

            if (resourcesRes.status === 'fulfilled') {
                setResourceUtilization(resourcesRes.value.data?.data || resourcesRes.value.data || null);
            }

            if (complianceRes.status === 'fulfilled') {
                setComplianceStatus(complianceRes.value.data?.data || complianceRes.value.data || null);
            }
        } catch (error: any) {
            // Silently handle errors - endpoints may not exist yet
            setPerformanceMetrics(null);
            setGoals([]);
            setResourceUtilization(null);
            setComplianceStatus(null);
        }
    };

    if (loading || !department) {
        return <SectionLoader />;
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="mb-2">
                <h2 className="text-4xl font-bold bg-gradient-to-r from-[#970E2C] via-[#800020] to-[#970E2C] bg-clip-text text-transparent">Performance & Analytics</h2>
                <p className="text-muted-foreground mt-2 text-base">
                    Track department performance, goals, and key metrics
                </p>
            </div>

            {/* Premium Performance Metrics */}
            {performanceMetrics ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {/* Productivity - Brand */}
                    <Card className="group relative overflow-hidden border-0 shadow-lg shadow-[#970E2C]/10 hover:shadow-xl hover:shadow-[#970E2C]/20 transition-all duration-300 hover:-translate-y-1">
                        <div className="absolute inset-0 bg-gradient-to-br from-[#970E2C]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                        <CardContent className="p-6 relative">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs font-semibold text-[#970E2C] uppercase tracking-wide">Productivity</p>
                                    <p className="text-4xl font-bold mt-3 bg-gradient-to-r from-[#970E2C] to-[#800020] bg-clip-text text-transparent">{performanceMetrics.productivity}%</p>
                                    <Progress value={performanceMetrics.productivity} className="mt-3 h-2" />
                                </div>
                                <div className="p-4 rounded-2xl bg-gradient-to-br from-[#970E2C] to-[#800020] shadow-lg shadow-[#970E2C]/30">
                                    <TrendingUp className="h-7 w-7 text-white" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Satisfaction - Brand */}
                    <Card className="group relative overflow-hidden border-0 shadow-lg shadow-[#970E2C]/10 hover:shadow-xl hover:shadow-[#970E2C]/20 transition-all duration-300 hover:-translate-y-1">
                        <div className="absolute inset-0 bg-gradient-to-br from-[#970E2C]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                        <CardContent className="pt-6 relative">
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <p className="text-xs font-semibold text-[#970E2C] uppercase tracking-wide">
                                        Employee Satisfaction
                                    </p>
                                    <p className="text-4xl font-bold mt-3 bg-gradient-to-r from-[#970E2C] to-[#800020] bg-clip-text text-transparent">
                                        {performanceMetrics.satisfaction}%
                                    </p>
                                    <Progress value={performanceMetrics.satisfaction} className="mt-3 h-2" />
                                </div>
                                <div className="p-4 rounded-2xl bg-gradient-to-br from-[#970E2C] to-[#800020] shadow-lg shadow-[#970E2C]/30">
                                    <Users className="w-7 h-7 text-white" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Retention Rate - Brand */}
                    <Card className="group relative overflow-hidden border-0 shadow-lg shadow-[#970E2C]/10 hover:shadow-xl hover:shadow-[#970E2C]/20 transition-all duration-300 hover:-translate-y-1">
                        <div className="absolute inset-0 bg-gradient-to-br from-[#970E2C]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                        <CardContent className="pt-6 relative">
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <p className="text-xs font-semibold text-[#970E2C] uppercase tracking-wide">
                                        Retention Rate
                                    </p>
                                    <p className="text-4xl font-bold mt-3 bg-gradient-to-r from-[#970E2C] to-[#800020] bg-clip-text text-transparent">
                                        {performanceMetrics.retention}%
                                    </p>
                                    <Progress value={performanceMetrics.retention} className="mt-3 h-2" />
                                </div>
                                <div className="p-4 rounded-2xl bg-gradient-to-br from-[#970E2C] to-[#800020] shadow-lg shadow-[#970E2C]/30">
                                    <Shield className="w-7 h-7 text-white" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Growth - Brand Gradient */}
                    <Card className="group relative overflow-hidden border-0 shadow-lg shadow-[#970E2C]/10 hover:shadow-xl hover:shadow-[#970E2C]/20 transition-all duration-300 hover:-translate-y-1">
                        <div className="absolute inset-0 bg-gradient-to-br from-[#970E2C]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                        <CardContent className="pt-6 relative">
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <p className="text-xs font-semibold text-[#970E2C] uppercase tracking-wide">
                                        Growth Rate
                                    </p>
                                    <p className="text-4xl font-bold mt-3 bg-gradient-to-r from-[#970E2C] to-[#800020] bg-clip-text text-transparent">
                                        +{performanceMetrics.growth}%
                                    </p>
                                    <div className="mt-3">
                                        <Badge variant="secondary" className="text-xs bg-[#970E2C]/10 text-[#970E2C] border-[#970E2C]/20">
                                            Year over year
                                        </Badge>
                                    </div>
                                </div>
                                <div className="p-4 rounded-2xl bg-gradient-to-br from-[#970E2C] to-[#800020] shadow-lg shadow-[#970E2C]/30">
                                    <TrendingUp className="w-7 h-7 text-white" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Efficiency - Brand Gradient */}
                    <Card className="group relative overflow-hidden border-0 shadow-lg shadow-[#970E2C]/10 hover:shadow-xl hover:shadow-[#970E2C]/20 transition-all duration-300 hover:-translate-y-1">
                        <div className="absolute inset-0 bg-gradient-to-br from-[#970E2C]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                        <CardContent className="pt-6 relative">
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <p className="text-xs font-semibold text-[#970E2C] uppercase tracking-wide">
                                        Efficiency
                                    </p>
                                    <p className="text-4xl font-bold mt-3 bg-gradient-to-r from-[#970E2C] to-[#800020] bg-clip-text text-transparent">
                                        {performanceMetrics.efficiency}%
                                    </p>
                                    <Progress value={performanceMetrics.efficiency} className="mt-3 h-2" />
                                </div>
                                <div className="p-4 rounded-2xl bg-gradient-to-br from-[#970E2C] to-[#800020] shadow-lg shadow-[#970E2C]/30">
                                    <Zap className="w-7 h-7 text-white" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Quality Score - Brand Gradient */}
                    <Card className="group relative overflow-hidden border-0 shadow-lg shadow-[#970E2C]/10 hover:shadow-xl hover:shadow-[#970E2C]/20 transition-all duration-300 hover:-translate-y-1">
                        <div className="absolute inset-0 bg-gradient-to-br from-[#970E2C]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                        <CardContent className="pt-6 relative">
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <p className="text-xs font-semibold text-[#970E2C] uppercase tracking-wide">
                                        Quality Score
                                    </p>
                                    <p className="text-4xl font-bold mt-3 bg-gradient-to-r from-[#970E2C] to-[#800020] bg-clip-text text-transparent">
                                        {performanceMetrics.qualityScore}%
                                    </p>
                                    <Progress value={performanceMetrics.qualityScore} className="mt-3 h-2" />
                                </div>
                                <div className="p-4 rounded-2xl bg-gradient-to-br from-[#970E2C] to-[#800020] shadow-lg shadow-[#970E2C]/30">
                                    <Award className="w-7 h-7 text-white" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            ) : (
                <Card>
                    <CardContent className="py-12 text-center">
                        <BarChart3 className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                        <p className="text-muted-foreground">No performance metrics available</p>
                        <p className="text-xs text-muted-foreground mt-2">Performance data will appear here once available</p>
                    </CardContent>
                </Card>
            )
            }

            {/* Goals & Resource Utilization */}
            <Tabs defaultValue="goals" className="space-y-4">
                <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="goals">Goals & Objectives</TabsTrigger>
                    <TabsTrigger value="resources">Resource Utilization</TabsTrigger>
                    <TabsTrigger value="compliance">Compliance Status</TabsTrigger>
                </TabsList>

                <TabsContent value="goals" className="space-y-4">
                    <Card className="card-modern">
                        <CardHeader className="pb-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle className="flex items-center gap-2">
                                        <Target className="w-5 h-5 text-primary" />
                                        Department Goals
                                    </CardTitle>
                                    <CardDescription>Active goals and their progress</CardDescription>
                                </div>
                                <Button onClick={() => toast({ title: "Coming Soon", description: "Goal creation will be available soon" })} className="bg-gradient-to-r from-[#970E2C] to-[#800020] hover:from-[#800020] hover:to-[#970E2C] text-white shadow-lg shadow-[#970E2C]/20 transition-all">
                                    <Target className="w-4 h-4 mr-2" />
                                    Create Goal
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {goals.length > 0 ? (
                                <div className="space-y-6">
                                    {goals.map((goal: any) => (
                                        <div key={goal.id} className="space-y-3 p-4 border rounded-lg">
                                            <div className="flex items-start justify-between">
                                                <div className="flex-1">
                                                    <h3 className="font-semibold">{goal.title}</h3>
                                                    <p className="text-sm text-muted-foreground mt-1">{goal.description}</p>
                                                </div>
                                                <Badge
                                                    variant={
                                                        goal.priority === "high"
                                                            ? "destructive"
                                                            : goal.priority === "medium"
                                                                ? "default"
                                                                : "secondary"
                                                    }
                                                >
                                                    {goal.priority}
                                                </Badge>
                                            </div>
                                            <div className="space-y-2">
                                                <div className="flex items-center justify-between text-sm">
                                                    <span className="text-muted-foreground">Progress</span>
                                                    <span className="font-medium">
                                                        {goal.current} / {goal.target} {goal.unit}
                                                    </span>
                                                </div>
                                                <Progress value={(goal.current / goal.target) * 100} />
                                            </div>
                                            <div className="flex items-center justify-between text-xs text-muted-foreground">
                                                <span>Deadline: {goal.deadline}</span>
                                                <span>{Math.round((goal.current / goal.target) * 100)}% Complete</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-12">
                                    <Target className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                                    <p className="text-muted-foreground">No goals set</p>
                                    <p className="text-xs text-muted-foreground mt-2">Create department goals to track progress</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="resources" className="space-y-4">
                    {resourceUtilization ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Card className="card-modern">
                                <CardHeader className="pb-4">
                                    <CardTitle className="text-lg">Resource Metrics</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-muted-foreground">Capacity</span>
                                            <span className="font-medium">{resourceUtilization.capacity}%</span>
                                        </div>
                                        <Progress value={resourceUtilization.capacity} />
                                    </div>

                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-muted-foreground">Workload</span>
                                            <span className="font-medium">{resourceUtilization.workload}%</span>
                                        </div>
                                        <Progress value={resourceUtilization.workload} />
                                    </div>

                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-muted-foreground">Availability</span>
                                            <span className="font-medium">{resourceUtilization.availability}%</span>
                                        </div>
                                        <Progress value={resourceUtilization.availability} />
                                    </div>

                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-muted-foreground">Efficiency</span>
                                            <span className="font-medium">{resourceUtilization.efficiency}%</span>
                                        </div>
                                        <Progress value={resourceUtilization.efficiency} />
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="card-modern">
                                <CardHeader className="pb-4">
                                    <CardTitle className="text-lg">Resource Allocation</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    {resourceUtilization.allocation && Object.entries(resourceUtilization.allocation).map(([category, percentage]) => (
                                        <div key={category} className="space-y-2">
                                            <div className="flex items-center justify-between text-sm">
                                                <span className="font-medium">{category}</span>
                                                <span className="text-muted-foreground">{percentage as number}%</span>
                                            </div>
                                            <Progress value={percentage as number} />
                                        </div>
                                    ))}
                                </CardContent>
                            </Card>
                        </div>
                    ) : (
                        <Card>
                            <CardContent className="py-12 text-center">
                                <Users className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                                <p className="text-muted-foreground">No resource utilization data available</p>
                                <p className="text-xs text-muted-foreground mt-2">Resource metrics will appear here once available</p>
                            </CardContent>
                        </Card>
                    )}
                </TabsContent>

                <TabsContent value="compliance" className="space-y-4">
                    {complianceStatus ? (
                        <Card className="card-modern">
                            <CardHeader className="pb-4">
                                <CardTitle className="flex items-center gap-2">
                                    <Award className="w-5 h-5 text-primary" />
                                    Compliance Status
                                </CardTitle>
                                <CardDescription>
                                    Overall compliance score: {complianceStatus.overall}%
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-muted-foreground">Training Completion</span>
                                        <span className="font-medium">{complianceStatus.training}%</span>
                                    </div>
                                    <Progress value={complianceStatus.training} />
                                </div>

                                <div className="space-y-2">
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-muted-foreground">Certifications</span>
                                        <span className="font-medium">{complianceStatus.certifications}%</span>
                                    </div>
                                    <Progress value={complianceStatus.certifications} />
                                </div>

                                <div className="space-y-2">
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-muted-foreground">Policy Adherence</span>
                                        <span className="font-medium">{complianceStatus.policies}%</span>
                                    </div>
                                    <Progress value={complianceStatus.policies} />
                                </div>

                                <div className="space-y-2">
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-muted-foreground">Security Compliance</span>
                                        <span className="font-medium">{complianceStatus.security}%</span>
                                    </div>
                                    <Progress value={complianceStatus.security} />
                                </div>

                                <div className="pt-4 border-t">
                                    <p className="text-sm text-muted-foreground">
                                        Last Audit: {complianceStatus.lastAudit}
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    ) : (
                        <Card>
                            <CardContent className="py-12 text-center">
                                <Award className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                                <p className="text-muted-foreground">No compliance data available</p>
                                <p className="text-xs text-muted-foreground mt-2">Compliance status will appear here once available</p>
                            </CardContent>
                        </Card>
                    )}
                </TabsContent>
            </Tabs>
        </div >
    );
}
