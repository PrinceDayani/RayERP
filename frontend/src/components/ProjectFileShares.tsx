//path: frontend/src/components/ProjectFileShares.tsx

'use client';

import { useState, useEffect } from 'react';

interface FileShare {
  _id: string;
  file: {
    name: string;
    originalName: string;
  };
  sharedBy: {
    firstName: string;
    lastName: string;
  };
  sharedWith: Array<{
    firstName: string;
    lastName: string;
  }>;
  viewedBy: Array<{
    employee: {
      firstName: string;
      lastName: string;
    };
    viewedAt: string;
  }>;
  downloadedBy: Array<{
    employee: {
      firstName: string;
      lastName: string;
    };
    downloadedAt: string;
  }>;
  message?: string;
  status: string;
  createdAt: string;
}

interface ProjectFileSharesProps {
  projectId: string;
}

export default function ProjectFileShares({ projectId }: ProjectFileSharesProps) {
  const [shares, setShares] = useState<FileShare[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchShares();
  }, [projectId]);

  const fetchShares = async () => {
    try {
      const response = await fetch(`/api/file-shares/projects/${projectId}/shares`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      setShares(data);
    } catch (error) {
      console.error('Failed to fetch shares:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">File Shares in This Project</h3>
      
      {shares.length === 0 ? (
        <p className="text-gray-500">No files have been shared yet.</p>
      ) : (
        <div className="space-y-3">
          {shares.map(share => (
            <div key={share._id} className="border rounded-lg p-4">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-medium">{share.file.originalName}</p>
                  <p className="text-sm text-gray-600">
                    Shared by: {share.sharedBy.firstName} {share.sharedBy.lastName}
                  </p>
                  <p className="text-sm text-gray-600">
                    Shared with: {share.sharedWith.map(e => `${e.firstName} ${e.lastName}`).join(', ')}
                  </p>
                  {share.message && (
                    <p className="text-sm text-gray-500 mt-1 italic">"{share.message}"</p>
                  )}
                </div>
                <span className={`px-2 py-1 text-xs rounded ${
                  share.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                  share.status === 'viewed' ? 'bg-blue-100 text-blue-800' :
                  'bg-green-100 text-green-800'
                }`}>
                  {share.status}
                </span>
              </div>
              
              {share.viewedBy.length > 0 && (
                <div className="mt-2 text-sm text-gray-600">
                  Viewed by: {share.viewedBy.map(v => v.employee.firstName).join(', ')}
                </div>
              )}
              
              {share.downloadedBy.length > 0 && (
                <div className="mt-1 text-sm text-gray-600">
                  Downloaded by: {share.downloadedBy.map(d => d.employee.firstName).join(', ')}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
