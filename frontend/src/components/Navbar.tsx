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
import { NotificationCenter } from "@/components/NotificationCenter";

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
          <NotificationCenter />

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
                <Link href="/dashboard/profile" className="flex items-center p-3 cursor-pointer">
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
