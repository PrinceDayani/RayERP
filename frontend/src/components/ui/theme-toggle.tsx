"use client";

import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import { Sun, Moon, Monitor } from 'lucide-react';
import { useEffect, useState } from 'react';

interface ThemeToggleProps {
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

export function ThemeToggle({ size = 'md', showLabel = false }: ThemeToggleProps) {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);
  
  if (!mounted) {
    return (
      <Button variant="outline" size="icon" className="h-10 w-10">
        <span className="sr-only">Toggle theme</span>
      </Button>
    );
  }
  
  const iconSize = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6'
  }[size];
  
  const buttonSize = {
    sm: 'h-8 px-2',
    md: 'h-10 px-3',
    lg: 'h-12 px-4'
  }[size];
  
  const toggleTheme = () => {
    const themeOrder = ['light', 'dark', 'system'];
    const currentIndex = themeOrder.indexOf(theme || 'system');
    const nextIndex = (currentIndex + 1) % themeOrder.length;
    setTheme(themeOrder[nextIndex]);
  };
  
  const getIcon = () => {
    if (theme === 'system') {
      return <Monitor className={iconSize} />;
    }
    return resolvedTheme === 'dark' ? 
      <Moon className={iconSize} /> : 
      <Sun className={iconSize} />;
  };
  
  const getLabel = () => {
    if (theme === 'system') return 'System';
    return resolvedTheme === 'dark' ? 'Dark' : 'Light';
  };
  
  return (
    <Button
      variant="outline"
      size={showLabel ? 'default' : 'icon'}
      onClick={toggleTheme}
      className={showLabel ? buttonSize : 'h-10 w-10'}
    >
      {getIcon()}
      {showLabel && <span className="ml-2">{getLabel()}</span>}
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}

export default ThemeToggle;