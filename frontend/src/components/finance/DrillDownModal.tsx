"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar, FileText, TrendingUp, TrendingDown, Banknote } from "lucide-react";

interface Transaction {
  _id?: string;
  date: string;
  description: string;
  voucherNumber?: string;
  reference?: string;
  debit: number;
  credit: number;
  balance?: number;
}

interface DrillDownModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  accountName: string;
  accountCode: string;
  transactions: Transaction[];
}

export function DrillDownModal({ open, onOpenChange, accountName, accountCode, transactions }: DrillDownModalProps) {
  const totalDebit = transactions.reduce((sum, t) => sum + (t.debit || 0), 0);
  const totalCredit = transactions.reduce((sum, t) => sum + (t.credit || 0), 0);
  const netBalance = totalDebit - totalCredit;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <FileText className="h-6 w-6 text-blue-600" />
            <div>
              <div className="text-xl font-bold">{accountName}</div>
              <div className="text-sm text-muted-foreground font-normal">Account Code: {accountCode}</div>
            </div>
          </DialogTitle>
        </DialogHeader>

        {/* Summary Cards */}
        <div className="grid grid-cols-3 gap-4 mb-4">
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Debit</p>
                  <p className="text-2xl font-bold text-green-600">₹{totalDebit.toLocaleString()}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Credit</p>
                  <p className="text-2xl font-bold text-red-600">₹{totalCredit.toLocaleString()}</p>
                </div>
                <TrendingDown className="h-8 w-8 text-red-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Net Balance</p>
                  <p className={`text-2xl font-bold ${netBalance >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>
                    ₹{Math.abs(netBalance).toLocaleString()}
                  </p>
                </div>
                <Banknote className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Transaction Count */}
        <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-sm font-medium text-blue-900">
            Showing {transactions.length} transaction{transactions.length !== 1 ? 's' : ''} for this account
          </p>
        </div>

        {/* Transactions Table */}
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead className="font-bold">Date</TableHead>
                <TableHead className="font-bold">Description</TableHead>
                <TableHead className="font-bold">Reference</TableHead>
                <TableHead className="text-right font-bold">Debit</TableHead>
                <TableHead className="text-right font-bold">Credit</TableHead>
                <TableHead className="text-right font-bold">Running Balance</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No transactions found for this account in the selected period
                  </TableCell>
                </TableRow>
              ) : (
                transactions.map((txn, idx) => {
                  const runningBalance = transactions
                    .slice(0, idx + 1)
                    .reduce((sum, t) => sum + (t.debit || 0) - (t.credit || 0), 0);
                  
                  return (
                    <TableRow key={txn._id || idx} className="hover:bg-blue-50">
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-blue-600" />
                          <span className="font-medium">{new Date(txn.date).toLocaleDateString('en-IN', { 
                            day: '2-digit', 
                            month: 'short', 
                            year: 'numeric' 
                          })}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-xs">
                          <p className="font-medium text-sm">{txn.description || 'No description'}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        {(txn.voucherNumber || txn.reference) ? (
                          <Badge variant="outline" className="font-mono text-xs">
                            {txn.voucherNumber || txn.reference}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground text-xs">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {txn.debit > 0 ? (
                          <span className="font-bold text-green-600">₹{txn.debit.toLocaleString()}</span>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {txn.credit > 0 ? (
                          <span className="font-bold text-red-600">₹{txn.credit.toLocaleString()}</span>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <span className={`font-bold ${runningBalance >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>
                          ₹{Math.abs(runningBalance).toLocaleString()}
                        </span>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        {/* Summary Footer */}
        {transactions.length > 0 && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg border">
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Total Entries</p>
                <p className="font-bold text-lg">{transactions.length}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Net Movement</p>
                <p className={`font-bold text-lg ${netBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {netBalance >= 0 ? '+' : '-'}₹{Math.abs(netBalance).toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Account Type</p>
                <p className="font-bold text-lg">{netBalance >= 0 ? 'Debit Balance' : 'Credit Balance'}</p>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
