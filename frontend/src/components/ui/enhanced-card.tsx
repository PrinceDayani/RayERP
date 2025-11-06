import * as React from "react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "./card";

export interface EnhancedCardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'interactive' | 'gradient' | 'glass' | 'premium';
  size?: 'sm' | 'md' | 'lg';
  hover?: boolean;
  glow?: boolean;
}

const EnhancedCard = React.forwardRef<HTMLDivElement, EnhancedCardProps>(
  ({ className, variant = 'default', size = 'md', hover = false, glow = false, ...props }, ref) => {
    return (
      <Card
        ref={ref}
        className={cn(
          // Base styles
          "relative overflow-hidden transition-all duration-300",
          
          // Variant styles
          {
            'card-modern': variant === 'default',
            'card-interactive hover:shadow-xl hover:-translate-y-2 hover:scale-[1.02] cursor-pointer': variant === 'interactive',
            'card-gradient': variant === 'gradient',
            'glass-effect': variant === 'glass',
            'card-premium': variant === 'premium',
          },
          
          // Size styles
          {
            'p-3': size === 'sm',
            'p-4': size === 'md',
            'p-6': size === 'lg',
          },
          
          // Hover effects
          {
            'hover-lift': hover,
            'card-glow': glow,
          },
          
          className
        )}
        {...props}
      />
    );
  }
);

EnhancedCard.displayName = "EnhancedCard";

const EnhancedCardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { compact?: boolean }
>(({ className, compact = false, ...props }, ref) => (
  <CardHeader
    ref={ref}
    className={cn(
      "flex flex-col space-y-1.5",
      {
        'p-4 pb-2': compact,
        'p-6': !compact,
      },
      className
    )}
    {...props}
  />
));

EnhancedCardHeader.displayName = "EnhancedCardHeader";

const EnhancedCardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement> & { 
    gradient?: boolean;
    size?: 'sm' | 'md' | 'lg';
  }
>(({ className, gradient = false, size = 'md', ...props }, ref) => (
  <CardTitle
    ref={ref}
    className={cn(
      "font-semibold leading-none tracking-tight",
      {
        'text-sm': size === 'sm',
        'text-base': size === 'md',
        'text-lg': size === 'lg',
        'text-gradient': gradient,
      },
      className
    )}
    {...props}
  />
));

EnhancedCardTitle.displayName = "EnhancedCardTitle";

const EnhancedCardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement> & { muted?: boolean }
>(({ className, muted = true, ...props }, ref) => (
  <CardDescription
    ref={ref}
    className={cn(
      "text-sm",
      {
        'text-muted-foreground': muted,
      },
      className
    )}
    {...props}
  />
));

EnhancedCardDescription.displayName = "EnhancedCardDescription";

const EnhancedCardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { compact?: boolean }
>(({ className, compact = false, ...props }, ref) => (
  <CardContent
    ref={ref}
    className={cn(
      {
        'p-4 pt-0': compact,
        'p-6 pt-0': !compact,
      },
      className
    )}
    {...props}
  />
));

EnhancedCardContent.displayName = "EnhancedCardContent";

const EnhancedCardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { compact?: boolean }
>(({ className, compact = false, ...props }, ref) => (
  <CardFooter
    ref={ref}
    className={cn(
      "flex items-center",
      {
        'p-4 pt-0': compact,
        'p-6 pt-0': !compact,
      },
      className
    )}
    {...props}
  />
));

EnhancedCardFooter.displayName = "EnhancedCardFooter";

// Specialized card components
const StatsCard = React.forwardRef<
  HTMLDivElement,
  EnhancedCardProps & {
    title: string;
    value: string | number;
    description?: string;
    trend?: {
      value: string;
      isPositive: boolean;
    };
    icon?: React.ReactNode;
  }
>(({ title, value, description, trend, icon, className, ...props }, ref) => (
  <EnhancedCard
    ref={ref}
    variant="premium"
    className={cn("dashboard-stat", className)}
    {...props}
  >
    <EnhancedCardHeader compact>
      <div className="flex items-center justify-between">
        <EnhancedCardTitle size="sm" className="text-muted-foreground">
          {title}
        </EnhancedCardTitle>
        {icon && <div className="text-muted-foreground">{icon}</div>}
      </div>
    </EnhancedCardHeader>
    <EnhancedCardContent compact>
      <div className="text-3xl font-bold text-foreground mb-2">
        {typeof value === 'number' ? value.toLocaleString() : value}
      </div>
      {(description || trend) && (
        <div className="flex items-center text-sm">
          {trend && (
            <span className={cn(
              "flex items-center font-medium mr-2",
              trend.isPositive ? "text-green-600" : "text-red-600"
            )}>
              {trend.value}
            </span>
          )}
          {description && (
            <span className="text-muted-foreground">{description}</span>
          )}
        </div>
      )}
    </EnhancedCardContent>
  </EnhancedCard>
));

StatsCard.displayName = "StatsCard";

const MetricCard = React.forwardRef<
  HTMLDivElement,
  EnhancedCardProps & {
    title: string;
    value: string | number;
    subtitle?: string;
    color?: 'blue' | 'green' | 'orange' | 'red' | 'purple';
    icon?: React.ReactNode;
  }
>(({ title, value, subtitle, color = 'blue', icon, className, ...props }, ref) => (
  <EnhancedCard
    ref={ref}
    variant="interactive"
    className={cn(
      "border-l-4",
      {
        'border-l-blue-500': color === 'blue',
        'border-l-green-500': color === 'green',
        'border-l-orange-500': color === 'orange',
        'border-l-red-500': color === 'red',
        'border-l-purple-500': color === 'purple',
      },
      className
    )}
    {...props}
  >
    <EnhancedCardContent compact>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-muted-foreground">{title}</p>
          <h3 className="text-xl font-bold">
            {typeof value === 'number' ? value.toLocaleString() : value}
          </h3>
          {subtitle && (
            <span className={cn(
              "text-xs flex items-center",
              {
                'text-blue-600': color === 'blue',
                'text-green-600': color === 'green',
                'text-orange-600': color === 'orange',
                'text-red-600': color === 'red',
                'text-purple-600': color === 'purple',
              }
            )}>
              {subtitle}
            </span>
          )}
        </div>
        {icon && (
          <div className={cn(
            "h-8 w-8",
            {
              'text-blue-600': color === 'blue',
              'text-green-600': color === 'green',
              'text-orange-600': color === 'orange',
              'text-red-600': color === 'red',
              'text-purple-600': color === 'purple',
            }
          )}>
            {icon}
          </div>
        )}
      </div>
    </EnhancedCardContent>
  </EnhancedCard>
));

MetricCard.displayName = "MetricCard";

export {
  EnhancedCard,
  EnhancedCardHeader,
  EnhancedCardFooter,
  EnhancedCardTitle,
  EnhancedCardDescription,
  EnhancedCardContent,
  StatsCard,
  MetricCard,
};