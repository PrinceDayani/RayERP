'use client';

import { useState, useEffect } from 'react';
import { Download, Printer, X } from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import QRCode from 'qrcode';
import { tallyInvoiceAPI } from '../../lib/api/tallyInvoiceAPI';

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
      const result = await tallyInvoiceAPI.getById(invoiceId);
      
      if (result.success && result.data) {
        setInvoice(result.data);
        await generateQRCode(result.data);
      } else {
        console.error('Failed to fetch invoice:', result.message);
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
        workOrderNumber: invoiceData.workOrderNumber || 'N/A',
        totalAmount: invoiceData.totalAmount,
        subtotal: invoiceData.subtotal,
        gstEnabled: invoiceData.gstEnabled,
        gstAmount: invoiceData.gstEnabled ? invoiceData.gstTotalAmount : 0,
        gstRate: invoiceData.gstRate || 0,
        invoiceDate: invoiceData.invoiceDate,
        dueDate: invoiceData.dueDate,
        partyName: invoiceData.partyName,
        partyGSTIN: invoiceData.partyGSTIN || 'N/A',
        status: invoiceData.status,
        currency: invoiceData.currency || 'INR',
        paidAmount: invoiceData.paidAmount || 0,
        balanceAmount: invoiceData.balanceAmount || invoiceData.totalAmount,
        generatedBy: 'RayERP',
        timestamp: new Date().toISOString()
      });
      
      const qrCodeDataUrl = await QRCode.toDataURL(qrData, {
        width: 200,
        margin: 2,
        color: { dark: '#1e40af', light: '#ffffff' },
        errorCorrectionLevel: 'M'
      });
      
      setQrCodeUrl(qrCodeDataUrl);
    } catch (error) {
      console.error('QR Code generation error:', error);
    }
  };

  const downloadPDF = async () => {
    if (!invoice) return;
    
    try {
      await tallyInvoiceAPI.downloadPDF(invoiceId, invoice.invoiceNumber);
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

  const formatDate = (date: string) => tallyInvoiceAPI.formatDate(date);
  const formatCurrency = (amount: number) => tallyInvoiceAPI.formatCurrency(amount);

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
          <Card className="border-2 border-blue-200">
            <CardHeader className="bg-blue-50">
              <CardTitle className="text-blue-800">Bill To Party</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 pt-4">
              <p className="font-bold text-xl text-blue-900">{invoice.partyName}</p>
              {invoice.partyAddress && (
                <div className="bg-gray-50 p-3 rounded">
                  <p className="text-sm font-medium text-gray-700">Address:</p>
                  <p className="text-gray-600">{invoice.partyAddress}</p>
                </div>
              )}
              {invoice.partyGSTIN && (
                <div className="bg-green-50 p-2 rounded">
                  <p><strong className="text-green-800">GSTIN:</strong> <span className="font-mono text-green-700">{invoice.partyGSTIN}</span></p>
                </div>
              )}
              {invoice.partyEmail && (
                <p><strong>Email:</strong> <span className="text-blue-600">{invoice.partyEmail}</span></p>
              )}
            </CardContent>
          </Card>

          {/* Invoice Metadata */}
          <Card className="border-2 border-green-200">
            <CardHeader className="bg-green-50">
              <CardTitle className="text-green-800">Invoice Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 pt-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-600">Invoice Date</p>
                  <p className="font-semibold">{formatDate(invoice.invoiceDate)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Due Date</p>
                  <p className="font-semibold text-red-600">{formatDate(invoice.dueDate)}</p>
                </div>
              </div>
              {invoice.workOrderNumber && (
                <div className="bg-yellow-50 p-3 rounded border border-yellow-200">
                  <p><strong className="text-yellow-800">Work Order No:</strong> <span className="font-mono text-yellow-700">{invoice.workOrderNumber}</span></p>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-600">Type</p>
                  <p className="font-semibold">{invoice.invoiceType || 'SALES'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Currency</p>
                  <p className="font-semibold">{invoice.currency || 'INR'}</p>
                </div>
              </div>
              {invoice.paymentTerms && (
                <div>
                  <p className="text-sm font-medium text-gray-600">Payment Terms</p>
                  <p className="font-semibold">{invoice.paymentTerms}</p>
                </div>
              )}
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
          
          <Card className={invoice.gstEnabled ? "border-2 border-green-200" : "border-2 border-gray-200"}>
            <CardHeader className={invoice.gstEnabled ? "bg-green-50" : "bg-gray-50"}>
              <CardTitle className={invoice.gstEnabled ? "text-green-800" : "text-gray-600"}>GST Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 pt-4">
              {invoice.gstEnabled ? (
                <>
                  <div className="bg-green-100 p-3 rounded">
                    <p className="font-bold text-green-800">GST Rate: {invoice.gstRate}%</p>
                  </div>
                  <div className="space-y-2">
                    {invoice.cgstAmount > 0 && (
                      <div className="flex justify-between items-center bg-blue-50 p-2 rounded">
                        <span className="font-medium text-blue-800">CGST ({(invoice.gstRate / 2)}%):</span>
                        <span className="font-bold text-blue-900">{formatCurrency(invoice.cgstAmount)}</span>
                      </div>
                    )}
                    {invoice.sgstAmount > 0 && (
                      <div className="flex justify-between items-center bg-blue-50 p-2 rounded">
                        <span className="font-medium text-blue-800">SGST ({(invoice.gstRate / 2)}%):</span>
                        <span className="font-bold text-blue-900">{formatCurrency(invoice.sgstAmount)}</span>
                      </div>
                    )}
                    {invoice.igstAmount > 0 && (
                      <div className="flex justify-between items-center bg-purple-50 p-2 rounded">
                        <span className="font-medium text-purple-800">IGST ({invoice.gstRate}%):</span>
                        <span className="font-bold text-purple-900">{formatCurrency(invoice.igstAmount)}</span>
                      </div>
                    )}
                  </div>
                  <div className="bg-green-200 p-3 rounded border-2 border-green-300">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-green-800">Total GST:</span>
                      <span className="font-bold text-xl text-green-900">{formatCurrency(invoice.gstTotalAmount || 0)}</span>
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center py-4">
                  <p className="text-gray-500 font-medium">GST Not Applicable</p>
                  <p className="text-sm text-gray-400">This invoice is not subject to GST</p>
                </div>
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
        <Card className="border-2 border-blue-200">
          <CardHeader className="bg-blue-50">
            <CardTitle className="text-blue-800 text-center">Invoice Verification QR Code</CardTitle>
          </CardHeader>
          <CardContent className="text-center pt-6">
            {qrCodeUrl ? (
              <div className="space-y-4">
                <div className="bg-white p-4 rounded-lg shadow-inner border-2 border-blue-100 inline-block">
                  <img src={qrCodeUrl} alt="Invoice QR Code" className="mx-auto" />
                </div>
                <div className="bg-blue-50 p-3 rounded">
                  <p className="text-sm font-medium text-blue-800">Scan to verify invoice details</p>
                  <p className="text-xs text-blue-600 mt-1">
                    Contains: Invoice #{invoice.invoiceNumber}, Amount: {formatCurrency(invoice.totalAmount)}
                    {invoice.workOrderNumber && `, WO: ${invoice.workOrderNumber}`}
                    {invoice.gstEnabled && `, GST: ${formatCurrency(invoice.gstTotalAmount || 0)}`}
                  </p>
                </div>
              </div>
            ) : (
              <div className="w-[200px] h-[200px] border-2 border-dashed border-gray-300 flex items-center justify-center mx-auto rounded">
                <span className="text-gray-500 text-sm">Generating QR Code...</span>
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