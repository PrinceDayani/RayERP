"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { Eye, Edit, Users, Wallet, BarChart3, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { usePermissions } from "@/hooks/usePermissions";
import { PERMISSIONS } from "@/lib/permissions";

interface DepartmentNavProps {
    departmentId: string;
}

const navItems = [
    { href: "", label: "Overview", icon: Eye, permission: PERMISSIONS.VIEW_DEPARTMENT_DETAILS },
    { href: "/edit", label: "Edit", icon: Edit, permission: PERMISSIONS.EDIT_DEPARTMENT },
    { href: "/members", label: "Members", icon: Users, permission: PERMISSIONS.DEPT_VIEW_MEMBERS },
    { href: "/budget", label: "Budget", icon: Wallet, permission: PERMISSIONS.DEPT_VIEW_BUDGET },
    { href: "/performance", label: "Performance", icon: BarChart3, permission: PERMISSIONS.DEPT_VIEW_PERFORMANCE },
    { href: "/settings", label: "Settings", icon: Settings, permission: PERMISSIONS.DEPT_VIEW_SETTINGS },
];

export function DepartmentNav({ departmentId }: DepartmentNavProps) {
    const pathname = usePathname();
    const basePath = `/dashboard/departments/${departmentId}`;
    const { hasPermission } = usePermissions();

    // Filter tabs based on permissions
    const visibleItems = navItems.filter(item => !item.permission || hasPermission(item.permission));

    return (
        <div className="border-b">
            <nav className="flex space-x-1 px-1">
                {visibleItems.map((item) => {
                    const href = `${basePath}${item.href}`;
                    const isActive = item.href === ""
                        ? pathname === basePath
                        : pathname.startsWith(href);
                    const Icon = item.icon;

                    return (
                        <Link
                            key={item.href}
                            href={href}
                            className={cn(
                                "flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors",
                                isActive
                                    ? "border-primary text-primary"
                                    : "border-transparent text-muted-foreground hover:text-foreground hover:border-muted"
                            )}
                        >
                            <Icon className="w-4 h-4" />
                            {item.label}
                        </Link>
                    );
                })}
            </nav>
        </div>
    );
}
