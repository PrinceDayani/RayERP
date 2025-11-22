import { Socket } from "socket.io";

interface AuthenticatedSocket extends Socket {
  userId?: string;
}

export const setupSettingsHandlers = (socket: AuthenticatedSocket) => {
  socket.on("settings:updated", (data) => {
    socket.broadcast.emit("settings:synced", {
      ...data,
      socketId: socket.id,
      timestamp: new Date().toISOString()
    });
  });

  socket.on("settings:force_sync", (data) => {
    socket.emit("settings:synced", {
      ...data,
      forced: true,
      timestamp: new Date().toISOString()
    });
  });
};
