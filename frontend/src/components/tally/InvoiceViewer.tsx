'use client';

import { useState, useEffect } from 'react';
import { Download, Printer, X } from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import QRCode from 'qrcode';

interface InvoiceData {
  _id: string;
  invoiceNumber: string;
  workOrderNumber?: string;
  partyName: string;
  partyEmail?: string;
  partyAddress?: string;
  partyGSTIN?: string;
  gstEnabled: boolean;
  gstRate?: number;
  cgstAmount?: number;
  sgstAmount?: number;
  igstAmount?: number;
  gstTotalAmount?: number;
  totalAmount: number;
  subtotal: number;
  paidAmount?: number;
  balanceAmount?: number;
  invoiceDate: string;
  dueDate: string;
  lineItems: any[];
  notes?: string;
  internalNotes?: string;
  status: string;
  invoiceType?: string;
  currency?: string;
  exchangeRate?: number;
  paymentTerms?: string;
  totalTax?: number;
  isRecurring?: boolean;
  recurringFrequency?: string;
  nextRecurringDate?: string;
  remindersSent?: number;
  dunningLevel?: number;
  attachments?: string[];
  journalEntryId?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface InvoiceViewerProps {
  invoiceId: string;
  onClose: () => void;
}

export default function InvoiceViewer({ invoiceId, onClose }: InvoiceViewerProps) {
  const [invoice, setInvoice] = useState<InvoiceData | null>(null);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInvoice();
  }, [invoiceId]);

  const fetchInvoice = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/tally-invoices/${invoiceId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('auth-token')}` }
      });
      const data = await res.json();
      
      if (data.success) {
        setInvoice(data.data);
        await generateQRCode(data.data);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateQRCode = async (invoiceData: InvoiceData) => {
    try {
      const qrData = JSON.stringify({
        invoiceNumber: invoiceData.invoiceNumber,
        workOrderNumber: invoiceData.workOrderNumber,
        amount: invoiceData.totalAmount,
        date: invoiceData.invoiceDate,
        gst: invoiceData.gstEnabled ? invoiceData.gstTotalAmount : 0,
        party: invoiceData.partyName
      });
      
      const qrCodeDataUrl = await QRCode.toDataURL(qrData, {
        width: 150,
        margin: 1,
        color: { dark: '#000000', light: '#FFFFFF' }
      });
      
      setQrCodeUrl(qrCodeDataUrl);
    } catch (error) {
      console.error('QR Code generation error:', error);
    }
  };

  const downloadPDF = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/tally-invoices/${invoiceId}/pdf`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('auth-token')}` }
      });
      
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `invoice-${invoice?.invoiceNumber}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      DRAFT: 'bg-gray-100 text-gray-800',
      SENT: 'bg-blue-100 text-blue-800',
      PAID: 'bg-green-100 text-green-800',
      OVERDUE: 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const formatDate = (date: string) => new Date(date).toLocaleDateString('en-IN');
  const formatCurrency = (amount: number) => `₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Invoice not found</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto bg-white">
      {/* Header Actions */}
      <div className="flex justify-between items-center p-4 border-b print:hidden">
        <h2 className="text-xl font-bold">Complete Invoice Details</h2>
        <div className="flex gap-2">
          <Button onClick={downloadPDF} variant="outline" size="sm">
            <Download size={16} className="mr-1" />
            PDF
          </Button>
          <Button onClick={() => window.print()} variant="outline" size="sm">
            <Printer size={16} className="mr-1" />
            Print
          </Button>
          <Button onClick={onClose} variant="outline" size="sm">
            <X size={16} />
          </Button>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Invoice Header */}
        <div className="text-center border-b pb-4">
          <h1 className="text-2xl font-bold">Invoice #{invoice.invoiceNumber}</h1>
          {invoice.workOrderNumber && <p className="text-gray-600">Work Order: {invoice.workOrderNumber}</p>}
          <Badge className={getStatusColor(invoice.status)}>{invoice.status}</Badge>
        </div>

        {/* Complete Invoice Details */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Party Details */}
          <Card>
            <CardHeader>
              <CardTitle>Bill To</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="font-semibold text-lg">{invoice.partyName}</p>
              {invoice.partyAddress && <p>{invoice.partyAddress}</p>}
              {invoice.partyGSTIN && <p><strong>GSTIN:</strong> {invoice.partyGSTIN}</p>}
              {invoice.partyEmail && <p><strong>Email:</strong> {invoice.partyEmail}</p>}
            </CardContent>
          </Card>

          {/* Invoice Metadata */}
          <Card>
            <CardHeader>
              <CardTitle>Invoice Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p><strong>Date:</strong> {formatDate(invoice.invoiceDate)}</p>
              <p><strong>Due Date:</strong> {formatDate(invoice.dueDate)}</p>
              <p><strong>Type:</strong> {invoice.invoiceType || 'SALES'}</p>
              <p><strong>Currency:</strong> {invoice.currency || 'INR'}</p>
              <p><strong>Exchange Rate:</strong> {invoice.exchangeRate || 1}</p>
              {invoice.paymentTerms && <p><strong>Payment Terms:</strong> {invoice.paymentTerms}</p>}
            </CardContent>
          </Card>
        </div>

        {/* Financial Summary */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Payment Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p><strong>Total Amount:</strong> {formatCurrency(invoice.totalAmount)}</p>
              <p><strong>Paid Amount:</strong> {formatCurrency(invoice.paidAmount || 0)}</p>
              <p><strong>Balance:</strong> {formatCurrency(invoice.balanceAmount || invoice.totalAmount)}</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Amount Breakdown</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p><strong>Subtotal:</strong> {formatCurrency(invoice.subtotal)}</p>
              <p><strong>Total Tax:</strong> {formatCurrency(invoice.totalTax || 0)}</p>
              <p><strong>Total Amount:</strong> {formatCurrency(invoice.totalAmount)}</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>GST Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {invoice.gstEnabled ? (
                <>
                  <p><strong>GST Rate:</strong> {invoice.gstRate}%</p>
                  {invoice.cgstAmount > 0 && <p><strong>CGST:</strong> {formatCurrency(invoice.cgstAmount)}</p>}
                  {invoice.sgstAmount > 0 && <p><strong>SGST:</strong> {formatCurrency(invoice.sgstAmount)}</p>}
                  {invoice.igstAmount > 0 && <p><strong>IGST:</strong> {formatCurrency(invoice.igstAmount)}</p>}
                  <p><strong>Total GST:</strong> {formatCurrency(invoice.gstTotalAmount || 0)}</p>
                </>
              ) : (
                <p className="text-gray-500">GST Not Applicable</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Line Items */}
        <Card>
          <CardHeader>
            <CardTitle>Line Items</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-gray-300">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border border-gray-300 px-4 py-2 text-left">Description</th>
                    <th className="border border-gray-300 px-4 py-2 text-right">Qty</th>
                    <th className="border border-gray-300 px-4 py-2 text-right">Rate</th>
                    <th className="border border-gray-300 px-4 py-2 text-right">Discount</th>
                    <th className="border border-gray-300 px-4 py-2 text-right">Amount</th>
                    {invoice.gstEnabled && <th className="border border-gray-300 px-4 py-2 text-right">Tax</th>}
                  </tr>
                </thead>
                <tbody>
                  {invoice.lineItems.map((item, index) => (
                    <tr key={index}>
                      <td className="border border-gray-300 px-4 py-2">{item.description}</td>
                      <td className="border border-gray-300 px-4 py-2 text-right">{item.quantity}</td>
                      <td className="border border-gray-300 px-4 py-2 text-right">{formatCurrency(item.unitPrice)}</td>
                      <td className="border border-gray-300 px-4 py-2 text-right">{formatCurrency(item.discount || 0)}</td>
                      <td className="border border-gray-300 px-4 py-2 text-right">{formatCurrency(item.amount)}</td>
                      {invoice.gstEnabled && (
                        <td className="border border-gray-300 px-4 py-2 text-right">
                          {formatCurrency(item.taxAmount || 0)}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* System Information */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>System Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p><strong>Invoice ID:</strong> <code className="bg-gray-100 px-2 py-1 rounded text-sm">{invoice._id}</code></p>
              {invoice.createdAt && <p><strong>Created:</strong> {formatDate(invoice.createdAt)}</p>}
              {invoice.updatedAt && <p><strong>Updated:</strong> {formatDate(invoice.updatedAt)}</p>}
              {invoice.journalEntryId && <p><strong>Journal Entry:</strong> <code className="bg-gray-100 px-2 py-1 rounded text-sm">{invoice.journalEntryId}</code></p>}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Additional Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {invoice.isRecurring && (
                <>
                  <p><strong>Recurring:</strong> Yes</p>
                  <p><strong>Frequency:</strong> {invoice.recurringFrequency}</p>
                  {invoice.nextRecurringDate && <p><strong>Next Due:</strong> {formatDate(invoice.nextRecurringDate)}</p>}
                </>
              )}
              {invoice.remindersSent > 0 && <p><strong>Reminders Sent:</strong> {invoice.remindersSent}</p>}
              {invoice.dunningLevel > 0 && <p><strong>Dunning Level:</strong> {invoice.dunningLevel}</p>}
              {invoice.attachments && invoice.attachments.length > 0 && (
                <p><strong>Attachments:</strong> {invoice.attachments.length} file(s)</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* QR Code */}
        <Card>
          <CardHeader>
            <CardTitle>QR Code</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            {qrCodeUrl ? (
              <img src={qrCodeUrl} alt="Invoice QR Code" className="mx-auto border border-gray-300" />
            ) : (
              <div className="w-[150px] h-[150px] border border-gray-300 flex items-center justify-center mx-auto">
                <span className="text-gray-500 text-sm">QR Code</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Notes */}
        {invoice.notes && (
          <Card>
            <CardHeader>
              <CardTitle>Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap">{invoice.notes}</p>
            </CardContent>
          </Card>
        )}

        {invoice.internalNotes && (
          <Card>
            <CardHeader>
              <CardTitle>Internal Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap">{invoice.internalNotes}</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}