'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Lock, Unlock } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL  || process.env.BACKEND_URL;

export default function YearEndClosing() {
  const [years, setYears] = useState([]);

  useEffect(() => { fetchYears(); }, []);

  const fetchYears = async () => {
    const token = localStorage.getItem('auth-token');
    const res = await fetch(`${API_URL}/api/finance-advanced/financial-years`, { headers: { Authorization: `Bearer ${token}` } });
    setYears((await res.json()).years || []);
  };

  const closeYear = async (yearId: string, yearName: string) => {
    if (!confirm(`Close financial year ${yearName}? This will transfer balances to next year.`)) return;
    const token = localStorage.getItem('auth-token');
    const res = await fetch(`${API_URL}/api/finance-advanced/financial-years/close`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ yearId })
    });
    const data = await res.json();
    alert(data.message);
    fetchYears();
  };

  return (
    <Card>
      <CardHeader><CardTitle>Financial Year Management</CardTitle></CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Financial Year</TableHead>
              <TableHead>Start Date</TableHead>
              <TableHead>End Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {years.map((y: any) => (
              <TableRow key={y.year}>
                <TableCell className="font-bold">{y.year}</TableCell>
                <TableCell>{new Date(y.startDate).toLocaleDateString()}</TableCell>
                <TableCell>{new Date(y.endDate).toLocaleDateString()}</TableCell>
                <TableCell>
                  {y.status === 'OPEN' ? (
                    <Badge variant="default" className="bg-green-600"><Unlock className="w-3 h-3 mr-1" />Open</Badge>
                  ) : (
                    <Badge variant="secondary"><Lock className="w-3 h-3 mr-1" />Closed</Badge>
                  )}
                </TableCell>
                <TableCell>
                  {y.status === 'OPEN' && (
                    <Button size="sm" variant="destructive" onClick={() => closeYear(y._id, y.year)}>
                      <Lock className="w-4 h-4 mr-2" />Close Year
                    </Button>
                  )}
                  {y.status === 'CLOSED' && (
                    <span className="text-xs text-gray-500">Closed {new Date(y.closedAt).toLocaleDateString()}</span>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
