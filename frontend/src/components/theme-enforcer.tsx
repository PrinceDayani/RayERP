"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export function ThemeEnforcer() {
  const { resolvedTheme, theme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    
    const root = document.documentElement;
    
    // Remove all theme classes first
    root.classList.remove('light', 'dark');
    
    // Apply the resolved theme
    if (resolvedTheme === 'dark') {
      root.classList.add('dark');
      root.setAttribute('data-theme', 'dark');
      
      // Ensure dark mode styles are applied
      root.style.colorScheme = 'dark';
    } else {
      root.classList.add('light');
      root.setAttribute('data-theme', 'light');
      
      // Ensure light mode styles are applied
      root.style.colorScheme = 'light';
    }
    
    // Force repaint to ensure theme changes are visible
    requestAnimationFrame(() => {
      root.style.display = 'none';
      root.offsetHeight; // Trigger reflow
      root.style.display = '';
    });
    
  }, [mounted, resolvedTheme]);

  // Listen for system theme changes when using system theme
  useEffect(() => {
    if (!mounted || theme !== 'system') return;
    
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleChange = () => {
      const root = document.documentElement;
      root.classList.remove('light', 'dark');
      
      if (mediaQuery.matches) {
        root.classList.add('dark');
        root.setAttribute('data-theme', 'dark');
        root.style.colorScheme = 'dark';
      } else {
        root.classList.add('light');
        root.setAttribute('data-theme', 'light');
        root.style.colorScheme = 'light';
      }
    };
    
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [mounted, theme]);

  return null;
}