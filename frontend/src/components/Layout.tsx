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
  Building2,
  UserCheck,
  Calculator,
  PieChart,
  Wallet,
  Receipt,
  Target,
  ClipboardList,
  UserCog,
  Boxes,
  Building,
  Activity,
  MessageCircle
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { usePermissions } from "@/hooks/usePermissions";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
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

  const roleName = typeof user?.role === 'string' ? user.role : user?.role?.name || '';
  const isRoot = roleName.toLowerCase() === "root";
  const isSuperAdmin = roleName.toLowerCase() === "super_admin" || roleName.toLowerCase() === "superadmin";
  const isAdmin = roleName.toLowerCase() === "admin";
  const isManager = roleName.toLowerCase() === "manager" || isAdmin || isSuperAdmin || isRoot;

  // Module access checks (Root has access to everything)
  const hasFinanceAccess = isRoot || hasAnyPermission(['finance.view', 'finance.manage']);
  const hasEmployeeAccess = isRoot || hasAnyPermission(['employees.view', 'employees.manage']);
  const hasDepartmentAccess = isRoot || hasAnyPermission(['departments.view', 'departments.manage']);
  const hasProjectAccess = isRoot || hasAnyPermission(['projects.view', 'projects.manage']);
  const hasTaskAccess = isRoot || hasAnyPermission(['tasks.view', 'tasks.manage']);
  const hasResourceAccess = isRoot || hasAnyPermission(['resources.view', 'resources.manage']);
  const hasBudgetAccess = isRoot || hasAnyPermission(['budgets.view', 'budgets.manage']);
  const hasReportAccess = isRoot || hasAnyPermission(['reports.view', 'reports.manage']);

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
        { path: "/dashboard/users", name: "User Management", icon: UserCog, description: "System user administration", access: isAdmin || isSuperAdmin || isRoot } as MenuItem & { icon: any; description: string },
        { path: "/dashboard/employees", name: "Employees", icon: UserCheck, description: "Employee management", access: hasEmployeeAccess } as MenuItem & { icon: any; description: string },
        { path: "/dashboard/departments", name: "Departments", icon: Building, description: "Department management", access: hasDepartmentAccess } as MenuItem & { icon: any; description: string }
      ]
    },
    {
      title: "Project Management",
      items: [
        { path: "/dashboard/projects", name: "Projects", icon: Briefcase, description: "Project tracking & management", access: hasProjectAccess } as MenuItem & { icon: any; description: string },
        { path: "/dashboard/tasks", name: "Tasks", icon: CheckCircle, description: "Task management", access: hasTaskAccess } as MenuItem & { icon: any; description: string },
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
      ]
    },
    {
      title: "System Administration",
      items: [
        { path: "/dashboard/settings", name: "Settings", icon: Settings, description: "System configuration" } as MenuItem & { icon: any; description: string },
        { path: "/dashboard/backup", name: "System Backup", icon: Receipt, description: "Download system backup", access: isAdmin || isSuperAdmin || isRoot } as MenuItem & { icon: any; description: string },
        { path: "/dashboard/admin", name: "Admin Panel", icon: Shield, description: "Advanced system controls", access: isAdmin || isSuperAdmin || isRoot } as MenuItem & { icon: any; description: string },
      ]
    }
  ], [isAdmin, isSuperAdmin, isRoot, isManager, hasFinanceAccess, hasEmployeeAccess, hasDepartmentAccess, hasProjectAccess, hasTaskAccess, hasResourceAccess, hasBudgetAccess, hasReportAccess]);

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

  const getRoleColor = (role: any) => {
    const roleName = typeof role === 'string' ? role : role?.name || '';
    switch (roleName.toLowerCase()) {
      case 'root':
        return 'bg-red-500';
      case 'super_admin':
      case 'superadmin':
        return 'bg-purple-500';
      case 'admin':
        return 'bg-red-500';
      case 'manager':
        return 'bg-green-500';
      default:
        return 'bg-gray-500';
    }
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
    <div className="flex h-screen overflow-hidden bg-gradient-to-br from-stone-50 via-rose-50/20 to-amber-50/10 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      {/* Sidebar */}
      <div
        className={`${isMobile
          ? `fixed inset-y-0 left-0 z-30 w-64 bg-gradient-to-b from-stone-100 via-stone-50 to-white dark:from-slate-800 dark:via-slate-800 dark:to-slate-900 border-r border-stone-200/50 dark:border-slate-700/50 shadow-[8px_0_24px_rgba(0,0,0,0.1)] dark:shadow-[8px_0_24px_rgba(0,0,0,0.2)] transform transition-transform duration-300 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"
          }`
          : `${collapsed ? "w-16" : "w-64"} bg-gradient-to-b from-stone-100 via-stone-50 to-white dark:from-slate-800 dark:via-slate-800 dark:to-slate-900 border-r border-stone-200/50 dark:border-slate-700/50 shadow-[8px_0_24px_rgba(0,0,0,0.08)] dark:shadow-[8px_0_24px_rgba(0,0,0,0.15)] transition-all duration-300 ease-in-out`
          } flex flex-col h-full relative before:absolute before:inset-0 before:bg-[radial-gradient(ellipse_at_top,rgba(136,19,55,0.05),transparent_50%)] dark:before:bg-[radial-gradient(ellipse_at_top,rgba(136,19,55,0.08),transparent_50%)] before:pointer-events-none`}
      >
        {/* Header */}
        <div className="p-4 border-b border-stone-200/50 dark:border-slate-700/50 bg-gradient-to-br from-white/80 to-stone-50/80 dark:from-slate-800/80 dark:to-slate-800/60 backdrop-blur-sm shadow-[0_4px_12px_rgba(0,0,0,0.05)] dark:shadow-[0_4px_12px_rgba(0,0,0,0.2)]">
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
                    className="p-2 hover:bg-stone-200 dark:hover:bg-slate-700 rounded-lg transition-all shadow-[2px_2px_4px_rgba(0,0,0,0.1),-1px_-1px_2px_rgba(255,255,255,0.8)] dark:shadow-[2px_2px_4px_rgba(0,0,0,0.2),-1px_-1px_2px_rgba(255,255,255,0.02)] active:shadow-[inset_2px_2px_4px_rgba(0,0,0,0.15)] dark:active:shadow-[inset_2px_2px_4px_rgba(0,0,0,0.3)]"
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
        <nav className="flex-1 overflow-y-auto py-4 px-2 scrollbar-thin scrollbar-thumb-stone-300 dark:scrollbar-thumb-slate-600 scrollbar-track-stone-100 dark:scrollbar-track-slate-800">
          <TooltipProvider>
            <div className="space-y-6">
              {menuSections.map((section) => (
                <div key={section.title}>
                  {!collapsed && (
                    <h3 className="px-3 text-xs font-semibold text-stone-500 dark:text-slate-400 uppercase tracking-wider mb-3 drop-shadow-[0_1px_1px_rgba(255,255,255,0.8)] dark:drop-shadow-[0_1px_2px_rgba(0,0,0,0.3)]">
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
                              className={`w-full flex items-center justify-between px-3 py-2.5 text-sm font-medium rounded-xl group transition-all ${isActive
                                ? "bg-gradient-to-r from-rose-700 to-rose-800 text-white shadow-[3px_3px_8px_rgba(136,19,55,0.4),-1px_-1px_4px_rgba(255,255,255,0.1),inset_0_1px_2px_rgba(255,255,255,0.2)]"
                                : "text-stone-700 dark:text-slate-300 hover:bg-stone-200 dark:hover:bg-slate-700 hover:text-stone-900 dark:hover:text-slate-100 shadow-[2px_2px_4px_rgba(0,0,0,0.08),-1px_-1px_2px_rgba(255,255,255,0.8)] dark:shadow-[2px_2px_4px_rgba(0,0,0,0.15),-1px_-1px_2px_rgba(255,255,255,0.02)] hover:shadow-[3px_3px_6px_rgba(0,0,0,0.12),-1px_-1px_3px_rgba(255,255,255,0.9)] dark:hover:shadow-[3px_3px_6px_rgba(0,0,0,0.2),-1px_-1px_3px_rgba(255,255,255,0.03)]"
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
                                className={`flex items-center px-3 py-2.5 text-sm font-medium rounded-xl group cursor-pointer transition-all ${isActive
                                  ? "bg-gradient-to-r from-rose-700 to-rose-800 text-white shadow-[3px_3px_8px_rgba(136,19,55,0.4),-1px_-1px_4px_rgba(255,255,255,0.1),inset_0_1px_2px_rgba(255,255,255,0.2)]"
                                  : "text-stone-700 dark:text-slate-300 hover:bg-stone-200 dark:hover:bg-slate-700 hover:text-stone-900 dark:hover:text-slate-100 shadow-[2px_2px_4px_rgba(0,0,0,0.08),-1px_-1px_2px_rgba(255,255,255,0.8)] dark:shadow-[2px_2px_4px_rgba(0,0,0,0.15),-1px_-1px_2px_rgba(255,255,255,0.02)] hover:shadow-[3px_3px_6px_rgba(0,0,0,0.12),-1px_-1px_3px_rgba(255,255,255,0.9)] dark:hover:shadow-[3px_3px_6px_rgba(0,0,0,0.2),-1px_-1px_3px_rgba(255,255,255,0.03)]"
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
                            <div className="ml-8 mt-1 space-y-1">
                              {item.subItems.map((subItem: SubMenuItem) => (
                                <Link key={subItem.path} href={subItem.path} prefetch={false}>
                                  <div
                                    className={`flex items-center px-3 py-2 text-sm rounded-lg transition-all ${pathname === subItem.path
                                      ? "bg-gradient-to-r from-rose-100 to-rose-50 dark:from-rose-900/20 dark:to-rose-800/20 text-rose-700 dark:text-rose-300 font-medium shadow-[inset_2px_2px_4px_rgba(136,19,55,0.15)] dark:shadow-[inset_2px_2px_4px_rgba(0,0,0,0.2)]"
                                      : "text-stone-600 dark:text-slate-400 hover:bg-stone-200 dark:hover:bg-slate-700 hover:text-stone-900 dark:hover:text-slate-200"
                                      }`}
                                  >
                                    <div className="w-2 h-2 rounded-full bg-current opacity-50 mr-3" />
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

        {/* User Profile */}
        {user && (
          <div className="p-4 border-t border-stone-200/50 dark:border-slate-700/50 bg-gradient-to-br from-white/80 to-stone-50/80 dark:from-slate-800/80 dark:to-slate-800/60 backdrop-blur-sm shadow-[0_-4px_12px_rgba(0,0,0,0.05)] dark:shadow-[0_-4px_12px_rgba(0,0,0,0.2)]">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className={`flex items-center space-x-3 p-2 rounded-xl hover:bg-stone-200 dark:hover:bg-slate-700 transition-all cursor-pointer shadow-[2px_2px_4px_rgba(0,0,0,0.08),-1px_-1px_2px_rgba(255,255,255,0.8)] dark:shadow-[2px_2px_4px_rgba(0,0,0,0.15),-1px_-1px_2px_rgba(255,255,255,0.02)] hover:shadow-[3px_3px_6px_rgba(0,0,0,0.12),-1px_-1px_3px_rgba(255,255,255,0.9)] dark:hover:shadow-[3px_3px_6px_rgba(0,0,0,0.2),-1px_-1px_3px_rgba(255,255,255,0.03)] ${collapsed ? 'justify-center' : ''}`}>
                    <div className="relative">
                      <Avatar className="w-10 h-10 border-2 border-rose-300 dark:border-rose-700/50 shadow-[2px_2px_6px_rgba(136,19,55,0.3)] dark:shadow-[2px_2px_6px_rgba(136,19,55,0.3)]">
                        <AvatarFallback className={`${getRoleColor(user.role)} text-white text-sm font-semibold shadow-inner`}>
                          {user.name?.charAt(0).toUpperCase() || "U"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-gradient-to-br from-emerald-400 to-emerald-600 border-2 border-white dark:border-slate-800 rounded-full shadow-[0_2px_4px_rgba(16,185,129,0.5)]" />
                    </div>
                    {!collapsed && (
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-stone-900 dark:text-slate-100 truncate drop-shadow-[0_1px_1px_rgba(255,255,255,0.8)] dark:drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]">
                          {user.name}
                        </p>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="text-xs px-2 py-0.5 bg-stone-200 dark:bg-slate-700 text-stone-700 dark:text-slate-300 border border-stone-300 dark:border-slate-600 shadow-[inset_1px_1px_2px_rgba(0,0,0,0.1)] dark:shadow-[inset_1px_1px_2px_rgba(0,0,0,0.2)]">
                            {typeof user.role === 'string' ? user.role : user.role?.name || 'User'}
                          </Badge>
                        </div>
                      </div>
                    )}
                  </div>
                </TooltipTrigger>
                <TooltipContent side={collapsed ? "right" : "top"} className="ml-2">
                  <div>
                    <p className="font-medium">{user.name}</p>
                    <p className="text-xs text-stone-500 dark:text-stone-400">{user.email}</p>
                    <p className="text-xs text-stone-500 dark:text-stone-400 capitalize">{typeof user.role === 'string' ? user.role : user.role?.name || 'User'} Access</p>
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        )}
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
        <main className="flex-1 overflow-y-auto bg-gradient-to-br from-stone-50 via-rose-50/20 to-amber-50/10 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
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
