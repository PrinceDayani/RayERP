// path: frontend/src/lib/socket.ts
import { io, Socket } from "socket.io-client";
import { useEffect, useState } from "react";
import { checkServerHealth } from "../utils/socketHealth";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

// Global singleton
let socket: Socket | null = null;
let isConnecting = false;

// Initialize socket with safe singleton + reconnection
export const initializeSocket = async (token?: string): Promise<Socket | null> => {
  if (!API_URL) {
    console.warn("⚠️ NEXT_PUBLIC_API_URL environment variable is not set");
    return null;
  }

  if (socket && socket.connected) {
    return socket;
  }

  if (isConnecting) {
    return socket;
  }

  // Check server health before connecting
  const serverHealthy = await checkServerHealth(API_URL);
  if (!serverHealthy) {
    console.warn("⚠️ Server is not responding, skipping socket connection");
    return null;
  }

  isConnecting = true;
  console.log(`🔌 Initializing socket connection to: ${API_URL}`);

  // Disconnect existing socket if any
  if (socket) {
    socket.removeAllListeners();
    socket.disconnect();
  }

  socket = io(API_URL, {
    auth: token ? { token } : undefined,
    transports: ["websocket", "polling"],
    reconnection: true,
    reconnectionAttempts: 3,
    reconnectionDelay: 2000,
    reconnectionDelayMax: 10000,
    timeout: 10000,
    forceNew: true,
    upgrade: true,
    autoConnect: true,
    withCredentials: true
  });

  socket.on("connect", () => {
    console.log("✅ Socket connected:", socket?.id);
    isConnecting = false;
  });

  socket.on("disconnect", (reason: string) => {
    console.warn("⚠️ Socket disconnected:", reason);
    isConnecting = false;
  });

  socket.on("connect_error", (err: Error) => {
    console.error("❌ Socket connection error:", err.message);
    isConnecting = false;
  });

  socket.on("reconnect", (attemptNumber: number) => {
    console.log(`🔄 Socket reconnected after ${attemptNumber} attempts`);
  });

  socket.on("reconnect_error", (err: Error) => {
    console.error("❌ Socket reconnection error:", err.message);
  });

  socket.on("reconnect_failed", () => {
    console.error("❌ Socket reconnection failed - max attempts reached");
  });

  return socket;
};

// Disconnect socket safely
export const disconnectSocket = (): void => {
  if (socket) {
    console.log("🔌 Disconnecting socket...");
    socket.removeAllListeners();
    socket.disconnect();
    socket = null;
    isConnecting = false;
  }
};

// Get socket instance
export const getSocket = (): Socket | null => socket;

// Hook for socket state
export const useSocket = (url?: string): Socket | null => {
  const [socketInstance, setSocketInstance] = useState<Socket | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      const serverUrl = url || 'http://localhost:5000';
      
      const newSocket = io(serverUrl, {
        transports: ['polling', 'websocket'],
        withCredentials: false,
        autoConnect: true,
        reconnection: false,
        timeout: 5000
      });

      newSocket.on('connect', () => {
        console.log('✅ Socket connected');
        setSocketInstance(newSocket);
      });

      newSocket.on('connect_error', () => {
        console.warn('⚠️ Socket connection failed');
        setSocketInstance(null);
      });

      return () => {
        newSocket.disconnect();
        setSocketInstance(null);
      };
    } catch (error) {
      console.warn('Socket initialization failed');
      setSocketInstance(null);
    }
  }, [url]);

  return socketInstance;
};

export const useSocketWithStatus = (
  token?: string
): [Socket | null, boolean, string | null] => {
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    
    const initSocket = async () => {
      const s = await initializeSocket(token);
      
      if (!mounted || !s) return;

      const onConnect = () => {
        setIsConnected(true);
        setError(null);
      };

      const onDisconnect = () => setIsConnected(false);

      const onError = (err: Error) => {
        setIsConnected(false);
        setError(err.message);
      };

      s.on("connect", onConnect);
      s.on("disconnect", onDisconnect);
      s.on("connect_error", onError);

      setIsConnected(s.connected);
    };
    
    initSocket();

    return () => {
      mounted = false;
      if (socket) {
        socket.off("connect");
        socket.off("disconnect");
        socket.off("connect_error");
      }
    };
  }, [token]);

  return [socket, isConnected, error];
};

// Hook for listening to specific events
export const useSocketEvent = <T>(
  event: string,
  callback: (data: T) => void,
  deps: any[] = []
): void => {
  useEffect(() => {
    if (!socket) return;
    socket.on(event, callback);
    return () => {
      socket?.off(event, callback);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [event, callback, ...deps]);
};

// Ping server
export const pingServer = (): Promise<boolean> => {
  return new Promise((resolve) => {
    if (!socket || !socket.connected) {
      resolve(false);
      return;
    }

    const timeout = setTimeout(() => {
      resolve(false);
    }, 5000);

    socket.emit("ping", "test", (response: string) => {
      clearTimeout(timeout);
      resolve(response === "pong");
    });
  });
};

// Generic event helpers
export const onSocketEvent = (event: string, cb: (data: any) => void) => {
  if (!socket) initializeSocket();
  socket?.on(event, cb);
  return () => socket?.off(event, cb);
};

export const emitSocketEvent = (event: string, data: any): boolean => {
  if (!socket || !socket.connected) {
    console.warn(`⚠️ Cannot emit ${event}: socket not connected`);
    return false;
  }
  socket.emit(event, data);
  return true;
};

// Join user room for targeted notifications
export const joinUserRoom = (userId: string): void => {
  if (socket && socket.connected && userId) {
    socket.emit("join-user-room", userId);
  }
};

// ---- Event Types (for ERP) ----
export interface OrderCreatedEvent {
  _id: string;
  orderNumber: string;
  customer: { _id: string; name: string };
  totalAmount: number;
  status: string;
  createdAt: string;
}

export interface OrderUpdatedEvent {
  _id: string;
  status: string;
  updatedAt: string;
}

export interface InventoryUpdatedEvent {
  productId: { _id: string; name: string; sku: string; price: number; category: string };
  quantity: number;
  status: string;
  _id: string;
  location: string;
}

export interface LowStockEvent {
  productId: { _id: string; name: string; sku: string };
  quantity: number;
  minimumStockLevel: number;
  reorderPoint: number;
}

export interface NotificationEvent {
  id: string;
  type: string;
  message: string;
  timestamp: string;
  read: boolean;
  link?: string;
}

export interface RealTimeMetrics {
  activeUsers: number;
  totalRevenue: number;
  ordersToday: number;
  systemLoad: number;
  lastUpdated: string;
}
