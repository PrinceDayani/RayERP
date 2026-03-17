"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Socket } from 'socket.io-client';
import { initializeSocket, disconnectSocket, getSocket } from '@/lib/socket';

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
          console.log('Task comment notification:', data);
        });
        
        s.on('task:updated', (data) => {
          console.log('Task update notification:', data);
        });
        
        s.on('task:mentioned', (data) => {
          console.log('Task mention notification:', data);
        });
        
        s.on('task:watcher:added', (data) => {
          console.log('Watcher added notification:', data);
        });

        // Custom Fields events
        s.on('task:customField:added', (data) => {
          console.log('Custom field added:', data);
        });

        s.on('task:customField:updated', (data) => {
          console.log('Custom field updated:', data);
        });

        s.on('task:customField:removed', (data) => {
          console.log('Custom field removed:', data);
        });

        // Dependency events
        s.on('task:dependency:added', (data) => {
          console.log('Dependency added:', data);
        });

        s.on('task:dependency:removed', (data) => {
          console.log('Dependency removed:', data);
        });

        // Gantt events
        s.on('task:gantt:updated', (data) => {
          console.log('Gantt task updated:', data);
        });

        // Bulk operation events
        s.on('tasks:bulk:deleted', (data) => {
          console.log('Tasks bulk deleted:', data);
        });

        s.on('tasks:bulk:assigned', (data) => {
          console.log('Tasks bulk assigned:', data);
        });

        s.on('tasks:bulk:status:changed', (data) => {
          console.log('Tasks bulk status changed:', data);
        });

        s.on('tasks:bulk:priority:changed', (data) => {
          console.log('Tasks bulk priority changed:', data);
        });

        s.on('tasks:bulk:tags:added', (data) => {
          console.log('Tasks bulk tags added:', data);
        });

        s.on('tasks:bulk:dueDate:set', (data) => {
          console.log('Tasks bulk due date set:', data);
        });

        s.on('tasks:bulk:cloned', (data) => {
          console.log('Tasks bulk cloned:', data);
        });

        s.on('tasks:bulk:archived', (data) => {
          console.log('Tasks bulk archived:', data);
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
