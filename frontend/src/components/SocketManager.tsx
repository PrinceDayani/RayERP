"use client";

import { useEffect } from 'react';
import { initializeSocket, disconnectSocket } from '../lib/socket';

export default function SocketManager() {
  useEffect(() => {
    // Initialize socket connection when component mounts
    const init = async () => {
      try {
        await initializeSocket();
      } catch (error) {
        console.warn('Socket initialization failed:', error);
      }
    };
    
    init();

    // Cleanup on unmount
    return () => {
      disconnectSocket();
    };
  }, []);

  return null; // This component doesn't render anything
}