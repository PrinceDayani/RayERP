'use client';

import { useState, useEffect, useRef } from 'react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MoreVertical, Shield } from 'lucide-react';
import { useSocket } from '@/hooks/useSocket';
import { useAuth } from '@/contexts/AuthContext';
import { Input } from '@/components/ui/input';
import { Send, Paperclip, Image, FileText, X, Check, CheckCheck, Clock, AlertCircle, Copy, Reply, Forward, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import ChatInput from './ChatInput';
import TypingIndicator from './TypingIndicator';

interface Message {
  _id?: string;
  sender: { _id: string; name: string; email: string };
  content: string;
  timestamp: string;
  read: boolean;
  type: 'text' | 'image' | 'file';
  fileData?: string;
  fileName?: string;
  fileSize?: number;
  mimeType?: string;
  status?: 'sending' | 'sent' | 'delivered' | 'read' | 'failed';
  replyTo?: string;
  edited?: boolean;
  editedAt?: string;
  metadata?: {
    ipAddress?: string;
    device?: string;
    browser?: string;
    os?: string;
    location?: {
      latitude?: number;
      longitude?: number;
      city?: string;
      country?: string;
    };
  };
}

interface Chat {
  _id: string;
  participants: Array<{ _id: string; name: string; email: string }>;
  messages: Message[];
  isGroup: boolean;
  groupName?: string;
}

interface ChatWindowProps {
  chat: Chat;
  onSendMessage: (content: string, type?: string, fileData?: string, fileName?: string, fileSize?: number, mimeType?: string) => void;
}

export default function ChatWindow({ chat, onSendMessage }: ChatWindowProps) {
  const { user } = useAuth();
  const [typingUsers, setTypingUsers] = useState<Array<{ _id: string; name: string; email: string }>>([]);
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const socket = useSocket();
  const currentUserId = user?._id;

  useEffect(() => {
    scrollToBottom();
  }, [chat.messages]);

  useEffect(() => {
    if (!socket) return;

    socket.on('user_typing', (data: any) => {
      if (data.chatId === chat._id && data.userId !== currentUserId) {
        setTypingUsers(prev => {
          const exists = prev.find(u => u._id === data.userId);
          if (!exists && data.user) {
            return [...prev, data.user];
          }
          return prev;
        });
      }
    });

    socket.on('user_stop_typing', (data: any) => {
      if (data.chatId === chat._id) {
        setTypingUsers(prev => prev.filter(u => u._id !== data.userId));
      }
    });

    socket.on('user_online', (data: any) => {
      setOnlineUsers(prev => [...new Set([...prev, data.userId])]);
    });

    socket.on('user_offline', (data: any) => {
      setOnlineUsers(prev => prev.filter(id => id !== data.userId));
    });

    return () => {
      socket.off('user_typing');
      socket.off('user_stop_typing');
      socket.off('user_online');
      socket.off('user_offline');
    };
  }, [socket, chat._id, currentUserId]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async (content: string, type?: string, fileData?: string, fileName?: string, fileSize?: number, mimeType?: string, replyToId?: string) => {
    try {
      await onSendMessage(content, type, fileData, fileName, fileSize, mimeType);
      if (socket) {
        socket.emit('stop_typing', { chatId: chat._id, userId: currentUserId });
      }
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  const handleReply = (message: Message) => {
    setReplyingTo(message);
  };

  const handleCancelReply = () => {
    setReplyingTo(null);
  };

  const handleDeleteMessage = async (message: Message) => {
    if (confirm('Are you sure you want to delete this message?')) {
      console.log('Delete message:', message._id);
      // TODO: Implement delete functionality
    }
  };

  const handleForwardMessage = (message: Message) => {
    console.log('Forward message:', message._id);
    // TODO: Implement forward functionality
    alert('Forward functionality will be implemented soon!');
  };

  const formatMessageTime = (timestamp: string) => {
    try {
      const date = new Date(timestamp);
      const today = new Date();
      const isToday = date.toDateString() === today.toDateString();
      
      if (isToday) {
        return format(date, 'HH:mm');
      }
      return format(date, 'MMM dd, HH:mm');
    } catch {
      return '';
    }
  };

  const getStatusIcon = (message: Message, isOwn: boolean) => {
    if (!isOwn) return null;
    
    switch (message.status) {
      case 'sending':
        return <Clock className="w-3 h-3 text-gray-400 animate-pulse" />;
      case 'sent':
        return <Check className="w-3 h-3 text-gray-400" />;
      case 'delivered':
        return <CheckCheck className="w-3 h-3 text-gray-400" />;
      case 'read':
        return <CheckCheck className="w-3 h-3 text-blue-500" />;
      case 'failed':
        return <AlertCircle className="w-3 h-3 text-red-500" />;
      default:
        return <Check className="w-3 h-3 text-gray-400" />;
    }
  };

  const getChatName = () => {
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

  const getInitials = (name: string) => {
    if (!name) return 'U';
    return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const isUserOnline = (userId: string) => {
    return onlineUsers.includes(userId);
  };

  return (
    <div className="flex-1 flex flex-col bg-white dark:bg-gray-800">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between bg-white dark:bg-gray-800">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10">
            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-semibold">
              {getInitials(getChatName())}
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-gray-900 dark:text-white">{getChatName()}</h3>
              {(user as any)?.role?.name?.toLowerCase() === 'root' && (
                <Badge variant="destructive" className="text-xs">
                  <Shield className="w-3 h-3 mr-1" />
                  Monitoring
                </Badge>
              )}
            </div>
            {typingUsers.length > 0 && (
              <p className="text-xs text-blue-600 dark:text-blue-400">
                {typingUsers.length === 1 
                  ? `${typingUsers[0].name} is typing...`
                  : `${typingUsers.length} people are typing...`
                }
              </p>
            )}
          </div>
        </div>
        <Button variant="ghost" size="icon">
          <MoreVertical className="h-5 w-5" />
        </Button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-gray-900">
        {(!chat.messages || chat.messages.length === 0) ? (
          <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
            <p>No messages yet. Start the conversation!</p>
          </div>
        ) : (
          (chat.messages || []).filter(msg => msg && msg.sender).map((msg, index) => {
            const isOwn = msg.sender._id === currentUserId;
            const showAvatar = index === 0 || !chat.messages[index - 1]?.sender || chat.messages[index - 1].sender._id !== msg.sender._id;

            return (
              <div
                key={msg._id || index}
                className={`flex gap-2 group ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}
              >
                {showAvatar ? (
                  <Avatar className="h-8 w-8 flex-shrink-0">
                    <AvatarFallback className={`text-xs font-semibold ${
                      isOwn
                        ? 'bg-gradient-to-br from-green-500 to-teal-600 text-white'
                        : 'bg-gradient-to-br from-blue-500 to-purple-600 text-white'
                    }`}>
                      {getInitials(msg.sender.name)}
                    </AvatarFallback>
                  </Avatar>
                ) : (
                  <div className="w-8" />
                )}
                <div className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'} max-w-[70%] relative`}>
                  {showAvatar && !isOwn && (
                    <span className="text-xs text-gray-600 dark:text-gray-400 mb-1 px-2">
                      {msg.sender.name}
                    </span>
                  )}
                  
                  <div className="relative">
                    <div
                      className={`rounded-2xl px-4 py-2 relative ${
                        isOwn
                          ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-br-sm shadow-md'
                          : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 rounded-bl-sm shadow-sm'
                      }`}
                    >
                      {msg.type === 'image' && msg.fileData ? (
                        <div className="space-y-2">
                          <img 
                            src={msg.fileData} 
                            alt={msg.content}
                            className="max-w-xs rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                            onClick={() => {
                              const link = document.createElement('a');
                              link.href = msg.fileData!;
                              link.download = msg.fileName || 'image';
                              link.click();
                            }}
                          />
                          {msg.content && <p className="text-sm break-words">{msg.content}</p>}
                        </div>
                      ) : msg.type === 'file' && msg.fileData ? (
                        <button
                          onClick={() => {
                            const link = document.createElement('a');
                            link.href = msg.fileData!;
                            link.download = msg.fileName || 'file';
                            link.click();
                          }}
                          className="flex items-center gap-3 hover:bg-opacity-80 p-2 rounded-lg transition-all w-full text-left"
                        >
                          <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                            <FileText className="w-5 h-5 text-blue-600" />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium break-words">{msg.fileName || msg.content}</p>
                            {msg.fileSize && (
                              <p className="text-xs opacity-70">
                                {(msg.fileSize / 1024).toFixed(1)}KB • Click to download
                              </p>
                            )}
                          </div>
                        </button>
                      ) : (
                        <p className="text-sm break-words leading-relaxed">{msg.content}</p>
                      )}
                    </div>
                    
                    {/* Message Actions */}
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-2 right-0 flex gap-1 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 hover:bg-gray-100"
                        onClick={() => handleReply(msg)}
                        title="Reply"
                      >
                        <Reply className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 hover:bg-gray-100"
                        onClick={() => navigator.clipboard.writeText(msg.content)}
                        title="Copy"
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 hover:bg-gray-100"
                        onClick={() => handleForwardMessage(msg)}
                        title="Forward"
                      >
                        <Forward className="h-3 w-3" />
                      </Button>
                      {isOwn && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 hover:bg-red-100 hover:text-red-600"
                          onClick={() => handleDeleteMessage(msg)}
                          title="Delete"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-1 mt-1 px-2">
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {formatMessageTime(msg.timestamp)}
                    </span>
                    {getStatusIcon(msg, isOwn)}
                  </div>
                </div>
              </div>
            );
          })
        )}
        
        {/* Typing Indicator */}
        {typingUsers.length > 0 && (
          <TypingIndicator users={typingUsers} />
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      {(user as any)?.role?.name?.toLowerCase() === 'root' ? (
        <div className="flex items-center justify-center gap-2 text-gray-500 dark:text-gray-400 py-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
          <Shield className="w-4 h-4" />
          <span className="text-sm">Read-only mode - Root users cannot send messages</span>
        </div>
      ) : (
        <ChatInput
          onSendMessage={handleSendMessage}
          replyingTo={replyingTo}
          onCancelReply={handleCancelReply}
          disabled={false}
          placeholder="Type a message..."
          maxLength={1000}
        />
      )}
    </div>
  );
}
