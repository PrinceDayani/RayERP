"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Upload, Download, Share2, Trash2, File, FileText, Image, 
  Video, Music, Archive, Eye, Users, Lock, Globe, Search,
  Filter, Calendar, User, FolderOpen
} from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { Progress } from "@/components/ui/progress";

interface ProjectFile {
  _id: string;
  filename: string;
  originalName: string;
  mimetype: string;
  size: number;
  url: string;
  uploadedBy: any;
  uploadedAt: string;
  sharedWith: string[];
  permissions: {
    canView: boolean;
    canDownload: boolean;
    canShare: boolean;
  };
  tags: string[];
  description?: string;
}

interface EnhancedFileSharingProps {
  projectId: string;
  files: ProjectFile[];
  onFilesUpdate: (files: ProjectFile[]) => void;
  canUpload?: boolean;
  canManage?: boolean;
}

const EnhancedFileSharing: React.FC<EnhancedFileSharingProps> = ({
  projectId,
  files,
  onFilesUpdate,
  canUpload = true,
  canManage = true
}) => {
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<ProjectFile | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [sortBy, setSortBy] = useState("date");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const [uploadData, setUploadData] = useState({
    file: null as File | null,
    description: "",
    tags: [] as string[],
    permissions: {
      canView: true,
      canDownload: true,
      canShare: false
    }
  });

  const [shareData, setShareData] = useState({
    users: [] as string[],
    departments: [] as string[],
    permissions: {
      canView: true,
      canDownload: true,
      canShare: false
    }
  });

  const getFileIcon = (mimetype: string) => {
    if (mimetype.startsWith('image/')) return Image;
    if (mimetype.startsWith('video/')) return Video;
    if (mimetype.startsWith('audio/')) return Music;
    if (mimetype.includes('pdf') || mimetype.includes('document')) return FileText;
    if (mimetype.includes('zip') || mimetype.includes('rar')) return Archive;
    return File;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleFileUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadData.file) {
      toast({
        title: "Error",
        description: "Please select a file to upload",
        variant: "destructive"
      });
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      const formData = new FormData();
      formData.append('file', uploadData.file);
      formData.append('description', uploadData.description);
      formData.append('tags', JSON.stringify(uploadData.tags));
      formData.append('permissions', JSON.stringify(uploadData.permissions));

      const token = localStorage.getItem('auth-token');
      const xhr = new XMLHttpRequest();

      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const progress = (e.loaded / e.total) * 100;
          setUploadProgress(progress);
        }
      });

      xhr.addEventListener('load', () => {
        if (xhr.status === 200) {
          const result = JSON.parse(xhr.responseText);
          onFilesUpdate([...files, result.file]);
          toast({
            title: "Success",
            description: "File uploaded successfully"
          });
          setIsUploadDialogOpen(false);
          setUploadData({
            file: null,
            description: "",
            tags: [],
            permissions: { canView: true, canDownload: true, canShare: false }
          });
        } else {
          throw new Error('Upload failed');
        }
        setUploading(false);
        setUploadProgress(0);
      });

      xhr.addEventListener('error', () => {
        toast({
          title: "Error",
          description: "Failed to upload file",
          variant: "destructive"
        });
        setUploading(false);
        setUploadProgress(0);
      });

      xhr.open('POST', `${process.env.NEXT_PUBLIC_API_URL}/api/projects/${projectId}/files`);
      xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      xhr.send(formData);
    } catch (error) {
      console.error('Error uploading file:', error);
      toast({
        title: "Error",
        description: "Failed to upload file",
        variant: "destructive"
      });
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleFileShare = async () => {
    if (!selectedFile) return;

    try {
      const token = localStorage.getItem('auth-token');
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/projects/${projectId}/files/${selectedFile._id}/share`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(shareData)
        }
      );

      if (!response.ok) {
        throw new Error('Failed to share file');
      }

      const result = await response.json();
      const updatedFiles = files.map(file => 
        file._id === selectedFile._id ? result.file : file
      );
      onFilesUpdate(updatedFiles);

      toast({
        title: "Success",
        description: "File shared successfully"
      });
      setIsShareDialogOpen(false);
      setSelectedFile(null);
    } catch (error) {
      console.error('Error sharing file:', error);
      toast({
        title: "Error",
        description: "Failed to share file",
        variant: "destructive"
      });
    }
  };

  const handleFileDownload = async (file: ProjectFile) => {
    try {
      const token = localStorage.getItem('auth-token');
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/projects/${projectId}/files/${file._id}/download`,
        {
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );

      if (!response.ok) {
        throw new Error('Failed to download file');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.originalName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading file:', error);
      toast({
        title: "Error",
        description: "Failed to download file",
        variant: "destructive"
      });
    }
  };

  const handleFileDelete = async (fileId: string) => {
    if (!confirm('Are you sure you want to delete this file?')) return;

    try {
      const token = localStorage.getItem('auth-token');
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/projects/${projectId}/files/${fileId}`,
        {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );

      if (!response.ok) {
        throw new Error('Failed to delete file');
      }

      const updatedFiles = files.filter(file => file._id !== fileId);
      onFilesUpdate(updatedFiles);

      toast({
        title: "Success",
        description: "File deleted successfully"
      });
    } catch (error) {
      console.error('Error deleting file:', error);
      toast({
        title: "Error",
        description: "Failed to delete file",
        variant: "destructive"
      });
    }
  };

  const filteredFiles = files
    .filter(file => {
      const matchesSearch = file.originalName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           file.description?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = filterType === 'all' || file.mimetype.startsWith(filterType);
      return matchesSearch && matchesType;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.originalName.localeCompare(b.originalName);
        case 'size':
          return b.size - a.size;
        case 'type':
          return a.mimetype.localeCompare(b.mimetype);
        case 'date':
        default:
          return new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime();
      }
    });

  return (
    <div className="space-y-4">
      {/* Header with controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex items-center gap-4 flex-1">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search files..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="image">Images</SelectItem>
              <SelectItem value="video">Videos</SelectItem>
              <SelectItem value="audio">Audio</SelectItem>
              <SelectItem value="application">Documents</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="date">Date</SelectItem>
              <SelectItem value="name">Name</SelectItem>
              <SelectItem value="size">Size</SelectItem>
              <SelectItem value="type">Type</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
          >
            {viewMode === 'grid' ? 'List' : 'Grid'}
          </Button>
          
          {canUpload && (
            <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload File
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Upload File</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleFileUpload} className="space-y-4">
                  <div className="space-y-2">
                    <Label>File</Label>
                    <Input
                      type="file"
                      onChange={(e) => setUploadData(prev => ({ 
                        ...prev, 
                        file: e.target.files?.[0] || null 
                      }))}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Description (Optional)</Label>
                    <Input
                      value={uploadData.description}
                      onChange={(e) => setUploadData(prev => ({ 
                        ...prev, 
                        description: e.target.value 
                      }))}
                      placeholder="File description"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Permissions</Label>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="canDownload"
                          checked={uploadData.permissions.canDownload}
                          onCheckedChange={(checked) => setUploadData(prev => ({
                            ...prev,
                            permissions: { ...prev.permissions, canDownload: !!checked }
                          }))}
                        />
                        <Label htmlFor="canDownload" className="text-sm">Allow download</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="canShare"
                          checked={uploadData.permissions.canShare}
                          onCheckedChange={(checked) => setUploadData(prev => ({
                            ...prev,
                            permissions: { ...prev.permissions, canShare: !!checked }
                          }))}
                        />
                        <Label htmlFor="canShare" className="text-sm">Allow sharing</Label>
                      </div>
                    </div>
                  </div>
                  
                  {uploading && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Uploading...</span>
                        <span>{Math.round(uploadProgress)}%</span>
                      </div>
                      <Progress value={uploadProgress} />
                    </div>
                  )}
                  
                  <div className="flex gap-2">
                    <Button type="submit" disabled={uploading}>
                      {uploading ? 'Uploading...' : 'Upload'}
                    </Button>
                    <Button type="button" variant="outline" onClick={() => setIsUploadDialogOpen(false)}>
                      Cancel
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      {/* Files display */}
      {filteredFiles.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <FolderOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No Files</h3>
            <p className="text-muted-foreground mb-4">
              {searchTerm || filterType !== 'all' 
                ? 'No files match your search criteria.'
                : 'No files have been uploaded to this project yet.'
              }
            </p>
            {canUpload && !searchTerm && filterType === 'all' && (
              <Button onClick={() => setIsUploadDialogOpen(true)}>
                <Upload className="h-4 w-4 mr-2" />
                Upload First File
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className={viewMode === 'grid' 
          ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
          : "space-y-2"
        }>
          {filteredFiles.map((file) => {
            const FileIcon = getFileIcon(file.mimetype);
            
            if (viewMode === 'list') {
              return (
                <Card key={file._id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <FileIcon className="h-8 w-8 text-muted-foreground flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium truncate">{file.originalName}</h4>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span>{formatFileSize(file.size)}</span>
                          <span>{new Date(file.uploadedAt).toLocaleDateString()}</span>
                          {file.sharedWith.length > 0 && (
                            <Badge variant="secondary" className="text-xs">
                              <Users className="h-3 w-3 mr-1" />
                              {file.sharedWith.length}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-1">
                        {file.permissions.canDownload && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleFileDownload(file)}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        )}
                        {canManage && (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedFile(file);
                                setIsShareDialogOpen(true);
                              }}
                            >
                              <Share2 className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleFileDelete(file._id)}
                              className="text-red-500 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            }

            return (
              <Card key={file._id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <FileIcon className="h-8 w-8 text-muted-foreground" />
                    {file.sharedWith.length > 0 && (
                      <Badge variant="secondary" className="text-xs">
                        <Users className="h-3 w-3 mr-1" />
                        {file.sharedWith.length}
                      </Badge>
                    )}
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-sm line-clamp-2 mb-1">
                      {file.originalName}
                    </h4>
                    {file.description && (
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {file.description}
                      </p>
                    )}
                  </div>
                  
                  <div className="text-xs text-muted-foreground space-y-1">
                    <div>{formatFileSize(file.size)}</div>
                    <div>{new Date(file.uploadedAt).toLocaleDateString()}</div>
                  </div>
                  
                  <div className="flex gap-1 pt-2 border-t">
                    {file.permissions.canDownload && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleFileDownload(file)}
                        className="flex-1"
                      >
                        <Download className="h-3 w-3" />
                      </Button>
                    )}
                    {canManage && (
                      <>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedFile(file);
                            setIsShareDialogOpen(true);
                          }}
                          className="flex-1"
                        >
                          <Share2 className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleFileDelete(file._id)}
                          className="flex-1 text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Share Dialog */}
      <Dialog open={isShareDialogOpen} onOpenChange={setIsShareDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Share File: {selectedFile?.originalName}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Share with Users</Label>
              <Input placeholder="Enter user emails (comma separated)" />
            </div>
            
            <div className="space-y-2">
              <Label>Permissions</Label>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="shareCanDownload"
                    checked={shareData.permissions.canDownload}
                    onCheckedChange={(checked) => setShareData(prev => ({
                      ...prev,
                      permissions: { ...prev.permissions, canDownload: !!checked }
                    }))}
                  />
                  <Label htmlFor="shareCanDownload" className="text-sm">Allow download</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="shareCanShare"
                    checked={shareData.permissions.canShare}
                    onCheckedChange={(checked) => setShareData(prev => ({
                      ...prev,
                      permissions: { ...prev.permissions, canShare: !!checked }
                    }))}
                  />
                  <Label htmlFor="shareCanShare" className="text-sm">Allow re-sharing</Label>
                </div>
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button onClick={handleFileShare}>Share File</Button>
              <Button variant="outline" onClick={() => setIsShareDialogOpen(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EnhancedFileSharing;