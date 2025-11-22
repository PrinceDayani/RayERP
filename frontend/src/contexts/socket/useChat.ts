"use client";

import { useEffect, useCallback } from 'react';
import { useSocketContext } from './SocketContext';

export const useSocketChat = (chatId?: string) => {
  const { socket, isConnected } = useSocketContext();

  useEffect(() => {
    if (!socket || !isConnected || !chatId) return;

    socket.emit('join_chat', chatId);

    return () => {
      socket.emit('leave_chat', chatId);
    };
  }, [socket, isConnected, chatId]);

  const sendTyping = useCallback((userId: string) => {
    if (socket && chatId) {
      socket.emit('typing', { chatId, userId });
    }
  }, [socket, chatId]);

  const sendStopTyping = useCallback((userId: string) => {
    if (socket && chatId) {
      socket.emit('stop_typing', { chatId, userId });
    }
  }, [socket, chatId]);

  return { sendTyping, sendStopTyping };
};
