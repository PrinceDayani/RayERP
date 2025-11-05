//path: frontend/src/hooks/useSocket.ts

"use client";

import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';

export const useSocket = (url: string = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000') => {
  const socketRef = useRef<Socket | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Only initialize socket if backend is likely running
    const initSocket = () => {
      try {
        if (!socketRef.current) {
          socketRef.current = io(url, {
            transports: ['websocket', 'polling'],
            withCredentials: true,
            timeout: 5000,
            forceNew: true,
            reconnection: true,
            reconnectionAttempts: 3,
            reconnectionDelay: 1000
          });

          socketRef.current.on('connect', () => {
            console.log('✅ Socket connected:', socketRef.current?.id);
            setIsConnected(true);
            setSocket(socketRef.current);
            
            // Authenticate socket connection
            const token = localStorage.getItem('auth-token');
            if (token) {
              socketRef.current?.emit('authenticate', token);
            }
          });

          socketRef.current.on('disconnect', () => {
            console.log('🔌 Socket disconnected');
            setIsConnected(false);
            setSocket(null);
          });

          socketRef.current.on('connect_error', (error) => {
            console.warn('⚠️ Socket connection error:', error.message);
            setIsConnected(false);
            setSocket(null);
          });

          socketRef.current.on('reconnect', () => {
            console.log('🔄 Socket reconnected');
            setIsConnected(true);
          });

          socketRef.current.on('reconnect_failed', () => {
            console.warn('❌ Socket reconnection failed');
            setIsConnected(false);
          });
        }
      } catch (error) {
        console.warn('Socket initialization failed:', error);
        setSocket(null);
        setIsConnected(false);
      }
    };

    // Check if backend is running before initializing socket
    fetch(`${url}/api/health`)
      .then(() => initSocket())
      .catch(() => {
        console.warn('Backend not available, skipping socket connection');
        setSocket(null);
        setIsConnected(false);
      });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        setSocket(null);
        setIsConnected(false);
      }
    };
  }, [url]);

  return socket;
};