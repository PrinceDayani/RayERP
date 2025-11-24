'use client';

import { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { 
  Upload, 
  FileText, 
  AlertTriangle, 
  CheckCircle, 
  Database,
  HardDrive,
  Shield,
  RefreshCw,
  Download,
  Trash2
} from 'lucide-react';

interface RestoreFile {
  name: string;
  size: number;
  type: string;
  lastModified: number;
}

interface RestoreProgress {
  stage: string;
  progress: number;
  message: string;
}

export default function BackupRestoreManager() {
  const [selectedFile, setSelectedFile] = useState<RestoreFile | null>(null);
  const [isRestoring, setIsRestoring] = useState(false);
  const [restoreProgress, setRestoreProgress] = useState<RestoreProgress | null>(null);
  const [restoreLog, setRestoreLog] = useState<string[]>([]);
  const [previewData, setPreviewData] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type !== 'application/zip' && !file.name.endsWith('.zip')) {
        toast({
          title: "Invalid File",
          description: "Please select a valid backup ZIP file",
          variant: "destructive"
        });
        return;
      }

      setSelectedFile({
        name: file.name,
        size: file.size,
        type: file.type,
        lastModified: file.lastModified
      });

      // Preview backup contents (placeholder)
      setPreviewData({
        backupDate: new Date(file.lastModified).toISOString(),
        estimatedRecords: Math.floor(file.size / 1000), // Rough estimate
        modules: ['employees', 'projects', 'finance', 'contacts'] // Placeholder
      });
    }
  };

  const handleRestore = async () => {
    if (!selectedFile || !fileInputRef.current?.files?.[0]) {
      toast({
        title: "No File Selected",
        description: "Please select a backup file to restore",
        variant: "destructive"
      });
      return;
    }

    const confirmed = confirm(
      "⚠️ WARNING: This will replace all existing data with the backup data. This action cannot be undone. Are you sure you want to continue?"
    );

    if (!confirmed) return;

    setIsRestoring(true);
    setRestoreLog([]);
    setRestoreProgress({ stage: 'Initializing', progress: 0, message: 'Preparing restore process...' });

    try {
      const formData = new FormData();
      formData.append('backup', fileInputRef.current.files[0]);

      // Simulate restore progress (in real implementation, this would be WebSocket updates)
      const stages = [
        { stage: 'Validating', progress: 10, message: 'Validating backup file...' },
        { stage: 'Extracting', progress: 25, message: 'Extracting backup contents...' },
        { stage: 'Preparing', progress: 40, message: 'Preparing database for restore...' },
        { stage: 'Restoring Data', progress: 60, message: 'Restoring database records...' },
        { stage: 'Restoring Files', progress: 80, message: 'Restoring uploaded files...' },
        { stage: 'Finalizing', progress: 95, message: 'Finalizing restore process...' },
        { stage: 'Complete', progress: 100, message: 'Restore completed successfully!' }
      ];

      for (const stage of stages) {
        await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate processing time
        setRestoreProgress(stage);
        setRestoreLog(prev => [...prev, `${new Date().toLocaleTimeString()}: ${stage.message}`]);
      }

      // In real implementation, make API call here
      const response = await fetch('/api/backup/restore', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth-token')}`
        },
        body: formData
      });

      if (response.ok) {
        toast({
          title: "Restore Completed",
          description: "System has been successfully restored from backup"
        });
      } else {
        throw new Error('Restore failed');
      }

    } catch (error) {
      console.error('Restore failed:', error);
      setRestoreProgress({ stage: 'Failed', progress: 0, message: 'Restore process failed' });
      setRestoreLog(prev => [...prev, `${new Date().toLocaleTimeString()}: ERROR - Restore failed`]);
      
      toast({
        title: "Restore Failed",
        description: "Failed to restore from backup. Please check the logs.",
        variant: "destructive"
      });
    } finally {
      setIsRestoring(false);
    }
  };

  const clearSelection = () => {
    setSelectedFile(null);
    setPreviewData(null);
    setRestoreProgress(null);
    setRestoreLog([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-600 dark:text-red-400">
            <AlertTriangle className="h-5 w-5" />
            System Restore - Use with Extreme Caution
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5" />
              <div className="text-sm text-red-700 dark:text-red-300">
                <p className="font-semibold mb-2">⚠️ Critical Warning:</p>
                <ul className="space-y-1 list-disc list-inside">
                  <li>This will completely replace ALL existing system data</li>
                  <li>All current data will be permanently lost</li>
                  <li>This action cannot be undone</li>
                  <li>Ensure you have a current backup before proceeding</li>
                  <li>Only use backups from the same system version</li>
                </ul>
              </div>
            </div>
          </div>

          {!selectedFile ? (
            <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center">
              <Upload className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-semibold mb-2">Select Backup File</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Choose a ZIP backup file to restore from
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".zip"
                onChange={handleFileSelect}
                className="hidden"
              />
              <Button onClick={() => fileInputRef.current?.click()}>
                <Upload className="h-4 w-4 mr-2" />
                Choose Backup File
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              {/* File Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Selected Backup File</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <FileText className="h-8 w-8 text-blue-600" />
                      <div>
                        <p className="font-semibold">{selectedFile.name}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {formatFileSize(selectedFile.size)} • {new Date(selectedFile.lastModified).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" onClick={clearSelection}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Backup Preview */}
              {previewData && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Backup Preview</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="font-medium">Backup Date:</span>
                        <br />
                        {new Date(previewData.backupDate).toLocaleString()}
                      </div>
                      <div>
                        <span className="font-medium">Estimated Records:</span>
                        <br />
                        ~{previewData.estimatedRecords.toLocaleString()}
                      </div>
                      <div>
                        <span className="font-medium">Modules:</span>
                        <br />
                        <div className="flex flex-wrap gap-1 mt-1">
                          {previewData.modules.map((module: string) => (
                            <Badge key={module} variant="outline" className="text-xs">
                              {module}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Restore Progress */}
              {restoreProgress && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Restore Progress</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between text-sm mb-2">
                          <span>{restoreProgress.stage}</span>
                          <span>{restoreProgress.progress}%</span>
                        </div>
                        <Progress value={restoreProgress.progress} className="h-2" />
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                          {restoreProgress.message}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Restore Log */}
              {restoreLog.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Restore Log</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 max-h-64 overflow-y-auto">
                      <div className="font-mono text-sm space-y-1">
                        {restoreLog.map((log, index) => (
                          <div key={index} className="text-gray-700 dark:text-gray-300">
                            {log}
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Action Buttons */}
              <div className="flex gap-4">
                <Button
                  onClick={handleRestore}
                  disabled={isRestoring}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  {isRestoring ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Restoring...
                    </>
                  ) : (
                    <>
                      <Database className="h-4 w-4 mr-2" />
                      Start Restore Process
                    </>
                  )}
                </Button>
                <Button variant="outline" onClick={clearSelection} disabled={isRestoring}>
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Restore Guidelines */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Restore Guidelines</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 text-sm">
            <div>
              <h4 className="font-semibold mb-2">Before Restoring:</h4>
              <ul className="space-y-1 list-disc list-inside text-gray-600 dark:text-gray-400">
                <li>Create a current backup of your system</li>
                <li>Ensure the backup file is from a compatible system version</li>
                <li>Verify the backup file integrity</li>
                <li>Notify all users about the maintenance window</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-2">During Restore:</h4>
              <ul className="space-y-1 list-disc list-inside text-gray-600 dark:text-gray-400">
                <li>Do not close the browser or navigate away</li>
                <li>Ensure stable internet connection</li>
                <li>Monitor the restore log for any errors</li>
                <li>The system will be unavailable during restore</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-2">After Restore:</h4>
              <ul className="space-y-1 list-disc list-inside text-gray-600 dark:text-gray-400">
                <li>Verify all data has been restored correctly</li>
                <li>Test critical system functions</li>
                <li>Notify users that the system is available</li>
                <li>Update any changed configurations if needed</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
