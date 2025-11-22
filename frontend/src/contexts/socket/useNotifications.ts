"use client";

import { useEffect, useState } from 'react';
import { useSocketContext } from './SocketContext';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  priority: string;
  timestamp: string;
}

export const useSocketNotifications = () => {
  const { socket, isConnected } = useSocketContext();
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    if (!socket || !isConnected) return;

    const handleNotification = (notification: Notification) => {
      setNotifications(prev => [notification, ...prev]);
    };

    socket.on('notification:received', handleNotification);

    return () => {
      socket.off('notification:received', handleNotification);
    };
  }, [socket, isConnected]);

  const sendTestNotification = (data?: { title?: string; message?: string }) => {
    if (socket) {
      socket.emit('notification:test', data);
    }
  };

  return { notifications, sendTestNotification };
};
