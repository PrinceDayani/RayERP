"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Download, Filter } from "lucide-react";

interface ProjectLedgerProps {
  projectId: string;
}

export default function ProjectLedger({ projectId }: ProjectLedgerProps) {
  const ledgerEntries = [
    {
      date: '2024-01-15',
      account: 'Cash',
      description: 'Initial project funding',
      voucher: 'RV001',
      debit: 50000,
      credit: 0,
      balance: 50000
    },
    {
      date: '2024-01-20',
      account: 'Direct Costs',
      description: 'Material purchase',
      voucher: 'PV001',
      debit: 25000,
      credit: 0,
      balance: 25000
    }
  ];

  const journalEntries = [
    {
      date: '2024-01-15',
      voucher: 'JV001',
      description: 'Project setup entry',
      debit: 50000,
      credit: 50000,
      status: 'Posted'
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Project Ledger & Journal Entries</h3>
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

      <Tabs defaultValue="ledger" className="space-y-4">
        <TabsList>
          <TabsTrigger value="ledger">Ledger Entries</TabsTrigger>
          <TabsTrigger value="journal">Journal Entries</TabsTrigger>
        </TabsList>

        <TabsContent value="ledger">
          <Card>
            <CardHeader>
              <CardTitle>General Ledger</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Account</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Voucher</TableHead>
                    <TableHead className="text-right">Debit</TableHead>
                    <TableHead className="text-right">Credit</TableHead>
                    <TableHead className="text-right">Balance</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ledgerEntries.map((entry, index) => (
                    <TableRow key={index}>
                      <TableCell>{entry.date}</TableCell>
                      <TableCell className="font-medium">{entry.account}</TableCell>
                      <TableCell>{entry.description}</TableCell>
                      <TableCell>{entry.voucher}</TableCell>
                      <TableCell className="text-right">
                        {entry.debit > 0 ? `$${entry.debit.toLocaleString()}` : '-'}
                      </TableCell>
                      <TableCell className="text-right">
                        {entry.credit > 0 ? `$${entry.credit.toLocaleString()}` : '-'}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        ${entry.balance.toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="journal">
          <Card>
            <CardHeader>
              <CardTitle>Journal Entries</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Voucher</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-right">Total Debit</TableHead>
                    <TableHead className="text-right">Total Credit</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {journalEntries.map((entry, index) => (
                    <TableRow key={index}>
                      <TableCell>{entry.date}</TableCell>
                      <TableCell className="font-medium">{entry.voucher}</TableCell>
                      <TableCell>{entry.description}</TableCell>
                      <TableCell className="text-right">${entry.debit.toLocaleString()}</TableCell>
                      <TableCell className="text-right">${entry.credit.toLocaleString()}</TableCell>
                      <TableCell>
                        <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
                          {entry.status}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}