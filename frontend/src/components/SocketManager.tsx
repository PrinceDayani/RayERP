"use client";

import { useEffect, useState } from 'react';
import { initializeSocket, disconnectSocket, getSocket } from '../lib/socket';
import { realTimeDataManager } from '../lib/realTimeDataManager';

export default function SocketManager() {
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('disconnected');

  useEffect(() => {
    let mounted = true;
    let reconnectTimeout: NodeJS.Timeout;

    // Initialize socket connection when component mounts
    const init = async () => {
      if (!mounted) return;
      
      try {
        setConnectionStatus('connecting');
        const socket = await initializeSocket();
        
        if (!mounted || !socket) {
          setConnectionStatus('error');
          return;
        }

        // Set up connection event listeners
        socket.on('connect', () => {
          if (mounted) {
            setConnectionStatus('connected');
            console.log('✅ Socket connected successfully');
            
            // Start real-time data simulation when connected
            realTimeDataManager.startSimulation();
          }
        });

        socket.on('disconnect', (reason) => {
          if (mounted) {
            setConnectionStatus('disconnected');
            console.warn('⚠️ Socket disconnected:', reason);
            
            // Attempt to reconnect after a delay
            if (reason === 'io server disconnect') {
              // Server initiated disconnect, don't reconnect automatically
              return;
            }
            
            reconnectTimeout = setTimeout(() => {
              if (mounted) {
                init(); // Retry connection
              }
            }, 5000);
          }
        });

        socket.on('connect_error', (error) => {
          if (mounted) {
            setConnectionStatus('error');
            console.error('❌ Socket connection error:', {
              message: error.message,
              type: error.name,
              timestamp: new Date().toISOString()
            });
            
            // Retry connection after a delay
            reconnectTimeout = setTimeout(() => {
              if (mounted) {
                init();
              }
            }, 10000);
          }
        });

        // Check initial connection status
        if (socket.connected) {
          setConnectionStatus('connected');
        }
        
      } catch (error) {
        if (mounted) {
          setConnectionStatus('error');
          console.error('Socket initialization failed:', {
            message: error instanceof Error ? error.message : 'Unknown error',
            timestamp: new Date().toISOString()
          });
          
          // Retry after delay
          reconnectTimeout = setTimeout(() => {
            if (mounted) {
              init();
            }
          }, 15000);
        }
      }
    };
    
    init();

    // Cleanup on unmount
    return () => {
      mounted = false;
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
      }
      
      const socket = getSocket();
      if (socket) {
        socket.removeAllListeners();
      }
      
      disconnectSocket();
    };
  }, []);

  // Optional: You can expose connection status for debugging
  if (process.env.NODE_ENV === 'development') {
    console.log('Socket status:', connectionStatus);
  }

  return null; // This component doesn't render anything
}