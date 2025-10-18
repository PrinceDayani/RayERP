"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import Navbar from "./Navbar";
import { 
  ChevronLeft, 
  ChevronRight,
  ChevronDown, 
  ChevronUp,
  LayoutDashboard,
  Users,
  Briefcase,
  DollarSign,
  BarChart3,
  Settings,
  Shield,
  FileText,
  CheckCircle,
  TrendingUp,
  Building2,
  UserCheck,
  Calculator,
  PieChart,
  Wallet,
  CreditCard,
  Receipt,
  Target,
  ClipboardList,
  UserCog
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import BackendStatus from "@/components/BackendStatus";

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
  const pathname = usePathname();
  const { user } = useAuth();

  const isRoot = user?.role === "root";
  const isSuperAdmin = user?.role === "super_admin";
  const isAdmin = user?.role === "admin";
  const isManager = user?.role as string === "manager" || isAdmin || isSuperAdmin || isRoot;

  const menuSections = [
    {
      title: "Overview",
      items: [
        { path: "/dashboard", name: "Dashboard", icon: LayoutDashboard, description: "Main dashboard overview" } as MenuItem & { icon: any; description: string },
      ]
    },
    {
      title: "Business Relations",
      items: [
        { path: "/dashboard/contacts", name: "Contacts", icon: Users, description: "Manage business contacts" } as MenuItem & { icon: any; description: string },
      ]
    },
    {
      title: "Human Resources",
      items: [
        { path: "/dashboard/users", name: "User Management", icon: UserCog, description: "System user administration", access: isAdmin || isSuperAdmin || isRoot } as MenuItem & { icon: any; description: string },
        { path: "/dashboard/employees", name: "Employees", icon: UserCheck, description: "Employee management" } as MenuItem & { icon: any; description: string }
      ]
    },
    {
      title: "Project Management",
      items: [
        { path: "/dashboard/projects", name: "Projects", icon: Briefcase, description: "Project tracking & management" } as MenuItem & { icon: any; description: string },
        { path: "/dashboard/tasks", name: "Tasks", icon: CheckCircle, description: "Task management" } as MenuItem & { icon: any; description: string }
      ]
    },
    {
      title: "Budget & Finance",
      items: [
        { path: "/dashboard/budgets", name: "Budgets", icon: Calculator, description: "Budget planning & tracking" } as MenuItem & { icon: any; description: string },
        { path: "/dashboard/budgets/templates", name: "Budget Templates", icon: ClipboardList, description: "Reusable budget templates" } as MenuItem & { icon: any; description: string },
        { path: "/dashboard/budgets/approvals", name: "Approvals", icon: Target, description: "Budget approval workflow", access: isManager } as MenuItem & { icon: any; description: string },
        { path: "/dashboard/budgets/analytics", name: "Budget Analytics", icon: PieChart, description: "Budget performance analysis", access: isManager } as MenuItem & { icon: any; description: string },
        { path: "/dashboard/finance", name: "General Ledger", icon: Wallet, description: "Financial accounting" } as MenuItem & { icon: any; description: string },
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
        { path: "/dashboard/admin", name: "Admin Panel", icon: Shield, description: "Advanced system controls", access: isAdmin || isSuperAdmin || isRoot } as MenuItem & { icon: any; description: string },
      ]
    }
  ];

  useEffect(() => {
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

  const toggleMenu = (path: string) => {
    setExpandedMenus(prev => 
      prev.includes(path) 
        ? prev.filter(p => p !== path)
        : [...prev, path]
    );
  };

  const isMenuExpanded = (path: string) => expandedMenus.includes(path);

  const isSubItemActive = (item: MenuItem) => {
    if (!item.subItems) return false;
    return item.subItems.some((subItem: SubMenuItem) => pathname === subItem.path);
  };

  const getRoleColor = (role: string) => {
    switch (role?.toLowerCase()) {
      case 'root':
        return 'bg-red-500';
      case 'super_admin':
        return 'bg-purple-500';
      case 'admin':
        return 'bg-blue-500';
      case 'manager':
        return 'bg-green-500';
      default:
        return 'bg-gray-500';
    }
  };



  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar */}
      <div
        className={`${
          isMobile 
            ? `fixed inset-y-0 left-0 z-30 w-64 bg-theme-sidebar border-r border-border shadow-lg transform transition-transform duration-300 ${
                (!isMobile || sidebarOpen) ? "translate-x-0" : "-translate-x-full"
              }`
            : `${collapsed ? "w-16" : "w-64"} bg-theme-sidebar border-r border-border transition-all duration-300 ease-in-out`
        } flex flex-col h-full`}
      >
        {/* Header */}
        <div className="p-4 border-b border-border bg-gradient-to-r from-primary/5 to-primary/10">
          <div className="flex items-center justify-between">
            {!collapsed && (
              <div className="flex items-center space-x-3">
                <div className="flex items-center justify-center">
                  <div className="h-10 w-10 bg-gradient-to-br from-primary to-primary/80 rounded-xl flex items-center justify-center shadow-lg">
                    <Building2 className="h-5 w-5 text-primary-foreground" />
                  </div>
                  <div className="ml-3">
                    <span className="text-lg font-bold text-foreground">RayERP</span>
                    <p className="text-xs text-muted-foreground">Enterprise Solution</p>
                  </div>
                </div>
              </div>
            )}
            {collapsed && (
              <div className="flex items-center justify-center w-full">
                <div className="h-8 w-8 bg-gradient-to-br from-primary to-primary/80 rounded-lg flex items-center justify-center shadow-lg">
                  <Building2 className="h-4 w-4 text-primary-foreground" />
                </div>
              </div>
            )}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={toggleSidebar}
                    className="p-2 hover:bg-primary/10 rounded-lg transition-colors"
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
                    <h3 className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
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
                              className={`w-full flex items-center justify-between px-3 py-2.5 text-sm font-medium rounded-xl transition-all duration-200 group ${
                                isActive
                                  ? "bg-gradient-to-r from-primary to-primary/80 text-primary-foreground shadow-lg"
                                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground hover:shadow-md"
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
                            <Link href={item.path}>
                              <div
                                className={`flex items-center px-3 py-2.5 text-sm font-medium rounded-xl transition-all duration-200 group ${
                                  isActive
                                    ? "bg-gradient-to-r from-primary to-primary/80 text-primary-foreground shadow-lg"
                                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground hover:shadow-md"
                                }`}
                              >
                                <Icon className={`w-5 h-5 ${collapsed ? 'mx-auto' : ''} transition-colors`} />
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
                                <Link key={subItem.path} href={subItem.path}>
                                  <div
                                    className={`flex items-center px-3 py-2 text-sm rounded-lg transition-all duration-200 ${
                                      pathname === subItem.path
                                        ? "bg-primary/20 text-primary font-medium"
                                        : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
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
          <div className="p-4 border-t border-border bg-gradient-to-r from-muted/30 to-muted/10">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className={`flex items-center space-x-3 p-2 rounded-xl hover:bg-accent/50 transition-colors cursor-pointer ${collapsed ? 'justify-center' : ''}`}>
                    <div className="relative">
                      <Avatar className="w-10 h-10 border-2 border-primary/20">
                        <AvatarFallback className={`${getRoleColor(user.role || '')} text-white text-sm font-semibold`}>
                          {user.name?.charAt(0).toUpperCase() || "U"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-background rounded-full" />
                    </div>
                    {!collapsed && (
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-foreground truncate">
                          {user.name}
                        </p>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="text-xs px-2 py-0.5">
                            {user.role}
                          </Badge>
                        </div>
                      </div>
                    )}
                  </div>
                </TooltipTrigger>
                <TooltipContent side={collapsed ? "right" : "top"} className="ml-2">
                  <div>
                    <p className="font-medium">{user.name}</p>
                    <p className="text-xs text-muted-foreground">{user.email}</p>
                    <p className="text-xs text-muted-foreground capitalize">{user.role} Access</p>
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
        <div className="sticky top-0 z-10">
          <Navbar toggleSidebar={toggleSidebar} isMobile={isMobile} />
        </div>
        <main className="flex-1 overflow-y-auto bg-gradient-to-br from-background to-muted/20">
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