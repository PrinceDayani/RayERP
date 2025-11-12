// Example React Component for Project File Sharing
// Path: frontend/src/components/ProjectFileSharing.tsx

import React, { useState, useEffect } from 'react';

interface Department {
  _id: string;
  name: string;
}

interface User {
  _id: string;
  name: string;
  email: string;
}

interface ProjectFile {
  _id: string;
  originalName: string;
  size: number;
  mimeType: string;
  uploadedBy: User;
  sharedWithDepartments: Department[];
  sharedWithUsers: User[];
  shareType: 'department' | 'user' | 'both';
  createdAt: string;
}

interface FileUploadModalProps {
  projectId: string;
  onClose: () => void;
  onSuccess: () => void;
}

const FileUploadModal: React.FC<FileUploadModalProps> = ({ projectId, onClose, onSuccess }) => {
  const [file, setFile] = useState<File | null>(null);
  const [shareType, setShareType] = useState<'department' | 'user' | 'both'>('department');
  const [selectedDepartments, setSelectedDepartments] = useState<string[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Fetch departments and users
    fetchDepartments();
    fetchUsers();
  }, []);

  const fetchDepartments = async () => {
    const response = await fetch('/api/departments', {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    });
    const data = await response.json();
    setDepartments(data);
  };

  const fetchUsers = async () => {
    const response = await fetch('/api/users', {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    });
    const data = await response.json();
    setUsers(data);
  };

  const handleUpload = async () => {
    if (!file) return;

    setLoading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('shareType', shareType);

    if (shareType === 'department' || shareType === 'both') {
      formData.append('sharedWithDepartments', JSON.stringify(selectedDepartments));
    }

    if (shareType === 'user' || shareType === 'both') {
      formData.append('sharedWithUsers', JSON.stringify(selectedUsers));
    }

    try {
      const response = await fetch(`/api/projects/${projectId}/files`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
        body: formData
      });

      if (response.ok) {
        onSuccess();
        onClose();
      }
    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal">
      <div className="modal-content">
        <h2>Upload & Share File</h2>

        {/* File Input */}
        <div className="form-group">
          <label>Select File</label>
          <input
            type="file"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
          />
        </div>

        {/* Share Type Selection */}
        <div className="form-group">
          <label>Share With</label>
          <select value={shareType} onChange={(e) => setShareType(e.target.value as any)}>
            <option value="department">Entire Department(s)</option>
            <option value="user">Specific User(s)</option>
            <option value="both">Both Departments & Users</option>
          </select>
        </div>

        {/* Department Selection */}
        {(shareType === 'department' || shareType === 'both') && (
          <div className="form-group">
            <label>Select Departments</label>
            <select
              multiple
              value={selectedDepartments}
              onChange={(e) => {
                const values = Array.from(e.target.selectedOptions, option => option.value);
                setSelectedDepartments(values);
              }}
            >
              {departments.map(dept => (
                <option key={dept._id} value={dept._id}>
                  {dept.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* User Selection */}
        {(shareType === 'user' || shareType === 'both') && (
          <div className="form-group">
            <label>Select Users</label>
            <select
              multiple
              value={selectedUsers}
              onChange={(e) => {
                const values = Array.from(e.target.selectedOptions, option => option.value);
                setSelectedUsers(values);
              }}
            >
              {users.map(user => (
                <option key={user._id} value={user._id}>
                  {user.name} ({user.email})
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Actions */}
        <div className="modal-actions">
          <button onClick={onClose} disabled={loading}>Cancel</button>
          <button onClick={handleUpload} disabled={!file || loading}>
            {loading ? 'Uploading...' : 'Upload & Share'}
          </button>
        </div>
      </div>
    </div>
  );
};

interface FileListProps {
  projectId: string;
}

const ProjectFileList: React.FC<FileListProps> = ({ projectId }) => {
  const [files, setFiles] = useState<ProjectFile[]>([]);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState<ProjectFile | null>(null);
  const [showShareModal, setShowShareModal] = useState(false);

  useEffect(() => {
    fetchFiles();
  }, [projectId]);

  const fetchFiles = async () => {
    const response = await fetch(`/api/projects/${projectId}/files`, {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    });
    const data = await response.json();
    setFiles(data);
  };

  const downloadFile = async (fileId: string, fileName: string) => {
    const response = await fetch(`/api/projects/${projectId}/files/${fileId}/download`, {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    });
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    a.click();
  };

  const deleteFile = async (fileId: string) => {
    if (!confirm('Are you sure you want to delete this file?')) return;

    await fetch(`/api/projects/${projectId}/files/${fileId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    });
    fetchFiles();
  };

  return (
    <div className="project-files">
      <div className="header">
        <h2>Project Files</h2>
        <button onClick={() => setShowUploadModal(true)}>Upload File</button>
      </div>

      <table>
        <thead>
          <tr>
            <th>File Name</th>
            <th>Size</th>
            <th>Uploaded By</th>
            <th>Shared With</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {files.map(file => (
            <tr key={file._id}>
              <td>{file.originalName}</td>
              <td>{(file.size / 1024).toFixed(2)} KB</td>
              <td>{file.uploadedBy.name}</td>
              <td>
                {file.shareType === 'department' && (
                  <span>Departments: {file.sharedWithDepartments.map(d => d.name).join(', ')}</span>
                )}
                {file.shareType === 'user' && (
                  <span>Users: {file.sharedWithUsers.map(u => u.name).join(', ')}</span>
                )}
                {file.shareType === 'both' && (
                  <div>
                    <div>Depts: {file.sharedWithDepartments.map(d => d.name).join(', ')}</div>
                    <div>Users: {file.sharedWithUsers.map(u => u.name).join(', ')}</div>
                  </div>
                )}
              </td>
              <td>
                <button onClick={() => downloadFile(file._id, file.originalName)}>
                  Download
                </button>
                <button onClick={() => {
                  setSelectedFile(file);
                  setShowShareModal(true);
                }}>
                  Update Sharing
                </button>
                <button onClick={() => deleteFile(file._id)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {showUploadModal && (
        <FileUploadModal
          projectId={projectId}
          onClose={() => setShowUploadModal(false)}
          onSuccess={fetchFiles}
        />
      )}

      {showShareModal && selectedFile && (
        <UpdateSharingModal
          projectId={projectId}
          file={selectedFile}
          onClose={() => {
            setShowShareModal(false);
            setSelectedFile(null);
          }}
          onSuccess={fetchFiles}
        />
      )}
    </div>
  );
};

interface UpdateSharingModalProps {
  projectId: string;
  file: ProjectFile;
  onClose: () => void;
  onSuccess: () => void;
}

const UpdateSharingModal: React.FC<UpdateSharingModalProps> = ({ projectId, file, onClose, onSuccess }) => {
  const [shareType, setShareType] = useState(file.shareType);
  const [selectedDepartments, setSelectedDepartments] = useState<string[]>(
    file.sharedWithDepartments.map(d => d._id)
  );
  const [selectedUsers, setSelectedUsers] = useState<string[]>(
    file.sharedWithUsers.map(u => u._id)
  );
  const [departments, setDepartments] = useState<Department[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchDepartments();
    fetchUsers();
  }, []);

  const fetchDepartments = async () => {
    const response = await fetch('/api/departments', {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    });
    const data = await response.json();
    setDepartments(data);
  };

  const fetchUsers = async () => {
    const response = await fetch('/api/users', {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    });
    const data = await response.json();
    setUsers(data);
  };

  const handleUpdate = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/projects/${projectId}/files/${file._id}/share`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          shareType,
          departmentIds: shareType === 'department' || shareType === 'both' ? selectedDepartments : [],
          userIds: shareType === 'user' || shareType === 'both' ? selectedUsers : []
        })
      });

      if (response.ok) {
        onSuccess();
        onClose();
      }
    } catch (error) {
      console.error('Update failed:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal">
      <div className="modal-content">
        <h2>Update Sharing Settings</h2>
        <p>File: {file.originalName}</p>

        <div className="form-group">
          <label>Share With</label>
          <select value={shareType} onChange={(e) => setShareType(e.target.value as any)}>
            <option value="department">Entire Department(s)</option>
            <option value="user">Specific User(s)</option>
            <option value="both">Both Departments & Users</option>
          </select>
        </div>

        {(shareType === 'department' || shareType === 'both') && (
          <div className="form-group">
            <label>Select Departments</label>
            <select
              multiple
              value={selectedDepartments}
              onChange={(e) => {
                const values = Array.from(e.target.selectedOptions, option => option.value);
                setSelectedDepartments(values);
              }}
            >
              {departments.map(dept => (
                <option key={dept._id} value={dept._id}>
                  {dept.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {(shareType === 'user' || shareType === 'both') && (
          <div className="form-group">
            <label>Select Users</label>
            <select
              multiple
              value={selectedUsers}
              onChange={(e) => {
                const values = Array.from(e.target.selectedOptions, option => option.value);
                setSelectedUsers(values);
              }}
            >
              {users.map(user => (
                <option key={user._id} value={user._id}>
                  {user.name} ({user.email})
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="modal-actions">
          <button onClick={onClose} disabled={loading}>Cancel</button>
          <button onClick={handleUpdate} disabled={loading}>
            {loading ? 'Updating...' : 'Update Sharing'}
          </button>
        </div>
      </div>
    </div>
  );
};

// Component to show files shared with current user
const SharedFilesView: React.FC = () => {
  const [sharedFiles, setSharedFiles] = useState<ProjectFile[]>([]);

  useEffect(() => {
    fetchSharedFiles();
  }, []);

  const fetchSharedFiles = async () => {
    const response = await fetch('/api/projects/shared/files', {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    });
    const data = await response.json();
    setSharedFiles(data);
  };

  const downloadFile = async (projectId: string, fileId: string, fileName: string) => {
    const response = await fetch(`/api/projects/${projectId}/files/${fileId}/download`, {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    });
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    a.click();
  };

  return (
    <div className="shared-files">
      <h2>Files Shared With Me</h2>
      <table>
        <thead>
          <tr>
            <th>File Name</th>
            <th>Project</th>
            <th>Uploaded By</th>
            <th>Shared Via</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {sharedFiles.map(file => (
            <tr key={file._id}>
              <td>{file.originalName}</td>
              <td>{(file as any).project.name}</td>
              <td>{file.uploadedBy.name}</td>
              <td>
                {file.shareType === 'department' && 'Department'}
                {file.shareType === 'user' && 'Direct Share'}
                {file.shareType === 'both' && 'Department & Direct'}
              </td>
              <td>
                <button onClick={() => downloadFile(
                  (file as any).project._id,
                  file._id,
                  file.originalName
                )}>
                  Download
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export { ProjectFileList, SharedFilesView, FileUploadModal, UpdateSharingModal };
