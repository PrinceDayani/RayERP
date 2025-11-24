'use client';

import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Search, Plus, RefreshCw, Shield, Megaphone, Check, CheckCheck, Clock, Image, FileText, Mic } from 'lucide-react';
import NewChatDialog from './NewChatDialog';
import BroadcastDialog from './BroadcastDialog';
import { formatDistanceToNow } from 'date-fns';
import { useAuth } from '@/contexts/AuthContext';

interface Chat {
  _id: string;
  participants: Array<{ _id: string; name: string; email: string }>;
  lastMessage?: string;
  lastMessageTime?: string;
  lastMessageType?: 'text' | 'image' | 'file' | 'audio';
  lastMessageStatus?: 'sending' | 'sent' | 'delivered' | 'read' | 'failed';
  unreadCount?: number;
  isGroup: boolean;
  groupName?: string;
  messages?: any[];
  isOnline?: boolean;
  lastSeen?: string;
}

interface ChatSidebarProps {
  chats: Chat[];
  selectedChat: Chat | null;
  onSelectChat: (chat: Chat) => Promise<void>;
  onRefresh: () => void;
}

export default function ChatSidebar({ chats, selectedChat, onSelectChat, onRefresh }: ChatSidebarProps) {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [showNewChat, setShowNewChat] = useState(false);
  const [showBroadcast, setShowBroadcast] = useState(false);
  const [filteredChats, setFilteredChats] = useState(chats);

  useEffect(() => {
    const filtered = chats.filter((chat) => {
      const chatName = chat.isGroup
        ? chat.groupName
        : chat.participants.find((p) => p._id !== user?._id)?.name || '';
      return (chatName || '').toLowerCase().includes(searchQuery.toLowerCase());
    });
    setFilteredChats(filtered);
  }, [searchQuery, chats, user]);

  const getChatName = (chat: Chat) => {
    if (chat.isGroup) return chat.groupName || 'Group Chat';
    
    // For root user, show both participants
    const userRole = (user as any)?.role?.name?.toLowerCase();
    if (userRole === 'root') {
      const names = chat.participants.map(p => p.name).join(' ↔ ');
      return names || 'Unknown Users';
    }
    
    const otherUser = chat.participants.find((p) => p._id !== user?._id);
    return otherUser?.name || 'Unknown User';
  };

  const getChatInitials = (chat: Chat) => {
    const name = getChatName(chat);
    if (!name) return 'U';
    return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const formatTime = (time?: string) => {
    if (!time) return '';
    try {
      const date = new Date(time);
      const now = new Date();
      const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
      
      if (diffInHours < 24) {
        return date.toLocaleTimeString('en-US', { 
          hour: '2-digit', 
          minute: '2-digit',
          hour12: false 
        });
      } else if (diffInHours < 168) { // Less than a week
        return date.toLocaleDateString('en-US', { weekday: 'short' });
      } else {
        return date.toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric' 
        });
      }
    } catch {
      return '';
    }
  };

  const getMessagePreview = (chat: Chat) => {
    if (!chat.lastMessage) return 'No messages yet';
    
    switch (chat.lastMessageType) {
      case 'image':
        return '📷 Photo';
      case 'file':
        return '📎 File';
      case 'audio':
        return '🎵 Audio';
      default:
        return chat.lastMessage;
    }
  };

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case 'sending':
        return <Clock className="w-3 h-3 text-gray-400" />;
      case 'sent':
        return <Check className="w-3 h-3 text-gray-400" />;
      case 'delivered':
        return <CheckCheck className="w-3 h-3 text-gray-400" />;
      case 'read':
        return <CheckCheck className="w-3 h-3 text-blue-500" />;
      default:
        return null;
    }
  };

  return (
    <>
      <div className="w-80 border-r border-gray-200 dark:border-gray-700 flex flex-col bg-white dark:bg-gray-800">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Messages</h2>
              {(user as any)?.role?.name?.toLowerCase() === 'root' && (
                <Badge variant="destructive" className="text-xs">
                  <Shield className="w-3 h-3 mr-1" />
                  Root
                </Badge>
              )}
            </div>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={onRefresh}
                className="h-8 w-8"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
              {(user as any)?.role?.name?.toLowerCase() !== 'root' && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowNewChat(true)}
                  className="h-8 w-8"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              )}
              {['root', 'super_admin', 'admin'].includes((user as any)?.role?.name?.toLowerCase()) && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowBroadcast(true)}
                  className="h-8 w-8"
                  title="Broadcast Message"
                >
                  <Megaphone className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {filteredChats.length === 0 ? (
            <div className="p-8 text-center text-gray-500 dark:text-gray-400">
              <p>No conversations yet</p>
              <Button
                variant="link"
                onClick={() => setShowNewChat(true)}
                className="mt-2"
              >
                Start a new chat
              </Button>
            </div>
          ) : (
            filteredChats.map((chat) => (
              <div
                key={chat._id}
                onClick={() => onSelectChat(chat)}
                className={`p-4 border-b border-gray-100 dark:border-gray-700 cursor-pointer transition-colors ${
                  selectedChat?._id === chat._id
                    ? (user as any)?.role?.name?.toLowerCase() === 'root'
                      ? 'bg-red-50 dark:bg-red-900/20 border-l-4 border-l-red-600'
                      : 'bg-blue-50 dark:bg-blue-900/20'
                    : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'
                }`}
              >
                <div className="flex items-start gap-3">
                  <Avatar className="h-12 w-12">
                    <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-semibold">
                      {getChatInitials(chat)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                          {getChatName(chat)}
                        </h3>
                        {chat.isOnline && (
                          <div className="w-2 h-2 bg-green-500 rounded-full" title="Online" />
                        )}
                      </div>
                      <div className="flex items-center gap-1 ml-2">
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {formatTime(chat.lastMessageTime)}
                        </span>
                        {getStatusIcon(chat.lastMessageStatus)}
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-gray-600 dark:text-gray-400 truncate flex-1">
                        {chat.lastMessage || 'No messages yet'}
                      </p>
                      {chat.unreadCount && chat.unreadCount > 0 && (
                        <Badge 
                          variant="destructive" 
                          className="ml-2 h-5 min-w-[20px] text-xs flex items-center justify-center rounded-full"
                        >
                          {chat.unreadCount > 99 ? '99+' : chat.unreadCount}
                        </Badge>
                      )}
                    </div>
                    {!chat.isOnline && chat.lastSeen && (
                      <p className="text-xs text-gray-400 mt-1">
                        Last seen {formatTime(chat.lastSeen)}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <NewChatDialog
        open={showNewChat}
        onClose={() => setShowNewChat(false)}
        onChatCreated={(chat) => {
          setShowNewChat(false);
          onSelectChat(chat);
          onRefresh();
        }}
      />

      <BroadcastDialog
        open={showBroadcast}
        onClose={() => setShowBroadcast(false)}
      />
    </>
  );
}
