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

} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/tooltip";
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
    <header className="h-16 border-b border-stone-200/50 dark:border-slate-700/50 bg-gradient-to-r from-white via-stone-50/50 to-white dark:from-slate-800 dark:via-slate-700 dark:to-slate-800 shadow-[0_4px_12px_rgba(0,0,0,0.08),0_-1px_4px_rgba(255,255,255,0.8)] dark:shadow-[0_4px_12px_rgba(0,0,0,0.2),0_-1px_4px_rgba(255,255,255,0.01)] sticky top-0 z-40 backdrop-blur-sm">
      <div className="flex h-full items-center justify-between px-4 sm:px-6">
        <div className="flex items-center space-x-4">
          {isMobile && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    onClick={toggleSidebar}
                    variant="ghost"
                    size="icon"
                    className="hover:bg-stone-100 dark:hover:bg-slate-700 rounded-lg transition-all shadow-[2px_2px_4px_rgba(0,0,0,0.1),-1px_-1px_3px_rgba(255,255,255,0.9)] dark:shadow-[2px_2px_4px_rgba(0,0,0,0.2),-1px_-1px_3px_rgba(255,255,255,0.02)] active:shadow-[inset_2px_2px_4px_rgba(0,0,0,0.15),inset_-1px_-1px_2px_rgba(255,255,255,0.7)]"
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
                <Search className="h-4 w-4 text-stone-500 dark:text-stone-400" />
              </div>
              <Input
                type="text"
                placeholder="Search projects, employees, budgets..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-80 pl-10 bg-gradient-to-br from-stone-50 to-white dark:from-slate-700 dark:to-slate-800 border-stone-200/50 dark:border-slate-600/50 text-stone-900 dark:text-slate-100 placeholder:text-stone-500 dark:placeholder:text-slate-400 focus:border-rose-700 dark:focus:border-rose-700 transition-all rounded-xl shadow-[inset_2px_2px_4px_rgba(0,0,0,0.08),inset_-1px_-1px_3px_rgba(255,255,255,0.9)] dark:shadow-[inset_2px_2px_4px_rgba(0,0,0,0.2),inset_-1px_-1px_3px_rgba(255,255,255,0.02)] focus:shadow-[inset_3px_3px_6px_rgba(0,0,0,0.12),inset_-1px_-1px_4px_rgba(255,255,255,1)]"
              />
            </div>
          </form>
        </div>

        <div className="flex items-center space-x-2">
          {/* Mobile search button */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden hover:bg-stone-100 dark:hover:bg-slate-700 rounded-xl transition-all shadow-[2px_2px_4px_rgba(0,0,0,0.1),-1px_-1px_3px_rgba(255,255,255,0.9)] active:shadow-[inset_2px_2px_4px_rgba(0,0,0,0.15)]">
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
                <Button variant="ghost" size="icon" className="hover:bg-stone-100 dark:hover:bg-slate-700 rounded-xl transition-all shadow-[2px_2px_4px_rgba(0,0,0,0.1),-1px_-1px_3px_rgba(255,255,255,0.9)] active:shadow-[inset_2px_2px_4px_rgba(0,0,0,0.15)]">
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
              <Button variant="ghost" className="relative h-12 w-12 rounded-full hover:bg-stone-100 dark:hover:bg-stone-800 transition-all shadow-[3px_3px_6px_rgba(0,0,0,0.1),-2px_-2px_4px_rgba(255,255,255,0.9)] dark:shadow-[3px_3px_6px_rgba(0,0,0,0.3),-2px_-2px_4px_rgba(255,255,255,0.02)] active:shadow-[inset_2px_2px_5px_rgba(0,0,0,0.15),inset_-1px_-1px_3px_rgba(255,255,255,0.8)]">
                <div className="relative">
                  <Avatar className="h-10 w-10 border-2 border-rose-200 dark:border-rose-800 shadow-[2px_2px_6px_rgba(136,19,55,0.3)]">
                    <AvatarFallback className={`${getRoleColor(user?.role)} text-white font-bold shadow-inner`}>
                      {user?.name?.charAt(0).toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-gradient-to-br from-emerald-400 to-emerald-600 border-2 border-white dark:border-stone-900 rounded-full shadow-[0_2px_4px_rgba(16,185,129,0.4)]" />
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
                    <p className="text-sm font-semibold leading-none truncate text-stone-900 dark:text-white">{user?.name || "User"}</p>
                    <p className="text-xs leading-none text-stone-600 dark:text-stone-400 mt-1 truncate">
                      {user?.email || "user@example.com"}
                    </p>
                    <Badge variant="outline" className="w-fit mt-2 text-xs border-stone-300 dark:border-stone-700">
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
