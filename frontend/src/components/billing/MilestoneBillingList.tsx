'use client';

import { useState } from 'react';
import { useBillingsByProject, useSubmitForApproval, useApproveBilling } from '@/hooks/useMilestoneBilling';
import { IMilestoneBilling } from '@/types/billing';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  FileText, 
  CheckCircle, 
  Clock, 
  DollarSign,
  Eye,
  CheckSquare,
  XCircle,
  FileCheck
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

interface MilestoneBillingListProps {
  projectId: string;
  onSelectBilling?: (billing: IMilestoneBilling) => void;
}

export default function MilestoneBillingList({ projectId, onSelectBilling }: MilestoneBillingListProps) {
  const { data, isLoading } = useBillingsByProject(projectId);
  const submitForApproval = useSubmitForApproval();
  const approveBilling = useApproveBilling();
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-gray-500';
      case 'pending-approval': return 'bg-yellow-500';
      case 'approved': return 'bg-blue-500';
      case 'invoiced': return 'bg-purple-500';
      case 'paid': return 'bg-green-500';
      case 'cancelled': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const handleSubmit = async (id: string) => {
    await submitForApproval.mutateAsync(id);
  };

  const handleApprove = async (id: string) => {
    await approveBilling.mutateAsync(id);
  };

  if (isLoading) {
    return <div className="text-center py-8">Loading billings...</div>;
  }

  const billings = data?.billings || [];
  const filteredBillings = selectedStatus === 'all' 
    ? billings 
    : billings.filter(b => b.status === selectedStatus);

  return (
    <div className="space-y-4">
      <div className="flex gap-2 flex-wrap">
        <Button
          variant={selectedStatus === 'all' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setSelectedStatus('all')}
        >
          All
        </Button>
        {['draft', 'pending-approval', 'approved', 'invoiced', 'paid', 'cancelled'].map(status => (
          <Button
            key={status}
            variant={selectedStatus === status ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedStatus(status)}
          >
            {status.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
          </Button>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredBillings.map((billing) => (
          <Card key={billing._id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg">{billing.milestoneName}</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    {billing.invoiceNumber || 'No Invoice'}
                  </p>
                </div>
                <Badge className={getStatusColor(billing.status)}>
                  {billing.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Contract Value</p>
                  <p className="font-semibold">
                    {formatCurrency(billing.totalContractValue, billing.currency)}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Billed</p>
                  <p className="font-semibold">
                    {formatCurrency(billing.totalBilledAmount, billing.currency)}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Paid</p>
                  <p className="font-semibold text-green-600">
                    {formatCurrency(billing.totalPaidAmount, billing.currency)}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Outstanding</p>
                  <p className="font-semibold text-red-600">
                    {formatCurrency(billing.outstandingAmount, billing.currency)}
                  </p>
                </div>
              </div>

              {billing.retentionPercentage > 0 && (
                <div className="text-sm">
                  <p className="text-muted-foreground">Retention ({billing.retentionPercentage}%)</p>
                  <p className="font-medium">
                    {formatCurrency(billing.retentionAmount, billing.currency)}
                  </p>
                </div>
              )}

              <div className="text-sm">
                <p className="text-muted-foreground">Type</p>
                <p className="font-medium capitalize">{billing.billingType}</p>
              </div>

              <div className="flex gap-2 flex-wrap">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onSelectBilling?.(billing)}
                >
                  <Eye className="h-4 w-4 mr-1" />
                  View
                </Button>

                {billing.status === 'draft' && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleSubmit(billing._id)}
                    disabled={submitForApproval.isPending}
                  >
                    <FileCheck className="h-4 w-4 mr-1" />
                    Submit
                  </Button>
                )}

                {billing.status === 'pending-approval' && (
                  <Button
                    size="sm"
                    variant="default"
                    onClick={() => handleApprove(billing._id)}
                    disabled={approveBilling.isPending}
                  >
                    <CheckSquare className="h-4 w-4 mr-1" />
                    Approve
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredBillings.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          No billings found
        </div>
      )}
    </div>
  );
}
