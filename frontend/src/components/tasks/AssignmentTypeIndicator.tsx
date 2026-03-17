"use client";

import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { User, UserPlus } from "lucide-react";

interface AssignmentTypeIndicatorProps {
  assignmentType?: "self-assigned" | "manager-assigned";
  taskType?: "individual" | "project";
  size?: "sm" | "md" | "lg";
  showIcon?: boolean;
  showText?: boolean;
}

export function AssignmentTypeIndicator({
  assignmentType,
  taskType,
  size = "sm",
  showIcon = true,
  showText = true,
}: AssignmentTypeIndicatorProps) {
  if (!assignmentType && !taskType) return null;

  const isSelfAssigned = assignmentType === "self-assigned";
  const isIndividual = taskType === "individual";

  const sizeClasses = {
    sm: "h-3 w-3",
    md: "h-4 w-4",
    lg: "h-5 w-5",
  };

  const iconSize = sizeClasses[size];

  const getVariant = () => {
    if (isSelfAssigned) return "default";
    if (isIndividual) return "secondary";
    return "outline";
  };

  const getLabel = () => {
    if (isSelfAssigned) return "Self-Assigned";
    if (assignmentType === "manager-assigned") return "Manager-Assigned";
    if (isIndividual) return "Individual";
    return "Project Task";
  };

  const getIcon = () => {
    if (isSelfAssigned) return <User className={iconSize} />;
    return <UserPlus className={iconSize} />;
  };

  const getTooltip = () => {
    if (isSelfAssigned) return "This task was created by the assignee for themselves";
    if (assignmentType === "manager-assigned") return "This task was assigned by a manager";
    if (isIndividual) return "Individual task not linked to a project";
    return "Task linked to a project";
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge variant={getVariant()} className="gap-1 cursor-help">
            {showIcon && getIcon()}
            {showText && <span className="text-xs">{getLabel()}</span>}
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <p className="text-xs">{getTooltip()}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
