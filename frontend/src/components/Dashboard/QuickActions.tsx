//project\frontend\src\components\Dashboard\QuickActions.tsx
"use client";

import React, { memo } from "react";
import { QUICK_ACTIONS } from "@/config/quickActions";
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardDescription, 
  CardContent 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { cn } from "@/lib/utils";

interface QuickActionProps {
  title: string;
  description: string;
  href: string;
  color: string;
  isAuthenticated: boolean;
  router: AppRouterInstance;
  badgeText: string;
}

const QuickAction: React.FC<QuickActionProps> = memo(({
  title,
  description,
  href,
  color,
  isAuthenticated,
  router,
  badgeText
}) => {
  return (
    <Button
      variant="outline"
      className={cn(
        "flex flex-col h-auto p-4 transition-all",
        isAuthenticated ? "hover:shadow-md" : "opacity-50 cursor-not-allowed"
      )}
      onClick={() => isAuthenticated && router.push(href)}
      disabled={!isAuthenticated}
    >
      <Badge variant="secondary" className="mb-3">
        {badgeText}
      </Badge>
      <h3 className="font-medium text-sm">{title}</h3>
      <p className="text-xs text-muted-foreground mt-1">{description}</p>
    </Button>
  );
});

QuickAction.displayName = 'QuickAction';

interface QuickActionsProps {
  isAuthenticated: boolean;
  router: AppRouterInstance;
}

const QuickActions: React.FC<QuickActionsProps> = memo(({ isAuthenticated, router }) => {
  const actions = QUICK_ACTIONS;

  return (
    <Card className="overflow-hidden transition-all hover:shadow-md">
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
        <CardDescription>Common tasks for employee and project management</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {actions.map((action, index) => (
            <QuickAction
              key={index}
              title={action.title}
              description={action.description}
              href={action.href}
              color={action.color}
              isAuthenticated={isAuthenticated}
              router={router}
              badgeText={action.badgeText}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
});

QuickActions.displayName = 'QuickActions';

export default QuickActions;
