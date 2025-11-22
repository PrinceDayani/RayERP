"use client";

import { useEffect, useState } from 'react';
import { useSocketContext } from './SocketContext';

interface SystemStats {
  timestamp: string;
  uptime: number;
  memory: NodeJS.MemoryUsage;
  connections: number;
}

export const useSocketRealtime = (types?: string[]) => {
  const { socket, isConnected } = useSocketContext();
  const [systemStats, setSystemStats] = useState<SystemStats | null>(null);

  useEffect(() => {
    if (!socket || !isConnected) return;

    if (types && types.length > 0) {
      socket.emit('subscribe_realtime', { types });
    }

    const handleStats = (stats: SystemStats) => {
      setSystemStats(stats);
    };

    socket.on('system_stats', handleStats);

    return () => {
      socket.off('system_stats', handleStats);
    };
  }, [socket, isConnected, types]);

  return { systemStats };
};
