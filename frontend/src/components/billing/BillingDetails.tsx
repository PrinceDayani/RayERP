'use client';

import { useState } from 'react';
import { useMilestoneBilling } from '@/hooks/useMilestoneBilling';
import { IMilestoneBilling } from '@/types/billing';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { FileText, DollarSign, CheckCircle, XCircle } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

interface BillingDetailsProps {
  billing: IMilestoneBilling;
}

export default function BillingDetails({ billing }: BillingDetailsProps) {
  const {
    generateInvoice,
    recordPayment,
    rejectBilling,
    submitForApproval,
    approveBilling
  } = useMilestoneBilling();

  const [invoiceData, setInvoiceData] = useState({
    invoiceNumber: '',
    invoiceDate: new Date().toISOString().split('T')[0],
    dueDate: ''
  });

  const [paymentData, setPaymentData] = useState({
    amount: 0,
    paymentReference: '',
    paymentDate: new Date().toISOString().split('T')[0]
  });

  const [rejectionReason, setRejectionReason] = useState('');

  const handleGenerateInvoice = async () => {
    await generateInvoice.mutateAsync({
      id: billing._id,
      data: invoiceData
    });
  };

  const handleRecordPayment = async () => {
    await recordPayment.mutateAsync({
      id: billing._id,
      data: paymentData
    });
  };

  const handleReject = async () => {
    await rejectBilling.mutateAsync({
      id: billing._id,
      data: { rejectionReason }
    });
  };

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

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle>{billing.milestoneName}</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {billing.invoiceNumber || 'No Invoice Generated'}
              </p>
            </div>
            <Badge className={getStatusColor(billing.status)}>
              {billing.status}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-sm text-muted-foreground">Billing Type</p>
              <p className="font-medium capitalize">{billing.billingType}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Currency</p>
              <p className="font-medium">{billing.currency}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Contract Value</p>
              <p className="text-lg font-bold">
                {formatCurrency(billing.totalContractValue, billing.currency)}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Retention ({billing.retentionPercentage}%)</p>
              <p className="text-lg font-bold">
                {formatCurrency(billing.retentionAmount, billing.currency)}
              </p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3 pt-4 border-t">
            <div>
              <p className="text-sm text-muted-foreground">Total Billed</p>
              <p className="text-xl font-bold">
                {formatCurrency(billing.totalBilledAmount, billing.currency)}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Paid</p>
              <p className="text-xl font-bold text-green-600">
                {formatCurrency(billing.totalPaidAmount, billing.currency)}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Outstanding</p>
              <p className="text-xl font-bold text-red-600">
                {formatCurrency(billing.outstandingAmount, billing.currency)}
              </p>
            </div>
          </div>

          {billing.paymentTerms && (
            <div>
              <p className="text-sm text-muted-foreground">Payment Terms</p>
              <p className="font-medium">{billing.paymentTerms}</p>
            </div>
          )}

          {billing.notes && (
            <div>
              <p className="text-sm text-muted-foreground">Notes</p>
              <p className="text-sm">{billing.notes}</p>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex gap-2 flex-wrap">
        {billing.status === 'draft' && (
          <Button onClick={() => submitForApproval.mutateAsync(billing._id)}>
            Submit for Approval
          </Button>
        )}

        {billing.status === 'pending-approval' && (
          <>
            <Button onClick={() => approveBilling.mutateAsync(billing._id)}>
              <CheckCircle className="h-4 w-4 mr-2" />
              Approve
            </Button>
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="destructive">
                  <XCircle className="h-4 w-4 mr-2" />
                  Reject
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Reject Billing</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Rejection Reason</Label>
                    <Textarea
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      rows={4}
                    />
                  </div>
                  <Button onClick={handleReject} disabled={!rejectionReason}>
                    Reject Billing
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </>
        )}

        {billing.status === 'approved' && (
          <Dialog>
            <DialogTrigger asChild>
              <Button>
                <FileText className="h-4 w-4 mr-2" />
                Generate Invoice
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Generate Invoice</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Invoice Number</Label>
                  <Input
                    value={invoiceData.invoiceNumber}
                    onChange={(e) => setInvoiceData({ ...invoiceData, invoiceNumber: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Invoice Date</Label>
                  <Input
                    type="date"
                    value={invoiceData.invoiceDate}
                    onChange={(e) => setInvoiceData({ ...invoiceData, invoiceDate: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Due Date</Label>
                  <Input
                    type="date"
                    value={invoiceData.dueDate}
                    onChange={(e) => setInvoiceData({ ...invoiceData, dueDate: e.target.value })}
                  />
                </div>
                <Button onClick={handleGenerateInvoice} disabled={!invoiceData.invoiceNumber}>
                  Generate Invoice
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}

        {billing.status === 'invoiced' && (
          <Dialog>
            <DialogTrigger asChild>
              <Button>
                <DollarSign className="h-4 w-4 mr-2" />
                Record Payment
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Record Payment</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Amount</Label>
                  <Input
                    type="number"
                    value={paymentData.amount}
                    onChange={(e) => setPaymentData({ ...paymentData, amount: parseFloat(e.target.value) })}
                  />
                </div>
                <div>
                  <Label>Payment Reference</Label>
                  <Input
                    value={paymentData.paymentReference}
                    onChange={(e) => setPaymentData({ ...paymentData, paymentReference: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Payment Date</Label>
                  <Input
                    type="date"
                    value={paymentData.paymentDate}
                    onChange={(e) => setPaymentData({ ...paymentData, paymentDate: e.target.value })}
                  />
                </div>
                <Button onClick={handleRecordPayment} disabled={!paymentData.amount || !paymentData.paymentReference}>
                  Record Payment
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {billing.paymentSchedules.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Payment Schedules</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {billing.paymentSchedules.map((schedule, index) => (
                <div key={index} className="flex justify-between items-center p-3 border rounded">
                  <div>
                    <p className="font-medium">{schedule.milestoneName}</p>
                    <p className="text-sm text-muted-foreground">
                      Due: {new Date(schedule.dueDate).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">{formatCurrency(schedule.amount, billing.currency)}</p>
                    <Badge className={getStatusColor(schedule.status)}>
                      {schedule.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
