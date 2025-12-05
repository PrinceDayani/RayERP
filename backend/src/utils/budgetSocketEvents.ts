import { Server } from 'socket.io';

let io: Server | null = null;

export const initBudgetSocket = (socketIO: Server) => {
  io = socketIO;
};

export const emitBudgetCreated = (budgetId: string) => {
  if (io) {
    io.emit('budget:created', { budgetId });
  }
};

export const emitBudgetUpdated = (budgetId: string) => {
  if (io) {
    io.emit('budget:updated', { budgetId });
  }
};

export const emitBudgetDeleted = (budgetId: string) => {
  if (io) {
    io.emit('budget:deleted', { budgetId });
  }
};

export const emitBudgetApproved = (budgetId: string) => {
  if (io) {
    io.emit('budget:approved', { budgetId });
  }
};

export const emitBudgetRejected = (budgetId: string) => {
  if (io) {
    io.emit('budget:rejected', { budgetId });
  }
};

export const emitBudgetStatusChanged = (budgetId: string, status: string) => {
  if (io) {
    io.emit('budget:status-changed', { budgetId, status });
  }
};
