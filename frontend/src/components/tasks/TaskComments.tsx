"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { MentionInput } from "@/components/ui/MentionInput";
import { tasksAPI } from "@/lib/api/tasksAPI";
import api from "@/lib/api/api";
import { toast } from "@/components/ui/use-toast";
import { Plus, MessageSquare } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

// comments[].user references User, which carries `name` - not the Employee
// firstName/lastName this previously declared. See Documentation/identity-map.md.
interface Comment {
  _id?: string;
  user: {
    _id: string;
    name: string;
    email?: string;
  };
  comment: string;
  mentions?: string[];
  createdAt: Date;
}

interface TaskCommentsProps {
  taskId: string;
  comments: Comment[];
  onCommentAdded?: () => void;
}

export function TaskComments({ taskId, comments, onCommentAdded }: TaskCommentsProps) {
  const { user } = useAuth();
  const [newComment, setNewComment] = useState("");
  const [mentions, setMentions] = useState<string[]>([]);
  const [adding, setAdding] = useState(false);
  const [users, setUsers] = useState<any[]>([]);

  useEffect(() => {
    fetchUsers();
  }, []);

  // Mentions resolve to Users, and the relative URL used here previously hit
  // the Next.js server rather than the API, so the list was always empty.
  const fetchUsers = async () => {
    try {
      const { data } = await api.get('/users');
      const list = Array.isArray(data) ? data : data?.users ?? data?.data ?? [];
      setUsers(list);
    } catch {
      // Listing users needs the users.view permission; without it mentions are
      // simply unavailable, which must not break commenting.
      setUsers([]);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;

    try {
      setAdding(true);
      await tasksAPI.addComment(taskId, newComment);
      setNewComment("");
      setMentions([]);
      toast({ title: "Success", description: "Comment added" });
      onCommentAdded?.();
    } catch (error) {
      toast({ title: "Error", description: "Failed to add comment", variant: "destructive" });
    } finally {
      setAdding(false);
    }
  };

  const escapeHtml = (value: string) =>
    value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');

  // The result is injected with dangerouslySetInnerHTML, so the comment body is
  // escaped first and only the mention markup is added back afterwards -
  // otherwise a comment containing HTML would execute. A comment stored without
  // text must not throw here either: this renders inside the default-open tab,
  // so one malformed record would take down the whole page.
  const renderComment = (text: unknown) => {
    if (typeof text !== 'string' || text.length === 0) return '';

    return escapeHtml(text).replace(
      /@\[([^\]]+)\]\([^)]+\)/g,
      '<span class="text-primary font-medium">@$1</span>'
    );
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="space-y-4">
          <div className="flex gap-2">
            <MentionInput
              value={newComment}
              onChange={(value, extractedMentions) => {
                setNewComment(value);
                setMentions(extractedMentions);
              }}
              users={users}
              placeholder="Add a comment... Use @ to mention someone"
              rows={3}
            />
            <Button onClick={handleAddComment} disabled={adding || !newComment.trim()} size="icon">
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          <Separator />
          <div className="space-y-4">
            {comments && comments.length > 0 ? (
              comments.map((comment, index) => (
                <div key={comment._id || index} className="flex gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>
                      {(((comment.user as any)?.name) || '').split(' ').slice(0, 2).map((p: string) => p[0]).join('').toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="bg-muted rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-sm">
                          {(comment.user as any)?.name}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(comment.createdAt).toLocaleString()}
                        </span>
                      </div>
                      <div
                        className="text-sm"
                        dangerouslySetInnerHTML={{ __html: renderComment(comment.comment) }}
                      />
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <MessageSquare className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No comments yet</p>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
