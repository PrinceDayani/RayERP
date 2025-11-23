'use client';

import { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Send, MoreVertical, Shield, Paperclip, Image, FileText, X } from 'lucide-react';
import { format } from 'date-fns';
import { useSocket } from '@/hooks/useSocket';
import { useAuth } from '@/contexts/AuthContext';

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
  const [message, setMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const socket = useSocket();
  const currentUserId = user?._id;

  useEffect(() => {
    scrollToBottom();
  }, [chat.messages]);

  useEffect(() => {
    if (!socket) return;

    socket.on('user_typing', (data: any) => {
      if (data.chatId === chat._id && data.userId !== currentUserId) {
        setIsTyping(true);
      }
    });

    socket.on('user_stop_typing', (data: any) => {
      if (data.chatId === chat._id) {
        setIsTyping(false);
      }
    });

    return () => {
      socket.off('user_typing');
      socket.off('user_stop_typing');
    };
  }, [socket, chat._id, currentUserId]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSend = async () => {
    if (selectedFile) {
      await handleFileUpload();
      return;
    }
    if (!message.trim()) return;
    onSendMessage(message);
    setMessage('');
    if (socket) {
      socket.emit('stop_typing', { chatId: chat._id, userId: currentUserId });
    }
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleFileUpload = async () => {
    if (!selectedFile) return;

    setUploading(true);
    try {
      // Validate file size (5MB limit)
      if (selectedFile.size > 5 * 1024 * 1024) {
        alert('File size must be less than 5MB');
        setUploading(false);
        return;
      }

      const fileBase64 = await fileToBase64(selectedFile);
      const fileType = selectedFile.type.startsWith('image/') ? 'image' : 'file';
      const content = message.trim() || selectedFile.name;

      await onSendMessage(
        content,
        fileType,
        fileBase64,
        selectedFile.name,
        selectedFile.size,
        selectedFile.type
      );

      setSelectedFile(null);
      setMessage('');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error('File upload failed:', error);
      alert('Failed to send file. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleTyping = (value: string) => {
    setMessage(value);
    if (socket && value.length > 0) {
      socket.emit('typing', { chatId: chat._id, userId: currentUserId });
    } else if (socket) {
      socket.emit('stop_typing', { chatId: chat._id, userId: currentUserId });
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
            {isTyping && (
              <p className="text-xs text-blue-600 dark:text-blue-400">typing...</p>
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
                className={`flex gap-2 ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}
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
                <div className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'} max-w-[70%]`}>
                  {showAvatar && !isOwn && (
                    <span className="text-xs text-gray-600 dark:text-gray-400 mb-1 px-2">
                      {msg.sender.name}
                    </span>
                  )}
                  <div
                    className={`rounded-2xl px-4 py-2 ${
                      isOwn
                        ? 'bg-blue-600 text-white rounded-br-sm'
                        : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 rounded-bl-sm'
                    }`}
                  >
                    {msg.type === 'image' && msg.fileData ? (
                      <div className="space-y-2">
                        <img 
                          src={msg.fileData} 
                          alt={msg.content}
                          className="max-w-xs rounded-lg cursor-pointer hover:opacity-90"
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
                        className="flex items-center gap-2 hover:underline"
                      >
                        <FileText className="w-4 h-4" />
                        <span className="text-sm break-words">{msg.fileName || msg.content}</span>
                        {msg.fileSize && <span className="text-xs opacity-70">({(msg.fileSize / 1024).toFixed(1)}KB)</span>}
                      </button>
                    ) : (
                      <p className="text-sm break-words">{msg.content}</p>
                    )}
                  </div>
                  <span className="text-xs text-gray-500 dark:text-gray-400 mt-1 px-2">
                    {formatMessageTime(msg.timestamp)}
                  </span>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        {(user as any)?.role?.name?.toLowerCase() === 'root' ? (
          <div className="flex items-center justify-center gap-2 text-gray-500 dark:text-gray-400 py-2">
            <Shield className="w-4 h-4" />
            <span className="text-sm">Read-only mode - Root users cannot send messages</span>
          </div>
        ) : (
          <div className="space-y-2">
            {selectedFile && (
              <div className="flex items-center gap-2 p-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
                {selectedFile.type.startsWith('image/') ? (
                  <Image className="w-4 h-4 text-blue-600" />
                ) : (
                  <FileText className="w-4 h-4 text-blue-600" />
                )}
                <span className="text-sm flex-1 truncate">{selectedFile.name}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => setSelectedFile(null)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
            <div className="flex gap-2">
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,.zip,.rar"
                onChange={handleFileSelect}
              />
              <Button
                variant="outline"
                size="icon"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
              >
                <Paperclip className="h-4 w-4" />
              </Button>
              <Input
                placeholder={selectedFile ? "Add a caption (optional)" : "Type a message..."}
                value={message}
                onChange={(e) => handleTyping(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                className="flex-1"
                disabled={uploading}
              />
              <Button
                onClick={handleSend}
                disabled={(!message.trim() && !selectedFile) || uploading}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {uploading ? (
                  <span className="animate-spin">⏳</span>
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
