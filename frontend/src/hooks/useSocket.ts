//path: frontend/src/hooks/useSocket.ts

"use client";

import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';

export const useSocket = (url: string = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000') => {
  const socketRef = useRef<Socket | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    if (!socketRef.current) {
      socketRef.current = io(url, {
        transports: ['websocket', 'polling'],
        withCredentials: true,
      });

      // Authenticate socket connection
      const token = localStorage.getItem('token');
      if (token) {
        socketRef.current.emit('authenticate', token);
      }

      socketRef.current.on('connect', () => {
        console.log('Socket connected:', socketRef.current?.id);
        setSocket(socketRef.current);
      });

      socketRef.current.on('disconnect', () => {
        console.log('Socket disconnected');
        setSocket(null);
      });

      setSocket(socketRef.current);
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