'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export default function AgingAnalysis() {
  const [receivables, setReceivables] = useState([]);
  const [payables, setPayables] = useState([]);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    const token = localStorage.getItem('token');
    const [rec, pay] = await Promise.all([
      fetch(`${API_URL}/api/finance-advanced/aging-analysis?type=receivables`, { headers: { Authorization: `Bearer ${token}` } }),
      fetch(`${API_URL}/api/finance-advanced/aging-analysis?type=payables`, { headers: { Authorization: `Bearer ${token}` } })
    ]);
    setReceivables((await rec.json()).aging || []);
    setPayables((await pay.json()).aging || []);
  };

  const AgingTable = ({ data }: any) => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Account</TableHead>
          <TableHead className="text-right">Current</TableHead>
          <TableHead className="text-right">1-30 Days</TableHead>
          <TableHead className="text-right">31-60 Days</TableHead>
          <TableHead className="text-right">61-90 Days</TableHead>
          <TableHead className="text-right">90+ Days</TableHead>
          <TableHead className="text-right">Total</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.map((row: any, i: number) => {
          const total = row.current + row.days30 + row.days60 + row.days90 + row.over90;
          return (
            <TableRow key={i}>
              <TableCell className="font-medium">{row.account}</TableCell>
              <TableCell className="text-right">₹{row.current.toFixed(2)}</TableCell>
              <TableCell className="text-right">₹{row.days30.toFixed(2)}</TableCell>
              <TableCell className="text-right">₹{row.days60.toFixed(2)}</TableCell>
              <TableCell className="text-right">₹{row.days90.toFixed(2)}</TableCell>
              <TableCell className="text-right text-red-600">₹{row.over90.toFixed(2)}</TableCell>
              <TableCell className="text-right font-bold">₹{total.toFixed(2)}</TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );

  return (
    <Tabs defaultValue="receivables">
      <TabsList>
        <TabsTrigger value="receivables">Accounts Receivable</TabsTrigger>
        <TabsTrigger value="payables">Accounts Payable</TabsTrigger>
      </TabsList>
      <TabsContent value="receivables">
        <Card>
          <CardHeader><CardTitle>Receivables Aging Analysis</CardTitle></CardHeader>
          <CardContent><AgingTable data={receivables} /></CardContent>
        </Card>
      </TabsContent>
      <TabsContent value="payables">
        <Card>
          <CardHeader><CardTitle>Payables Aging Analysis</CardTitle></CardHeader>
          <CardContent><AgingTable data={payables} /></CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
