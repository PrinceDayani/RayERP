import { Socket } from "socket.io";
import { logger } from "../utils/logger";

interface AuthenticatedSocket extends Socket {
  userId?: string;
}

export const setupChatHandlers = (socket: AuthenticatedSocket) => {
  socket.on("join_chat", (chatId) => {
    socket.join(chatId);
    socket.to(chatId).emit("user_joined_chat", {
      userId: socket.userId,
      chatId,
      timestamp: new Date().toISOString()
    });
    logger.info(`Socket ${socket.id} joined chat ${chatId}`);
  });

  socket.on("leave_chat", (chatId) => {
    socket.leave(chatId);
    socket.to(chatId).emit("user_left_chat", {
      userId: socket.userId,
      chatId,
      timestamp: new Date().toISOString()
    });
    logger.info(`Socket ${socket.id} left chat ${chatId}`);
  });

  socket.on("typing", (data) => {
    socket.to(data.chatId).emit("user_typing", {
      userId: data.userId,
      chatId: data.chatId,
      timestamp: new Date().toISOString()
    });
  });

  socket.on("stop_typing", (data) => {
    socket.to(data.chatId).emit("user_stop_typing", {
      userId: data.userId,
      chatId: data.chatId,
      timestamp: new Date().toISOString()
    });
  });
};
