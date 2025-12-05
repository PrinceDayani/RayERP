'use client';

import { useState } from 'react';
import { BudgetComment, budgetCommentAPI } from '@/lib/api/budgetCommentAPI';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ThumbsUp, CheckCircle, AlertCircle, HelpCircle, Reply, Edit, Trash2 } from 'lucide-react';

interface CommentThreadProps {
  comment: BudgetComment;
  onRefresh: () => void;
  currentUserId: string;
}

export default function CommentThread({ comment, onRefresh, currentUserId }: CommentThreadProps) {
  const [showReply, setShowReply] = useState(false);
  const [replyContent, setReplyContent] = useState('');
  const [editing, setEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);
  const [loading, setLoading] = useState(false);

  const reactionIcons = {
    like: { icon: ThumbsUp, color: 'text-blue-600', label: '👍' },
    approve: { icon: CheckCircle, color: 'text-green-600', label: '✅' },
    concern: { icon: AlertCircle, color: 'text-orange-600', label: '⚠️' },
    question: { icon: HelpCircle, color: 'text-purple-600', label: '❓' },
  };

  const handleReaction = async (type: 'like' | 'approve' | 'concern' | 'question') => {
    try {
      const userReaction = comment.reactions.find(r => r.user._id === currentUserId);
      if (userReaction?.type === type) {
        await budgetCommentAPI.removeReaction(comment._id);
      } else {
        await budgetCommentAPI.addReaction(comment._id, type);
      }
      onRefresh();
    } catch (err) {
      console.error('Failed to update reaction:', err);
    }
  };

  const handleReply = async () => {
    if (!replyContent.trim()) return;
    setLoading(true);
    try {
      await budgetCommentAPI.createComment(comment.budget, {
        content: replyContent,
        parentCommentId: comment._id,
      });
      setReplyContent('');
      setShowReply(false);
      onRefresh();
    } catch (err) {
      console.error('Failed to reply:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = async () => {
    if (!editContent.trim()) return;
    setLoading(true);
    try {
      await budgetCommentAPI.updateComment(comment._id, editContent);
      setEditing(false);
      onRefresh();
    } catch (err) {
      console.error('Failed to edit:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Delete this comment?')) return;
    try {
      await budgetCommentAPI.deleteComment(comment._id);
      onRefresh();
    } catch (err) {
      console.error('Failed to delete:', err);
    }
  };

  if (comment.isDeleted) {
    return (
      <div className="border-l-2 border-gray-300 pl-4 py-2 text-gray-500 italic">
        [Comment deleted]
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="border rounded-lg p-4">
        <div className="flex justify-between items-start mb-2">
          <div>
            <span className="font-semibold">{comment.author.name}</span>
            <span className="text-xs text-gray-500 ml-2">
              {new Date(comment.createdAt).toLocaleString()}
              {comment.isEdited && ' (edited)'}
            </span>
          </div>
          {comment.author._id === currentUserId && (
            <div className="flex gap-2">
              <Button size="sm" variant="ghost" onClick={() => setEditing(!editing)}>
                <Edit className="w-3 h-3" />
              </Button>
              <Button size="sm" variant="ghost" onClick={handleDelete}>
                <Trash2 className="w-3 h-3" />
              </Button>
            </div>
          )}
        </div>

        {editing ? (
          <div className="space-y-2">
            <Textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              rows={3}
            />
            <div className="flex gap-2">
              <Button size="sm" onClick={handleEdit} disabled={loading}>Save</Button>
              <Button size="sm" variant="outline" onClick={() => setEditing(false)}>Cancel</Button>
            </div>
          </div>
        ) : (
          <p className="text-sm mb-3">{comment.content}</p>
        )}

        {comment.mentions.length > 0 && (
          <div className="text-xs text-blue-600 mb-2">
            Mentioned: {comment.mentions.map(m => `@${m.name}`).join(', ')}
          </div>
        )}

        <div className="flex gap-4 items-center">
          {Object.entries(reactionIcons).map(([type, { icon: Icon, color, label }]) => {
            const count = comment.reactions.filter(r => r.type === type).length;
            const userReacted = comment.reactions.some(r => r.type === type && r.user._id === currentUserId);
            return (
              <button
                key={type}
                onClick={() => handleReaction(type as any)}
                className={`flex items-center gap-1 text-xs ${userReacted ? color : 'text-gray-500'} hover:opacity-70`}
              >
                <span>{label}</span>
                {count > 0 && <span>{count}</span>}
              </button>
            );
          })}
          <Button size="sm" variant="ghost" onClick={() => setShowReply(!showReply)}>
            <Reply className="w-3 h-3 mr-1" />
            Reply
          </Button>
        </div>

        {showReply && (
          <div className="mt-3 space-y-2">
            <Textarea
              placeholder="Write a reply..."
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              rows={2}
            />
            <div className="flex gap-2">
              <Button size="sm" onClick={handleReply} disabled={loading}>Post Reply</Button>
              <Button size="sm" variant="outline" onClick={() => setShowReply(false)}>Cancel</Button>
            </div>
          </div>
        )}
      </div>

      {comment.replies && comment.replies.length > 0 && (
        <div className="ml-8 space-y-3">
          {comment.replies.map((reply) => (
            <CommentThread
              key={reply._id}
              comment={reply}
              onRefresh={onRefresh}
              currentUserId={currentUserId}
            />
          ))}
        </div>
      )}
    </div>
  );
}
