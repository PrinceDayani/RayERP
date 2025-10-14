"use client";

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Wifi, WifiOff, RefreshCw } from 'lucide-react';

interface RealTimeIndicatorProps {
  isConnected: boolean;
  lastUpdated?: Date;
  isLoading?: boolean;
}

export const RealTimeIndicator: React.FC<RealTimeIndicatorProps> = ({
  isConnected,
  lastUpdated,
  isLoading = false
}) => {
  const formatLastUpdated = (date?: Date) => {
    if (!date) return 'Never';
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="flex items-center gap-2 text-sm">
      <Badge 
        variant={isConnected ? "default" : "secondary"}
        className={`flex items-center gap-1 ${
          isConnected 
            ? 'bg-green-100 text-green-800 border-green-200' 
            : 'bg-orange-100 text-orange-800 border-orange-200'
        }`}
      >
        {isLoading ? (
          <RefreshCw className="h-3 w-3 animate-spin" />
        ) : isConnected ? (
          <Wifi className="h-3 w-3" />
        ) : (
          <WifiOff className="h-3 w-3" />
        )}
        {isConnected ? 'Live' : 'Offline'}
      </Badge>
      
      {lastUpdated && (
        <span className="text-muted-foreground">
          Updated {formatLastUpdated(lastUpdated)}
        </span>
      )}
    </div>
  );
};

export default RealTimeIndicator;