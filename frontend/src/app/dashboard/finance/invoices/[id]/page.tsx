'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowLeft, Download, Mail, Printer, Edit, Copy, CheckCircle } from 'lucide-react';

export default function FinanceDetailPage() {
    const params = useParams();
    const router = useRouter();
    const [record, setRecord] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (params.id) {
            fetchRecord();
        }
    }, [params.id]);

    const fetchRecord = async () => {
        try {
            setLoading(true);
            const response = await fetch(`/api/finance/${params.id}`);
            const data = await response.json();
            if (data.success) {
                setRecord(data.data);
            }
        } catch (error) {
            console.error('Failed to fetch record:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDownloadPDF = async () => {
        try {
            const response = await fetch(`/api/finance/${params.id}/pdf`);
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${record.type}-${record.invoiceNumber || record.paymentNumber}.pdf`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (error) {
            console.error('Failed to download PDF:', error);
            alert('Failed to download PDF');
        }
    };

    const handleSendEmail = () => {
        // Open email dialog
        const email = prompt('Enter email address:');
        if (email) {
            fetch(`/api/finance/${params.id}/send-email`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ to: email, subject: `${record.type} ${record.invoiceNumber || record.paymentNumber}` }),
            })
                .then(res => res.json())
                .then(data => alert(data.message))
                .catch(err => alert('Failed to send email'));
        }
    };

    const formatCurrency = (amount: number, currency: string = 'INR') => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency,
        }).format(amount);
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    };

    if (loading) {
        return (
            <div className="p-6 flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                    <p>Loading...</p>
                </div>
            </div>
        );
    }

    if (!record) {
        return (
            <div className="p-6">
                <Card>
                    <CardContent className="py-12 text-center">
                        <h2 className="text-2xl font-bold mb-2">Record Not Found</h2>
                        <p className="text-muted-foreground mb-6">The requested finance record could not be found.</p>
                        <Button onClick={() => router.back()}>Go Back</Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    const isInvoice = record.type === 'invoice';

    return (
        <div className="p-6 space-y-6 max-w-6xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="outline" size="icon" onClick={() => router.back()}>
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div>
                        <h1 className="text-3xl font-bold">
                            {isInvoice ? 'Invoice' : 'Payment'} Details
                        </h1>
                        <p className="text-muted-foreground">
                            {record.invoiceNumber || record.paymentNumber}
                        </p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={handleDownloadPDF}>
                        <Download className="mr-2 h-4 w-4" />
                        Download PDF
                    </Button>
                    <Button variant="outline" onClick={handleSendEmail}>
                        <Mail className="mr-2 h-4 w-4" />
                        Send Email
                    </Button>
                    <Button variant="outline">
                        <Printer className="mr-2 h-4 w-4" />
                        Print
                    </Button>
                    <Button>
                        <Edit className="mr-2 h-4 w-4" />
                        Edit
                    </Button>
                </div>
            </div>

            {/* Status & Info Card */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>Summary</CardTitle>
                            <CardDescription>
                                {isInvoice ? 'Invoice' : 'Payment'} information and status
                            </CardDescription>
                        </div>
                        <Badge className="text-lg px-4 py-2">
                            {record.status}
                        </Badge>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                            <p className="text-sm text-muted-foreground">
                                {isInvoice ? 'Invoice' : 'Payment'} Number
                            </p>
                            <p className="text-lg font-semibold">
                                {record.invoiceNumber || record.paymentNumber}
                            </p>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Date</p>
                            <p className="text-lg font-semibold">
                                {formatDate(record.invoiceDate || record.paymentDate || record.createdAt)}
                            </p>
                        </div>
                        {isInvoice && record.dueDate && (
                            <div>
                                <p className="text-sm text-muted-foreground">Due Date</p>
                                <p className="text-lg font-semibold">
                                    {formatDate(record.dueDate)}
                                </p>
                            </div>
                        )}
                        <div>
                            <p className="text-sm text-muted-foreground">Total Amount</p>
                            <p className="text-2xl font-bold text-primary">
                                {formatCurrency(record.totalAmount, record.currency)}
                            </p>
                        </div>
                        {isInvoice && (
                            <>
                                <div>
                                    <p className="text-sm text-muted-foreground">Paid Amount</p>
                                    <p className="text-lg font-semibold text-green-600">
                                        {formatCurrency(record.paidAmount || 0, record.currency)}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Balance</p>
                                    <p className="text-lg font-semibold text-orange-600">
                                        {formatCurrency(record.balanceAmount || record.totalAmount, record.currency)}
                                    </p>
                                </div>
                            </>
                        )}
                        <div>
                            <p className="text-sm text-muted-foreground">Party</p>
                            <p className="text-lg font-semibold">{record.partyName || 'N/A'}</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Line Items (for invoices) */}
            {isInvoice && record.lineItems && record.lineItems.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle>Line Items</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Description</TableHead>
                                    <TableHead className="text-right">Quantity</TableHead>
                                    <TableHead className="text-right">Unit Price</TableHead>
                                    <TableHead className="text-right">Tax %</TableHead>
                                    <TableHead className="text-right">Amount</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {record.lineItems.map((item: any, index: number) => (
                                    <TableRow key={index}>
                                        <TableCell>{item.description}</TableCell>
                                        <TableCell className="text-right">{item.quantity}</TableCell>
                                        <TableCell className="text-right">
                                            {formatCurrency(item.unitPrice || item.rate, record.currency)}
                                        </TableCell>
                                        <TableCell className="text-right">{item.taxRate || item.gstRate}%</TableCell>
                                        <TableCell className="text-right font-semibold">
                                            {formatCurrency(item.amount || item.total, record.currency)}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>

                        <Separator className="my-4" />

                        <div className="space-y-2 text-right max-w-md ml-auto">
                            <div className="flex justify-between">
                                <span>Subtotal:</span>
                                <span>{formatCurrency(record.subtotal || 0, record.currency)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Total Tax:</span>
                                <span>{formatCurrency(record.totalTax || 0, record.currency)}</span>
                            </div>
                            {record.discount > 0 && (
                                <div className="flex justify-between text-orange-600">
                                    <span>Discount:</span>
                                    <span>-{formatCurrency(record.discount, record.currency)}</span>
                                </div>
                            )}
                            <Separator />
                            <div className="flex justify-between text-lg font-bold">
                                <span>Total:</span>
                                <span>{formatCurrency(record.totalAmount, record.currency)}</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Notes */}
            {record.notes && (
                <Card>
                    <CardHeader>
                        <CardTitle>Notes</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="whitespace-pre-wrap">{record.notes}</p>
                    </CardContent>
                </Card>
            )}

            {/* Metadata */}
            <Card>
                <CardHeader>
                    <CardTitle>Additional Information</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                            <span className="text-muted-foreground">Created:</span>{' '}
                            <span>{formatDate(record.createdAt)}</span>
                        </div>
                        <div>
                            <span className="text-muted-foreground">Last Updated:</span>{' '}
                            <span>{formatDate(record.updatedAt)}</span>
                        </div>
                        {record.paymentMethod && (
                            <div>
                                <span className="text-muted-foreground">Payment Method:</span>{' '}
                                <span>{record.paymentMethod}</span>
                            </div>
                        )}
                        {record.paymentTerms && (
                            <div>
                                <span className="text-muted-foreground">Payment Terms:</span>{' '}
                                <span>{record.paymentTerms.replace('_', ' ')}</span>
                            </div>
                        )}
                        {record.recurringFrequency && (
                            <div>
                                <span className="text-muted-foreground">Recurring:</span>{' '}
                                <Badge variant="secondary">{record.recurringFrequency}</Badge>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
