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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/tooltip";

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

    const root = document.documentElement;
    root.classList.remove('light', 'dark');

    if (newTheme === 'dark') {
      root.classList.add('dark');
      root.setAttribute('data-theme', 'dark');
    } else if (newTheme === 'light') {
      root.classList.add('light');
      root.setAttribute('data-theme', 'light');
    } else {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      root.classList.add(prefersDark ? 'dark' : 'light');
      root.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="w-9 h-9 hover:bg-accent/50 rounded-xl transition-all"
        >
          {getIcon()}
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-[160px]">
            <DropdownMenuLabel className="flex items-center gap-2 px-3 py-2">
              <Palette className="h-4 w-4" />
              <span className="font-semibold">Theme</span>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />

            <DropdownMenuItem
              onClick={() => handleThemeChange("light")}
              className={`cursor-pointer transition-all hover:bg-accent ${theme === 'light' ? 'bg-accent' : ''}`}
            >
              <SunIcon className="mr-3 h-4 w-4" />
              <span className="font-medium">Light</span>
              {theme === 'light' && <div className="w-2 h-2 bg-primary rounded-full ml-auto" />}
            </DropdownMenuItem>

            <DropdownMenuItem
              onClick={() => handleThemeChange("dark")}
              className={`cursor-pointer transition-all hover:bg-accent ${theme === 'dark' ? 'bg-accent' : ''}`}
            >
              <MoonIcon className="mr-3 h-4 w-4" />
              <span className="font-medium">Dark</span>
              {theme === 'dark' && <div className="w-2 h-2 bg-primary rounded-full ml-auto" />}
            </DropdownMenuItem>

            <DropdownMenuItem
              onClick={() => handleThemeChange("system")}
              className={`cursor-pointer transition-all hover:bg-accent ${theme === 'system' ? 'bg-accent' : ''}`}
            >
              <Monitor className="mr-3 h-4 w-4" />
              <span className="font-medium">System</span>
              {theme === 'system' && <div className="w-2 h-2 bg-primary rounded-full ml-auto" />}
            </DropdownMenuItem>
          </DropdownMenuContent>
    </DropdownMenu>
  );
}
