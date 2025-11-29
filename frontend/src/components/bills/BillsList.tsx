'use client';

import { format } from 'date-fns';
import { CreditCard, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface BillsListProps {
  bills: any[];
  onPayment: (bill: any) => void;
  onRefresh: () => void;
}

export default function BillsList({ bills, onPayment, onRefresh }: BillsListProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-500';
      case 'partial': return 'bg-yellow-500';
      case 'pending': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  if (!bills || bills.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>All Bills</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            No bills found. Create your first bill to get started.
          </div>
        </CardContent>
      </Card>
    );
  }

  const isOverdue = (bill: any) => {
    if (!bill.dueDate || bill.status === 'paid') return false;
    return new Date(bill.dueDate) < new Date();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>All Bills</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Bill Number</TableHead>
              <TableHead>Account</TableHead>
              <TableHead>Vendor</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Due Date</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead className="text-right">Paid</TableHead>
              <TableHead className="text-right">Balance</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {bills.map((bill) => (
              <TableRow key={bill._id}>
                <TableCell className="font-mono">{bill.billNumber}</TableCell>
                <TableCell>{bill.accountId?.name}</TableCell>
                <TableCell>{bill.vendor || <span className="text-muted-foreground">-</span>}</TableCell>
                <TableCell className="whitespace-nowrap">{format(new Date(bill.billDate), 'MMM dd, yyyy')}</TableCell>
                <TableCell className="whitespace-nowrap">
                  {bill.dueDate ? (
                    <div className="flex items-center gap-2">
                      <span className={isOverdue(bill) ? 'text-red-600 font-medium' : ''}>
                        {format(new Date(bill.dueDate), 'MMM dd, yyyy')}
                      </span>
                      {isOverdue(bill) && <AlertTriangle className="w-4 h-4 text-red-600" />}
                    </div>
                  ) : <span className="text-muted-foreground">-</span>}
                </TableCell>
                <TableCell className="text-right font-mono font-semibold">₹{bill.totalAmount.toLocaleString('en-IN', {minimumFractionDigits: 2})}</TableCell>
                <TableCell className="text-right font-mono text-green-600 font-semibold">₹{bill.paidAmount.toLocaleString('en-IN', {minimumFractionDigits: 2})}</TableCell>
                <TableCell className="text-right font-mono text-red-600 font-semibold">₹{bill.balanceAmount.toLocaleString('en-IN', {minimumFractionDigits: 2})}</TableCell>
                <TableCell>
                  <Badge className={getStatusColor(bill.status)}>
                    {bill.status.charAt(0).toUpperCase() + bill.status.slice(1)}
                  </Badge>
                </TableCell>
                <TableCell>
                  {bill.status !== 'paid' ? (
                    <Button size="sm" onClick={() => onPayment(bill)} variant="outline">
                      <CreditCard className="w-4 h-4 mr-1" />
                      Pay
                    </Button>
                  ) : (
                    <span className="text-xs text-muted-foreground">Completed</span>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        </div>
      </CardContent>
    </Card>
  );
}
