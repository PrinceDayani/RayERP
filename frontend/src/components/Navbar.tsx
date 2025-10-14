"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Menu, Search, Settings, LogOut, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import ThemeSwitcher from "@/components/ThemeSwitcher";

interface NavbarProps {
  toggleSidebar: () => void;
  isMobile: boolean;
}

export default function Navbar({ toggleSidebar, isMobile }: NavbarProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const router = useRouter();
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      message: "New order #4832 has been placed",
      time: "Just now",
      isRead: false,
    },
    {
      id: 2,
      message: "Inventory alert: Product XYZ is low on stock",
      time: "1 hour ago",
      isRead: false,
    },
    {
      id: 3,
      message: "Monthly sales report is ready",
      time: "3 hours ago",
      isRead: true,
    },
  ]);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(notification => ({ ...notification, isRead: true }))
    );
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Implement search functionality
    console.log("Searching for:", searchQuery);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    router.push('/login');
  };

  return (
    <header className="h-16 border-b border-border bg-theme-navbar px-4 sm:px-6 shadow-theme-light">
      <div className="flex h-full items-center justify-between">
        <div className="flex items-center">
          {isMobile && (
            <Button
              onClick={toggleSidebar}
              variant="ghost"
              size="icon"
              className="mr-4"
              aria-label="Toggle sidebar"
            >
              <Menu className="h-4 w-4" />
            </Button>
          )}
          
          <form onSubmit={handleSearch} className="hidden md:block">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <Search className="h-4 w-4 text-muted-foreground" />
              </div>
              <Input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-64 pl-10"
              />
            </div>
          </form>
        </div>

        <div className="flex items-center space-x-3">
          {/* Mobile search button */}
          <Button variant="ghost" size="icon" className="md:hidden">
            <Search className="h-4 w-4" />
          </Button>

          {/* Theme Switcher */}
          <ThemeSwitcher />



          {/* Logout button */}
          <Button variant="ghost" size="icon" title="Logout" onClick={handleLogout}>
            <LogOut className="h-4 w-4" />
          </Button>

          {/* User avatar */}
          <Avatar className="h-8 w-8">
            <AvatarFallback>AU</AvatarFallback>
          </Avatar>
        </div>
      </div>
    </header>
  );
}