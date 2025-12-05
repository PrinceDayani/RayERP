'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowLeft, FileText, Calendar, Hash, Edit } from 'lucide-react';
import { format } from 'date-fns';

const API_URL = process.env.NEXT_PUBLIC_API_URL || process.env.BACKEND_URL;

export default function JournalEntryDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [entry, setEntry] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEntry();
  }, [params.id]);

  const fetchEntry = async () => {
    try {
      const token = localStorage.getItem('auth-token');
      const response = await fetch(`${API_URL}/api/journal-entries/${params.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      setEntry(data.data || data);
    } catch (error) {
      console.error('Error fetching entry:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading...</div>;
  }

  if (!entry) {
    return <div className="p-6">Entry not found</div>;
  }

  const totalDebit = entry.lines?.reduce((sum: number, line: any) => sum + (line.debit || 0), 0) || 0;
  const totalCredit = entry.lines?.reduce((sum: number, line: any) => sum + (line.credit || 0), 0) || 0;

  return (
    <div className="p-6 space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => router.back()}>
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-6 h-6" />
                  Journal Entry Details
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  Entry #{entry.entryNumber}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Badge variant={entry.status === 'posted' ? 'default' : 'secondary'}>
                {entry.status}
              </Badge>
              <Button size="sm" onClick={() => router.push(`/dashboard/finance/journal-entry?edit=${entry._id}`)}>
                <Edit className="w-4 h-4 mr-2" />
                Edit
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-3 gap-4 p-4 bg-muted rounded-lg">
            <div>
              <div className="text-sm text-muted-foreground flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Date
              </div>
              <div className="font-semibold mt-1">
                {format(new Date(entry.entryDate || entry.date), 'MMM dd, yyyy')}
              </div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground flex items-center gap-2">
                <Hash className="w-4 h-4" />
                Reference
              </div>
              <div className="font-semibold mt-1 font-mono">
                {entry.reference || '-'}
              </div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Description</div>
              <div className="font-semibold mt-1">{entry.description}</div>
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-3">Entry Lines</h3>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Account</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-right">Debit</TableHead>
                  <TableHead className="text-right">Credit</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {entry.lines?.map((line: any, idx: number) => (
                  <TableRow key={idx}>
                    <TableCell>
                      <div className="font-medium">
                        {line.account?.name || line.accountId}
                      </div>
                      <div className="text-sm text-muted-foreground font-mono">
                        {line.account?.code}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">{line.description}</TableCell>
                    <TableCell className="text-right font-mono">
                      {line.debit > 0 ? (
                        <span className="text-red-600 font-semibold">
                          {line.debit.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}
                        </span>
                      ) : '-'}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {line.credit > 0 ? (
                        <span className="text-green-600 font-semibold">
                          {line.credit.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}
                        </span>
                      ) : '-'}
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow className="font-bold bg-muted">
                  <TableCell colSpan={2}>Total</TableCell>
                  <TableCell className="text-right text-red-600">
                    {totalDebit.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}
                  </TableCell>
                  <TableCell className="text-right text-green-600">
                    {totalCredit.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>

          {entry.attachments && entry.attachments.length > 0 && (
            <div>
              <h3 className="font-semibold mb-3">Attachments</h3>
              <div className="space-y-2">
                {entry.attachments.map((att: any, idx: number) => (
                  <div key={idx} className="p-3 border rounded-lg flex items-center justify-between">
                    <span className="text-sm">{att.filename}</span>
                    <Button size="sm" variant="outline">Download</Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="text-xs text-muted-foreground pt-4 border-t">
            Created: {format(new Date(entry.createdAt), 'MMM dd, yyyy HH:mm')}
            {entry.updatedAt && ` • Updated: ${format(new Date(entry.updatedAt), 'MMM dd, yyyy HH:mm')}`}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
