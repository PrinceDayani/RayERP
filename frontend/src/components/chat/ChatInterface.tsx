'use client';

import { useState, useEffect } from 'react';
import { chatAPI } from '@/lib/api/chatAPI';
import ChatSidebar from './ChatSidebar';
import ChatWindow from './ChatWindow';
import { useSocket } from '@/hooks/useSocket';
import { MessageCircle, Shield } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Badge } from '@/components/ui/badge';

interface Chat {
  _id: string;
  participants: Array<{ _id: string; name: string; email: string }>;
  lastMessage?: string;
  lastMessageTime?: string;
  isGroup: boolean;
  groupName?: string;
  messages: any[];
}

export default function ChatInterface() {
  const [chats, setChats] = useState<Chat[]>([]);
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [loading, setLoading] = useState(true);
  const socket = useSocket();
  const { user } = useAuth();
  const isRoot = (user as any)?.role?.name?.toLowerCase() === 'root';

  useEffect(() => {
    loadChats();
  }, []);

  useEffect(() => {
    if (!socket) return;

    socket.on('new_message', (data: any) => {
      if (selectedChat?._id === data.chatId) {
        setSelectedChat((prev) => {
          if (!prev) return prev;
          // Ensure message has proper structure before adding
          if (data.message && data.message.sender) {
            return {
              ...prev,
              messages: [...(prev.messages || []), data.message]
            };
          }
          return prev;
        });
      }
      loadChats();
    });

    return () => {
      socket.off('new_message');
    };
  }, [socket, selectedChat]);

  const loadChats = async () => {
    try {
      const response = await chatAPI.getChats();
      setChats(response.data || []);
    } catch (error) {
      console.error('Failed to load chats:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectChat = async (chat: Chat) => {
    setSelectedChat({ ...chat, messages: [] }); // Initialize with empty messages
    try {
      const response = await chatAPI.getMessages(chat._id);
      setSelectedChat({ ...chat, messages: response.data || [] });
      
      // Try to mark messages as read, but don't fail if it doesn't work
      try {
        await chatAPI.markAsRead(chat._id);
      } catch (markReadError) {
        console.warn('Failed to mark messages as read:', markReadError);
        // Continue execution even if markAsRead fails
      }
      
      if (socket) {
        socket.emit('join_chat', chat._id);
      }
    } catch (error) {
      console.error('Failed to load messages:', error);
      setSelectedChat({ ...chat, messages: [] }); // Fallback to empty messages on error
    }
  };

  const handleSendMessage = async (content: string, type?: string, fileUrl?: string) => {
    if (!selectedChat) return;
    try {
      const response = await chatAPI.sendMessage(selectedChat._id, content, type, fileUrl);
      if (response.data) {
        setSelectedChat(response.data);
      }
      loadChats();
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="flex h-full relative">
      {isRoot && (
        <div className="absolute top-0 left-0 right-0 z-10 bg-red-600 text-white px-4 py-2 flex items-center justify-center gap-2 shadow-lg">
          <Shield className="w-4 h-4" />
          <span className="text-sm font-semibold">ROOT MONITORING MODE - Read-Only Access to All Conversations</span>
        </div>
      )}
      <div className={`flex h-full w-full ${isRoot ? 'pt-10' : ''}`}>
        <ChatSidebar
          chats={chats}
          selectedChat={selectedChat}
          onSelectChat={handleSelectChat as any}
          onRefresh={loadChats}
        />
        {selectedChat ? (
          <ChatWindow
            chat={selectedChat}
            onSendMessage={handleSendMessage}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gray-50 dark:bg-gray-900">
            <div className="text-center">
              <MessageCircle className="w-20 h-20 mx-auto text-gray-300 dark:text-gray-700 mb-4" />
              <h3 className="text-xl font-semibold text-gray-600 dark:text-gray-400 mb-2">
                {isRoot ? 'Select a conversation to monitor' : 'Select a conversation'}
              </h3>
              <p className="text-gray-500 dark:text-gray-500">
                {isRoot ? 'View any conversation in the system' : 'Choose a chat from the sidebar to start messaging'}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
