//path: frontend/src/components/SharedFilesPanel.tsx

'use client';

import { useState, useEffect } from 'react';

interface SharedFile {
  _id: string;
  file: {
    _id: string;
    name: string;
    originalName: string;
    size: number;
    mimeType: string;
  };
  project: {
    _id: string;
    name: string;
  };
  sharedBy: {
    firstName: string;
    lastName: string;
    email: string;
  };
  message?: string;
  status: 'pending' | 'viewed' | 'downloaded';
  createdAt: string;
}

export default function SharedFilesPanel() {
  const [sharedFiles, setSharedFiles] = useState<SharedFile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSharedFiles();
  }, []);

  const fetchSharedFiles = async () => {
    try {
      const response = await fetch('/api/file-shares/shared', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      setSharedFiles(data);
    } catch (error) {
      console.error('Failed to fetch shared files:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsViewed = async (shareId: string) => {
    try {
      await fetch(`/api/file-shares/shares/${shareId}/viewed`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      fetchSharedFiles();
    } catch (error) {
      console.error('Failed to mark as viewed:', error);
    }
  };

  const downloadFile = async (shareId: string, fileId: string, fileName: string) => {
    try {
      await fetch(`/api/file-shares/shares/${shareId}/downloaded`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      const response = await fetch(`/api/projects/files/${fileId}/download`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      a.click();
      
      fetchSharedFiles();
    } catch (error) {
      console.error('Failed to download file:', error);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return <div className="p-4">Loading shared files...</div>;
  }

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Files Shared With Me</h2>

      {sharedFiles.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No files have been shared with you yet.
        </div>
      ) : (
        <div className="space-y-4">
          {sharedFiles.map(share => (
            <div
              key={share._id}
              className="border rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-lg">
                      {share.file.originalName}
                    </h3>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      share.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      share.status === 'viewed' ? 'bg-blue-100 text-blue-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {share.status}
                    </span>
                  </div>
                  
                  <p className="text-sm text-gray-600 mt-1">
                    Project: <span className="font-medium">{share.project.name}</span>
                  </p>
                  
                  <p className="text-sm text-gray-600">
                    Shared by: {share.sharedBy.firstName} {share.sharedBy.lastName}
                  </p>
                  
                  <p className="text-sm text-gray-500">
                    {formatFileSize(share.file.size)} • {formatDate(share.createdAt)}
                  </p>

                  {share.message && (
                    <div className="mt-2 p-2 bg-gray-50 rounded text-sm">
                      <span className="font-medium">Message:</span> {share.message}
                    </div>
                  )}
                </div>

                <div className="flex gap-2 ml-4">
                  {share.status === 'pending' && (
                    <button
                      onClick={() => markAsViewed(share._id)}
                      className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                      Mark as Viewed
                    </button>
                  )}
                  <button
                    onClick={() => downloadFile(share._id, share.file._id, share.file.originalName)}
                    className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700"
                  >
                    Download
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
