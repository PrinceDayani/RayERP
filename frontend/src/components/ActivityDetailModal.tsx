"use client";

import { useRef, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { X, User, Undo2, Shield, AlertTriangle } from 'lucide-react';
import { Activity } from '@/types/activity';
import { getActionIcon, getActionColor, getCategoryIcon, getSeverityColor } from '@/lib/utils/activityUtils';
import { canViewSensitiveData } from '@/lib/utils/activityUtils';

interface ActivityDetailModalProps {
  activity: Activity;
  onClose: () => void;
  onRevert?: (activityId: string) => void;
  userRole?: string;
  userPermissions?: string[];
}

export function ActivityDetailModal({ 
  activity, 
  onClose, 
  onRevert,
  userRole = 'user',
  userPermissions = []
}: ActivityDetailModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const ActionIcon = getActionIcon(activity.action, activity.resourceType);
  const canViewSensitive = canViewSensitiveData(userRole, userPermissions);

  // Focus trap
  useEffect(() => {
    if (!modalRef.current) return;

    const modal = modalRef.current;
    const focusableElements = modal.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement?.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement?.focus();
        }
      }
    };

    modal.addEventListener('keydown', handleTabKey as any);
    firstElement?.focus();

    return () => {
      modal.removeEventListener('keydown', handleTabKey as any);
    };
  }, []);

  return (
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="activity-modal-title"
      onClick={onClose}
    >
      <div 
        ref={modalRef}
        className="bg-card rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-border"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-card/95 backdrop-blur-sm border-b border-border p-6 z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-xl ${getActionColor(activity.action)} flex items-center justify-center text-white shadow-lg`}>
                <ActionIcon className="h-4 w-4" />
              </div>
              <div>
                <h2 id="activity-modal-title" className="text-xl font-bold">Activity Details</h2>
                <p className="text-sm text-muted-foreground">Complete information about this activity</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="rounded-full hover:bg-destructive/10 hover:text-destructive"
              aria-label="Close modal"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Summary */}
          <div className="bg-muted/50 rounded-xl p-4">
            <p className="text-base leading-relaxed">
              <span className="font-bold text-primary">{activity.userName}</span>
              {' '}
              <span className="text-muted-foreground capitalize">{activity.action}d</span>
              {' '}
              <span className="font-semibold">{activity.resource}</span>
            </p>
            <p className="text-sm text-muted-foreground mt-2">{activity.details}</p>
          </div>

          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-muted/30 rounded-lg p-4">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Timestamp</label>
              <p className="text-sm font-medium mt-1">{new Date(activity.timestamp).toLocaleString()}</p>
            </div>
            <div className="bg-muted/30 rounded-lg p-4">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Status</label>
              <div className="mt-2">
                <Badge 
                  variant={activity.status === 'error' ? 'destructive' : activity.status === 'warning' ? 'default' : 'secondary'}
                  className="text-xs"
                >
                  {activity.status}
                </Badge>
              </div>
            </div>
            <div className="bg-muted/30 rounded-lg p-4">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Resource Type</label>
              <p className="text-sm font-medium mt-1 capitalize">{activity.resourceType}</p>
            </div>
            <div className="bg-muted/30 rounded-lg p-4">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Action</label>
              <p className="text-sm font-medium mt-1 capitalize">{activity.action}</p>
            </div>
          </div>

          {/* Project Information */}
          {(activity.projectId || activity.projectName) && (
            <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
              <label className="text-xs font-semibold text-primary uppercase tracking-wide">Project</label>
              <p className="text-sm font-medium mt-1">{activity.projectId?.name || activity.projectName}</p>
            </div>
          )}

          {/* Performance & Technical Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activity.duration !== undefined && (
              <div className="bg-muted/30 rounded-lg p-4">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Duration</label>
                <p className="text-sm font-mono mt-1">{activity.duration}ms</p>
              </div>
            )}
            {activity.requestId && (
              <div className="bg-muted/30 rounded-lg p-4">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Request ID</label>
                <p className="text-sm font-mono mt-1">{activity.requestId}</p>
              </div>
            )}
            {activity.httpMethod && (
              <div className="bg-muted/30 rounded-lg p-4">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">HTTP Method</label>
                <p className="text-sm font-mono mt-1">{activity.httpMethod}</p>
              </div>
            )}
            {activity.endpoint && (
              <div className="bg-muted/30 rounded-lg p-4">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Endpoint</label>
                <p className="text-sm font-mono mt-1 break-all">{activity.endpoint}</p>
              </div>
            )}
          </div>

          {/* User Information */}
          {activity.user && (
            <div className="bg-muted/30 rounded-lg p-4">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3 block">User Details</label>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm"><span className="font-medium">Name:</span> {activity.user.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm"><span className="font-medium">Email:</span> {activity.user.email}</span>
                </div>
              </div>
            </div>
          )}

          {/* Sensitive Technical Details - Role-Based */}
          {canViewSensitive ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {activity.ipAddress && (
                <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Shield className="h-4 w-4 text-amber-600" />
                    <label className="text-xs font-semibold text-amber-700 dark:text-amber-400 uppercase tracking-wide">IP Address</label>
                  </div>
                  <p className="text-sm font-mono mt-1">{activity.ipAddress}</p>
                </div>
              )}
              {activity.sessionId && (
                <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Shield className="h-4 w-4 text-amber-600" />
                    <label className="text-xs font-semibold text-amber-700 dark:text-amber-400 uppercase tracking-wide">Session ID</label>
                  </div>
                  <p className="text-sm font-mono mt-1">{activity.sessionId}</p>
                </div>
              )}
              {activity.userAgent && (
                <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4 md:col-span-2">
                  <div className="flex items-center gap-2 mb-2">
                    <Shield className="h-4 w-4 text-amber-600" />
                    <label className="text-xs font-semibold text-amber-700 dark:text-amber-400 uppercase tracking-wide">User Agent</label>
                  </div>
                  <p className="text-sm font-mono mt-1 break-all">{activity.userAgent}</p>
                </div>
              )}
            </div>
          ) : (
            (activity.ipAddress || activity.sessionId || activity.userAgent) && (
              <div className="bg-muted/30 border border-border rounded-lg p-4">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <AlertTriangle className="h-4 w-4" />
                  <p className="text-sm">Sensitive technical details hidden. Admin access required.</p>
                </div>
              </div>
            )
          )}

          {activity.visibility && (
            <div className="bg-muted/30 rounded-lg p-4">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Visibility</label>
              <p className="text-sm mt-1 capitalize">{activity.visibility}</p>
            </div>
          )}

          {/* Error Stack */}
          {activity.errorStack && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
              <label className="text-xs font-semibold text-destructive uppercase tracking-wide mb-3 block">Error Stack Trace</label>
              <pre className="text-xs font-mono bg-background/50 p-3 rounded overflow-x-auto">{activity.errorStack}</pre>
            </div>
          )}

          {/* Changes */}
          {activity.changes && (activity.changes.before || activity.changes.after) && (
            <div className="bg-muted/30 rounded-lg p-4">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3 block">Changes</label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {activity.changes.before && (
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground mb-2">Before:</p>
                    <pre className="text-xs font-mono bg-background/50 p-3 rounded overflow-x-auto">{JSON.stringify(activity.changes.before, null, 2)}</pre>
                  </div>
                )}
                {activity.changes.after && (
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground mb-2">After:</p>
                    <pre className="text-xs font-mono bg-background/50 p-3 rounded overflow-x-auto">{JSON.stringify(activity.changes.after, null, 2)}</pre>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Metadata */}
          {activity.metadata && Object.keys(activity.metadata).length > 0 && (
            <div className="bg-muted/30 rounded-lg p-4">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3 block">Additional Information</label>
              <div className="space-y-3">
                {activity.metadata.category && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">Category:</span>
                    <Badge variant="secondary" className="text-xs flex items-center gap-1">
                      {activity.metadata.category}
                    </Badge>
                  </div>
                )}
                {activity.metadata.severity && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">Severity:</span>
                    <Badge className={`text-xs ${getSeverityColor(activity.metadata.severity)}`}>
                      {activity.metadata.severity}
                    </Badge>
                  </div>
                )}
                {Object.entries(activity.metadata)
                  .filter(([key]) => !['category', 'severity', 'timestamp'].includes(key))
                  .map(([key, value]) => (
                    <div key={key} className="flex items-start gap-2">
                      <span className="text-sm font-medium capitalize">{key.replace(/([A-Z])/g, ' $1')}:</span>
                      <span className="text-sm text-muted-foreground">{typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value)}</span>
                    </div>
                  ))
                }
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-card/95 backdrop-blur-sm border-t border-border p-6">
          <div className="flex justify-between items-center">
            {activity.reversible && !activity.reverted && onRevert && (
              <Button 
                variant="destructive" 
                onClick={() => onRevert(activity._id)}
                className="gap-2"
              >
                <Undo2 className="h-4 w-4" />
                Revert Action
              </Button>
            )}
            {activity.reverted && (
              <Badge variant="secondary" className="gap-2">
                <Undo2 className="h-3 w-3" />
                Reverted {activity.revertedAt && `on ${new Date(activity.revertedAt).toLocaleString()}`}
              </Badge>
            )}
            <Button onClick={onClose} className="bg-primary hover:bg-primary/90 ml-auto">
              Close
            </Button>
          </div>
          <p className="text-xs text-muted-foreground text-center mt-2">
            Press <kbd className="px-2 py-1 bg-muted rounded text-xs">Esc</kbd> to close
          </p>
        </div>
      </div>
    </div>
  );
}
