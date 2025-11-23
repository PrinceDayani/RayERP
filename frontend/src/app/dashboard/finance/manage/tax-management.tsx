'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

const API_URL = process.env.NEXT_PUBLIC_API_URL  || process.env.BACKEND_URL;

export default function TaxManagement() {
  const [taxes, setTaxes] = useState([]);
  const [form, setForm] = useState({ name: '', type: 'GST', rate: 0 });

  useEffect(() => { fetchTaxes(); }, []);

  const fetchTaxes = async () => {
    const token = localStorage.getItem('auth-token');
    const res = await fetch(`${API_URL}/api/finance-advanced/taxes`, { headers: { Authorization: `Bearer ${token}` } });
    setTaxes((await res.json()).taxes || []);
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    const token = localStorage.getItem('auth-token');
    await fetch(`${API_URL}/api/finance-advanced/taxes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ ...form, applicableFrom: new Date() })
    });
    setForm({ name: '', type: 'GST', rate: 0 });
    fetchTaxes();
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader><CardTitle>Add Tax Configuration</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="flex gap-4">
            <Input placeholder="Tax Name" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required />
            <Select value={form.type} onValueChange={v => setForm({...form, type: v})}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="GST">GST</SelectItem>
                <SelectItem value="VAT">VAT</SelectItem>
                <SelectItem value="TDS">TDS</SelectItem>
                <SelectItem value="TCS">TCS</SelectItem>
                <SelectItem value="SALES_TAX">Sales Tax</SelectItem>
              </SelectContent>
            </Select>
            <Input type="number" placeholder="Rate %" value={form.rate} onChange={e => setForm({...form, rate: Number(e.target.value)})} required />
            <Button type="submit">Add Tax</Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Tax Configurations ({taxes.length})</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Rate</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Applicable From</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {taxes.map((t: any) => (
                <TableRow key={t._id}>
                  <TableCell className="font-medium">{t.name}</TableCell>
                  <TableCell><Badge>{t.type}</Badge></TableCell>
                  <TableCell>{t.rate}%</TableCell>
                  <TableCell>{t.isActive ? <Badge variant="default">Active</Badge> : <Badge variant="secondary">Inactive</Badge>}</TableCell>
                  <TableCell>{new Date(t.applicableFrom).toLocaleDateString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
