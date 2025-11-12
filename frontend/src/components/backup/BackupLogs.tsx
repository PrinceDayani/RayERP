'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  FileText, 
  CheckCircle, 
  AlertTriangle, 
  XCircle, 
  Clock, 
  Download,
  Shield,
  Database,
  HardDrive,
  RefreshCw
} from 'lucide-react';

interface BackupLog {
  _id: string;
  backupId: string;
  type: 'manual' | 'scheduled';
  backupType: 'database' | 'files' | 'full' | 'incremental';
  status: 'pending' | 'in-progress' | 'success' | 'failed';
  size: number;
  duration: number;
  startTime: string;
  endTime: string;
  isEncrypted: boolean;
  isHealthy: boolean;
  createdBy: {
    name: string;
    email: string;
  };
  modules: string[];
  errorMessage?: string;
}

export default function BackupLogs() {
  const [logs, setLogs] = useState<BackupLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  const fetchLogs = async () => {
    try {
      const response = await fetch(`/api/backup/logs?page=${page}&limit=10`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth-token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setLogs(data.logs);
      }
    } catch (error) {
      console.error('Failed to fetch backup logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const verifyBackup = async (backupId: string) => {
    try {
      const response = await fetch(`/api/backup/verify/${backupId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth-token')}`
        }
      });
      
      if (response.ok) {
        const result = await response.json();
        alert(result.message);
        fetchLogs(); // Refresh logs
      }
    } catch (error) {
      console.error('Failed to verify backup:', error);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'in-progress':
        return <Clock className="h-4 w-4 text-blue-600 animate-spin" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      success: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
      failed: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400',
      'in-progress': 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
      pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
    };
    
    return (
      <Badge className={variants[status as keyof typeof variants] || variants.pending}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'database':
        return <Database className="h-4 w-4" />;
      case 'files':
        return <FileText className="h-4 w-4" />;
      case 'full':
        return <HardDrive className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDuration = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  };

  useEffect(() => {
    fetchLogs();
  }, [page]);

  if (loading) {
    return (
      <Card className="bg-white dark:bg-gray-800">
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white dark:bg-gray-800">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
            <FileText className="h-5 w-5" />
            Backup Logs
          </CardTitle>
          <Button onClick={fetchLogs} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {logs.map((log) => (
            <div key={log._id} className="border border-gray-200 dark:border-gray-600 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    {getStatusIcon(log.status)}
                    <div className="flex items-center gap-2">
                      {getTypeIcon(log.backupType)}
                      <span className="font-medium text-gray-900 dark:text-white">
                        {log.backupType.charAt(0).toUpperCase() + log.backupType.slice(1)} Backup
                      </span>
                    </div>
                    {getStatusBadge(log.status)}
                    {log.isEncrypted && (
                      <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400">
                        <Shield className="h-3 w-3 mr-1" />
                        Encrypted
                      </Badge>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600 dark:text-gray-400">
                    <div>
                      <span className="font-medium">Created:</span>
                      <br />
                      {new Date(log.startTime).toLocaleString()}
                    </div>
                    <div>
                      <span className="font-medium">Size:</span>
                      <br />
                      {formatSize(log.size)}
                    </div>
                    <div>
                      <span className="font-medium">Duration:</span>
                      <br />
                      {log.duration ? formatDuration(log.duration) : 'N/A'}
                    </div>
                    <div>
                      <span className="font-medium">Created by:</span>
                      <br />
                      {log.createdBy?.name || 'Unknown'}
                    </div>
                  </div>
                  
                  {log.modules && log.modules.length > 0 && (
                    <div className="mt-2">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Modules: </span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {log.modules.map((module) => (
                          <Badge key={module} variant="outline" className="text-xs">
                            {module}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {log.errorMessage && (
                    <div className="mt-2 p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded text-sm text-red-700 dark:text-red-400">
                      <AlertTriangle className="h-4 w-4 inline mr-1" />
                      {log.errorMessage}
                    </div>
                  )}
                </div>
                
                <div className="flex flex-col gap-2 ml-4">
                  {log.status === 'success' && (
                    <>
                      <Button
                        onClick={() => verifyBackup(log.backupId)}
                        variant="outline"
                        size="sm"
                        className={log.isHealthy ? 'text-green-600' : 'text-red-600'}
                      >
                        {log.isHealthy ? '✅' : '⚠️'} Verify
                      </Button>
                      <Button variant="outline" size="sm">
                        <Download className="h-3 w-3" />
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
          
          {logs.length === 0 && (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
              <p>No backup logs found</p>
              <p className="text-sm">Backup logs will appear here after creating backups</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}