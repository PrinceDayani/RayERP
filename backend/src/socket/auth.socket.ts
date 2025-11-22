import { Socket } from "socket.io";
import { logger } from "../utils/logger";

interface AuthenticatedSocket extends Socket {
  userId?: string;
}

export const setupAuthHandlers = (socket: AuthenticatedSocket) => {
  socket.on("authenticate", async (token) => {
    try {
      if (!token || typeof token !== 'string') {
        socket.emit("auth_error", "Invalid token format");
        return;
      }
      
      const jwt = require("jsonwebtoken");
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      if (!decoded || !decoded.id) {
        socket.emit("auth_error", "Invalid token payload");
        return;
      }
      
      socket.join(`user-${decoded.id}`);
      socket.userId = decoded.id;
      
      logger.info(`User ${decoded.id} authenticated and joined room`);
      socket.emit("auth_success", { 
        userId: decoded.id,
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      logger.error("Socket authentication failed:", {
        error: error instanceof Error ? error.message : 'Unknown error',
        socketId: socket.id
      });
      socket.emit("auth_error", "Authentication failed");
    }
  });
};
