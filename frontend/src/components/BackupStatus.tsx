'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, CheckCircle, AlertCircle, Download } from 'lucide-react';

interface BackupHistory {
  id: string;
  date: string;
  status: 'success' | 'failed' | 'in-progress';
  size?: string;
  duration?: string;
}

export default function BackupStatus() {
  const [backupHistory, setBackupHistory] = useState<BackupHistory[]>([
    {
      id: '1',
      date: '2024-01-15 14:30:00',
      status: 'success',
      size: '45.2 MB',
      duration: '2m 15s'
    },
    {
      id: '2',
      date: '2024-01-14 14:30:00',
      status: 'success',
      size: '44.8 MB',
      duration: '2m 08s'
    },
    {
      id: '3',
      date: '2024-01-13 14:30:00',
      status: 'failed',
      size: '-',
      duration: '45s'
    }
  ]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      case 'in-progress':
        return <Clock className="h-4 w-4 text-blue-600 animate-spin" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'success':
        return <Badge className="bg-green-100 text-green-800">Success</Badge>;
      case 'failed':
        return <Badge className="bg-red-100 text-red-800">Failed</Badge>;
      case 'in-progress':
        return <Badge className="bg-blue-100 text-blue-800">In Progress</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">Unknown</Badge>;
    }
  };

  return (
    <Card className="w-full bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
          <Clock className="h-5 w-5" />
          Backup History
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {backupHistory.map((backup) => (
            <div
              key={backup.id}
              className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <div className="flex items-center gap-3">
                {getStatusIcon(backup.status)}
                <div>
                  <div className="font-medium text-sm text-gray-900 dark:text-white">
                    {new Date(backup.date).toLocaleString()}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    Size: {backup.size} • Duration: {backup.duration}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {getStatusBadge(backup.status)}
                {backup.status === 'success' && (
                  <button className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded">
                    <Download className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
        
        {backupHistory.length === 0 && (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <Clock className="h-12 w-12 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
            <p>No backup history available</p>
            <p className="text-sm">Create your first backup to see history here</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
