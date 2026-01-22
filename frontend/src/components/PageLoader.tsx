"use client";

import React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PageLoaderProps {
  text?: string;
  className?: string;
  variant?: 'spinner' | 'minimal';
}

/**
 * Consistent loading spinner for full-page loads
 * Use for: Initial page loads, authentication checks, data fetching
 * For skeleton states, use Skeleton component directly
 */
export function PageLoader({ 
  text = "Loading...", 
  className,
  variant = 'spinner'
}: PageLoaderProps) {
  return (
    <div className={cn(
      "flex flex-col items-center justify-center min-h-[400px] space-y-4",
      className
    )}>
      {variant === 'spinner' ? (
        <>
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          {text && (
            <p className="text-sm text-muted-foreground animate-pulse">
              {text}
            </p>
          )}
        </>
      ) : (
        <div className="flex items-center space-x-2">
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          {text && (
            <span className="text-sm text-muted-foreground">{text}</span>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Centered spinner for smaller sections
 */
export function SectionLoader({ text, className }: { text?: string; className?: string }) {
  return (
    <div className={cn("flex items-center justify-center py-8", className)}>
      <div className="flex flex-col items-center space-y-2">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
        {text && <p className="text-sm text-muted-foreground">{text}</p>}
      </div>
    </div>
  );
}

/**
 * Inline spinner for button states, small components
 */
export function InlineLoader({ className }: { className?: string }) {
  return <Loader2 className={cn("h-4 w-4 animate-spin", className)} />;
}
