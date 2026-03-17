"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { MentionInput } from "@/components/ui/MentionInput";
import { tasksAPI } from "@/lib/api/tasksAPI";
import { toast } from "@/components/ui/use-toast";
import { Plus, MessageSquare } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

interface Comment {
  _id?: string;
  user: {
    _id: string;
    firstName: string;
    lastName: string;
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

  const fetchUsers = async () => {
    try {
      const response = await fetch("/api/employees");
      const data = await response.json();
      setUsers(data);
    } catch (error) {
      console.error("Failed to fetch users:", error);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;

    try {
      setAdding(true);
      await tasksAPI.addComment(taskId, newComment, user?._id || "");
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

  const renderComment = (text: string) => {
    return text.replace(/@\[([^\]]+)\]\([^)]+\)/g, '<span class="text-primary font-medium">@$1</span>');
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
                      {comment.user?.firstName?.[0]}
                      {comment.user?.lastName?.[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="bg-muted rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-sm">
                          {comment.user?.firstName} {comment.user?.lastName}
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
