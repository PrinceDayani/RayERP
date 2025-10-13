//path: frontend/src/components/projects/ProjectFiles.tsx

"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  FileText, 
  Image, 
  FileSpreadsheet, 
  File, 
  Upload, 
  Download, 
  Trash2, 
  Search,
  FolderOpen,
  Plus
} from "lucide-react";
import { projectFilesAPI, ProjectFile } from "@/lib/api/projectFilesAPI";
import { toast } from "@/components/ui/use-toast";



interface ProjectFilesProps {
  projectId?: string;
}

const ProjectFiles: React.FC<ProjectFilesProps> = ({ projectId }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [files, setFiles] = useState<ProjectFile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (projectId) {
      fetchFiles();
    }
  }, [projectId]);

  const fetchFiles = async () => {
    try {
      setLoading(true);
      const data = await projectFilesAPI.getByProject(projectId!);
      setFiles(data);
    } catch (error: any) {
      console.error("Error fetching files:", error);
      if (error.response?.status === 404) {
        setFiles([]);
      } else {
        toast({
          title: "Error",
          description: "Failed to load project files",
          variant: "destructive",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) {
      return <Image className="h-8 w-8 text-green-600" />;
    } else if (mimeType.includes('pdf') || mimeType.includes('document')) {
      return <FileText className="h-8 w-8 text-blue-600" />;
    } else if (mimeType.includes('spreadsheet') || mimeType.includes('excel')) {
      return <FileSpreadsheet className="h-8 w-8 text-orange-600" />;
    }
    return <File className="h-8 w-8 text-gray-600" />;
  };

  const getCategoryColor = (mimeType: string) => {
    if (mimeType.startsWith('image/')) {
      return "bg-green-100 text-green-800";
    } else if (mimeType.includes('pdf') || mimeType.includes('document')) {
      return "bg-blue-100 text-blue-800";
    } else if (mimeType.includes('spreadsheet') || mimeType.includes('excel')) {
      return "bg-orange-100 text-orange-800";
    }
    return "bg-gray-100 text-gray-800";
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const filteredFiles = files.filter(file =>
    file.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    file.mimeType.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDownload = async (file: ProjectFile) => {
    try {
      const blob = await projectFilesAPI.download(projectId!, file._id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.originalName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to download file",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (fileId: string) => {
    if (confirm("Are you sure you want to delete this file?")) {
      try {
        await projectFilesAPI.delete(projectId!, fileId);
        toast({
          title: "Success",
          description: "File deleted successfully",
        });
        fetchFiles();
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to delete file",
          variant: "destructive",
        });
      }
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <FolderOpen className="h-5 w-5" />
            Project Files
          </CardTitle>
          <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Upload File
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Upload New File</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                  <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-lg font-medium mb-2">Drop files here or click to browse</p>
                  <p className="text-sm text-muted-foreground">
                    Supports: PDF, DOC, XLS, PNG, JPG, ZIP (Max 50MB)
                  </p>
                  <Button variant="outline" className="mt-4">
                    Choose Files
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search files..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Files Grid */}
          {loading ? (
            <div className="flex justify-center p-8">Loading files...</div>
          ) : (
            <div className="grid gap-4">
              {filteredFiles.map((file) => (
              <Card key={file.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    {/* File Icon */}
                    <div className="flex-shrink-0">
                      {getFileIcon(file.mimeType)}
                    </div>

                    {/* File Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-medium truncate">{file.originalName}</h3>
                        <Badge variant="outline" className={getCategoryColor(file.mimeType)}>
                          {file.mimeType.split('/')[1]?.toUpperCase() || 'FILE'}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>{formatFileSize(file.size)}</span>
                        <span>•</span>
                        <span>Uploaded by {file.uploadedBy.firstName} {file.uploadedBy.lastName}</span>
                        <span>•</span>
                        <span>{new Date(file.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDownload(file)}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(file._id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
              ))}
            </div>
          )}

          {filteredFiles.length === 0 && (
            <div className="text-center py-8">
              <FolderOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-lg font-medium mb-2">No files found</p>
              <p className="text-muted-foreground">
                {searchTerm ? "Try adjusting your search terms" : "Upload your first file to get started"}
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ProjectFiles;