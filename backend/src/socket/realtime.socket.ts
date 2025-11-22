import { Socket, Server as SocketServer } from "socket.io";

interface AuthenticatedSocket extends Socket {
  userId?: string;
}

export const setupRealtimeHandlers = (socket: AuthenticatedSocket, io: SocketServer) => {
  socket.on("subscribe_realtime", (data) => {
    const { types = [] } = data || {};
    
    types.forEach(type => {
      socket.join(`realtime_${type}`);
    });
    
    socket.emit("realtime_subscribed", {
      types,
      timestamp: new Date().toISOString()
    });
  });
};

export const startRealTimeUpdates = (socket: AuthenticatedSocket, userId: string, io: SocketServer) => {
  const updateInterval = setInterval(() => {
    socket.emit("system_stats", {
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      connections: io.engine.clientsCount
    });
  }, 30000);

  socket.on("disconnect", () => {
    clearInterval(updateInterval);
  });
};
