//path: frontend/src/hooks/useSocket.ts

"use client";

import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';

export const useSocket = (url: string = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000') => {
  const socketRef = useRef<Socket | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      if (!socketRef.current) {
        socketRef.current = io(url, {
          transports: ['websocket', 'polling'],
          withCredentials: true,
          autoConnect: true,
          reconnection: true,
          reconnectionAttempts: 3,
          reconnectionDelay: 2000,
          timeout: 10000
        });

        socketRef.current.on('connect', () => {
          setSocket(socketRef.current);
        });

        socketRef.current.on('connect_error', (error) => {
          console.warn('Socket connection failed:', error.message);
        });
      }
    } catch (error) {
      // Silently handle initialization errors
    }

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        setSocket(null);
      }
    };
  }, [url]);

  return socket;
};