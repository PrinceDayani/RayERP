'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export default function AuditTrail() {
  const [logs, setLogs] = useState([]);
  const [search, setSearch] = useState('');

  useEffect(() => { fetchLogs(); }, []);

  const fetchLogs = async () => {
    const token = localStorage.getItem('token');
    const res = await fetch(`${API_URL}/api/finance-advanced/audit-logs?limit=100`, { headers: { Authorization: `Bearer ${token}` } });
    setLogs((await res.json()).logs || []);
  };

  const filtered = logs.filter((l: any) => 
    l.action.toLowerCase().includes(search.toLowerCase()) || 
    l.entityType.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Audit Trail</CardTitle>
        <Input placeholder="Search logs..." value={search} onChange={e => setSearch(e.target.value)} />
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Timestamp</TableHead>
              <TableHead>User</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Entity</TableHead>
              <TableHead>IP Address</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((log: any) => (
              <TableRow key={log._id}>
                <TableCell className="text-xs">{new Date(log.timestamp).toLocaleString()}</TableCell>
                <TableCell>{log.userName}</TableCell>
                <TableCell><Badge>{log.action}</Badge></TableCell>
                <TableCell>{log.entityType}</TableCell>
                <TableCell className="text-xs text-gray-500">{log.ipAddress || 'N/A'}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
