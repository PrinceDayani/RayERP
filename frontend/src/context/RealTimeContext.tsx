"use client";

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { toast } from 'react-hot-toast';

interface RealTimeContextType {
  socket: Socket | null;
  isConnected: boolean;
  connectionStatus: 'connecting' | 'connected' | 'disconnected' | 'error';
  lastUpdate: Date | null;
  subscribe: (event: string, callback: (data: any) => void) => void;
  unsubscribe: (event: string) => void;
  emit: (event: string, data?: any) => void;
  reconnect: () => void;
}

const RealTimeContext = createContext<RealTimeContextType | undefined>(undefined);

export const useRealTime = () => {
  const context = useContext(RealTimeContext);
  if (context === undefined) {
    throw new Error('useRealTime must be used within a RealTimeProvider');
  }
  return context;
};

interface RealTimeProviderProps {
  children: React.ReactNode;
}

export const RealTimeProvider: React.FC<RealTimeProviderProps> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('disconnected');
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;
  const reconnectTimeout = useRef<NodeJS.Timeout>();

  const createSocket = useCallback(() => {
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
    
    const newSocket = io(backendUrl, {
      transports: ['polling', 'websocket'],
      upgrade: true,
      rememberUpgrade: true,
      timeout: 20000,
      forceNew: true,
      reconnection: true,
      reconnectionAttempts: maxReconnectAttempts,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      maxReconnectionAttempts: maxReconnectAttempts,
      randomizationFactor: 0.5
    });

    // Connection event handlers
    newSocket.on('connect', () => {
      console.log('✅ Socket connected:', newSocket.id);
      setIsConnected(true);
      setConnectionStatus('connected');
      setLastUpdate(new Date());
      reconnectAttempts.current = 0;
      
      // Authenticate if token exists
      const token = localStorage.getItem('auth-token');
      if (token) {
        newSocket.emit('authenticate', token);
      }
      
      toast.success('Real-time connection established');
    });

    newSocket.on('disconnect', (reason) => {
      console.log('❌ Socket disconnected:', reason);
      setIsConnected(false);
      setConnectionStatus('disconnected');
      
      if (reason === 'io server disconnect') {
        // Server initiated disconnect, reconnect manually
        newSocket.connect();
      }
    });

    newSocket.on('connect_error', (error) => {
      console.error('❌ Socket connection error:', error);
      setConnectionStatus('error');
      reconnectAttempts.current++;
      
      if (reconnectAttempts.current >= maxReconnectAttempts) {
        toast.error('Failed to establish real-time connection');
      }
    });

    newSocket.on('reconnect', (attemptNumber) => {
      console.log(`🔄 Socket reconnected after ${attemptNumber} attempts`);
      toast.success('Real-time connection restored');
    });

    newSocket.on('reconnect_error', (error) => {
      console.error('❌ Socket reconnection error:', error);
    });

    // Authentication events
    newSocket.on('auth_success', (data) => {
      console.log('✅ Socket authenticated:', data);
      toast.success('Real-time authentication successful');
    });

    newSocket.on('auth_error', (error) => {
      console.error('❌ Socket authentication error:', error);
      toast.error('Real-time authentication failed');
    });

    // Connection status updates
    newSocket.on('connection_status', (data) => {
      setLastUpdate(new Date(data.timestamp));
    });

    // System stats updates
    newSocket.on('system_stats', (data) => {
      setLastUpdate(new Date(data.timestamp));
    });

    // Real-time notifications
    newSocket.on('notification:received', (notification) => {
      const { type, title, message } = notification;
      
      switch (type) {
        case 'success':
          toast.success(`${title}: ${message}`);
          break;
        case 'error':
          toast.error(`${title}: ${message}`);
          break;
        case 'warning':
          toast(`${title}: ${message}`, { icon: '⚠️' });
          break;
        default:
          toast(`${title}: ${message}`);
      }
    });

    // Settings sync events
    newSocket.on('settings:synced', (data) => {
      setLastUpdate(new Date(data.timestamp));
      // Trigger custom event for settings components
      window.dispatchEvent(new CustomEvent('settings:synced', { detail: data }));
    });

    // Chat events
    newSocket.on('user_joined_chat', (data) => {
      setLastUpdate(new Date(data.timestamp));
    });

    newSocket.on('user_left_chat', (data) => {
      setLastUpdate(new Date(data.timestamp));
    });

    newSocket.on('user_typing', (data) => {
      setLastUpdate(new Date(data.timestamp));
    });

    newSocket.on('user_stop_typing', (data) => {
      setLastUpdate(new Date(data.timestamp));
    });

    // Error handling
    newSocket.on('socket_error', (error) => {
      console.error('Socket error:', error);
      toast.error('Real-time connection error');
    });

    return newSocket;
  }, []);

  const reconnect = useCallback(() => {
    if (socket) {
      socket.disconnect();
    }
    
    setConnectionStatus('connecting');
    
    if (reconnectTimeout.current) {
      clearTimeout(reconnectTimeout.current);
    }
    
    reconnectTimeout.current = setTimeout(() => {
      const newSocket = createSocket();
      setSocket(newSocket);
    }, 1000);
  }, [socket, createSocket]);

  const subscribe = useCallback((event: string, callback: (data: any) => void) => {
    if (socket) {
      socket.on(event, callback);
    }
  }, [socket]);

  const unsubscribe = useCallback((event: string) => {
    if (socket) {
      socket.off(event);
    }
  }, [socket]);

  const emit = useCallback((event: string, data?: any) => {
    if (socket && isConnected) {
      socket.emit(event, data);
    } else {
      console.warn('Socket not connected, cannot emit event:', event);
    }
  }, [socket, isConnected]);

  useEffect(() => {
    setConnectionStatus('connecting');
    const newSocket = createSocket();
    setSocket(newSocket);

    return () => {
      if (newSocket) {
        newSocket.disconnect();
      }
      if (reconnectTimeout.current) {
        clearTimeout(reconnectTimeout.current);
      }
    };
  }, [createSocket]);

  const value: RealTimeContextType = {
    socket,
    isConnected,
    connectionStatus,
    lastUpdate,
    subscribe,
    unsubscribe,
    emit,
    reconnect
  };

  return (
    <RealTimeContext.Provider value={value}>
      {children}
    </RealTimeContext.Provider>
  );
};
