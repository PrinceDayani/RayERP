"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/tooltip";
import { Eye, Lock, Users, Info, Shield, UserCheck } from "lucide-react";

interface AccessLevelIndicatorProps {
  isBasicView?: boolean;
  className?: string;
  showRequestAccess?: boolean;
  onRequestAccess?: () => void;
}

export function AccessLevelIndicator({
  isBasicView,
  className,
  showRequestAccess = false,
  onRequestAccess
}: AccessLevelIndicatorProps) {
  if (!isBasicView) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge
              variant="default"
              className={`text-xs flex items-center gap-1 bg-green-100 text-green-800 border-green-200 hover:bg-green-200 ${className}`}
            >
              <UserCheck className="w-3 h-3" />
              Full Access
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <div className="text-sm max-w-xs">
              <p className="font-medium mb-1 text-green-600">✓ Full Access</p>
              <p>You have complete access to view, edit, and manage this item.</p>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge
            variant="outline"
            className={`text-xs flex items-center gap-1 bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100 ${className}`}
          >
            <Eye className="w-3 h-3" />
            Department View
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <div className="text-sm max-w-xs space-y-2">
            <div>
              <p className="font-medium mb-1 text-amber-600">⚠ Limited Access</p>
              <p>You can see basic information through your department permissions.</p>
            </div>
            <div className="pt-2 border-t border-gray-200">
              <p className="text-xs text-gray-600 mb-2">To get full access:</p>
              <ul className="text-xs text-gray-600 space-y-1">
                <li>• Request assignment to this project/task</li>
                <li>• Contact your manager or project lead</li>
              </ul>
            </div>
            {showRequestAccess && onRequestAccess && (
              <Button
                size="sm"
                variant="outline"
                className="w-full mt-2 text-xs h-7"
                onClick={(e) => {
                  e.stopPropagation();
                  onRequestAccess();
                }}
              >
                Request Access
              </Button>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

interface AccessLevelLegendProps {
  className?: string;
  fullAccessCount?: number;
  basicViewCount?: number;
}

export function AccessLevelLegend({
  className,
  fullAccessCount = 0,
  basicViewCount = 0
}: AccessLevelLegendProps) {
  return (
    <div className={`flex items-center gap-6 text-sm bg-gray-50 dark:bg-gray-900 px-4 py-2 rounded-lg border ${className}`}>
      <div className="flex items-center gap-2">
        <div className="w-3 h-3 border-2 border-solid rounded bg-green-100 border-green-300"></div>
        <span className="font-medium">Full Access</span>
        {fullAccessCount > 0 && (
          <Badge variant="secondary" className="text-xs px-1.5 py-0.5 h-5">
            {fullAccessCount}
          </Badge>
        )}
      </div>
      <div className="flex items-center gap-2">
        <div className="w-3 h-3 border-2 border-dashed rounded opacity-75 bg-amber-50 border-amber-300"></div>
        <span className="font-medium">Department View</span>
        {basicViewCount > 0 && (
          <Badge variant="outline" className="text-xs px-1.5 py-0.5 h-5 border-amber-200 text-amber-700">
            {basicViewCount}
          </Badge>
        )}
      </div>
      <div className="flex items-center gap-1 text-xs text-muted-foreground ml-auto">
        <Info className="w-3 h-3" />
        <span>Access Levels</span>
      </div>
    </div>
  );
}