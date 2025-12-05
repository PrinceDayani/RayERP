"use client";

import { ReactNode } from "react";
import { AccessLevelLegend } from "@/components/ui/access-level-indicator";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Info, HelpCircle, Users, Shield } from "lucide-react";

interface TieredAccessWrapperProps {
  children: ReactNode;
  title: string;
  showLegend?: boolean;
  hasBasicViewItems?: boolean;
  fullAccessCount?: number;
  basicViewCount?: number;
  onRequestBulkAccess?: () => void;
}

export function TieredAccessWrapper({ 
  children, 
  title, 
  showLegend = true,
  hasBasicViewItems = false,
  fullAccessCount = 0,
  basicViewCount = 0,
  onRequestBulkAccess
}: TieredAccessWrapperProps) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
            {title}
          </h1>
          {(fullAccessCount > 0 || basicViewCount > 0) && (
            <p className="text-sm text-muted-foreground mt-1">
              {fullAccessCount} full access • {basicViewCount} department view
            </p>
          )}
        </div>
        {showLegend && (
          <AccessLevelLegend 
            fullAccessCount={fullAccessCount}
            basicViewCount={basicViewCount}
          />
        )}
      </div>
      
      {hasBasicViewItems && (
        <Card className="border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 dark:border-amber-800 dark:from-amber-950 dark:to-orange-950">
          <CardContent className="p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3 flex-1">
                <div className="p-2 bg-amber-100 dark:bg-amber-900 rounded-lg">
                  <Shield className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                </div>
                <div className="text-sm">
                  <p className="font-semibold text-amber-900 dark:text-amber-100 mb-2">
                    Mixed Access Levels Detected
                  </p>
                  <div className="space-y-1 text-amber-800 dark:text-amber-200">
                    <p>• <strong>Dashed borders</strong> indicate department-level visibility</p>
                    <p>• <strong>Solid borders</strong> show items you can fully manage</p>
                    <p>• Click <strong>"Request Access"</strong> to get assignment to specific items</p>
                  </div>
                </div>
              </div>
              {onRequestBulkAccess && basicViewCount > 1 && (
                <div className="flex flex-col gap-2">
                  <Button 
                    size="sm" 
                    variant="outline"
                    className="border-amber-300 text-amber-700 hover:bg-amber-100"
                    onClick={onRequestBulkAccess}
                  >
                    <Users className="w-4 h-4 mr-2" />
                    Request Bulk Access
                  </Button>
                  <p className="text-xs text-amber-600 text-center">
                    {basicViewCount} items
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
      
      {children}
    </div>
  );
}