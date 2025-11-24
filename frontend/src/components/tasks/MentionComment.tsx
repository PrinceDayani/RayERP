'use client';

import { useState } from 'react';
import { Send, AtSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

interface MentionCommentProps {
  taskId: string;
  userId: string;
  onCommentAdded?: () => void;
}

export default function MentionComment({ taskId, userId, onCommentAdded }: MentionCommentProps) {
  const [comment, setComment] = useState('');
  const [showMentions, setShowMentions] = useState(false);
  const [sending, setSending] = useState(false);

  const handleSubmit = async () => {
    if (!comment.trim()) return;
    
    setSending(true);
    try {
      const tasksAPI = (await import('@/lib/api/tasksAPI')).default;
      await tasksAPI.addComment(taskId, comment, userId);
      setComment('');
      onCommentAdded?.();
    } catch (error) {
      console.error('Comment error:', error);
    } finally {
      setSending(false);
    }
  };

  const extractMentions = (text: string): string[] => {
    const mentionRegex = /@\[([^\]]+)\]\(([^)]+)\)/g;
    const mentions: string[] = [];
    let match;
    
    while ((match = mentionRegex.exec(text)) !== null) {
      mentions.push(match[2]);
    }
    
    return mentions;
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === '@') {
      setShowMentions(true);
    }
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      handleSubmit();
    }
  };

  return (
    <div className="space-y-2">
      <div className="relative">
        <Textarea
          placeholder="Add a comment... Use @ to mention someone"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={3}
        />
        <div className="absolute bottom-2 right-2 text-xs text-muted-foreground">
          <AtSign className="w-3 h-3 inline mr-1" />
          Ctrl+Enter to send
        </div>
      </div>
      
      <div className="flex justify-end">
        <Button onClick={handleSubmit} disabled={sending || !comment.trim()} size="sm">
          <Send className="w-4 h-4 mr-2" />
          {sending ? 'Sending...' : 'Comment'}
        </Button>
      </div>
    </div>
  );
}
