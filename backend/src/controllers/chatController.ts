import { Request, Response } from 'express';
import Chat from '../models/Chat';
import User from '../models/User';
import path from 'path';
import fs from 'fs';
import mongoose from 'mongoose';

export const chatController = {
  // Get all chats for current user
  getChats: async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.id;
      const user = await User.findById(userId).populate('role');
      const isRoot = user?.role && (user.role as any).name?.toLowerCase() === 'root';

      const query = isRoot ? {} : { participants: userId };
      const chats = await Chat.find(query)
        .populate('participants', 'name email')
        .populate('groupAdmin', 'name email')
        .populate('messages.sender', 'name email')
        .sort({ lastMessageTime: -1 });
      
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
      const { chatId, content, type = 'text', fileUrl, location } = req.body;

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
        fileUrl,
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

      const populatedChat = await Chat.findById(chatId)
        .populate('participants', 'name email')
        .populate('messages.sender', 'name email');

      const { io } = await import('../server');
      io.to(chatId).emit('chat:message', { chatId, message: populatedChat?.messages[populatedChat.messages.length - 1] });

      res.json({ success: true, data: populatedChat });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  // Upload file for chat
  uploadFile: async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ success: false, message: 'No file uploaded' });
      }

      const fileUrl = `/uploads/chat/${req.file.filename}`;
      const fileType = req.file.mimetype.startsWith('image/') ? 'image' : 'file';

      res.json({ 
        success: true, 
        data: { 
          fileUrl, 
          type: fileType,
          filename: req.file.originalname,
          size: req.file.size
        } 
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  // Get messages for a chat
  getMessages: async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.id;
      const { chatId } = req.params;

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
