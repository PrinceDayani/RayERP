'use client';

import { useState } from 'react';
import { Download, Database, AlertCircle, CheckCircle } from 'lucide-react';
import { backupAPI } from '@/lib/api/backupAPI';

export default function SystemBackup() {
  const [isDownloading, setIsDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleDownloadBackup = async () => {
    try {
      setIsDownloading(true);
      setError(null);
      setSuccess(null);

      console.log('Starting backup download...');
      const blob = await backupAPI.downloadSystemBackup();
      console.log('Backup blob received:', blob.size, 'bytes');
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `erp-backup-${timestamp}.zip`;
      link.download = filename;
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      setSuccess(`Backup downloaded successfully as ${filename}`);
      
    } catch (error: any) {
      console.error('Backup download error:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to download backup';
      setError(errorMessage);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <div className="flex items-center gap-3 mb-6">
        <Database className="h-6 w-6 text-blue-600 dark:text-blue-400" />
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">System Backup</h2>
      </div>

      <div className="space-y-4">
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
            <div>
              <h3 className="font-medium text-blue-900 dark:text-blue-100">Backup Information</h3>
              <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                This will create a complete backup of your ERP system including:
              </p>
              <ul className="text-sm text-blue-700 dark:text-blue-300 mt-2 space-y-1">
                <li>• All employee records and attendance data</li>
                <li>• Projects, tasks, and contact information</li>
                <li>• User accounts and system settings</li>
                <li>• Uploaded files and documents</li>
              </ul>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
              <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
            </div>
          </div>
        )}

        {success && (
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
              <p className="text-sm text-green-700 dark:text-green-300">{success}</p>
            </div>
          </div>
        )}

        <button
          onClick={handleDownloadBackup}
          disabled={isDownloading}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          <Download className={`h-5 w-5 ${isDownloading ? 'animate-spin' : ''}`} />
          {isDownloading ? 'Creating Backup...' : 'Download System Backup'}
        </button>

        <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
          Backup files are compressed in ZIP format. Large systems may take several minutes to process.
        </p>
      </div>
    </div>
  );
}