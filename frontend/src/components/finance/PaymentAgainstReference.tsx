'use client';

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';
import { Search, CheckCircle, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useToast } from '@/hooks/use-toast';

interface Reference {
  _id: string;
  entryNumber: string;
  reference: string;
  date: string;
  description: string;
  totalAmount: number;
  paidAmount: number;
  outstandingAmount: number;
  status: 'OUTSTANDING' | 'PARTIALLY_PAID' | 'FULLY_PAID';
  accountId: { code: string; name: string };
}

interface PaymentAgainstReferenceProps {
  open: boolean;
  onClose: () => void;
  paymentId?: string;
  accountId?: string;
  onSuccess?: () => void;
}

export default function PaymentAgainstReference({
  open,
  onClose,
  paymentId,
  accountId,
  onSuccess
}: PaymentAgainstReferenceProps) {
  const { formatAmount } = useCurrency();
  const { toast } = useToast();
  const [references, setReferences] = useState<Reference[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRef, setSelectedRef] = useState<Reference | null>(null);
  const [amount, setAmount] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (open) {
      fetchReferences();
    }
  }, [open, accountId]);

  const fetchReferences = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('auth-token');
      const params = new URLSearchParams();
      if (accountId) params.append('accountId', accountId);

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/reference-payments/outstanding-references?${params}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (!response.ok) throw new Error('Failed to fetch references');
      const data = await response.json();
      setReferences(data.references || []);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load outstanding references',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePayReference = async () => {
    if (!selectedRef || !amount || !paymentId) return;

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      toast({
        title: 'Invalid Amount',
        description: 'Please enter a valid amount',
        variant: 'destructive'
      });
      return;
    }

    if (amountNum > selectedRef.outstandingAmount) {
      toast({
        title: 'Amount Exceeds Outstanding',
        description: `Amount cannot exceed ${formatAmount(selectedRef.outstandingAmount)}`,
        variant: 'destructive'
      });
      return;
    }

    try {
      setProcessing(true);
      const token = localStorage.getItem('auth-token');
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/reference-payments/pay-reference`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            paymentId,
            referenceId: selectedRef._id,
            amount: amountNum
          })
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to process payment');
      }

      toast({
        title: 'Success',
        description: 'Payment allocated to reference successfully',
        variant: 'default'
      });

      setSelectedRef(null);
      setAmount('');
      fetchReferences();
      onSuccess?.();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to process payment',
        variant: 'destructive'
      });
    } finally {
      setProcessing(false);
    }
  };

  const filteredReferences = references.filter(
    (ref) =>
      ref.reference.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ref.entryNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ref.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Pay Against Reference</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search by reference, entry number, or description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* References Table */}
          {loading ? (
            <div className="flex justify-center py-8">
              <Spinner className="w-6 h-6" />
            </div>
          ) : filteredReferences.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <AlertCircle className="w-12 h-12 mx-auto mb-2 text-gray-400" />
              <p>No outstanding references found</p>
            </div>
          ) : (
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Entry #</TableHead>
                    <TableHead>Reference</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead className="text-right">Paid</TableHead>
                    <TableHead className="text-right">Outstanding</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredReferences.map((ref) => (
                    <TableRow
                      key={ref._id}
                      className={selectedRef?._id === ref._id ? 'bg-blue-50' : ''}
                    >
                      <TableCell className="font-mono text-sm">{ref.entryNumber}</TableCell>
                      <TableCell className="font-semibold">{ref.reference}</TableCell>
                      <TableCell>{format(new Date(ref.date), 'dd MMM yyyy')}</TableCell>
                      <TableCell className="max-w-xs truncate">{ref.description}</TableCell>
                      <TableCell className="text-right">{formatAmount(ref.totalAmount)}</TableCell>
                      <TableCell className="text-right">{formatAmount(ref.paidAmount)}</TableCell>
                      <TableCell className="text-right font-semibold">
                        {formatAmount(ref.outstandingAmount)}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            ref.status === 'OUTSTANDING'
                              ? 'destructive'
                              : ref.status === 'PARTIALLY_PAID'
                              ? 'default'
                              : 'secondary'
                          }
                        >
                          {ref.status.replace('_', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant={selectedRef?._id === ref._id ? 'default' : 'outline'}
                          onClick={() => {
                            setSelectedRef(ref);
                            setAmount(ref.outstandingAmount.toString());
                          }}
                        >
                          {selectedRef?._id === ref._id ? 'Selected' : 'Select'}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Payment Form */}
          {selectedRef && (
            <div className="border rounded-lg p-4 bg-blue-50 space-y-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-blue-600" />
                <h3 className="font-semibold">
                  Selected: {selectedRef.reference} - {selectedRef.entryNumber}
                </h3>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Outstanding Amount</Label>
                  <div className="text-2xl font-bold text-blue-600">
                    {formatAmount(selectedRef.outstandingAmount)}
                  </div>
                </div>
                <div>
                  <Label htmlFor="amount">Payment Amount</Label>
                  <Input
                    id="amount"
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                    max={selectedRef.outstandingAmount}
                  />
                </div>
              </div>

              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setSelectedRef(null)}>
                  Cancel
                </Button>
                <Button onClick={handlePayReference} disabled={processing || !amount}>
                  {processing ? (
                    <>
                      <Spinner className="w-4 h-4 mr-2" />
                      Processing...
                    </>
                  ) : (
                    'Allocate Payment'
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
