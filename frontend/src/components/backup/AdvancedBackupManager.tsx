'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Database, 
  FileText, 
  HardDrive, 
  Cloud, 
  Download, 
  Calendar, 
  Shield, 
  Clock,
  Settings,
  Upload,
  RefreshCw
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import BackupScheduleManager from './BackupScheduleManager';
import BackupLogsManager from './BackupLogsManager';
import BackupRestoreManager from './BackupRestoreManager';

interface BackupOptions {
  backupType: 'database' | 'files' | 'full' | 'incremental';
  modules: string[];
  storageLocation: 'local' | 'cloud' | 'external';
  encrypt: boolean;
}

export default function AdvancedBackupManager() {
  const [options, setOptions] = useState<BackupOptions>({
    backupType: 'full',
    modules: [],
    storageLocation: 'external',
    encrypt: false
  });
  const [isCreating, setIsCreating] = useState(false);

  const modules = [
    { id: 'hr', name: 'HR & Employees', icon: '👥' },
    { id: 'projects', name: 'Projects & Tasks', icon: '📋' },
    { id: 'finance', name: 'Finance & Accounting', icon: '💰' },
    { id: 'contacts', name: 'Contacts & CRM', icon: '📞' },
    { id: 'users', name: 'Users & Roles', icon: '🔐' },
    { id: 'system', name: 'System Settings', icon: '⚙️' }
  ];

  const handleCreateBackup = async () => {
    setIsCreating(true);
    try {
      const params = new URLSearchParams({
        backupType: options.backupType,
        modules: options.modules.join(','),
        encrypt: options.encrypt.toString(),
        storageLocation: options.storageLocation
      });

      const response = await fetch(`/api/backup/download?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth-token')}`
        }
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${options.backupType}-backup-${Date.now()}.zip`;
        a.click();
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Backup failed:', error);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Card className="bg-white dark:bg-gray-800">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
          <Database className="h-5 w-5" />
          Advanced Backup Manager
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="manual" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="manual">Manual Backup</TabsTrigger>
            <TabsTrigger value="scheduled">Scheduled</TabsTrigger>
            <TabsTrigger value="logs">Backup Logs</TabsTrigger>
            <TabsTrigger value="restore">Restore</TabsTrigger>
          </TabsList>

          <TabsContent value="manual" className="space-y-6">
            {/* Backup Type Selection */}
            <div className="space-y-3">
              <h3 className="font-medium text-gray-900 dark:text-white">Backup Type</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { id: 'database', name: 'Database Only', icon: Database },
                  { id: 'files', name: 'Files Only', icon: FileText },
                  { id: 'full', name: 'Full System', icon: HardDrive },
                  { id: 'incremental', name: 'Incremental', icon: Clock }
                ].map(({ id, name, icon: Icon }) => (
                  <Button
                    key={id}
                    variant={options.backupType === id ? 'default' : 'outline'}
                    className="h-auto p-4 flex flex-col gap-2"
                    onClick={() => setOptions({ ...options, backupType: id as any })}
                  >
                    <Icon className="h-5 w-5" />
                    <span className="text-xs">{name}</span>
                  </Button>
                ))}
              </div>
            </div>

            {/* Module Selection */}
            <div className="space-y-3">
              <h3 className="font-medium text-gray-900 dark:text-white">Select Modules</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {modules.map((module) => (
                  <Button
                    key={module.id}
                    variant={options.modules.includes(module.id) ? 'default' : 'outline'}
                    className="h-auto p-3 flex items-center gap-2 justify-start"
                    onClick={() => {
                      const newModules = options.modules.includes(module.id)
                        ? options.modules.filter(m => m !== module.id)
                        : [...options.modules, module.id];
                      setOptions({ ...options, modules: newModules });
                    }}
                  >
                    <span>{module.icon}</span>
                    <span className="text-xs">{module.name}</span>
                  </Button>
                ))}
              </div>
            </div>

            {/* Storage Options */}
            <div className="space-y-3">
              <h3 className="font-medium text-gray-900 dark:text-white">Storage Location</h3>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { id: 'local', name: 'Local Server', icon: HardDrive },
                  { id: 'cloud', name: 'Cloud Storage', icon: Cloud },
                  { id: 'external', name: 'Download', icon: Download }
                ].map(({ id, name, icon: Icon }) => (
                  <Button
                    key={id}
                    variant={options.storageLocation === id ? 'default' : 'outline'}
                    className="h-auto p-4 flex flex-col gap-2"
                    onClick={() => setOptions({ ...options, storageLocation: id as any })}
                  >
                    <Icon className="h-5 w-5" />
                    <span className="text-xs">{name}</span>
                  </Button>
                ))}
              </div>
            </div>

            {/* Security Options */}
            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                <span className="font-medium text-gray-900 dark:text-white">Encrypt Backup</span>
              </div>
              <Button
                variant={options.encrypt ? 'default' : 'outline'}
                size="sm"
                onClick={() => setOptions({ ...options, encrypt: !options.encrypt })}
              >
                {options.encrypt ? 'Enabled' : 'Disabled'}
              </Button>
            </div>

            {/* Create Backup Button */}
            <Button
              onClick={handleCreateBackup}
              disabled={isCreating}
              className="w-full h-12"
            >
              <Download className="h-5 w-5 mr-2" />
              {isCreating ? 'Creating Backup...' : 'Create Backup'}
            </Button>
          </TabsContent>

          <TabsContent value="scheduled">
            <BackupScheduleManager />
          </TabsContent>

          <TabsContent value="logs">
            <BackupLogsManager />
          </TabsContent>

          <TabsContent value="restore">
            <BackupRestoreManager />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}