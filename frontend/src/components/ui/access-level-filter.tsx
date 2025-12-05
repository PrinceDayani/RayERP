"use client";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Filter, Eye, UserCheck } from "lucide-react";

interface AccessLevelFilterProps {
  value: 'all' | 'full' | 'basic';
  onValueChange: (value: 'all' | 'full' | 'basic') => void;
  fullCount?: number;
  basicCount?: number;
  className?: string;
}

export function AccessLevelFilter({ 
  value, 
  onValueChange, 
  fullCount = 0, 
  basicCount = 0,
  className 
}: AccessLevelFilterProps) {
  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger className={`w-48 ${className}`}>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4" />
          <SelectValue placeholder="Access Level" />
        </div>
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">
          <div className="flex items-center justify-between w-full">
            <span>All Access Levels</span>
            <Badge variant="outline" className="ml-2 text-xs">
              {fullCount + basicCount}
            </Badge>
          </div>
        </SelectItem>
        <SelectItem value="full">
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2">
              <UserCheck className="w-3 h-3 text-green-600" />
              <span>Full Access</span>
            </div>
            <Badge variant="secondary" className="ml-2 text-xs">
              {fullCount}
            </Badge>
          </div>
        </SelectItem>
        <SelectItem value="basic">
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2">
              <Eye className="w-3 h-3 text-amber-600" />
              <span>Department View</span>
            </div>
            <Badge variant="outline" className="ml-2 text-xs border-amber-200 text-amber-700">
              {basicCount}
            </Badge>
          </div>
        </SelectItem>
      </SelectContent>
    </Select>
  );
}