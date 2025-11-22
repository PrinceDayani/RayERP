import { Server as SocketServer, Socket } from "socket.io";
import { logger } from "../utils/logger";
import { setupAuthHandlers } from "./auth.socket";
import { setupChatHandlers } from "./chat.socket";
import { setupNotificationHandlers } from "./notification.socket";
import { setupRealtimeHandlers, startRealTimeUpdates } from "./realtime.socket";
import { setupSettingsHandlers } from "./settings.socket";
import { setupConnectionHandlers } from "./connection.socket";

interface AuthenticatedSocket extends Socket {
  userId?: string;
}

export const setupSocketHandlers = (io: SocketServer) => {
  io.on("connection", (socket: AuthenticatedSocket) => {
    logger.info(`User connected: ${socket.id}`);
    
    // Setup all handlers
    setupConnectionHandlers(socket);
    setupAuthHandlers(socket);
    setupChatHandlers(socket);
    setupNotificationHandlers(socket);
    setupRealtimeHandlers(socket, io);
    setupSettingsHandlers(socket);
    
    // If pre-authenticated, join room and start updates
    if (socket.userId) {
      socket.join(`user-${socket.userId}`);
      logger.info(`Pre-authenticated user ${socket.userId} joined room`);
      socket.emit("auth_success", { 
        userId: socket.userId,
        timestamp: new Date().toISOString()
      });
      startRealTimeUpdates(socket, socket.userId, io);
    }
  });
};

export const setupSocketAuth = (io: SocketServer) => {
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      
      if (!token) {
        return next();
      }
      
      if (typeof token !== 'string' || token === 'undefined' || token === 'null') {
        return next(new Error('Invalid token format'));
      }
      
      const jwt = require("jsonwebtoken");
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      if (!decoded || !decoded.id) {
        return next(new Error('Invalid token payload'));
      }
      
      (socket as AuthenticatedSocket).userId = decoded.id;
      next();
    } catch (error) {
      logger.error("Socket authentication failed:", {
        error: error instanceof Error ? error.message : 'Unknown error',
        socketId: socket.id,
        timestamp: new Date().toISOString()
      });
      next(new Error('jwt malformed'));
    }
  });
};
