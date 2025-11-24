'use client';

import { useState } from 'react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { 
  Check, 
  CheckCheck, 
  Clock, 
  AlertCircle, 
  Copy, 
  Reply, 
  Forward, 
  Trash2, 
  Smile,
  FileText,
  Download
} from 'lucide-react';
import { format } from 'date-fns';

interface Message {
  _id?: string;
  sender: { _id: string; name: string; email: string };
  content: string;
  timestamp: string;
  read: boolean;
  type: 'text' | 'image' | 'file' | 'audio' | 'video';
  fileData?: string;
  fileName?: string;
  fileSize?: number;
  mimeType?: string;
  status?: 'sending' | 'sent' | 'delivered' | 'read' | 'failed';
  replyTo?: Message;
  edited?: boolean;
  editedAt?: string;
  reactions?: Array<{
    emoji: string;
    users: Array<{ _id: string; name: string }>;
    count: number;
  }>;
}

interface MessageBubbleProps {
  message: Message;
  isOwn: boolean;
  showAvatar: boolean;
  currentUserId?: string;
  onReply?: (message: Message) => void;
  onEdit?: (message: Message) => void;
  onDelete?: (message: Message) => void;
  onReact?: (message: Message, emoji: string) => void;
  onForward?: (message: Message) => void;
}

export default function MessageBubble({
  message,
  isOwn,
  showAvatar,
  currentUserId,
  onReply,
  onEdit,
  onDelete,
  onReact,
  onForward
}: MessageBubbleProps) {
  const [showActions, setShowActions] = useState(false);
  const [showReactions, setShowReactions] = useState(false);

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

  const getStatusIcon = () => {
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
        return <AlertCircle className="w-3 h-3 text-red-500 cursor-pointer" title="Failed to send. Click to retry." />;
      default:
        return <Check className="w-3 h-3 text-gray-400" />;
    }
  };

  const handleAction = (action: string) => {
    switch (action) {
      case 'reply':
        onReply?.(message);
        break;
      case 'edit':
        onEdit?.(message);
        break;
      case 'copy':
        navigator.clipboard.writeText(message.content);
        break;
      case 'forward':
        onForward?.(message);
        break;
      case 'delete':
        onDelete?.(message);
        break;
    }
    setShowActions(false);
  };

  const handleReaction = (emoji: string) => {
    onReact?.(message, emoji);
    setShowReactions(false);
  };

  const downloadFile = () => {
    if (message.fileData) {
      const link = document.createElement('a');
      link.href = message.fileData;
      link.download = message.fileName || 'file';
      link.click();
    }
  };

  const commonReactions = ['👍', '❤️', '😂', '😮', '😢', '😡'];

  return (
    <div className={`flex gap-3 group ${isOwn ? 'flex-row-reverse' : 'flex-row'} relative`}>
      {/* Avatar */}
      {showAvatar ? (
        <Avatar className="h-8 w-8 flex-shrink-0">
          <AvatarFallback className={`text-xs font-semibold ${
            isOwn
              ? 'bg-gradient-to-br from-green-500 to-teal-600 text-white'
              : 'bg-gradient-to-br from-blue-500 to-purple-600 text-white'
          }`}>
            {getInitials(message.sender.name)}
          </AvatarFallback>
        </Avatar>
      ) : (
        <div className="w-8" />
      )}

      {/* Message Content */}
      <div className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'} max-w-[70%] relative`}>
        {/* Sender Name */}
        {showAvatar && !isOwn && (
          <span className="text-xs text-gray-600 dark:text-gray-400 mb-1 px-2">
            {message.sender.name}
          </span>
        )}

        {/* Reply Context */}
        {message.replyTo && (
          <div className="mb-2 p-2 bg-gray-100 dark:bg-gray-700 rounded-lg border-l-4 border-blue-500 text-xs max-w-full">
            <p className="text-blue-600 font-medium">Replying to {message.replyTo.sender.name}</p>
            <p className="text-gray-600 dark:text-gray-300 truncate">
              {message.replyTo.content}
            </p>
          </div>
        )}

        {/* Message Bubble */}
        <div
          className={`rounded-2xl px-4 py-2 relative transition-all duration-200 ${
            isOwn
              ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-br-sm shadow-md hover:shadow-lg'
              : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 rounded-bl-sm shadow-sm hover:shadow-md'
          }`}
          onMouseEnter={() => setShowActions(true)}
          onMouseLeave={() => setShowActions(false)}
        >
          {/* Message Content Based on Type */}
          {message.type === 'image' && message.fileData ? (
            <div className="space-y-2">
              <div className="relative group">
                <img 
                  src={message.fileData} 
                  alt={message.content}
                  className="max-w-xs rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                  onClick={downloadFile}
                />
                <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-20 rounded-lg transition-all flex items-center justify-center opacity-0 hover:opacity-100">
                  <div className="flex gap-2">
                    <Button
                      variant="secondary"
                      size="icon"
                      className="h-8 w-8 bg-white/80 hover:bg-white"
                      onClick={downloadFile}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="secondary"
                      size="icon"
                      className="h-8 w-8 bg-white/80 hover:bg-white"
                      onClick={() => window.open(message.fileData, '_blank')}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
              {message.content && (
                <p className="text-sm break-words leading-relaxed">{message.content}</p>
              )}
            </div>
          ) : message.type === 'file' && message.fileData ? (
            <button
              onClick={downloadFile}
              className="flex items-center gap-3 hover:bg-opacity-80 p-2 rounded-lg transition-all w-full text-left group"
            >
              <div className={`p-2 rounded-lg ${isOwn ? 'bg-blue-500' : 'bg-blue-100 dark:bg-blue-900'}`}>
                <FileText className={`w-5 h-5 ${isOwn ? 'text-white' : 'text-blue-600'}`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium break-words">{message.fileName || message.content}</p>
                {message.fileSize && (
                  <p className="text-xs opacity-70">
                    {(message.fileSize / 1024).toFixed(1)}KB • Click to download
                  </p>
                )}
              </div>
              <Download className={`w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity ${isOwn ? 'text-white' : 'text-gray-600'}`} />
            </button>
          ) : (
            <p className="text-sm break-words leading-relaxed">{message.content}</p>
          )}

          {/* Edit Indicator */}
          {message.edited && (
            <span className="text-xs opacity-60 italic mt-1 block">
              edited {message.editedAt ? formatMessageTime(message.editedAt) : ''}
            </span>
          )}

          {/* Reactions */}
          {message.reactions && message.reactions.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {message.reactions.map((reaction, index) => (
                <Button
                  key={index}
                  variant="ghost"
                  size="sm"
                  className={`h-6 px-2 text-xs rounded-full ${
                    reaction.users.some(u => u._id === currentUserId)
                      ? 'bg-blue-100 dark:bg-blue-900 text-blue-600'
                      : 'bg-gray-100 dark:bg-gray-700'
                  }`}
                  onClick={() => handleReaction(reaction.emoji)}
                >
                  {reaction.emoji} {reaction.count}
                </Button>
              ))}
            </div>
          )}
        </div>

        {/* Message Actions */}
        {showActions && (
          <div className={`absolute -top-2 ${isOwn ? 'left-0' : 'right-0'} flex gap-1 opacity-100 transition-opacity bg-white dark:bg-gray-800 rounded-lg shadow-lg p-1 z-10`}>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 hover:bg-gray-100"
              onClick={() => setShowReactions(!showReactions)}
            >
              <Smile className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 hover:bg-gray-100"
              onClick={() => handleAction('reply')}
            >
              <Reply className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 hover:bg-gray-100"
              onClick={() => handleAction('copy')}
            >
              <Copy className="h-3 w-3" />
            </Button>
            {isOwn && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 hover:bg-gray-100"
                  onClick={() => handleAction('edit')}
                >
                  <Edit3 className="h-3 w-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 hover:bg-red-100 hover:text-red-600"
                  onClick={() => handleAction('delete')}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 hover:bg-gray-100"
              onClick={() => handleAction('forward')}
            >
              <Forward className="h-3 w-3" />
            </Button>
          </div>
        )}

        {/* Reaction Picker */}
        {showReactions && (
          <div className={`absolute top-8 ${isOwn ? 'left-0' : 'right-0'} bg-white dark:bg-gray-800 rounded-lg shadow-lg p-2 flex gap-1 z-20`}>
            {commonReactions.map((emoji) => (
              <Button
                key={emoji}
                variant="ghost"
                size="icon"
                className="h-8 w-8 hover:bg-gray-100 text-lg"
                onClick={() => handleReaction(emoji)}
              >
                {emoji}
              </Button>
            ))}
          </div>
        )}

        {/* Time and Status */}
        <div className="flex items-center gap-1 mt-1 px-2">
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {formatMessageTime(message.timestamp)}
          </span>
          {getStatusIcon()}
        </div>
      </div>
    </div>
  );
}