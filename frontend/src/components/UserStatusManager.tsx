'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, XCircle, Clock, User, AlertTriangle } from 'lucide-react';
import usersAPI, { User as UserType, StatusChangeRequest } from '@/lib/api/usersAPI';

interface UserStatusManagerProps {
  user: UserType;
  onStatusChange?: (userId: string, newStatus: string) => void;
}

const STATUS_COLORS = {
  active: 'bg-green-100 text-green-800',
  inactive: 'bg-yellow-100 text-yellow-800',
  disabled: 'bg-red-100 text-red-800',
  pending_approval: 'bg-blue-100 text-blue-800'
};

const STATUS_LABELS = {
  active: 'Active',
  inactive: 'Inactive',
  disabled: 'Disabled',
  pending_approval: 'Pending Approval'
};

export default function UserStatusManager({ user, onStatusChange }: UserStatusManagerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState('');
  const [reason, setReason] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleStatusChangeRequest = async () => {
    if (!selectedStatus || selectedStatus === user.status) return;

    setIsLoading(true);
    setError(null);

    try {
      await usersAPI.requestStatusChange(user._id, selectedStatus, reason);
      setSuccess('Status change request submitted successfully');
      setIsOpen(false);
      setSelectedStatus('');
      setReason('');
      onStatusChange?.(user._id, 'pending_approval');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to submit status change request');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2">
            <User className="h-4 w-4" />
            Change Status
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Request Status Change</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Current Status</label>
              <Badge className={`ml-2 ${STATUS_COLORS[user.status as keyof typeof STATUS_COLORS]}`}>
                {STATUS_LABELS[user.status as keyof typeof STATUS_LABELS]}
              </Badge>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">New Status</label>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Select new status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="disabled">Disabled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Reason (Optional)</label>
              <Textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Provide a reason for this status change..."
                rows={3}
              />
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setIsOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleStatusChangeRequest}
                disabled={!selectedStatus || selectedStatus === user.status || isLoading}
              >
                {isLoading ? 'Submitting...' : 'Submit Request'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {success && (
        <Alert className="mt-4">
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}
    </>
  );
}

// Status Approval Manager Component
interface StatusApprovalManagerProps {
  onRefresh?: () => void;
}

export function StatusApprovalManager({ onRefresh }: StatusApprovalManagerProps) {
  const [requests, setRequests] = useState<StatusChangeRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPendingRequests();
  }, []);

  const fetchPendingRequests = async () => {
    try {
      setIsLoading(true);
      const data = await usersAPI.getPendingStatusRequests();
      setRequests(data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch pending requests');
    } finally {
      setIsLoading(false);
    }
  };

  const handleApproval = async (userId: string, approve: boolean) => {
    try {
      await usersAPI.approveStatusChange(userId, approve);
      await fetchPendingRequests();
      onRefresh?.();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to process approval');
    }
  };

  if (isLoading) {
    return <div className="text-center py-4">Loading pending requests...</div>;
  }

  if (requests.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-muted-foreground">
            No pending status change requests
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Pending Status Change Requests</h3>
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      {requests.map((request) => (
        <Card key={request._id}>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <User className="h-4 w-4" />
              {request.name}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-4 text-sm">
              <span>Current: <Badge className={STATUS_COLORS[request.status as keyof typeof STATUS_COLORS]}>{STATUS_LABELS[request.status as keyof typeof STATUS_LABELS]}</Badge></span>
              <span>→</span>
              <span>Requested: <Badge className={STATUS_COLORS[request.statusChangeRequest.requestedStatus as keyof typeof STATUS_COLORS]}>{STATUS_LABELS[request.statusChangeRequest.requestedStatus as keyof typeof STATUS_LABELS]}</Badge></span>
            </div>
            
            <div className="text-sm text-muted-foreground">
              <div>Requested by: {request.statusChangeRequest.requestedBy.name}</div>
              <div>Date: {new Date(request.statusChangeRequest.requestedAt).toLocaleDateString()}</div>
              {request.statusChangeRequest.reason && (
                <div>Reason: {request.statusChangeRequest.reason}</div>
              )}
            </div>

            <div className="flex gap-2">
              <Button 
                size="sm" 
                onClick={() => handleApproval(request._id, true)}
                className="gap-1"
              >
                <CheckCircle className="h-3 w-3" />
                Approve
              </Button>
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => handleApproval(request._id, false)}
                className="gap-1"
              >
                <XCircle className="h-3 w-3" />
                Reject
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}