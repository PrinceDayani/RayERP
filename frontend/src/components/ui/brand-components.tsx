import React from 'react';
import { cn } from '@/lib/utils';

interface BrandComponentsProps {
  className?: string;
  children?: React.ReactNode;
}

// Brand Button Component
export const BrandButton: React.FC<BrandComponentsProps & { 
  variant?: 'solid' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  onClick?: () => void;
}> = ({ 
  className, 
  children, 
  variant = 'solid', 
  size = 'md',
  onClick,
  ...props 
}) => {
  const baseClasses = "inline-flex items-center justify-center font-medium rounded-lg transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2";
  
  const variants = {
    solid: "bg-[#970E2C] text-white hover:bg-[#CD2E4F] focus:ring-[#970E2C] shadow-lg hover:shadow-xl hover:scale-105 active:scale-95",
    outline: "border-2 border-[#970E2C] text-[#970E2C] hover:bg-[#970E2C] hover:text-white focus:ring-[#970E2C] hover:scale-105 active:scale-95",
    ghost: "text-[#970E2C] hover:bg-[#970E2C]/10 focus:ring-[#970E2C] hover:scale-105 active:scale-95"
  };
  
  const sizes = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2 text-base",
    lg: "px-6 py-3 text-lg"
  };
  
  return (
    <button
      className={cn(baseClasses, variants[variant], sizes[size], className)}
      onClick={onClick}
      {...props}
    >
      {children}
    </button>
  );
};

// Brand Card Component
export const BrandCard: React.FC<BrandComponentsProps & {
  variant?: 'default' | 'brand' | 'interactive';
}> = ({ 
  className, 
  children, 
  variant = 'default',
  ...props 
}) => {
  const baseClasses = "rounded-xl border bg-card text-card-foreground shadow transition-all duration-300";
  
  const variants = {
    default: "hover:shadow-lg",
    brand: "border-[#970E2C]/20 bg-gradient-to-br from-[#970E2C]/5 to-white dark:to-card hover:shadow-lg hover:border-[#970E2C]/30",
    interactive: "hover:shadow-xl hover:-translate-y-1 hover:scale-[1.02] cursor-pointer"
  };
  
  return (
    <div
      className={cn(baseClasses, variants[variant], className)}
      {...props}
    >
      {children}
    </div>
  );
};

// Brand Badge Component
export const BrandBadge: React.FC<BrandComponentsProps & {
  variant?: 'solid' | 'outline' | 'soft';
  size?: 'sm' | 'md' | 'lg';
}> = ({ 
  className, 
  children, 
  variant = 'solid',
  size = 'md',
  ...props 
}) => {
  const baseClasses = "inline-flex items-center font-medium rounded-full transition-all duration-300";
  
  const variants = {
    solid: "bg-[#970E2C] text-white",
    outline: "border border-[#970E2C] text-[#970E2C] bg-transparent",
    soft: "bg-[#970E2C]/10 text-[#970E2C]"
  };
  
  const sizes = {
    sm: "px-2 py-0.5 text-xs",
    md: "px-2.5 py-0.5 text-sm",
    lg: "px-3 py-1 text-base"
  };
  
  return (
    <span
      className={cn(baseClasses, variants[variant], sizes[size], className)}
      {...props}
    >
      {children}
    </span>
  );
};

// Brand Alert Component
export const BrandAlert: React.FC<BrandComponentsProps & {
  type?: 'info' | 'success' | 'warning' | 'error';
}> = ({ 
  className, 
  children, 
  type = 'info',
  ...props 
}) => {
  const baseClasses = "p-4 rounded-lg border transition-all duration-300";
  
  const types = {
    info: "bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-200",
    success: "bg-green-50 border-green-200 text-green-800 dark:bg-green-900/20 dark:border-green-800 dark:text-green-200",
    warning: "bg-yellow-50 border-yellow-200 text-yellow-800 dark:bg-yellow-900/20 dark:border-yellow-800 dark:text-yellow-200",
    error: "bg-[#970E2C]/10 border-[#970E2C]/30 text-[#970E2C] dark:bg-[#970E2C]/20 dark:border-[#970E2C]/40"
  };
  
  return (
    <div
      className={cn(baseClasses, types[type], className)}
      {...props}
    >
      {children}
    </div>
  );
};

// Brand Input Component
export const BrandInput: React.FC<React.InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  error?: string;
}> = ({ 
  className, 
  label,
  error,
  ...props 
}) => {
  return (
    <div className="space-y-2">
      {label && (
        <label className="text-sm font-medium text-foreground">
          {label}
        </label>
      )}
      <input
        className={cn(
          "flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm transition-all duration-300",
          "focus:border-[#970E2C] focus:ring-2 focus:ring-[#970E2C]/20 focus:outline-none",
          "disabled:cursor-not-allowed disabled:opacity-50",
          error && "border-red-500 focus:border-red-500 focus:ring-red-500/20",
          className
        )}
        {...props}
      />
      {error && (
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      )}
    </div>
  );
};

export default {
  BrandButton,
  BrandCard,
  BrandBadge,
  BrandAlert,
  BrandInput
};
