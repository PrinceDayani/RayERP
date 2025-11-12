//path: frontend/src/hooks/useSocket.ts

"use client";

import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';

export const useSocket = (url: string = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000') => {
  const socketRef = useRef<Socket | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    let mounted = true;

    try {
      if (!socketRef.current) {
        const token = localStorage.getItem('auth-token') || localStorage.getItem('token');
        
        socketRef.current = io(url, {
          transports: ['websocket', 'polling'],
          withCredentials: true,
          autoConnect: true,
          reconnection: true,
          reconnectionAttempts: 5,
          reconnectionDelay: 2000,
          timeout: 10000,
          auth: token ? { token } : undefined
        });

        socketRef.current.on('connect', () => {
          if (mounted) {
            console.log('Socket connected:', socketRef.current?.id);
            setIsConnected(true);
            setSocket(socketRef.current);
            
            // Authenticate socket
            const authToken = localStorage.getItem('auth-token') || localStorage.getItem('token');
            if (authToken && socketRef.current) {
              socketRef.current.emit('authenticate', authToken);
            }
          }
        });

        socketRef.current.on('disconnect', () => {
          if (mounted) {
            console.log('Socket disconnected');
            setIsConnected(false);
          }
        });

        socketRef.current.on('connect_error', (error) => {
          console.warn('Socket connection failed:', error.message);
          if (mounted) {
            setIsConnected(false);
          }
        });

        socketRef.current.on('reconnect', (attemptNumber) => {
          console.log(`Socket reconnected after ${attemptNumber} attempts`);
          if (mounted) {
            setIsConnected(true);
          }
        });

        // Set initial state if already connected
        if (socketRef.current.connected && mounted) {
          setIsConnected(true);
          setSocket(socketRef.current);
        }
      }
    } catch (error) {
      console.error('Socket initialization error:', error);
    }

    return () => {
      mounted = false;
      if (socketRef.current) {
        socketRef.current.removeAllListeners();
        socketRef.current.disconnect();
        socketRef.current = null;
        setSocket(null);
        setIsConnected(false);
      }
    };
  }, [url]);

  return socket;
};