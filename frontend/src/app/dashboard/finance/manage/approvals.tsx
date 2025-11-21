'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { CheckCircle, XCircle } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL  || process.env.BACKEND_URL;

export default function ApprovalWorkflows() {
  const [approvals, setApprovals] = useState([]);

  useEffect(() => { fetchApprovals(); }, []);

  const fetchApprovals = async () => {
    const token = localStorage.getItem('token');
    const res = await fetch(`${API_URL}/api/finance-advanced/approvals`, { headers: { Authorization: `Bearer ${token}` } });
    setApprovals((await res.json()).approvals || []);
  };

  const updateStatus = async (id: string, status: string) => {
    const token = localStorage.getItem('token');
    await fetch(`${API_URL}/api/finance-advanced/approvals/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ status })
    });
    fetchApprovals();
  };

  return (
    <Card>
      <CardHeader><CardTitle>Approval Workflows ({approvals.length})</CardTitle></CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Entry Type</TableHead>
              <TableHead>Requested By</TableHead>
              <TableHead>Requested At</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Approvers</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {approvals.map((a: any) => (
              <TableRow key={a._id}>
                <TableCell><Badge>{a.entryType}</Badge></TableCell>
                <TableCell>{a.requestedBy?.name || 'Unknown'}</TableCell>
                <TableCell className="text-xs">{new Date(a.requestedAt).toLocaleString()}</TableCell>
                <TableCell>
                  {a.status === 'PENDING' && <Badge variant="secondary">Pending</Badge>}
                  {a.status === 'APPROVED' && <Badge className="bg-green-600">Approved</Badge>}
                  {a.status === 'REJECTED' && <Badge variant="destructive">Rejected</Badge>}
                </TableCell>
                <TableCell className="text-xs">{a.approvers.length} approvers</TableCell>
                <TableCell>
                  {a.status === 'PENDING' && (
                    <div className="flex gap-2">
                      <Button size="sm" variant="default" onClick={() => updateStatus(a._id, 'APPROVED')}>
                        <CheckCircle className="w-4 h-4 mr-1" />Approve
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => updateStatus(a._id, 'REJECTED')}>
                        <XCircle className="w-4 h-4 mr-1" />Reject
                      </Button>
                    </div>
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
