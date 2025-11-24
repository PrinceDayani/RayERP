'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { 
  Send, 
  Paperclip, 
  Image, 
  FileText, 
  X, 
  Smile,
  Reply
} from 'lucide-react';

interface Message {
  _id?: string;
  sender: { _id: string; name: string; email: string };
  content: string;
  timestamp: string;
  type: 'text' | 'image' | 'file' | 'audio';
}

interface ChatInputProps {
  onSendMessage: (content: string, type?: string, fileData?: string, fileName?: string, fileSize?: number, mimeType?: string, replyTo?: string) => void;
  replyingTo?: Message | null;
  onCancelReply?: () => void;
  disabled?: boolean;
  placeholder?: string;
  maxLength?: number;
}

export default function ChatInput({
  onSendMessage,
  replyingTo,
  onCancelReply,
  disabled = false,
  placeholder = "Type a message...",
  maxLength = 1000
}: ChatInputProps) {
  const [message, setMessage] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [showEmojis, setShowEmojis] = useState(false);
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);


  // Common emojis
  const commonEmojis = [
    '😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇',
    '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚',
    '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🤩',
    '🥳', '😏', '😒', '😞', '😔', '😟', '😕', '🙁', '☹️', '😣',
    '👍', '👎', '👌', '✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉',
    '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔'
  ];

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [message]);

  const handleSend = async () => {
    if (selectedFile) {
      await handleFileUpload();
      return;
    }
    
    if (!message.trim()) return;
    
    onSendMessage(message, 'text', undefined, undefined, undefined, undefined, replyingTo?._id);
    setMessage('');
    onCancelReply?.();
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
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
      // Validate file size (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        alert('File size must be less than 10MB');
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleFileUpload = async () => {
    if (!selectedFile) return;

    setUploading(true);
    try {
      const fileBase64 = await fileToBase64(selectedFile);
      const fileType = selectedFile.type.startsWith('image/') ? 'image' : 'file';
      const content = message.trim() || selectedFile.name;

      await onSendMessage(
        content,
        fileType,
        fileBase64,
        selectedFile.name,
        selectedFile.size,
        selectedFile.type,
        replyingTo?._id
      );

      setSelectedFile(null);
      setMessage('');
      onCancelReply?.();
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



  const insertEmoji = (emoji: string) => {
    const textarea = textareaRef.current;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const newMessage = message.substring(0, start) + emoji + message.substring(end);
      setMessage(newMessage);
      
      // Set cursor position after emoji
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + emoji.length;
        textarea.focus();
      }, 0);
    }
    setShowEmojis(false);
  };



  return (
    <div className="border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
      {/* Reply Context */}
      {replyingTo && (
        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border-b border-blue-200 dark:border-blue-800">
          <div className="flex items-center gap-2">
            <Reply className="w-4 h-4 text-blue-600" />
            <div className="flex-1">
              <p className="text-xs text-blue-600 font-medium">Replying to {replyingTo.sender.name}</p>
              <p className="text-sm text-gray-600 dark:text-gray-300 truncate">{replyingTo.content}</p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={onCancelReply}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* File Preview */}
      {selectedFile && (
        <div className="p-3 bg-gray-100 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
          <div className="flex items-center gap-3">
            {selectedFile.type.startsWith('image/') ? (
              <Image className="w-5 h-5 text-blue-600" />
            ) : (
              <FileText className="w-5 h-5 text-blue-600" />
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{selectedFile.name}</p>
              <p className="text-xs text-gray-500">
                {(selectedFile.size / 1024).toFixed(1)}KB
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => setSelectedFile(null)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="p-4 space-y-3">
        <div className="flex gap-2">
          {/* File Input */}
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,.zip,.rar"
            onChange={handleFileSelect}
          />
          
          {/* Attachment Button */}
          <Button
            variant="outline"
            size="icon"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading || disabled}
            className="hover:bg-blue-50 hover:border-blue-300"
          >
            <Paperclip className="h-4 w-4" />
          </Button>



          {/* Message Input */}
          <div className="flex-1 relative">
            <Textarea
              ref={textareaRef}
              placeholder={selectedFile ? "Add a caption (optional)" : replyingTo ? "Reply to message..." : placeholder}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              className="min-h-[40px] max-h-[120px] resize-none pr-12"
              disabled={uploading || disabled}
              maxLength={maxLength}
            />
            <div className="absolute right-2 bottom-2 text-xs text-gray-400">
              {message.length}/{maxLength}
            </div>
          </div>

          <Button
            variant="outline"
            size="icon"
            disabled={disabled}
            className="hover:bg-blue-50 hover:border-blue-300"
            onClick={() => setShowEmojis(!showEmojis)}
          >
            <Smile className="h-4 w-4" />
          </Button>



          {/* Send Button */}
          <Button
            onClick={handleSend}
            disabled={(!message.trim() && !selectedFile) || uploading || disabled || message.length > maxLength}
            className="bg-blue-600 hover:bg-blue-700 transition-all duration-200"
          >
            {uploading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>

        <div className="text-xs text-gray-500 text-center">
          Press Enter to send, Shift+Enter for new line
        </div>
        
        {/* Simple Emoji Picker */}
        {showEmojis && (
          <div className="absolute bottom-16 right-4 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-3 grid grid-cols-8 gap-1 z-10">
            {commonEmojis.map((emoji) => (
              <Button
                key={emoji}
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-lg hover:bg-gray-100"
                onClick={() => insertEmoji(emoji)}
              >
                {emoji}
              </Button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}