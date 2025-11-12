"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Upload, X } from "lucide-react";
import { toast } from "@/components/ui/use-toast";

interface Department {
  _id: string;
  name: string;
  description: string;
}

interface FileUploadWithDepartmentsProps {
  projectId: string;
  onUploadSuccess: () => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const FileUploadWithDepartments: React.FC<FileUploadWithDepartmentsProps> = ({
  projectId,
  onUploadSuccess,
  open,
  onOpenChange,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [selectedDepartments, setSelectedDepartments] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (open) {
      fetchDepartments();
    }
  }, [open]);

  const fetchDepartments = async () => {
    try {
      const token = localStorage.getItem('auth-token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/departments`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      setDepartments(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching departments:', error);
    }
  };

  const handleDepartmentToggle = (departmentId: string) => {
    setSelectedDepartments(prev =>
      prev.includes(departmentId)
        ? prev.filter(id => id !== departmentId)
        : [...prev, departmentId]
    );
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      toast({
        title: "Error",
        description: "Please select a file to upload",
        variant: "destructive",
      });
      return;
    }

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('file', file);
      formData.append('sharedWithDepartments', JSON.stringify(selectedDepartments));

      const token = localStorage.getItem('auth-token');
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/projects/${projectId}/files`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
          body: formData,
        }
      );

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      toast({
        title: "Success",
        description: "File uploaded successfully",
      });

      setFile(null);
      setSelectedDepartments([]);
      onUploadSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error('Error uploading file:', error);
      toast({
        title: "Error",
        description: "Failed to upload file",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Upload File to Project</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="file">Select File</Label>
            <Input
              id="file"
              type="file"
              onChange={handleFileChange}
              accept=".jpg,.jpeg,.png,.gif,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip,.rar"
            />
            {file && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>{file.name}</span>
                <span>({(file.size / 1024).toFixed(2)} KB)</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setFile(null)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label>Share with Departments (Optional)</Label>
            <div className="border rounded-md p-3 max-h-60 overflow-y-auto">
              {departments.length > 0 ? (
                <div className="space-y-2">
                  {departments.map((department) => (
                    <div key={department._id} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id={`dept-${department._id}`}
                        checked={selectedDepartments.includes(department._id)}
                        onChange={() => handleDepartmentToggle(department._id)}
                        className="rounded"
                      />
                      <Label
                        htmlFor={`dept-${department._id}`}
                        className="text-sm font-normal cursor-pointer flex-1"
                      >
                        <div>
                          <div className="font-medium">{department.name}</div>
                          <div className="text-xs text-muted-foreground">{department.description}</div>
                        </div>
                      </Label>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No departments available</p>
              )}
            </div>
            {selectedDepartments.length > 0 && (
              <p className="text-sm text-muted-foreground">
                File will be shared with {selectedDepartments.length} department{selectedDepartments.length !== 1 ? 's' : ''}
              </p>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleUpload} disabled={uploading || !file}>
            <Upload className="h-4 w-4 mr-2" />
            {uploading ? "Uploading..." : "Upload File"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default FileUploadWithDepartments;
