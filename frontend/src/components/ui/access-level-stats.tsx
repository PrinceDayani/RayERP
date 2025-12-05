"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { UserCheck, Eye, TrendingUp, Users } from "lucide-react";

interface AccessLevelStatsProps {
  fullAccessCount: number;
  basicViewCount: number;
  totalCount: number;
  className?: string;
}

export function AccessLevelStats({ 
  fullAccessCount, 
  basicViewCount, 
  totalCount,
  className 
}: AccessLevelStatsProps) {
  const fullAccessPercentage = totalCount > 0 ? (fullAccessCount / totalCount) * 100 : 0;
  const basicViewPercentage = totalCount > 0 ? (basicViewCount / totalCount) * 100 : 0;

  return (
    <div className={`grid grid-cols-1 md:grid-cols-3 gap-4 ${className}`}>
      <Card className="border-l-4 border-l-blue-500">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Items</p>
              <p className="text-2xl font-bold">{totalCount}</p>
              <p className="text-xs text-muted-foreground mt-1">All accessible items</p>
            </div>
            <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-xl">
              <Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-l-4 border-l-green-500">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Full Access</p>
              <p className="text-2xl font-bold text-green-600">{fullAccessCount}</p>
              <div className="flex items-center gap-2 mt-1">
                <Progress value={fullAccessPercentage} className="h-1.5 w-16" />
                <span className="text-xs text-green-600 font-medium">
                  {fullAccessPercentage.toFixed(0)}%
                </span>
              </div>
            </div>
            <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-xl">
              <UserCheck className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-l-4 border-l-amber-500">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Department View</p>
              <p className="text-2xl font-bold text-amber-600">{basicViewCount}</p>
              <div className="flex items-center gap-2 mt-1">
                <Progress value={basicViewPercentage} className="h-1.5 w-16" />
                <span className="text-xs text-amber-600 font-medium">
                  {basicViewPercentage.toFixed(0)}%
                </span>
              </div>
            </div>
            <div className="p-3 bg-amber-100 dark:bg-amber-900/20 rounded-xl">
              <Eye className="h-6 w-6 text-amber-600 dark:text-amber-400" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}