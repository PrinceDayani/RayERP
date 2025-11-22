"use client";

import { useEffect } from 'react';
import { useSocketContext } from './SocketContext';

export const useSocketAuth = (token?: string) => {
  const { socket, isConnected } = useSocketContext();

  useEffect(() => {
    if (!socket || !isConnected) return;

    const handleAuthSuccess = (data: { userId: string; timestamp: string }) => {
      console.log('Socket authenticated:', data.userId);
    };

    const handleAuthError = (error: string) => {
      console.error('Socket auth error:', error);
    };

    socket.on('auth_success', handleAuthSuccess);
    socket.on('auth_error', handleAuthError);

    if (token) {
      socket.emit('authenticate', token);
    }

    return () => {
      socket.off('auth_success', handleAuthSuccess);
      socket.off('auth_error', handleAuthError);
    };
  }, [socket, isConnected, token]);

  return { socket, isConnected };
};
