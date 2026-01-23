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
            {/* Employees */}
            <Card className="group relative overflow-hidden border-0 shadow-lg shadow-[#970E2C]/10 hover:shadow-xl hover:shadow-[#970E2C]/20 transition-all duration-300 hover:-translate-y-1">
                <div className="absolute inset-0 bg-gradient-to-br from-[#970E2C]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <CardContent className="pt-6 relative">
                    <div className="flex items-start justify-between">
                        <div className="flex-1">
                            <p className="text-xs font-semibold text-[#970E2C] uppercase tracking-wide">
                                Employees
                            </p>
                            <p className="text-4xl font-bold mt-3 bg-gradient-to-r from-[#970E2C] to-[#800020] bg-clip-text text-transparent">
                                {employees}
                            </p>
                            <p className="text-xs text-muted-foreground mt-2">Team members</p>
                        </div>
                        <div className="p-4 rounded-2xl bg-gradient-to-br from-[#970E2C] to-[#800020] shadow-lg shadow-[#970E2C]/30">
                            <Users className="w-7 h-7 text-white" />
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Projects */}
            <Card className="group relative overflow-hidden border-0 shadow-lg shadow-[#970E2C]/10 hover:shadow-xl hover:shadow-[#970E2C]/20 transition-all duration-300 hover:-translate-y-1">
                <div className="absolute inset-0 bg-gradient-to-br from-[#970E2C]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <CardContent className="pt-6 relative">
                    <div className="flex items-start justify-between">
                        <div className="flex-1">
                            <p className="text-xs font-semibold text-[#970E2C] uppercase tracking-wide">
                                Projects
                            </p>
                            <p className="text-4xl font-bold mt-3 bg-gradient-to-r from-[#970E2C] to-[#800020] bg-clip-text text-transparent">
                                {projects}
                            </p>
                            <p className="text-xs text-muted-foreground mt-2">Active projects</p>
                        </div>
                        <div className="p-4 rounded-2xl bg-gradient-to-br from-[#970E2C] to-[#800020] shadow-lg shadow-[#970E2C]/30">
                            <FolderOpen className="w-7 h-7 text-white" />
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Budget */}
            <Card className="group relative overflow-hidden border-0 shadow-lg shadow-[#970E2C]/10 hover:shadow-xl hover:shadow-[#970E2C]/20 transition-all duration-300 hover:-translate-y-1">
                <div className="absolute inset-0 bg-gradient-to-br from-[#970E2C]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <CardContent className="pt-6 relative">
                    <div className="flex items-start justify-between">
                        <div className="flex-1">
                            <p className="text-xs font-semibold text-[#970E2C] uppercase tracking-wide">
                                Budget
                            </p>
                            <p className="text-4xl font-bold mt-3 bg-gradient-to-r from-[#970E2C] to-[#800020] bg-clip-text text-transparent">
                                {formatAmount(budget)}
                            </p>
                            <p className="text-xs text-muted-foreground mt-2">Annual allocation</p>
                        </div>
                        <div className="p-4 rounded-2xl bg-gradient-to-br from-[#970E2C] to-[#800020] shadow-lg shadow-[#970E2C]/30">
                            <Wallet className="w-7 h-7 text-white" />
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
