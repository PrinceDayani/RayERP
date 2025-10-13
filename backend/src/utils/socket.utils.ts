import { io } from "../server";
import { logger } from "./logger";

// Emit to all connected clients
export const emitToAll = (event: string, data: any): void => {
  try {
    io.emit(event, data);
    logger.info(`📡 Emitted ${event} to all clients`);
  } catch (error) {
    logger.error(`Failed to emit ${event}:`, error);
  }
};

// Emit to specific user room
export const emitToUser = (userId: string, event: string, data: any): void => {
  try {
    io.to(`user-${userId}`).emit(event, data);
    logger.info(`📡 Emitted ${event} to user ${userId}`);
  } catch (error) {
    logger.error(`Failed to emit ${event} to user ${userId}:`, error);
  }
};

// Emit to specific room
export const emitToRoom = (room: string, event: string, data: any): void => {
  try {
    io.to(room).emit(event, data);
    logger.info(`📡 Emitted ${event} to room ${room}`);
  } catch (error) {
    logger.error(`Failed to emit ${event} to room ${room}:`, error);
  }
};

// Get connected clients count
export const getConnectedClientsCount = (): number => {
  try {
    return io.engine.clientsCount;
  } catch (error) {
    logger.error("Failed to get clients count:", error);
    return 0;
  }
};

// ERP-specific event emitters
export const emitOrderCreated = (orderData: any): void => {
  emitToAll("order:created", orderData);
};

export const emitOrderUpdated = (orderData: any): void => {
  emitToAll("order:updated", orderData);
};

export const emitInventoryUpdated = (inventoryData: any): void => {
  emitToAll("inventory:updated", inventoryData);
};

export const emitLowStockAlert = (stockData: any): void => {
  emitToAll("inventory:low-stock", stockData);
};

export const emitNotification = (userId: string, notification: any): void => {
  emitToUser(userId, "notification", notification);
};