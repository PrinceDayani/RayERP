"use client";

import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import { SunIcon, MoonIcon, Monitor, Palette } from "lucide-react";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export default function ThemeSwitcher() {
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme, resolvedTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  // Force theme application on mount and theme change
  useEffect(() => {
    if (mounted) {
      const root = document.documentElement;
      
      // Remove existing theme classes
      root.classList.remove('light', 'dark');
      
      // Apply theme based on resolved theme
      if (resolvedTheme === 'dark') {
        root.classList.add('dark');
        root.setAttribute('data-theme', 'dark');
      } else {
        root.classList.add('light');
        root.setAttribute('data-theme', 'light');
      }
      
      // Force a repaint to ensure theme is applied
      root.style.display = 'none';
      root.offsetHeight; // Trigger reflow
      root.style.display = '';
    }
  }, [mounted, resolvedTheme]);

  if (!mounted) {
    return (
      <Button variant="ghost" size="icon" className="w-9 h-9 hover:bg-accent/50 rounded-xl transition-all duration-300">
        <Palette className="h-4 w-4 animate-pulse" />
        <span className="sr-only">Loading theme</span>
      </Button>
    );
  }

  const getIcon = () => {
    if (theme === 'system') {
      return <Monitor className="h-4 w-4" />;
    }
    return resolvedTheme === 'dark' ? 
      <MoonIcon className="h-4 w-4" /> : 
      <SunIcon className="h-4 w-4" />;
  };

  const getThemeLabel = () => {
    if (theme === 'system') return 'System';
    return resolvedTheme === 'dark' ? 'Dark' : 'Light';
  };

  const handleThemeChange = (newTheme: string) => {
    setTheme(newTheme);
    
    // Immediate DOM update for better UX
    const root = document.documentElement;
    root.classList.remove('light', 'dark');
    
    if (newTheme === 'dark') {
      root.classList.add('dark');
      root.setAttribute('data-theme', 'dark');
    } else if (newTheme === 'light') {
      root.classList.add('light');
      root.setAttribute('data-theme', 'light');
    } else {
      // System theme
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      root.classList.add(prefersDark ? 'dark' : 'light');
      root.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
    }
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <DropdownMenu>
          <TooltipTrigger asChild>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                className="w-9 h-9 hover:bg-accent/50 rounded-xl transition-all duration-300 hover:scale-110 focus-ring-modern relative"
              >
                <div className="relative">
                  {getIcon()}
                  <div className="absolute -top-1 -right-1 w-2 h-2 bg-primary rounded-full opacity-60 animate-pulse" />
                </div>
                <span className="sr-only">Toggle theme - Current: {getThemeLabel()}</span>
              </Button>
            </DropdownMenuTrigger>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <p>Theme: {getThemeLabel()}</p>
          </TooltipContent>
          <DropdownMenuContent align="end" className="min-w-[160px] glass-morphism border border-border/50 shadow-xl">
            <DropdownMenuLabel className="flex items-center gap-2 px-3 py-2">
              <Palette className="h-4 w-4" />
              <span className="font-semibold">Theme</span>
              <Badge variant="outline" className="ml-auto text-xs">
                {getThemeLabel()}
              </Badge>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            
            <DropdownMenuItem 
              onClick={() => handleThemeChange("light")}
              className={`cursor-pointer transition-all duration-200 hover:bg-accent/80 ${
                theme === 'light' ? 'bg-accent/50 border-l-2 border-l-primary' : ''
              }`}
            >
              <SunIcon className="mr-3 h-4 w-4 text-yellow-500" />
              <div className="flex-1">
                <span className="font-medium">Light</span>
                <p className="text-xs text-muted-foreground mt-0.5">Bright and clean</p>
              </div>
              {theme === 'light' && (
                <div className="w-2 h-2 bg-primary rounded-full ml-2" />
              )}
            </DropdownMenuItem>
            
            <DropdownMenuItem 
              onClick={() => handleThemeChange("dark")}
              className={`cursor-pointer transition-all duration-200 hover:bg-accent/80 ${
                theme === 'dark' ? 'bg-accent/50 border-l-2 border-l-primary' : ''
              }`}
            >
              <MoonIcon className="mr-3 h-4 w-4 text-blue-400" />
              <div className="flex-1">
                <span className="font-medium">Dark</span>
                <p className="text-xs text-muted-foreground mt-0.5">Easy on the eyes</p>
              </div>
              {theme === 'dark' && (
                <div className="w-2 h-2 bg-primary rounded-full ml-2" />
              )}
            </DropdownMenuItem>
            
            <DropdownMenuItem 
              onClick={() => handleThemeChange("system")}
              className={`cursor-pointer transition-all duration-200 hover:bg-accent/80 ${
                theme === 'system' ? 'bg-accent/50 border-l-2 border-l-primary' : ''
              }`}
            >
              <Monitor className="mr-3 h-4 w-4 text-gray-500" />
              <div className="flex-1">
                <span className="font-medium">System</span>
                <p className="text-xs text-muted-foreground mt-0.5">Follows device setting</p>
              </div>
              {theme === 'system' && (
                <div className="w-2 h-2 bg-primary rounded-full ml-2" />
              )}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </Tooltip>
    </TooltipProvider>
  );
}