"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    Briefcase,
    Clock,
    CheckCircle2,
    TrendingUp,
    Award,
    Users,
    Code,
    BarChart3
} from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface WorkSummary {
    totalProjects: number;
    activeProjects: number;
    completedProjects: number;
    totalHours: number;
    totalTasks: number;
    completedTasks: number;
    attendanceRate: number;
    topSkills: string[];
    topRoles: string[];
    yearsOfExperience: number;
}

interface WorkSummaryDashboardProps {
    summary: WorkSummary;
}

export default function WorkSummaryDashboard({ summary }: WorkSummaryDashboardProps) {
    const completionRate = summary.totalTasks > 0
        ? Math.round((summary.completedTasks / summary.totalTasks) * 100)
        : 0;

    const projectCompletionRate = summary.totalProjects > 0
        ? Math.round((summary.completedProjects / summary.totalProjects) * 100)
        : 0;

    return (
        <div className="space-y-6">
            {/* Header Card */}
            <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 via-background to-background">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-2xl">
                        <BarChart3 className="w-6 h-6 text-primary" />
                        Work Summary & Analytics
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                        Comprehensive overview of professional contributions and performance
                    </p>
                </CardHeader>
            </Card>

            {/* Key Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Total Projects */}
                <Card className="hover:shadow-lg transition-shadow border-l-4 border-l-blue-500">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-2">
                            <Briefcase className="w-8 h-8 text-blue-500" />
                            <div className="text-right">
                                <div className="text-3xl font-bold">{summary.totalProjects}</div>
                                <div className="text-xs text-muted-foreground">Total Projects</div>
                            </div>
                        </div>
                        <div className="mt-4">
                            <div className="flex justify-between text-sm mb-1">
                                <span className="text-green-600 font-medium">{summary.completedProjects} Completed</span>
                                <span className="text-blue-600 font-medium">{summary.activeProjects} Active</span>
                            </div>
                            <Progress value={projectCompletionRate} className="h-2" />
                            <div className="text-xs text-muted-foreground mt-1 text-right">
                                {projectCompletionRate}% Success Rate
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Total Hours */}
                <Card className="hover:shadow-lg transition-shadow border-l-4 border-l-purple-500">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-2">
                            <Clock className="w-8 h-8 text-purple-500" />
                            <div className="text-right">
                                <div className="text-3xl font-bold">{summary.totalHours.toLocaleString()}</div>
                                <div className="text-xs text-muted-foreground">Total Hours</div>
                            </div>
                        </div>
                        <div className="mt-4 space-y-1">
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Avg per Month</span>
                                <span className="font-medium">
                                    {summary.yearsOfExperience > 0
                                        ? Math.round(summary.totalHours / (summary.yearsOfExperience * 12))
                                        : 0}h
                                </span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Experience</span>
                                <span className="font-medium">{summary.yearsOfExperience} years</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Task Performance */}
                <Card className="hover:shadow-lg transition-shadow border-l-4 border-l-green-500">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-2">
                            <CheckCircle2 className="w-8 h-8 text-green-500" />
                            <div className="text-right">
                                <div className="text-3xl font-bold">{summary.totalTasks}</div>
                                <div className="text-xs text-muted-foreground">Total Tasks</div>
                            </div>
                        </div>
                        <div className="mt-4">
                            <div className="flex justify-between text-sm mb-1">
                                <span className="text-muted-foreground">Completed</span>
                                <span className="text-green-600 font-medium">{summary.completedTasks}</span>
                            </div>
                            <Progress value={completionRate} className="h-2" />
                            <div className="text-xs text-muted-foreground mt-1 text-right">
                                {completionRate}% Completion Rate
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Attendance */}
                <Card className="hover:shadow-lg transition-shadow border-l-4 border-l-orange-500">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-2">
                            <TrendingUp className="w-8 h-8 text-orange-500" />
                            <div className="text-right">
                                <div className="text-3xl font-bold">{summary.attendanceRate}%</div>
                                <div className="text-xs text-muted-foreground">Attendance Rate</div>
                            </div>
                        </div>
                        <div className="mt-4">
                            <Progress value={summary.attendanceRate} className="h-2" />
                            <div className="text-xs text-center mt-2 font-medium">
                                {summary.attendanceRate >= 95 ? (
                                    <span className="text-green-600">Excellent</span>
                                ) : summary.attendanceRate >= 85 ? (
                                    <span className="text-blue-600">Good</span>
                                ) : (
                                    <span className="text-orange-600">Needs Improvement</span>
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Skills & Roles */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Top Skills */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Code className="w-5 h-5 text-primary" />
                            Top Skills & Expertise
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {summary.topSkills.length > 0 ? (
                            <div className="flex flex-wrap gap-2">
                                {summary.topSkills.map((skill, index) => (
                                    <Badge
                                        key={index}
                                        variant="secondary"
                                        className="px-3 py-1 text-sm bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20"
                                    >
                                        <Award className="w-3 h-3 mr-1" />
                                        {skill}
                                    </Badge>
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm text-muted-foreground text-center py-4">
                                No skills data available
                            </p>
                        )}
                    </CardContent>
                </Card>

                {/* Top Roles */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Users className="w-5 h-5 text-primary" />
                            Primary Roles
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {summary.topRoles.length > 0 ? (
                            <div className="space-y-2">
                                {summary.topRoles.map((role, index) => (
                                    <div
                                        key={index}
                                        className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                                    >
                                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                                            <Briefcase className="w-4 h-4 text-primary" />
                                        </div>
                                        <span className="font-medium">{role}</span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm text-muted-foreground text-center py-4">
                                No roles data available
                            </p>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Performance Summary */}
            <Card className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 border-2 border-green-200 dark:border-green-800">
                <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-full bg-green-500 flex items-center justify-center">
                            <TrendingUp className="w-8 h-8 text-white" />
                        </div>
                        <div className="flex-1">
                            <h3 className="text-xl font-bold mb-1">Overall Performance</h3>
                            <p className="text-sm text-muted-foreground">
                                Consistently delivering quality work with {completionRate}% task completion rate
                                and {summary.attendanceRate}% attendance across {summary.totalProjects} projects
                            </p>
                        </div>
                        <div className="text-center">
                            <div className="text-4xl font-bold text-green-600">
                                {Math.round((completionRate + summary.attendanceRate) / 2)}
                            </div>
                            <div className="text-xs text-muted-foreground">Performance Score</div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
