"use client";

import { Building, ChevronRight } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Department } from "@/types/department";

interface DepartmentHeaderProps {
    department: Department;
    currentPage?: string;
}

export function DepartmentHeader({ department, currentPage }: DepartmentHeaderProps) {
    return (
        <div className="space-y-4">
            {/* Breadcrumbs */}
            <nav className="flex items-center space-x-2 text-sm text-muted-foreground">
                <Link href="/dashboard" className="hover:text-foreground transition-colors">
                    Dashboard
                </Link>
                <ChevronRight className="w-4 h-4" />
                <Link href="/dashboard/departments" className="hover:text-foreground transition-colors">
                    Departments
                </Link>
                <ChevronRight className="w-4 h-4" />
                <span className="text-foreground font-medium">{department.name}</span>
                {currentPage && (
                    <>
                        <ChevronRight className="w-4 h-4" />
                        <span className="text-foreground font-medium">{currentPage}</span>
                    </>
                )}
            </nav>

            {/* Department Title */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-primary/10 rounded-lg">
                        <Building className="w-8 h-8 text-primary" />
                    </div>
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-3xl font-bold">{department.name}</h1>
                            <Badge variant={department.status === "active" ? "default" : "secondary"}>
                                {department.status}
                            </Badge>
                        </div>
                        <p className="text-muted-foreground mt-1">{department.description}</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
