// Socket configuration utility
export const getSocketConfig = () => {
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  return {
    // Use polling first in development to avoid websocket issues
    transports: isDevelopment ? ['polling'] : ['polling', 'websocket'],
    
    // More conservative settings for development
    reconnection: true,
    reconnectionAttempts: isDevelopment ? 2 : 5,
    reconnectionDelay: isDevelopment ? 3000 : 1000,
    reconnectionDelayMax: isDevelopment ? 10000 : 5000,
    timeout: isDevelopment ? 15000 : 10000,
    
    // Disable upgrade in development to prevent websocket errors
    upgrade: !isDevelopment,
    
    // Other settings
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