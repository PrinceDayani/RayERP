'use client';

import { useState } from 'react';
import { Paperclip, X, Download, FileText, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import tasksAPI from '@/lib/api/tasksAPI';

interface Attachment {
  _id?: string;
  filename: string;
  originalName: string;
  mimetype: string;
  size: number;
  url: string;
  uploadedBy: string;
  uploadedAt: string;
}

interface AttachmentManagerProps {
  taskId: string;
  userId: string;
  attachments?: Attachment[];
  onUpdate?: () => void;
}

export default function AttachmentManager({ taskId, userId, attachments = [], onUpdate }: AttachmentManagerProps) {
  const [uploading, setUploading] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      alert('File size must be less than 10MB');
      e.target.value = '';
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('uploadedBy', userId);
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/tasks/${taskId}/attachments`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth-token')}`
        },
        body: formData
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Upload failed');
      }
      
      onUpdate?.();
    } catch (error: any) {
      console.error('Upload failed:', error);
      alert(error.message || 'Failed to upload file');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleRemove = async (attachmentId: string) => {
    if (!confirm('Are you sure you want to remove this attachment?')) return;
    
    try {
      await tasksAPI.removeAttachment(taskId, attachmentId);
      onUpdate?.();
    } catch (error: any) {
      console.error('Remove failed:', error);
      alert(error.response?.data?.message || 'Failed to remove attachment');
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const getIcon = (mimetype: string) => {
    if (mimetype.startsWith('image/')) return <ImageIcon className="w-4 h-4" />;
    return <FileText className="w-4 h-4" />;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" disabled={uploading} asChild>
          <label className="cursor-pointer">
            <Paperclip className="w-4 h-4 mr-2" />
            {uploading ? 'Uploading...' : 'Attach File'}
            <input type="file" className="hidden" onChange={handleFileUpload} />
          </label>
        </Button>
      </div>

      {attachments.length > 0 && (
        <div className="space-y-2">
          {attachments.map((att) => (
            <div key={att._id} className="flex items-center gap-3 p-3 bg-muted rounded-lg">
              {getIcon(att.mimetype)}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{att.originalName}</p>
                <p className="text-xs text-muted-foreground">{formatSize(att.size)}</p>
              </div>
              <Button variant="ghost" size="sm" asChild>
                <a href={`${process.env.NEXT_PUBLIC_API_URL}${att.url}`} download={att.originalName} target="_blank" rel="noopener noreferrer">
                  <Download className="w-4 h-4" />
                </a>
              </Button>
              <Button variant="ghost" size="sm" onClick={() => att._id && handleRemove(att._id)}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
