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
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
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

  const roleName = typeof user?.role === 'string' ? user.role : user?.role?.name || '';
  const isRoot = roleName.toLowerCase() === "root";
  const isSuperAdmin = roleName.toLowerCase() === "super_admin" || roleName.toLowerCase() === "superadmin";
  const isAdmin = roleName.toLowerCase() === "admin";
  const isManager = roleName.toLowerCase() === "manager" || isAdmin || isSuperAdmin || isRoot;

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
        { path: "/dashboard/employees", name: "Employees", icon: UserCheck, description: "Employee management" } as MenuItem & { icon: any; description: string },
        { path: "/dashboard/departments", name: "Departments", icon: Building, description: "Department management" } as MenuItem & { icon: any; description: string }
      ]
    },
    {
      title: "Project Management",
      items: [
        { path: "/dashboard/projects", name: "Projects", icon: Briefcase, description: "Project tracking & management" } as MenuItem & { icon: any; description: string },
        { path: "/dashboard/tasks", name: "Tasks", icon: CheckCircle, description: "Task management" } as MenuItem & { icon: any; description: string },
        { path: "/dashboard/resources", name: "Resources", icon: Boxes, description: "Resource planning" } as MenuItem & { icon: any; description: string }
      ]
    },
    {
      title: "Budget & Finance",
      items: [
        { path: "/dashboard/budgets", name: "Budgets", icon: Calculator, description: "Budget planning & tracking" } as MenuItem & { icon: any; description: string },
        { path: "/dashboard/budgets/templates", name: "Budget Templates", icon: ClipboardList, description: "Reusable budget templates" } as MenuItem & { icon: any; description: string },
        { path: "/dashboard/budgets/approvals", name: "Approvals", icon: Target, description: "Budget approval workflow", access: isManager } as MenuItem & { icon: any; description: string },
        { path: "/dashboard/budgets/analytics", name: "Budget Analytics", icon: PieChart, description: "Budget performance analysis", access: isManager } as MenuItem & { icon: any; description: string },
        { path: "/dashboard/finance", name: "Finance", icon: Wallet, description: "Financial accounting" } as MenuItem & { icon: any; description: string },
      ]
    },
    {
      title: "Analytics & Reports",
      items: [
        { path: "/dashboard/reports", name: "Reports", icon: BarChart3, description: "Business intelligence reports", access: isManager } as MenuItem & { icon: any; description: string },
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
  ], [isAdmin, isSuperAdmin, isRoot, isManager]);

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
        <div className="w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 flex flex-col h-full">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-red-50 to-red-100 dark:from-gray-800 dark:to-gray-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Image src="/RAYlogo.webp" alt="RayERP Logo" width={180} height={60} className="object-contain" />
              </div>
            </div>
          </div>
        </div>
        <div className="flex flex-1 flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
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
        className={`${
          isMobile 
            ? `fixed inset-y-0 left-0 z-30 w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 shadow-lg transform transition-transform duration-300 ${
                sidebarOpen ? "translate-x-0" : "-translate-x-full"
              }`
            : `${collapsed ? "w-16" : "w-64"} bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 transition-all duration-300 ease-in-out`
        } flex flex-col h-full`}
      >
        {/* Header */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-red-50 to-red-100 dark:from-gray-800 dark:to-gray-700">
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
                    className="p-2 hover:bg-red-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
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
        <nav className="flex-1 overflow-y-auto py-4 px-2">
          <TooltipProvider>
            <div className="space-y-6">
              {menuSections.map((section) => (
                <div key={section.title}>
                  {!collapsed && (
                    <h3 className="px-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
                      {section.title}
                    </h3>
                  )}
                  <div className="space-y-1">
                    {section.items.map((item: any) => {
                      if (item.access === false) return null;
                      
                      const isActive = pathname === item.path || isSubItemActive(item);
                      const hasSubItems = item.subItems && item.subItems.length > 0;
                      const isExpanded = isMenuExpanded(item.path);
                      const Icon = item.icon;

                      const menuItem = (
                        <div key={item.path}>
                          {hasSubItems ? (
                            <button
                              onClick={() => toggleMenu(item.path)}
                              className={`w-full flex items-center justify-between px-3 py-2.5 text-sm font-medium rounded-xl group ${
                                isActive
                                  ? "bg-gradient-to-r from-red-600 to-red-700 text-white shadow-lg"
                                  : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white"
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
                                className={`flex items-center px-3 py-2.5 text-sm font-medium rounded-xl group cursor-pointer ${
                                  isActive
                                    ? "bg-gradient-to-r from-red-600 to-red-700 text-white shadow-lg"
                                    : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white"
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
                                    className={`flex items-center px-3 py-2 text-sm rounded-lg ${
                                      pathname === subItem.path
                                        ? "bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 font-medium"
                                        : "text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white"
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
          <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className={`flex items-center space-x-3 p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer ${collapsed ? 'justify-center' : ''}`}>
                    <div className="relative">
                      <Avatar className="w-10 h-10 border-2 border-red-200 dark:border-red-800">
                        <AvatarFallback className={`${getRoleColor(user.role)} text-white text-sm font-semibold`}>
                          {user.name?.charAt(0).toUpperCase() || "U"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white dark:border-gray-900 rounded-full" />
                    </div>
                    {!collapsed && (
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                          {user.name}
                        </p>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="text-xs px-2 py-0.5 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
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
                    <p className="text-xs text-gray-500 dark:text-gray-400">{user.email}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">{typeof user.role === 'string' ? user.role : user.role?.name || 'User'} Access</p>
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
        <main className="flex-1 overflow-y-auto bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
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
