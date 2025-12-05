'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { budgetCommentAPI } from '@/lib/api/budgetCommentAPI';

interface CommentInputProps {
  budgetId: string;
  onSuccess: () => void;
}

export default function CommentInput({ budgetId, onSuccess }: CommentInputProps) {
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!content.trim()) return;

    setLoading(true);
    try {
      await budgetCommentAPI.createComment(budgetId, { content });
      setContent('');
      onSuccess();
    } catch (err) {
      console.error('Failed to post comment:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-2">
      <Textarea
        placeholder="Write a comment... Use @name to mention someone"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        rows={3}
      />
      <div className="flex justify-between items-center">
        <div className="text-xs text-gray-500">
          Tip: Use @username to mention team members
        </div>
        <Button onClick={handleSubmit} disabled={loading || !content.trim()}>
          {loading ? 'Posting...' : 'Post Comment'}
        </Button>
      </div>
    </div>
  );
}
