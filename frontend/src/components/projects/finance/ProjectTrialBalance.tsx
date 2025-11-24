"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Download, Filter } from "lucide-react";

interface ProjectTrialBalanceProps {
  projectId: string;
}

export default function ProjectTrialBalance({ projectId }: ProjectTrialBalanceProps) {
  const accounts = [
    { code: '1001', name: 'Cash', debit: 25000, credit: 0, balance: 25000 },
    { code: '1200', name: 'Accounts Receivable', debit: 30000, credit: 0, balance: 30000 },
    { code: '2001', name: 'Accounts Payable', debit: 0, credit: 15000, balance: -15000 },
    { code: '4001', name: 'Project Revenue', debit: 0, credit: 120000, balance: -120000 },
    { code: '5001', name: 'Direct Costs', debit: 80000, credit: 0, balance: 80000 }
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Trial Balance</h3>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4 mr-2" />
            Filter
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Account Balances</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Account Code</TableHead>
                <TableHead>Account Name</TableHead>
                <TableHead className="text-right">Debit</TableHead>
                <TableHead className="text-right">Credit</TableHead>
                <TableHead className="text-right">Balance</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {accounts.map((account) => (
                <TableRow key={account.code}>
                  <TableCell className="font-medium">{account.code}</TableCell>
                  <TableCell>{account.name}</TableCell>
                  <TableCell className="text-right">${account.debit.toLocaleString()}</TableCell>
                  <TableCell className="text-right">${account.credit.toLocaleString()}</TableCell>
                  <TableCell className="text-right font-medium">
                    ${Math.abs(account.balance).toLocaleString()}
                  </TableCell>
                </TableRow>
              ))}
              <TableRow className="border-t-2 font-bold">
                <TableCell colSpan={2}>Total</TableCell>
                <TableCell className="text-right">?135,000</TableCell>
                <TableCell className="text-right">?135,000</TableCell>
                <TableCell className="text-right">-</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
