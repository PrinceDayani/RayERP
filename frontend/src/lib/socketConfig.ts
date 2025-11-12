// Socket configuration utility
export const getSocketConfig = () => {
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  return {
    transports: ['polling', 'websocket'],
    reconnection: true,
    reconnectionAttempts: 3,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    timeout: 5000,
    upgrade: true,
    autoConnect: true,
    withCredentials: true,
    forceNew: false
  };
};

// Check if socket should be enabled
export const shouldEnableSocket = (): boolean => {
  // Disable socket in development if there are persistent connection issues
  if (process.env.NODE_ENV === 'development') {
    // You can set this environment variable to disable sockets in dev
    return process.env.NEXT_PUBLIC_ENABLE_SOCKET !== 'false';
  }
  
  return true;
};