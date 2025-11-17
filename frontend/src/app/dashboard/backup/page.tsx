'use client';

import SystemBackup from '@/components/SystemBackup';
import BackupStatus from '@/components/BackupStatus';
import AdvancedBackupManager from '@/components/backup/AdvancedBackupManager';
import BackupScheduler from '@/components/backup/BackupScheduler';
import BackupLogs from '@/components/backup/BackupLogs';
import { Shield, Database, Download } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function BackupPage() {
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
            <Shield className="h-6 w-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">System Backup</h1>
            <p className="text-gray-600 dark:text-gray-300">Create and download complete system backup</p>
          </div>
        </div>
      </div>
      
      <Tabs defaultValue="advanced" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="advanced">Advanced Backup</TabsTrigger>
          <TabsTrigger value="simple">Simple Backup</TabsTrigger>
          <TabsTrigger value="scheduler">Scheduler</TabsTrigger>
          <TabsTrigger value="logs">Logs & History</TabsTrigger>
        </TabsList>
        
        <TabsContent value="advanced" className="mt-6">
          <AdvancedBackupManager />
        </TabsContent>
        
        <TabsContent value="simple" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <SystemBackup />
            </div>
            
            <div className="space-y-6">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Database className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  <h3 className="font-semibold text-gray-900 dark:text-white">What's Included</h3>
                </div>
                <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                  <li>• Employee records & attendance</li>
                  <li>• Projects & tasks</li>
                  <li>• Contacts & users</li>
                  <li>• Departments & roles</li>
                  <li>• Budgets & financial data</li>
                  <li>• System settings</li>
                  <li>• Uploaded files</li>
                </ul>
              </div>
              
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Download className="h-5 w-5 text-green-600 dark:text-green-400" />
                  <h3 className="font-semibold text-gray-900 dark:text-white">Backup Tips</h3>
                </div>
                <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                  <li>• Regular backups recommended</li>
                  <li>• Store backups securely</li>
                  <li>• Large systems may take time</li>
                  <li>• ZIP format for easy storage</li>
                </ul>
              </div>
              
              <BackupStatus />
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="scheduler" className="mt-6">
          <BackupScheduler />
        </TabsContent>
        
        <TabsContent value="logs" className="mt-6">
          <BackupLogs />
        </TabsContent>
      </Tabs>
    </div>
  );
}