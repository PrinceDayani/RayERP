"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Socket } from 'socket.io-client';
import { initializeSocket, disconnectSocket } from '@/lib/socket';

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false,
});

export const useSocketContext = () => useContext(SocketContext);

export const SocketProvider = ({ children }: { children: ReactNode }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const init = async () => {
      const s = await initializeSocket();
      if (s) {
        setSocket(s);
        setIsConnected(s.connected);

        s.on('connect', () => setIsConnected(true));
        s.on('disconnect', () => setIsConnected(false));
        
        // Task notifications
        s.on('task:commented', (data) => {
        });

        s.on('task:updated', (data) => {
        });

        s.on('task:mentioned', (data) => {
        });

        s.on('task:watcher:added', (data) => {
        });

        // Custom Fields events
        s.on('task:customField:added', (data) => {
        });

        s.on('task:customField:updated', (data) => {
        });

        s.on('task:customField:removed', (data) => {
        });

        // Dependency events
        s.on('task:dependency:added', (data) => {
        });

        s.on('task:dependency:removed', (data) => {
        });

        // Gantt events
        s.on('task:gantt:updated', (data) => {
        });

        // Bulk operation events
        s.on('tasks:bulk:deleted', (data) => {
        });

        s.on('tasks:bulk:assigned', (data) => {
        });

        s.on('tasks:bulk:status:changed', (data) => {
        });

        s.on('tasks:bulk:priority:changed', (data) => {
        });

        s.on('tasks:bulk:tags:added', (data) => {
        });

        s.on('tasks:bulk:dueDate:set', (data) => {
        });

        s.on('tasks:bulk:cloned', (data) => {
        });

        s.on('tasks:bulk:archived', (data) => {
        });
      }
    };

    init();

    return () => {
      disconnectSocket();
      setSocket(null);
      setIsConnected(false);
    };
  }, []);

  return (
    <SocketContext.Provider value={{ socket, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
};
