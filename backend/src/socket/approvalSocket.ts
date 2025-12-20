import { Server } from 'socket.io';
import ApprovalRequest from '../models/ApprovalRequest';

export const setupApprovalSocket = (io: Server) => {
  io.on('connection', (socket) => {
    // Join approval room
    socket.on('approval:join', (userId) => {
      socket.join(`user:${userId}`);
      socket.join('approvals');
    });

    // Leave approval room
    socket.on('approval:leave', (userId) => {
      socket.leave(`user:${userId}`);
    });
  });
};

// Emit approval created
export const emitApprovalCreated = (io: Server, approval: any, approverIds: string[]) => {
  approverIds.forEach(approverId => {
    io.to(`user:${approverId}`).emit('approval:new', approval);
  });
  io.to('approvals').emit('approval:created', approval);
};

// Emit approval updated
export const emitApprovalUpdated = (io: Server, approval: any) => {
  io.to(`user:${approval.requestedBy}`).emit('approval:updated', approval);
  io.to('approvals').emit('approval:statusChanged', approval);
};

// Emit approval approved
export const emitApprovalApproved = (io: Server, approval: any) => {
  io.to(`user:${approval.requestedBy}`).emit('approval:approved', approval);
  io.to('approvals').emit('approval:approved', approval);
};

// Emit approval rejected
export const emitApprovalRejected = (io: Server, approval: any) => {
  io.to(`user:${approval.requestedBy}`).emit('approval:rejected', approval);
  io.to('approvals').emit('approval:rejected', approval);
};
