"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  Menu, 
  Search, 
  Settings, 
  LogOut, 
  HelpCircle, 
  Bell, 
  User, 
  Shield,
  Briefcase,
  DollarSign,
  Users,
  Clock,
  AlertCircle,
  CheckCircle,
  Info,
  TrendingUp
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import ThemeSwitcher from "@/components/ThemeSwitcher";
import { useAuth } from "@/contexts/AuthContext";

interface NavbarProps {
  toggleSidebar: () => void;
  isMobile: boolean;
}

interface Notification {
  id: number;
  type: string;
  title: string;
  message: string;
  time: string;
  isRead: boolean;
  icon: any;
  color: string;
}

export default function Navbar({ toggleSidebar, isMobile }: NavbarProps) {
  const { user, logout } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const router = useRouter();
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      type: 'project',
      title: 'Project Update',
      message: "New project 'Website Redesign' has been created",
      time: "Just now",
      isRead: false,
      icon: Briefcase,
      color: 'text-red-500'
    },
    {
      id: 2,
      type: 'budget',
      title: 'Budget Alert',
      message: "Budget approval required for Q4 Marketing",
      time: "1 hour ago",
      isRead: false,
      icon: DollarSign,
      color: 'text-orange-500'
    },
    {
      id: 3,
      type: 'employee',
      title: 'HR Update',
      message: "New employee John Doe has been added",
      time: "2 hours ago",
      isRead: false,
      icon: Users,
      color: 'text-green-500'
    },
    {
      id: 4,
      type: 'report',
      title: 'Report Ready',
      message: "Monthly financial report is ready for review",
      time: "3 hours ago",
      isRead: true,
      icon: TrendingUp,
      color: 'text-purple-500'
    },
  ]);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(notification => ({ ...notification, isRead: true }))
    );
  };

  const handleLogout = async () => {
    await logout();
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Implement search functionality
    console.log("Searching for:", searchQuery);
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

  return (
    <header className="h-16 border-b border-border/50 glass-morphism shadow-lg sticky top-0 z-40 relative overflow-hidden">
      {/* Header Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-accent/5 pointer-events-none" />
      
      <div className="flex h-full items-center justify-between px-4 sm:px-6 relative z-10">
        <div className="flex items-center space-x-4">
          {isMobile && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    onClick={toggleSidebar}
                    variant="ghost"
                    size="icon"
                    className="hover:bg-accent rounded-lg transition-colors"
                    aria-label="Toggle sidebar"
                  >
                    <Menu className="h-5 w-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Toggle sidebar</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
          
          <form onSubmit={handleSearch} className="hidden md:block">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <Search className="h-4 w-4 text-muted-foreground" />
              </div>
              <Input
                type="text"
                placeholder="Search projects, employees, budgets..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-80 pl-10 bg-muted/30 backdrop-blur-sm border border-border/50 focus:bg-background/80 focus:border-primary/50 transition-all duration-300 rounded-xl shadow-sm focus:shadow-lg focus-ring-modern"
              />
            </div>
          </form>
        </div>

        <div className="flex items-center space-x-2">
          {/* Mobile search button */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden hover:bg-accent/50 rounded-xl transition-all duration-300 hover:scale-110 focus-ring-modern">
                  <Search className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Search</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {/* Help */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="hover:bg-accent/50 rounded-xl transition-all duration-300 hover:scale-110 focus-ring-modern">
                  <HelpCircle className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Help & Support</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {/* Notifications */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative hover:bg-accent/50 rounded-xl transition-all duration-300 hover:scale-110 focus-ring-modern">
                <Bell className="h-4 w-4" />
                {unreadCount > 0 && (
                  <>
                    <Badge 
                      variant="destructive" 
                      className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 text-xs flex items-center justify-center animate-pulse shadow-lg"
                    >
                      {unreadCount}
                    </Badge>
                    <div className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 animate-ping opacity-75" />
                  </>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-96 max-h-96 overflow-y-auto">
              <DropdownMenuLabel className="flex items-center justify-between p-4 border-b">
                <div className="flex items-center gap-2">
                  <Bell className="h-4 w-4" />
                  <span className="font-semibold">Notifications</span>
                  {unreadCount > 0 && (
                    <Badge variant="secondary" className="text-xs">
                      {unreadCount} new
                    </Badge>
                  )}
                </div>
                {unreadCount > 0 && (
                  <Button variant="ghost" size="sm" onClick={markAllAsRead} className="text-xs">
                    Mark all read
                  </Button>
                )}
              </DropdownMenuLabel>
              {notifications.length > 0 ? (
                <div className="max-h-80 overflow-y-auto">
                  {notifications.map((notification: any) => {
                    const Icon = notification.icon;
                    return (
                      <DropdownMenuItem key={notification.id} className="p-4 border-b last:border-b-0 cursor-pointer hover:bg-accent/50">
                        <div className="flex items-start gap-3 w-full">
                          <div className={`p-2 rounded-lg bg-muted ${notification.color}`}>
                            <Icon className="h-4 w-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <p className={`text-sm font-medium ${notification.isRead ? 'text-muted-foreground' : 'text-foreground'}`}>
                                  {notification.title}
                                </p>
                                <p className={`text-sm mt-1 ${notification.isRead ? 'text-muted-foreground' : 'text-muted-foreground'}`}>
                                  {notification.message}
                                </p>
                                <div className="flex items-center gap-2 mt-2">
                                  <Clock className="h-3 w-3 text-muted-foreground" />
                                  <p className="text-xs text-muted-foreground">{notification.time}</p>
                                </div>
                              </div>
                              {!notification.isRead && (
                                <div className="h-2 w-2 bg-primary rounded-full ml-2 mt-1 flex-shrink-0" />
                              )}
                            </div>
                          </div>
                        </div>
                      </DropdownMenuItem>
                    );
                  })}
                </div>
              ) : (
                <div className="p-8 text-center">
                  <Bell className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">No notifications</p>
                </div>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Theme Switcher */}
          <ThemeSwitcher />

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-12 w-12 rounded-full hover:bg-accent/50 transition-all duration-300 hover:scale-110 focus-ring-modern">
                <div className="relative">
                  <Avatar className="h-10 w-10 border-2 border-primary/30 shadow-lg">
                    <AvatarFallback className={`${getRoleColor(user?.role)} text-white font-bold`}>
                      {user?.name?.charAt(0).toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-background rounded-full status-online" />
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-64" align="end" forceMount>
              <DropdownMenuLabel className="font-normal p-4">
                <div className="flex items-center space-x-3">
                  <Avatar className="h-12 w-12">
                    <AvatarFallback className={`${getRoleColor(user?.role)} text-white font-semibold text-lg`}>
                      {user?.name?.charAt(0).toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold leading-none truncate">{user?.name || "User"}</p>
                    <p className="text-xs leading-none text-muted-foreground mt-1 truncate">
                      {user?.email || "user@example.com"}
                    </p>
                    <Badge variant="outline" className="w-fit mt-2 text-xs">
                      <Shield className="h-3 w-3 mr-1" />
                      {typeof user?.role === 'string' ? user.role : user?.role?.name || 'user'}
                    </Badge>
                  </div>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/dashboard/settings" className="flex items-center p-3 cursor-pointer">
                  <User className="mr-3 h-4 w-4" />
                  <span>Profile Settings</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/dashboard/settings" className="flex items-center p-3 cursor-pointer">
                  <Settings className="mr-3 h-4 w-4" />
                  <span>Preferences</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-red-600 focus:text-red-600 p-3 cursor-pointer">
                <LogOut className="mr-3 h-4 w-4" />
                <span>Sign out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
