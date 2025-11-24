"use client";

import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { ChevronRight, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface PageHeaderProps {
  title: string;
  description?: string;
  breadcrumbs?: BreadcrumbItem[];
  actions?: React.ReactNode;
  badge?: {
    text: string;
    variant?: 'default' | 'secondary' | 'destructive' | 'outline';
  };
  showBackButton?: boolean;
  backButtonPath?: string;
  className?: string;
  gradient?: boolean;
}

const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  description,
  breadcrumbs = [],
  actions,
  badge,
  showBackButton = false,
  backButtonPath,
  className,
  gradient = false
}) => {
  const router = useRouter();

  const handleBack = () => {
    if (backButtonPath) {
      router.push(backButtonPath);
    } else {
      router.back();
    }
  };

  return (
    <div className={cn(
      'space-y-4 pb-6',
      gradient && 'bg-gradient-to-r from-background via-background to-muted/20 -mx-6 -mt-6 px-6 pt-6 mb-6',
      className
    )}>
      {/* Breadcrumbs */}
      {breadcrumbs.length > 0 && (
        <Breadcrumb>
          <BreadcrumbList>
            {breadcrumbs.map((item, index) => (
              <React.Fragment key={index}>
                <BreadcrumbItem>
                  {item.href ? (
                    <BreadcrumbLink 
                      href={item.href}
                      className="text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {item.label}
                    </BreadcrumbLink>
                  ) : (
                    <BreadcrumbPage className="font-medium">
                      {item.label}
                    </BreadcrumbPage>
                  )}
                </BreadcrumbItem>
                {index < breadcrumbs.length - 1 && (
                  <BreadcrumbSeparator>
                    <ChevronRight className="h-4 w-4" />
                  </BreadcrumbSeparator>
                )}
              </React.Fragment>
            ))}
          </BreadcrumbList>
        </Breadcrumb>
      )}

      {/* Header Content */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-start gap-4">
          {/* Back Button */}
          {showBackButton && (
            <Button
              variant="outline"
              size="icon"
              onClick={handleBack}
              className="mt-1 shrink-0"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
          )}

          {/* Title and Description */}
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <h1 className={cn(
                'text-3xl font-bold tracking-tight',
                gradient ? 'bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent' : 'text-foreground'
              )}>
                {title}
              </h1>
              {badge && (
                <Badge variant={badge.variant || 'default'}>
                  {badge.text}
                </Badge>
              )}
            </div>
            {description && (
              <p className="text-muted-foreground text-lg max-w-2xl">
                {description}
              </p>
            )}
          </div>
        </div>

        {/* Actions */}
        {actions && (
          <div className="flex items-center gap-2 shrink-0">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
};

export default PageHeader;
