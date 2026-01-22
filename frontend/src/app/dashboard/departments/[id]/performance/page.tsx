"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import {
    BarChart3,
    TrendingUp,
    TrendingDown,
    Users,
    Target,
import { SectionLoader } from '@/components/PageLoader';
    Award,
    Activity,
    Loader2,
    Shield,
    Zap,
} from "lucide-react";
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
            <div>
                <h2 className="text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">Performance & Analytics</h2>
                <p className="text-muted-foreground mt-1">
                    Track department performance, goals, and key metrics
                </p>
            </div>

            {/* Premium Performance Metrics */}
            {performanceMetrics ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {/* Productivity - Blue */}
                    <Card className="card-modern hover-lift border-l-4 border-l-blue-500">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">Productivity</p>
                                    <p className="text-3xl font-bold text-foreground">{performanceMetrics.productivity}%</p>
                                    <Progress value={performanceMetrics.productivity} className="mt-3 h-2" />
                                </div>
                                <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-xl">
                                    <TrendingUp className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Satisfaction - Green Gradient */}
                    <Card className="group relative overflow-hidden border-0 shadow-lg shadow-green-500/10 hover:shadow-xl hover:shadow-green-500/20 transition-all duration-300 hover:-translate-y-1">
                        <div className="absolute inset-0 bg-gradient-to-br from-green-500 to-green-600 opacity-0 group-hover:opacity-5 transition-opacity duration-300" />
                        <CardContent className="pt-6 relative">
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <p className="text-xs font-semibold text-green-600 uppercase tracking-wide">
                                        Employee Satisfaction
                                    </p>
                                    <p className="text-4xl font-bold mt-3 bg-gradient-to-r from-green-600 to-green-700 bg-clip-text text-transparent">
                                        {performanceMetrics.satisfaction}%
                                    </p>
                                    <Progress value={performanceMetrics.satisfaction} className="mt-3 h-2" />
                                </div>
                                <div className="p-4 rounded-2xl bg-gradient-to-br from-green-500 to-green-600 shadow-lg shadow-green-500/30">
                                    <Users className="w-7 h-7 text-white" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Retention - Purple Gradient */}
                    <Card className="group relative overflow-hidden border-0 shadow-lg shadow-purple-500/10 hover:shadow-xl hover:shadow-purple-500/20 transition-all duration-300 hover:-translate-y-1">
                        <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-purple-600 opacity-0 group-hover:opacity-5 transition-opacity duration-300" />
                        <CardContent className="pt-6 relative">
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <p className="text-xs font-semibold text-purple-600 uppercase tracking-wide">
                                        Retention Rate
                                    </p>
                                    <p className="text-4xl font-bold mt-3 bg-gradient-to-r from-purple-600 to-purple-700 bg-clip-text text-transparent">
                                        {performanceMetrics.retention}%
                                    </p>
                                    <Progress value={performanceMetrics.retention} className="mt-3 h-2" />
                                </div>
                                <div className="p-4 rounded-2xl bg-gradient-to-br from-purple-500 to-purple-600 shadow-lg shadow-purple-500/30">
                                    <Shield className="w-7 h-7 text-white" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Growth - Orange Gradient */}
                    <Card className="group relative overflow-hidden border-0 shadow-lg shadow-orange-500/10 hover:shadow-xl hover:shadow-orange-500/20 transition-all duration-300 hover:-translate-y-1">
                        <div className="absolute inset-0 bg-gradient-to-br from-orange-500 to-orange-600 opacity-0 group-hover:opacity-5 transition-opacity duration-300" />
                        <CardContent className="pt-6 relative">
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <p className="text-xs font-semibold text-orange-600 uppercase tracking-wide">
                                        Growth Rate
                                    </p>
                                    <p className="text-4xl font-bold mt-3 bg-gradient-to-r from-orange-600 to-orange-700 bg-clip-text text-transparent">
                                        +{performanceMetrics.growth}%
                                    </p>
                                    <div className="mt-3">
                                        <Badge variant="secondary" className="text-xs bg-orange-50 text-orange-700 border-orange-200">
                                            Year over year
                                        </Badge>
                                    </div>
                                </div>
                                <div className="p-4 rounded-2xl bg-gradient-to-br from-orange-500 to-orange-600 shadow-lg shadow-orange-500/30">
                                    <TrendingUp className="w-7 h-7 text-white" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Efficiency - Cyan Gradient */}
                    <Card className="group relative overflow-hidden border-0 shadow-lg shadow-cyan-500/10 hover:shadow-xl hover:shadow-cyan-500/20 transition-all duration-300 hover:-translate-y-1">
                        <div className="absolute inset-0 bg-gradient-to-br from-cyan-500 to-cyan-600 opacity-0 group-hover:opacity-5 transition-opacity duration-300" />
                        <CardContent className="pt-6 relative">
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <p className="text-xs font-semibold text-cyan-600 uppercase tracking-wide">
                                        Efficiency
                                    </p>
                                    <p className="text-4xl font-bold mt-3 bg-gradient-to-r from-cyan-600 to-cyan-700 bg-clip-text text-transparent">
                                        {performanceMetrics.efficiency}%
                                    </p>
                                    <Progress value={performanceMetrics.efficiency} className="mt-3 h-2" />
                                </div>
                                <div className="p-4 rounded-2xl bg-gradient-to-br from-cyan-500 to-cyan-600 shadow-lg shadow-cyan-500/30">
                                    <Zap className="w-7 h-7 text-white" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Quality Score - Emerald Gradient */}
                    <Card className="group relative overflow-hidden border-0 shadow-lg shadow-emerald-500/10 hover:shadow-xl hover:shadow-emerald-500/20 transition-all duration-300 hover:-translate-y-1">
                        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500 to-emerald-600 opacity-0 group-hover:opacity-5 transition-opacity duration-300" />
                        <CardContent className="pt-6 relative">
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wide">
                                        Quality Score
                                    </p>
                                    <p className="text-4xl font-bold mt-3 bg-gradient-to-r from-emerald-600 to-emerald-700 bg-clip-text text-transparent">
                                        {performanceMetrics.qualityScore}%
                                    </p>
                                    <Progress value={performanceMetrics.qualityScore} className="mt-3 h-2" />
                                </div>
                                <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-lg shadow-emerald-500/30">
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
                                <Button onClick={() => toast({ title: "Coming Soon", description: "Goal creation will be available soon" })} className="btn-primary-gradient">
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
