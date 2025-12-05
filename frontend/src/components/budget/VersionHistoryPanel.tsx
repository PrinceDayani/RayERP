'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { History, GitBranch, RotateCcw, CheckCircle2 } from 'lucide-react';
import { budgetRevisionAPI, type BudgetVersion } from '@/lib/api/budgetRevisionAPI';
import { useToast } from '@/hooks/use-toast';

interface VersionHistoryPanelProps {
  budgetId: string;
  onRestore?: () => void;
}

export function VersionHistoryPanel({ budgetId, onRestore }: VersionHistoryPanelProps) {
  const [versions, setVersions] = useState<BudgetVersion[]>([]);
  const [loading, setLoading] = useState(true);
  const [showRestoreDialog, setShowRestoreDialog] = useState(false);
  const [selectedVersion, setSelectedVersion] = useState<BudgetVersion | null>(null);
  const [restoreReason, setRestoreReason] = useState('');
  const [restoring, setRestoring] = useState(false);
  const { toast } = useToast();

  const fetchVersions = async () => {
    try {
      setLoading(true);
      const response = await budgetRevisionAPI.getVersions(budgetId);
      setVersions(response.versions || []);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to fetch versions',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVersions();
  }, [budgetId]);

  const handleRestore = async () => {
    if (!selectedVersion || !restoreReason.trim()) {
      toast({
        title: 'Error',
        description: 'Reason is required for restoration',
        variant: 'destructive',
      });
      return;
    }

    try {
      setRestoring(true);
      await budgetRevisionAPI.restoreVersion(budgetId, selectedVersion._id, restoreReason);
      toast({
        title: 'Success',
        description: `Restored to version ${selectedVersion.budgetVersion}`,
      });
      setShowRestoreDialog(false);
      setRestoreReason('');
      fetchVersions();
      onRestore?.();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to restore version',
        variant: 'destructive',
      });
    } finally {
      setRestoring(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <History className="h-5 w-5" />
              Version History
            </h3>
            <p className="text-sm text-muted-foreground">
              {versions.length} version{versions.length !== 1 ? 's' : ''} available
            </p>
          </div>
        </div>

        {versions.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <GitBranch className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Version History</h3>
              <p className="text-sm text-muted-foreground text-center">
                This budget has no previous versions
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {versions.map((version) => (
              <Card key={version._id} className={version.isLatestVersion ? 'border-primary' : ''}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10">
                        <span className="text-sm font-bold">v{version.budgetVersion}</span>
                      </div>
                      <div>
                        <CardTitle className="text-base">{version.budgetName}</CardTitle>
                        <CardDescription className="text-xs mt-1">
                          {new Date(version.updatedAt).toLocaleString()}
                        </CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {version.isLatestVersion && (
                        <Badge variant="default">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Current
                        </Badge>
                      )}
                      <Badge variant="outline">{version.status}</Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4 text-sm mb-3">
                    <div>
                      <p className="text-muted-foreground">Total Amount</p>
                      <p className="font-semibold">${version.totalAmount.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Allocated</p>
                      <p className="font-semibold">${version.allocatedAmount.toLocaleString()}</p>
                    </div>
                  </div>

                  {version.revisionHistory && version.revisionHistory.length > 0 && (
                    <div className="mt-3 p-3 bg-muted rounded-lg">
                      <p className="text-xs font-medium mb-1">Latest Revision</p>
                      <p className="text-xs text-muted-foreground">
                        {version.revisionHistory[version.revisionHistory.length - 1].reason}
                      </p>
                    </div>
                  )}

                  {!version.isLatestVersion && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full mt-3"
                      onClick={() => {
                        setSelectedVersion(version);
                        setShowRestoreDialog(true);
                      }}
                    >
                      <RotateCcw className="h-4 w-4 mr-2" />
                      Restore This Version
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Restore Dialog */}
      <Dialog open={showRestoreDialog} onOpenChange={setShowRestoreDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Restore Version {selectedVersion?.budgetVersion}</DialogTitle>
            <DialogDescription>
              This will create a new version based on version {selectedVersion?.budgetVersion}. 
              Please provide a reason for this restoration.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="Reason for restoration (required)"
            value={restoreReason}
            onChange={(e) => setRestoreReason(e.target.value)}
            rows={4}
            required
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRestoreDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleRestore} disabled={restoring || !restoreReason.trim()}>
              {restoring ? 'Restoring...' : 'Restore Version'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
