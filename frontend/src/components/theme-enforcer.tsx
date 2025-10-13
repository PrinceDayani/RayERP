"use client";

import { useTheme } from "next-themes";
import { useEffect } from "react";

export function ThemeEnforcer() {
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    const root = document.documentElement;
    
    if (resolvedTheme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }

  }, [resolvedTheme]);

  return null;
}