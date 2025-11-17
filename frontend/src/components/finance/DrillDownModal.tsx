"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Calendar, FileText } from "lucide-react";

interface Transaction {
  date: string;
  description: string;
  voucherNumber: string;
  debit: number;
  credit: number;
  balance: number;
}

interface DrillDownModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  accountName: string;
  accountCode: string;
  transactions: Transaction[];
}

export function DrillDownModal({ open, onOpenChange, accountName, accountCode, transactions }: DrillDownModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {accountName} ({accountCode}) - Transactions
          </DialogTitle>
        </DialogHeader>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Voucher</TableHead>
              <TableHead className="text-right">Debit</TableHead>
              <TableHead className="text-right">Credit</TableHead>
              <TableHead className="text-right">Balance</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactions.map((txn, idx) => (
              <TableRow key={idx}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    {new Date(txn.date).toLocaleDateString()}
                  </div>
                </TableCell>
                <TableCell>{txn.description}</TableCell>
                <TableCell>
                  <Badge variant="outline">{txn.voucherNumber}</Badge>
                </TableCell>
                <TableCell className="text-right text-green-600">
                  {txn.debit > 0 ? `₹${txn.debit.toLocaleString()}` : '-'}
                </TableCell>
                <TableCell className="text-right text-red-600">
                  {txn.credit > 0 ? `₹${txn.credit.toLocaleString()}` : '-'}
                </TableCell>
                <TableCell className="text-right font-medium">
                  ₹{txn.balance.toLocaleString()}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </DialogContent>
    </Dialog>
  );
}
