'use client';

import { AlertCircle, Flame, AlertTriangle, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TaskPriorityIndicatorProps {
  priority: 'low' | 'medium' | 'high' | 'critical';
  className?: string;
  showIcon?: boolean;
  showLabel?: boolean;
}

const priorityConfig = {
  critical: {
    color: 'border-red-500 bg-red-50 text-red-700',
    icon: Flame,
    label: 'Critical',
    animate: 'animate-pulse'
  },
  high: {
    color: 'border-orange-500 bg-orange-50 text-orange-700',
    icon: AlertCircle,
    label: 'High',
    animate: ''
  },
  medium: {
    color: 'border-yellow-500 bg-yellow-50 text-yellow-700',
    icon: AlertTriangle,
    label: 'Medium',
    animate: ''
  },
  low: {
    color: 'border-blue-500 bg-blue-50 text-blue-700',
    icon: Info,
    label: 'Low',
    animate: ''
  }
};

export default function TaskPriorityIndicator({ 
  priority, 
  className, 
  showIcon = true, 
  showLabel = true 
}: TaskPriorityIndicatorProps) {
  const config = priorityConfig[priority];
  const Icon = config.icon;

  return (
    <div className={cn(
      'inline-flex items-center gap-2 px-3 py-1 rounded-full border-2',
      config.color,
      config.animate,
      className
    )}>
      {showIcon && <Icon className="w-4 h-4" />}
      {showLabel && <span className="text-sm font-medium">{config.label}</span>}
    </div>
  );
}
