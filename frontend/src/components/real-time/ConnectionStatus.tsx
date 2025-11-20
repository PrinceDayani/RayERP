"use client";

import React from 'react';
import { useRealTime } from '@/context/RealTimeContext';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Wifi, WifiOff, RefreshCw, AlertCircle } from 'lucide-react';

export const ConnectionStatus: React.FC = () => {
  const { isConnected, connectionStatus, lastUpdate, reconnect } = useRealTime();

  const getStatusColor = () => {
    switch (connectionStatus) {
      case 'connected':
        return 'bg-green-500';
      case 'connecting':
        return 'bg-yellow-500';
      case 'error':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusIcon = () => {
    switch (connectionStatus) {
      case 'connected':
        return <Wifi className="h-4 w-4" />;
      case 'connecting':
        return <RefreshCw className="h-4 w-4 animate-spin" />;
      case 'error':
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <WifiOff className="h-4 w-4" />;
    }
  };

  return (
    <div className="flex items-center gap-2 p-2 rounded-lg bg-card border">
      <div className="flex items-center gap-2">
        <div className={`w-2 h-2 rounded-full ${getStatusColor()}`} />
        {getStatusIcon()}
        <Badge variant={isConnected ? 'default' : 'destructive'}>
          {connectionStatus.charAt(0).toUpperCase() + connectionStatus.slice(1)}
        </Badge>
      </div>
      
      {lastUpdate && (
        <span className="text-xs text-muted-foreground">
          Last update: {lastUpdate.toLocaleTimeString()}
        </span>
      )}
      
      {!isConnected && (
        <Button
          size="sm"
          variant="outline"
          onClick={reconnect}
          className="ml-auto"
        >
          <RefreshCw className="h-3 w-3 mr-1" />
          Reconnect
        </Button>
      )}
    </div>
  );
};
