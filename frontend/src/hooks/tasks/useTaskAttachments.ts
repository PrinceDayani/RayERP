import { useState } from "react";
import { tasksAPI } from "@/lib/api/tasksAPI";
import { toast } from "@/components/ui/use-toast";

export function useTaskAttachments(taskId: string) {
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const uploadAttachments = async (files: File[]) => {
    try {
      setUploading(true);
      const formData = new FormData();
      files.forEach((file) => formData.append("files", file));
      await tasksAPI.uploadAttachment(taskId, formData);
      return true;
    } catch (error) {
      toast({ title: "Error", description: "Failed to upload files", variant: "destructive" });
      return false;
    } finally {
      setUploading(false);
    }
  };

  const deleteAttachment = async (attachmentId: string) => {
    try {
      setDeleting(true);
      await tasksAPI.deleteAttachment(taskId, attachmentId);
      return true;
    } catch (error) {
      toast({ title: "Error", description: "Failed to delete file", variant: "destructive" });
      return false;
    } finally {
      setDeleting(false);
    }
  };

  return { uploadAttachments, deleteAttachment, uploading, deleting };
}
