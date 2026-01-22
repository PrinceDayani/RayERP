import { Request, Response } from 'express';
import Chat from '../models/Chat';
import User from '../models/User';
import ActivityLog from '../models/ActivityLog';
import Notification from '../models/Notification';
import path from 'path';
import fs from 'fs';
import mongoose from 'mongoose';
import { registerCacheInvalidator } from '../utils/dashboardCache';

// Chat cache with 2min TTL - per user
let chatsCache: Map<string, { data: any; timestamp: number }> = new Map();
let messagesCache: Map<string, { data: any; timestamp: number }> = new Map();
const CACHE_TTL = 120000; // 2 minutes

const clearChatCacheForUser = (userId: string) => {
  // Clear user's chat list cache
  chatsCache.delete(`chats_${userId}`);
  
  // Clear message caches for chats involving this user
  for (const key of messagesCache.keys()) {
    if (key.includes(userId)) {
      messagesCache.delete(key);
    }
  }
};

const clearChatCacheForChat = (chatId: string, participantIds: string[]) => {
  // Clear message cache for this chat
  messagesCache.delete(`messages_${chatId}`);
  
  // Clear chat list cache for all participants
  participantIds.forEach(id => {
    chatsCache.delete(`chats_${id}`);
  });
};

registerCacheInvalidator(() => {
  chatsCache.clear();
  messagesCache.clear();
});

export const chatController = {
  // Get all chats for current user
  getChats: async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.id;
      const cacheKey = `chats_${userId}`;
      const cached = chatsCache.get(cacheKey);
      
      if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        return res.json({ success: true, data: cached.data, cached: true });
      }

      const user = await User.findById(userId).populate('role');
      const isRoot = user?.role && (user.role as any).name?.toLowerCase() === 'root';

      const query = isRoot ? {} : { participants: userId };
      const chats = await Chat.find(query)
        .populate('participants', 'name email')
        .populate('groupAdmin', 'name email')
        .populate('messages.sender', 'name email')
        .sort({ lastMessageTime: -1 });
      
      chatsCache.set(cacheKey, { data: chats, timestamp: Date.now() });
      
      res.json({ success: true, data: chats });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  // Get or create chat with user
  getOrCreateChat: async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.id;
      const { participantId } = req.body;

      const targetUser = await User.findById(participantId).populate('role');
      const isTargetRoot = targetUser?.role && (targetUser.role as any).name?.toLowerCase() === 'root';

      if (isTargetRoot) {
        return res.status(403).json({ success: false, message: 'Cannot create chat with root user' });
      }

      let chat = await Chat.findOne({
        isGroup: false,
        participants: { $all: [userId, participantId] }
      })
        .populate('participants', 'name email')
        .populate('messages.sender', 'name email');

      if (!chat) {
        chat = await Chat.create({
          participants: [userId, participantId],
          isGroup: false,
          messages: []
        });
        chat = await chat.populate('participants', 'name email');
      }

      res.json({ success: true, data: chat });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  // Send message
  sendMessage: async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.id;
      const { chatId, content, type = 'text', fileData, fileName, fileSize, mimeType, location } = req.body;

      const chat = await Chat.findById(chatId);
      if (!chat) {
        return res.status(404).json({ success: false, message: 'Chat not found' });
      }

      if (!chat.participants.some((p: any) => p.toString() === userId)) {
        return res.status(403).json({ success: false, message: 'Not authorized' });
      }

      for (const participantId of chat.participants) {
        const participant = await User.findById(participantId).populate('role');
        const isParticipantRoot = participant?.role && (participant.role as any).name?.toLowerCase() === 'root';
        if (isParticipantRoot && participantId.toString() !== userId) {
          return res.status(403).json({ success: false, message: 'Cannot send messages to root user' });
        }
      }

      const currentUser = await User.findById(userId);
      if (!currentUser) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }

      // Validate file size (5MB limit for Base64 storage)
      if (fileSize && fileSize > 5 * 1024 * 1024) {
        return res.status(400).json({ success: false, message: 'File size exceeds 5MB limit' });
      }

      const userAgent = req.headers['user-agent'] || '';
      const ipAddress = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;

      const message = {
        sender: userId,
        senderName: currentUser.name,
        senderEmail: currentUser.email,
        content,
        timestamp: new Date(),
        read: false,
        type,
        fileData,
        fileName,
        fileSize,
        mimeType,
        metadata: {
          ipAddress: typeof ipAddress === 'string' ? ipAddress : ipAddress?.[0],
          userAgent,
          device: userAgent.includes('Mobile') ? 'Mobile' : 'Desktop',
          browser: userAgent.split('/')[0],
          os: userAgent.includes('Windows') ? 'Windows' : userAgent.includes('Mac') ? 'macOS' : userAgent.includes('Linux') ? 'Linux' : 'Unknown',
          location: location ? {
            latitude: location.latitude,
            longitude: location.longitude,
            city: location.city,
            country: location.country
          } : undefined
        }
      };

      chat.messages.push(message);
      chat.lastMessage = content;
      chat.lastMessageTime = new Date();
      await chat.save();

      // Clear cache only for participants of this chat
      const participantIds = chat.participants.map((p: any) => p.toString());
      clearChatCacheForChat(chatId, participantIds);

      const populatedChat = await Chat.findById(chatId)
        .populate('participants', 'name email')
        .populate('messages.sender', 'name email');

      // Create activity log for file/image messages
      if (type === 'file' || type === 'image') {
        await ActivityLog.create({
          user: userId,
          userName: currentUser.name,
          action: type === 'image' ? 'sent_image' : 'sent_file',
          resource: fileName || content,
          resourceType: 'file',
          status: 'success',
          details: `Sent ${type} in chat: ${fileName || content} (${fileSize ? (fileSize / 1024).toFixed(2) + 'KB' : 'unknown size'})`,
          metadata: { chatId, fileName, fileSize, mimeType },
          ipAddress: typeof ipAddress === 'string' ? ipAddress : ipAddress?.[0] || 'unknown',
          visibility: 'private'
        });
      }

      // Send notifications to other participants
      const otherParticipants = chat.participants.filter((p: any) => p.toString() !== userId);
      for (const participantId of otherParticipants) {
        let notificationMessage = content;
        if (type === 'image') {
          notificationMessage = `📷 ${currentUser.name} sent an image${content !== fileName ? ': ' + content : ''}`;
        } else if (type === 'file') {
          notificationMessage = `📎 ${currentUser.name} sent a file: ${fileName || content}`;
        } else {
          notificationMessage = `${currentUser.name}: ${content.substring(0, 50)}${content.length > 50 ? '...' : ''}`;
        }

        await Notification.create({
          userId: participantId,
          type: 'info',
          title: 'New Message',
          message: notificationMessage,
          priority: 'medium',
          actionUrl: `/dashboard/chat?chatId=${chatId}`,
          metadata: { chatId, messageType: type, senderId: userId }
        });
      }

      const { io } = await import('../server');
      io.to(chatId).emit('chat:message', { chatId, message: populatedChat?.messages[populatedChat.messages.length - 1] });

      // Emit notifications to other participants
      for (const participantId of otherParticipants) {
        io.to(participantId.toString()).emit('notification', {
          type: 'chat',
          message: `New message from ${currentUser.name}`,
          chatId
        });
      }

      res.json({ success: true, data: populatedChat });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  },



  // Get messages for a chat
  getMessages: async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.id;
      const { chatId } = req.params;
      const cacheKey = `messages_${chatId}`;
      const cached = messagesCache.get(cacheKey);
      
      if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        return res.json({ success: true, data: cached.data, cached: true });
      }

      const chat = await Chat.findById(chatId)
        .populate('messages.sender', 'name email');

      if (!chat) {
        return res.status(404).json({ success: false, message: 'Chat not found' });
      }

      const user = await User.findById(userId).populate('role');
      const isRoot = user?.role && (user.role as any).name?.toLowerCase() === 'root';

      if (!isRoot && !chat.participants.includes(userId)) {
        return res.status(403).json({ success: false, message: 'Not authorized' });
      }

      messagesCache.set(cacheKey, { data: chat.messages, timestamp: Date.now() });

      res.json({ success: true, data: chat.messages });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  // Mark messages as read
  markAsRead: async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.id;
      const { chatId } = req.params;

      // Validate inputs
      if (!userId) {
        return res.status(401).json({ success: false, message: 'User not authenticated' });
      }

      if (!chatId) {
        return res.status(400).json({ success: false, message: 'Chat ID is required' });
      }

      // Validate chatId format
      if (!mongoose.Types.ObjectId.isValid(chatId)) {
        return res.status(400).json({ success: false, message: 'Invalid chat ID format' });
      }

      // Find chat
      const chat = await Chat.findById(chatId);
      if (!chat) {
        return res.status(404).json({ success: false, message: 'Chat not found' });
      }

      // Check if user is authorized to mark messages as read
      const user = await User.findById(userId).populate('role');
      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }

      const isRoot = user?.role && (user.role as any).name?.toLowerCase() === 'root';
      
      if (!isRoot && !chat.participants.some((p: any) => p.toString() === userId)) {
        return res.status(403).json({ success: false, message: 'Not authorized to access this chat' });
      }

      // Mark messages as read (only messages not sent by current user)
      let updatedCount = 0;
      if (chat.messages && Array.isArray(chat.messages)) {
        chat.messages.forEach((msg: any) => {
          if (msg.sender && msg.sender.toString() !== userId && !msg.read) {
            msg.read = true;
            updatedCount++;
          }
        });
      }

      // Save only if there were updates
      if (updatedCount > 0) {
        await chat.save();
        // Clear cache only for participants of this chat
        const participantIds = chat.participants.map((p: any) => p.toString());
        clearChatCacheForChat(chatId, participantIds);
      }
      
      res.json({ 
        success: true, 
        message: updatedCount > 0 ? `${updatedCount} messages marked as read` : 'No messages to mark as read',
        updatedCount 
      });
    } catch (error: any) {
      console.error('Error in markAsRead:', {
        error: error.message,
        stack: error.stack,
        chatId: req.params.chatId,
        userId: (req as any).user?.id
      });
      
      // Handle specific mongoose errors
      if (error.name === 'CastError') {
        return res.status(400).json({ 
          success: false, 
          message: 'Invalid chat ID format' 
        });
      }
      
      if (error.name === 'ValidationError') {
        return res.status(400).json({ 
          success: false, 
          message: 'Validation error',
          details: error.message 
        });
      }
      
      res.status(500).json({ 
        success: false, 
        message: 'Failed to mark messages as read',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  },

  // Get all users for chat
  getUsers: async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.id;
      const users = await User.find({ _id: { $ne: userId } })
        .populate('role')
        .select('name email')
        .limit(50);
      
      const filteredUsers = users.filter(user => {
        const isRoot = user.role && (user.role as any).name?.toLowerCase() === 'root';
        return !isRoot;
      });
      
      res.json({ success: true, data: filteredUsers });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
};

export default chatController;
