"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ColorPicker } from "@/components/ui/ColorPicker";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { tasksAPI } from "@/lib/api/tasksAPI";
import { toast } from "@/components/ui/use-toast";
import { Plus, X, Tag as TagIcon } from "lucide-react";

interface Tag {
  name: string;
  color: string;
}

interface TaskTagsProps {
  taskId: string;
  tags: Tag[];
  onTagsUpdated?: () => void;
}

export function TaskTags({ taskId, tags, onTagsUpdated }: TaskTagsProps) {
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newTagName, setNewTagName] = useState("");
  const [newTagColor, setNewTagColor] = useState("#3b82f6");
  const [loading, setLoading] = useState(false);

  const handleAddTag = async () => {
    if (!newTagName.trim()) return;

    try {
      setLoading(true);
      await tasksAPI.addTag(taskId, newTagName, newTagColor);
      toast({ title: "Success", description: "Tag added" });
      setNewTagName("");
      setNewTagColor("#3b82f6");
      setShowAddDialog(false);
      onTagsUpdated?.();
    } catch (error) {
      toast({ title: "Error", description: "Failed to add tag", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveTag = async (tagName: string) => {
    try {
      await tasksAPI.removeTag(taskId, tagName);
      toast({ title: "Success", description: "Tag removed" });
      onTagsUpdated?.();
    } catch (error) {
      toast({ title: "Error", description: "Failed to remove tag", variant: "destructive" });
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <TagIcon className="h-4 w-4" />
              Tags
            </CardTitle>
            <Button size="sm" variant="outline" onClick={() => setShowAddDialog(true)}>
              <Plus className="h-4 w-4 mr-1" />
              Add
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {tags && tags.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {tags.map((tag, index) => (
                <Badge
                  key={index}
                  style={{ backgroundColor: tag.color }}
                  className="text-white pr-1"
                >
                  {tag.name}
                  <button
                    onClick={() => handleRemoveTag(tag.name)}
                    className="ml-1 hover:bg-black/20 rounded-full p-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No tags</p>
          )}
        </CardContent>
      </Card>

      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Tag</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="tag-name">Tag Name</Label>
              <Input
                id="tag-name"
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
                placeholder="Enter tag name"
              />
            </div>
            <div className="space-y-2">
              <Label>Tag Color</Label>
              <ColorPicker value={newTagColor} onChange={setNewTagColor} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)} disabled={loading}>
              Cancel
            </Button>
            <Button onClick={handleAddTag} disabled={loading || !newTagName.trim()}>
              {loading ? "Adding..." : "Add Tag"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
