'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Calendar, User, Monitor, MapPin, FileText, AlertCircle } from 'lucide-react';

interface AuditLog {
  _id: string;
  timestamp: string;
  userEmail: string;
  action: string;
  module: string;
  recordId?: string;
  oldValue?: string;
  newValue?: string;
  ipAddress: string;
  userAgent: string;
  status: 'Success' | 'Failed' | 'Warning';
  additionalData?: any;
}

interface Props {
  log: AuditLog | null;
  open: boolean;
  onClose: () => void;
}

export default function AuditLogDetailsModal({ log, open, onClose }: Props) {
  if (!log) return null;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Success': return 'bg-green-100 text-green-700';
      case 'Failed': return 'bg-red-100 text-red-700';
      case 'Warning': return 'bg-yellow-100 text-yellow-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Audit Log Details</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-start gap-2">
              <Calendar className="w-4 h-4 mt-1 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Timestamp</p>
                <p className="text-sm text-muted-foreground">{new Date(log.timestamp).toLocaleString()}</p>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <User className="w-4 h-4 mt-1 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">User</p>
                <p className="text-sm text-muted-foreground">{log.userEmail}</p>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <FileText className="w-4 h-4 mt-1 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Action</p>
                <Badge className="mt-1">{log.action}</Badge>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 mt-1 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Status</p>
                <Badge className={`mt-1 ${getStatusColor(log.status)}`} variant="secondary">
                  {log.status}
                </Badge>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <MapPin className="w-4 h-4 mt-1 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">IP Address</p>
                <code className="text-xs bg-muted px-2 py-1 rounded">{log.ipAddress}</code>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <Monitor className="w-4 h-4 mt-1 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Module</p>
                <p className="text-sm text-muted-foreground">{log.module}</p>
              </div>
            </div>
          </div>

          {log.recordId && (
            <>
              <Separator />
              <div>
                <p className="text-sm font-medium mb-2">Record ID</p>
                <code className="text-xs bg-muted px-2 py-1 rounded block">{log.recordId}</code>
              </div>
            </>
          )}

          {(log.oldValue || log.newValue) && (
            <>
              <Separator />
              <div className="grid grid-cols-2 gap-4">
                {log.oldValue && (
                  <div>
                    <p className="text-sm font-medium mb-2">Old Value</p>
                    <div className="bg-red-50 border border-red-200 rounded p-3 text-xs max-h-40 overflow-y-auto">
                      <pre className="whitespace-pre-wrap">{log.oldValue}</pre>
                    </div>
                  </div>
                )}
                {log.newValue && (
                  <div>
                    <p className="text-sm font-medium mb-2">New Value</p>
                    <div className="bg-green-50 border border-green-200 rounded p-3 text-xs max-h-40 overflow-y-auto">
                      <pre className="whitespace-pre-wrap">{log.newValue}</pre>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}

          <Separator />
          <div>
            <p className="text-sm font-medium mb-2">User Agent</p>
            <p className="text-xs text-muted-foreground bg-muted p-2 rounded break-all">{log.userAgent}</p>
          </div>

          {log.additionalData && (
            <>
              <Separator />
              <div>
                <p className="text-sm font-medium mb-2">Additional Data</p>
                <pre className="text-xs bg-muted p-3 rounded overflow-x-auto">
                  {JSON.stringify(log.additionalData, null, 2)}
                </pre>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
