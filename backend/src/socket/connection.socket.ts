import { Socket } from "socket.io";
import { logger } from "../utils/logger";

interface AuthenticatedSocket extends Socket {
  userId?: string;
}

export const setupConnectionHandlers = (socket: AuthenticatedSocket) => {
  socket.emit("connection_status", {
    connected: true,
    socketId: socket.id,
    timestamp: new Date().toISOString()
  });

  socket.on("ping", (data, callback) => {
    const timestamp = new Date().toISOString();
    if (typeof callback === "function") {
      callback({ pong: true, timestamp, serverTime: Date.now() });
    } else {
      socket.emit("pong", { pong: true, timestamp, serverTime: Date.now() });
    }
  });

  socket.on("disconnect", (reason) => {
    logger.info(`User disconnected: ${socket.id}, reason: ${reason}`);
    
    if (socket.userId) {
      socket.broadcast.emit("user_disconnected", {
        userId: socket.userId,
        socketId: socket.id,
        reason,
        timestamp: new Date().toISOString()
      });
    }
  });

  socket.on("error", (error) => {
    logger.error(`Socket error for ${socket.id}:`, error);
    socket.emit("socket_error", {
      message: "An error occurred",
      timestamp: new Date().toISOString()
    });
  });
};
