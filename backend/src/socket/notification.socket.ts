import { Socket } from "socket.io";

interface AuthenticatedSocket extends Socket {
  userId?: string;
}

export const setupNotificationHandlers = (socket: AuthenticatedSocket) => {
  socket.on("notification:test", (data) => {
    socket.emit("notification:received", {
      id: `test-${Date.now()}`,
      type: 'info',
      title: data?.title || 'Test Notification',
      message: data?.message || 'This is a test notification to verify your settings.',
      priority: 'low',
      timestamp: new Date().toISOString()
    });
  });
};
