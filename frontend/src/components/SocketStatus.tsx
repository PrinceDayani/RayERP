'use client';

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Wifi, WifiOff } from 'lucide-react';

interface SocketStatusProps {
  isConnected: boolean;
  isEnabled: boolean;
  onToggle?: () => void;
}

export const SocketStatus: React.FC<SocketStatusProps> = ({ 
  isConnected, 
  isEnabled, 
  onToggle 
}) => {
  if (!isEnabled) {
    return (
      <div className="flex items-center space-x-2 text-sm text-gray-500">
        <WifiOff className="w-4 h-4" />
        <span>Real-time updates disabled</span>
        {onToggle && (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onToggle}
            className="text-xs"
          >
            Enable
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="flex items-center space-x-2">
      <Wifi className={`w-4 h-4 ${isConnected ? 'text-green-500' : 'text-red-500'}`} />
      <Badge 
        variant={isConnected ? "default" : "destructive"}
        className={isConnected ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}
      >
        {isConnected ? "Connected" : "Disconnected"}
      </Badge>
      {onToggle && (
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={onToggle}
          className="text-xs"
        >
          Disable
        </Button>
      )}
    </div>
  );
};

export default SocketStatus;