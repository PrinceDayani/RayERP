"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import Navbar from "./Navbar";
import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  LayoutDashboard,
  Users,
  Briefcase,
  BarChart3,
  Settings,
  Shield,
  CheckCircle,
  UserCheck,
  Calculator,
  PieChart,
  Wallet,
  Target,
  ClipboardList,
  UserCog,
  Boxes,
  Building,
  Activity,
  MessageCircle,
  GitBranch,
  FileText
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { usePermissions } from "@/hooks/usePermissions";
import { normaliseRoleName, ELEVATED_ROLE_LEVEL } from "@/lib/permissions";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/tooltip";
import BackendStatus from "@/components/BackendStatus";
import RealTimeNotifications from "@/components/RealTimeNotifications";

interface LayoutProps {
  children: React.ReactNode;
}

interface MenuItem {
  path: string;
  name: string;
  icon?: string;
  access?: boolean;
  subItems?: SubMenuItem[];
}

interface SubMenuItem {
  path: string;
  name: string;
}

export default function Layout({ children }: LayoutProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [expandedMenus, setExpandedMenus] = useState<string[]>([]);
  const [isClient, setIsClient] = useState(false);
  const pathname = usePathname();
  const { user } = useAuth();
  const { hasPermission, hasAnyPermission } = usePermissions();

  // Compare on the normalised name: the stored role is "Super Admin", which
  // never equalled the "super_admin" this used to look for, so every
  // admin-only entry stayed hidden from the people who should see it.
  const roleName = normaliseRoleName(typeof user?.role === 'string' ? user.role : user?.role?.name || '');
  const roleLevel = typeof user?.role === 'string' ? 0 : user?.role?.level ?? 0;
  const isRoot = roleName === "root";
  const isSuperAdmin = roleName === "superadmin";
  const isAdmin = roleName === "admin";
  // A role granted everything outranks the name checks above.
  const isElevated = isRoot || roleLevel >= ELEVATED_ROLE_LEVEL || hasPermission('*');
  const isManager = roleName === "manager" || isAdmin || isSuperAdmin || isElevated;

  // Module access checks (Root has access to everything).
  //
  // These must name permissions the system actually defines. 'finance.view',
  // 'departments.*' and 'resources.*' are not in the permission catalogue and
  // never have been, so gating on them alone hid those sections from everyone
  // but Root — no grant could fix it, because the names are not grantable.
  // The catalogue expresses finance access per ledger area, so accept those;
  // departments are HR records and resources are project allocations.
  const hasFinanceAccess = isElevated || hasAnyPermission([
    'finance.view', 'finance.manage',
    'accounts.view', 'journal.view', 'ledger.view', 'bills.view',
    'invoices.view', 'payments.view', 'expenses.view',
  ]);
  const hasEmployeeAccess = isElevated || hasAnyPermission(['employees.view', 'employees.manage']);
  const hasDepartmentAccess = isElevated || hasAnyPermission(['departments.view', 'departments.manage', 'employees.view']);
  const hasProjectAccess = isElevated || hasAnyPermission(['projects.view', 'projects.manage', 'projects.view_all']);
  const hasTaskAccess = isElevated || hasAnyPermission(['tasks.view', 'tasks.manage', 'tasks.view_all']);
  const hasResourceAccess = isElevated || hasAnyPermission(['resources.view', 'resources.manage', 'projects.view']);
  const hasBudgetAccess = isElevated || hasAnyPermission(['budgets.view', 'budgets.manage']);
  const hasReportAccess = isElevated || hasAnyPermission(['reports.view', 'reports.manage']);

  const menuSections = useMemo(() => [
    {
      title: "Overview",
      items: [
        { path: "/dashboard", name: "Dashboard", icon: LayoutDashboard, description: "Main dashboard overview" } as MenuItem & { icon: any; description: string },
        { path: "/dashboard/activity", name: "Activity Feed", icon: Activity, description: "Organization activity stream" } as MenuItem & { icon: any; description: string },
      ]
    },
    {
      title: "Communication",
      items: [
        { path: "/dashboard/chat", name: "Chat", icon: MessageCircle, description: "Team messaging" } as MenuItem & { icon: any; description: string },
        { path: "/dashboard/contacts", name: "Contacts", icon: Users, description: "Manage business contacts" } as MenuItem & { icon: any; description: string },
      ]
    },
    {
      title: "Human Resources",
      items: [
        { path: "/dashboard/users", name: "User Management", icon: UserCog, description: "System user administration", access: isAdmin || isSuperAdmin || isElevated } as MenuItem & { icon: any; description: string },
        { path: "/dashboard/employees", name: "Employees", icon: UserCheck, description: "Employee management", access: hasEmployeeAccess } as MenuItem & { icon: any; description: string },
        { path: "/dashboard/departments", name: "Departments", icon: Building, description: "Department management", access: hasDepartmentAccess } as MenuItem & { icon: any; description: string }
      ]
    },
    {
      title: "Project Management",
      items: [
        { path: "/dashboard/projects", name: "Projects", icon: Briefcase, description: "Project tracking & management", access: hasProjectAccess } as MenuItem & { icon: any; description: string },
        { path: "/dashboard/tasks", name: "Tasks", icon: CheckCircle, description: "Task management", access: hasTaskAccess } as MenuItem & { icon: any; description: string },
        { path: "/dashboard/workflows", name: "Workflows", icon: GitBranch, description: "Workflow management & automation", access: hasProjectAccess || isManager } as MenuItem & { icon: any; description: string },
        { path: "/dashboard/resources", name: "Resources", icon: Boxes, description: "Resource planning", access: hasResourceAccess } as MenuItem & { icon: any; description: string }
      ]
    },
    {
      title: "Budget & Finance",
      items: [
        { path: "/dashboard/budgets", name: "Budgets", icon: Calculator, description: "Budget planning & tracking", access: hasBudgetAccess } as MenuItem & { icon: any; description: string },
        { path: "/dashboard/budgets/templates", name: "Budget Templates", icon: ClipboardList, description: "Reusable budget templates", access: hasBudgetAccess } as MenuItem & { icon: any; description: string },
        { path: "/dashboard/budgets/approvals", name: "Approvals", icon: Target, description: "Budget approval workflow", access: hasBudgetAccess && isManager } as MenuItem & { icon: any; description: string },
        { path: "/dashboard/budgets/analytics", name: "Budget Analytics", icon: PieChart, description: "Budget performance analysis", access: hasBudgetAccess && isManager } as MenuItem & { icon: any; description: string },
        { path: "/dashboard/finance", name: "Finance", icon: Wallet, description: "Financial accounting", access: hasFinanceAccess } as MenuItem & { icon: any; description: string },
      ]
    },
    {
      title: "Analytics & Reports",
      items: [
        { path: "/dashboard/reports", name: "Reports", icon: BarChart3, description: "Business intelligence reports", access: hasReportAccess || isManager } as MenuItem & { icon: any; description: string },
        { path: "/dashboard/daily-reports", name: "Daily Reports", icon: FileText, description: "Cross-project daily report monitoring", access: true } as MenuItem & { icon: any; description: string },
      ]
    },
    {
      title: "System Administration",
      items: [
        { path: "/dashboard/settings", name: "Settings", icon: Settings, description: "System configuration" } as MenuItem & { icon: any; description: string },
        { path: "/dashboard/admin", name: "Admin Panel", icon: Shield, description: "Advanced system controls", access: isAdmin || isSuperAdmin || isElevated } as MenuItem & { icon: any; description: string },
      ]
    }
  ], [isAdmin, isSuperAdmin, isRoot, isElevated, isManager, hasFinanceAccess, hasEmployeeAccess, hasDepartmentAccess, hasProjectAccess, hasTaskAccess, hasResourceAccess, hasBudgetAccess, hasReportAccess]);

  useEffect(() => {
    setIsClient(true);
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth < 768) {
        setCollapsed(true);
      }
    };

    checkScreenSize();
    window.addEventListener("resize", checkScreenSize);

    return () => {
      window.removeEventListener("resize", checkScreenSize);
    };
  }, []);

  useEffect(() => {
    if (isMobile) {
      setSidebarOpen(false);
    }
  }, [pathname, isMobile]);

  const toggleSidebar = () => {
    if (isMobile) {
      setSidebarOpen(!sidebarOpen);
    } else {
      setCollapsed(!collapsed);
    }
  };

  const toggleMenu = useCallback((path: string) => {
    setExpandedMenus(prev =>
      prev.includes(path)
        ? prev.filter(p => p !== path)
        : [...prev, path]
    );
  }, []);

  const isMenuExpanded = (path: string) => expandedMenus.includes(path);

  const isSubItemActive = (item: MenuItem) => {
    if (!item.subItems) return false;
    return item.subItems.some((subItem: SubMenuItem) => pathname === subItem.path);
  };

  if (!isClient) {
    return (
      <div className="flex h-screen overflow-hidden bg-background">
        <div className="w-64 bg-white dark:bg-stone-900 border-r border-stone-200 dark:border-stone-800 flex flex-col h-full">
          <div className="p-4 border-b border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Image src="/RAYlogo.webp" alt="RayERP Logo" width={180} height={60} className="object-contain" />
              </div>
            </div>
          </div>
        </div>
        <div className="flex flex-1 flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto bg-white dark:bg-stone-950">
            <div className="p-4">{children}</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar */}
      <div
        className={`${isMobile
          ? `fixed inset-y-0 left-0 z-30 w-64 bg-card border-r border-border transform transition-transform duration-200 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"
          }`
          : `${collapsed ? "w-16" : "w-64"} bg-card border-r border-border transition-all duration-200`
          } flex flex-col h-full`}
      >
        {/* Header */}
        <div className="p-4 border-b border-border">
          <div className="flex items-center justify-between">
            {!collapsed && (
              <div className="flex items-center space-x-3">
                <Image src="/RAYlogo.webp" alt="RayERP Logo" width={180} height={60} className="object-contain" />
              </div>
            )}
            {collapsed && (
              <div className="flex items-center justify-center w-full">
                <Image src="/RAYlogo.webp" alt="RayERP Logo" width={40} height={40} className="object-contain" />
              </div>
            )}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={toggleSidebar}
                    className="p-2 hover:bg-accent rounded-md transition-colors"
                  >
                    {collapsed ? (
                      <ChevronRight className="w-4 h-4" />
                    ) : (
                      <ChevronLeft className="w-4 h-4" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right">
                  <p>{collapsed ? 'Expand sidebar' : 'Collapse sidebar'}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 scrollbar-thin">
          <TooltipProvider>
            <div className="space-y-6">
              {menuSections.map((section) => (
                <div key={section.title}>
                  {!collapsed && (
                    <h3 className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                      {section.title}
                    </h3>
                  )}
                  <div className="space-y-1">
                    {section.items.map((item: any) => {
                      if (item.access === false) return null;

                      const isActive = pathname === item.path || (item.path !== '/dashboard' && pathname.startsWith(item.path + '/')) || isSubItemActive(item);
                      const hasSubItems = item.subItems && item.subItems.length > 0;
                      const isExpanded = isMenuExpanded(item.path);
                      const Icon = item.icon;

                      const menuItem = (
                        <div key={item.path}>
                          {hasSubItems ? (
                            <button
                              onClick={() => toggleMenu(item.path)}
                              className={`w-full flex items-center justify-between px-3 py-2 text-sm font-medium rounded-md transition-colors ${isActive
                                ? "bg-primary text-primary-foreground"
                                : "text-foreground hover:bg-accent"
                                }`}
                            >
                              <div className="flex items-center">
                                <Icon className={`w-5 h-5 ${collapsed ? 'mx-auto' : ''} transition-colors`} />
                                {!collapsed && (
                                  <span className="ml-3 font-medium">{item.name}</span>
                                )}
                              </div>
                              {!collapsed && (
                                <div className="ml-auto">
                                  {isExpanded ? (
                                    <ChevronUp className="w-4 h-4 transition-transform" />
                                  ) : (
                                    <ChevronDown className="w-4 h-4 transition-transform" />
                                  )}
                                </div>
                              )}
                            </button>
                          ) : (
                            <Link href={item.path} prefetch={false}>
                              <div
                                className={`flex items-center px-3 py-2 text-sm font-medium rounded-md cursor-pointer transition-colors ${isActive
                                  ? "bg-primary text-primary-foreground"
                                  : "text-foreground hover:bg-accent"
                                  }`}
                              >
                                <Icon className={`w-5 h-5 ${collapsed ? 'mx-auto' : ''}`} />
                                {!collapsed && (
                                  <span className="ml-3 font-medium">{item.name}</span>
                                )}
                              </div>
                            </Link>
                          )}

                          {/* Sub Items */}
                          {hasSubItems && isExpanded && !collapsed && item.subItems && (
                            <div className="ml-6 mt-1 space-y-1">
                              {item.subItems.map((subItem: SubMenuItem) => (
                                <Link key={subItem.path} href={subItem.path} prefetch={false}>
                                  <div
                                    className={`flex items-center px-3 py-1.5 text-sm rounded-md transition-colors ${pathname === subItem.path
                                      ? "bg-accent text-primary font-medium"
                                      : "text-muted-foreground hover:bg-accent hover:text-foreground"
                                      }`}
                                  >
                                    <div className="w-1.5 h-1.5 rounded-full bg-current opacity-60 mr-2" />
                                    {subItem.name}
                                  </div>
                                </Link>
                              ))}
                            </div>
                          )}
                        </div>
                      );

                      return collapsed ? (
                        <Tooltip key={item.path}>
                          <TooltipTrigger asChild>
                            {menuItem}
                          </TooltipTrigger>
                          <TooltipContent side="right" className="ml-2">
                            <div>
                              <p className="font-medium">{item.name}</p>
                              {item.description && (
                                <p className="text-xs text-muted-foreground mt-1">{item.description}</p>
                              )}
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      ) : (
                        menuItem
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </TooltipProvider>
        </nav>
      </div>

      {/* Mobile overlay */}
      {isMobile && sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/50 transition-opacity"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <RealTimeNotifications />
        <div className="sticky top-0 z-10">
          <Navbar toggleSidebar={toggleSidebar} isMobile={isMobile} />
        </div>
        <main className="flex-1 overflow-y-auto bg-secondary/30">
          <div className="p-4">
            <BackendStatus />
          </div>
          <div className="px-4 pb-4">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
