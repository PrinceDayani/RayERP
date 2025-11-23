'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL  || process.env.BACKEND_URL;

export default function MultiCurrency() {
  const [currencies, setCurrencies] = useState([]);
  const [rates, setRates] = useState([]);
  const [form, setForm] = useState({ code: '', name: '', symbol: '' });

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    const token = localStorage.getItem('token');
    const [curr, rate] = await Promise.all([
      fetch(`${API_URL}/api/finance-advanced/currencies`, { headers: { Authorization: `Bearer ${token}` } }),
      fetch(`${API_URL}/api/finance-advanced/exchange-rates`, { headers: { Authorization: `Bearer ${token}` } })
    ]);
    setCurrencies((await curr.json()).currencies || []);
    setRates((await rate.json()).rates || []);
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    await fetch(`${API_URL}/api/finance-advanced/currencies`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(form)
    });
    setForm({ code: '', name: '', symbol: '' });
    fetchData();
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader><CardTitle>Add Currency</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="flex gap-4">
            <Input placeholder="Code (INR)" value={form.code} onChange={e => setForm({...form, code: e.target.value})} required />
            <Input placeholder="Name" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required />
            <Input placeholder="Symbol ($)" value={form.symbol} onChange={e => setForm({...form, symbol: e.target.value})} required />
            <Button type="submit"><Plus className="w-4 h-4 mr-2" />Add</Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Currencies ({currencies.length})</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Symbol</TableHead>
                <TableHead>Base</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {currencies.map((c: any) => (
                <TableRow key={c._id}>
                  <TableCell className="font-mono">{c.code}</TableCell>
                  <TableCell>{c.name}</TableCell>
                  <TableCell>{c.symbol}</TableCell>
                  <TableCell>{c.isBaseCurrency ? '✓' : ''}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Exchange Rates</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>From</TableHead>
                <TableHead>To</TableHead>
                <TableHead>Rate</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rates.map((r: any) => (
                <TableRow key={r._id}>
                  <TableCell>{r.fromCurrency}</TableCell>
                  <TableCell>{r.toCurrency}</TableCell>
                  <TableCell>{r.rate.toFixed(4)}</TableCell>
                  <TableCell>{new Date(r.date).toLocaleDateString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
