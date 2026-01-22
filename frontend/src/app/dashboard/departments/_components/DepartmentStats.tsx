"use client";

import { Users, FolderOpen, Wallet } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useGlobalCurrency } from '@/hooks/useGlobalCurrency';

interface DepartmentStatsProps {
    employees: number;
    projects: number;
    budget: number;
    efficiency?: number;
    goals?: number;
    completedGoals?: number;
}

export function DepartmentStats({
    employees,
    projects,
    budget,
}: DepartmentStatsProps) {
    const { formatAmount } = useGlobalCurrency();

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Employees - Blue Gradient */}
            <Card className="group relative overflow-hidden border-0 shadow-lg shadow-blue-500/10 hover:shadow-xl hover:shadow-blue-500/20 transition-all duration-300 hover:-translate-y-1">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-blue-600 opacity-0 group-hover:opacity-5 transition-opacity duration-300" />
                <CardContent className="pt-6 relative">
                    <div className="flex items-start justify-between">
                        <div className="flex-1">
                            <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide">
                                Employees
                            </p>
                            <p className="text-4xl font-bold mt-3 bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent">
                                {employees}
                            </p>
                            <p className="text-xs text-muted-foreground mt-2">Team members</p>
                        </div>
                        <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg shadow-blue-500/30">
                            <Users className="w-7 h-7 text-white" />
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Projects - Green Gradient */}
            <Card className="group relative overflow-hidden border-0 shadow-lg shadow-green-500/10 hover:shadow-xl hover:shadow-green-500/20 transition-all duration-300 hover:-translate-y-1">
                <div className="absolute inset-0 bg-gradient-to-br from-green-500 to-green-600 opacity-0 group-hover:opacity-5 transition-opacity duration-300" />
                <CardContent className="pt-6 relative">
                    <div className="flex items-start justify-between">
                        <div className="flex-1">
                            <p className="text-xs font-semibold text-green-600 uppercase tracking-wide">
                                Projects
                            </p>
                            <p className="text-4xl font-bold mt-3 bg-gradient-to-r from-green-600 to-green-700 bg-clip-text text-transparent">
                                {projects}
                            </p>
                            <p className="text-xs text-muted-foreground mt-2">Active projects</p>
                        </div>
                        <div className="p-4 rounded-2xl bg-gradient-to-br from-green-500 to-green-600 shadow-lg shadow-green-500/30">
                            <FolderOpen className="w-7 h-7 text-white" />
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Budget - Purple Gradient */}
            <Card className="group relative overflow-hidden border-0 shadow-lg shadow-purple-500/10 hover:shadow-xl hover:shadow-purple-500/20 transition-all duration-300 hover:-translate-y-1">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-purple-600 opacity-0 group-hover:opacity-5 transition-opacity duration-300" />
                <CardContent className="pt-6 relative">
                    <div className="flex items-start justify-between">
                        <div className="flex-1">
                            <p className="text-xs font-semibold text-purple-600 uppercase tracking-wide">
                                Budget
                            </p>
                            <p className="text-4xl font-bold mt-3 bg-gradient-to-r from-purple-600 to-purple-700 bg-clip-text text-transparent">
                                {formatAmount(budget)}
                            </p>
                            <p className="text-xs text-muted-foreground mt-2">Annual allocation</p>
                        </div>
                        <div className="p-4 rounded-2xl bg-gradient-to-br from-purple-500 to-purple-600 shadow-lg shadow-purple-500/30">
                            <Wallet className="w-7 h-7 text-white" />
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
