'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { PageLoader } from '@/components/PageLoader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowLeft, FileText, Calendar, Hash, Edit, User, ArrowRightLeft, TrendingUp, TrendingDown } from 'lucide-react';
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
    return <PageLoader text="Loading journal entry..." />;
  }

  if (!entry) {
    return <div className="p-6">Entry not found</div>;
  }

  const totalDebit = entry.lines?.reduce((sum: number, line: any) => sum + (line.debit || 0), 0) || 0;
  const totalCredit = entry.lines?.reduce((sum: number, line: any) => sum + (line.credit || 0), 0) || 0;
  const debitAccounts = entry.lines?.filter((l: any) => l.debit > 0) || [];
  const creditAccounts = entry.lines?.filter((l: any) => l.credit > 0) || [];
  
  const formatDate = (date: any) => {
    if (!date) return 'N/A';
    try {
      return format(new Date(date), 'MMM dd, yyyy');
    } catch {
      return 'Invalid Date';
    }
  };

  return (
    <div className="p-6 space-y-6 max-h-screen overflow-y-auto">
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
          {/* Double Entry Summary */}
          <div className="grid grid-cols-2 gap-6">
            <Card className="border-red-200 bg-red-50">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2 text-red-700">
                  <TrendingDown className="w-4 h-4" />
                  Debit (From)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {debitAccounts.map((line: any, idx: number) => (
                    <div key={idx} className="flex justify-between items-center">
                      <div>
                        <div className="font-medium text-sm">{line.account?.name}</div>
                        <div className="text-xs text-muted-foreground font-mono">{line.account?.code}</div>
                      </div>
                      <div className="font-bold text-red-600">
                        ₹{line.debit.toLocaleString('en-IN')}
                      </div>
                    </div>
                  ))}
                  <div className="pt-2 border-t flex justify-between font-bold text-red-700">
                    <span>Total Debit</span>
                    <span>₹{totalDebit.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-green-200 bg-green-50">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2 text-green-700">
                  <TrendingUp className="w-4 h-4" />
                  Credit (To)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {creditAccounts.map((line: any, idx: number) => (
                    <div key={idx} className="flex justify-between items-center">
                      <div>
                        <div className="font-medium text-sm">{line.account?.name}</div>
                        <div className="text-xs text-muted-foreground font-mono">{line.account?.code}</div>
                      </div>
                      <div className="font-bold text-green-600">
                        ₹{line.credit.toLocaleString('en-IN')}
                      </div>
                    </div>
                  ))}
                  <div className="pt-2 border-t flex justify-between font-bold text-green-700">
                    <span>Total Credit</span>
                    <span>₹{totalCredit.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Entry Info */}
          <div className="grid grid-cols-4 gap-4 p-4 bg-muted rounded-lg">
            <div>
              <div className="text-sm text-muted-foreground flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Date
              </div>
              <div className="font-semibold mt-1">
                {formatDate(entry.entryDate || entry.date)}
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
              <div className="text-sm text-muted-foreground flex items-center gap-2">
                <User className="w-4 h-4" />
                Created By
              </div>
              <div className="font-semibold mt-1">
                {entry.createdBy?.firstName} {entry.createdBy?.lastName || entry.createdBy?.name || 'N/A'}
              </div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground flex items-center gap-2">
                <ArrowRightLeft className="w-4 h-4" />
                Amount
              </div>
              <div className="font-bold mt-1 text-lg">
                ₹{totalDebit.toLocaleString('en-IN')}
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="text-sm font-medium text-blue-900 mb-1">Transaction Description</div>
            <div className="text-blue-800">{entry.description}</div>
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

          {entry.createdAt && (
            <div className="text-xs text-muted-foreground pt-4 border-t">
              Created: {formatDate(entry.createdAt)}
              {entry.updatedAt && ` • Updated: ${formatDate(entry.updatedAt)}`}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
