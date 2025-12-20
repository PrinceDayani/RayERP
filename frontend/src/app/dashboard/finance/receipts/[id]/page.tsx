'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { silentApiClient } from '@/lib/silentApi';
import { formatCurrency } from '@/lib/currency';
import { toast } from '@/lib/toast';
import { ArrowLeft, Download, Printer, FileText } from 'lucide-react';

interface Receipt {
  _id: string;
  receiptNumber: string;
  receiptDate: string;
  amount: number;
  currency: string;
  paymentMethod: string;
  paymentReference?: string;
  transactionId?: string;
  receivedFrom: string;
  receivedFromEmail?: string;
  receivedFromAddress?: string;
  invoiceNumber: string;
  invoiceId: any;
  bankName?: string;
  chequeNumber?: string;
  chequeDate?: string;
  notes?: string;
  status: string;
  createdBy: any;
  createdAt: string;
}

export default function ReceiptViewPage() {
  const router = useRouter();
  const params = useParams();
  const receiptId = params.id as string;

  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReceipt = async () => {
      if (!receiptId) return;
      
      const response = await silentApiClient.get(`/api/receipts/${receiptId}`);
      if (response?.data) {
        setReceipt(response.data);
      }
      setLoading(false);
    };

    fetchReceipt();
  }, [receiptId]);

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    toast.info('PDF download coming soon');
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex justify-center items-center h-64">
          <div className="text-lg">Loading receipt...</div>
        </div>
      </div>
    );
  }

  if (!receipt) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-4">Receipt not found</h2>
          <Button onClick={() => router.back()}>Go Back</Button>
        </div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'valid': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'refunded': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="flex items-center justify-between mb-6 print:hidden">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Payment Receipt</h1>
            <p className="text-gray-600">Receipt #{receipt.receiptNumber}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handlePrint}>
            <Printer className="h-4 w-4 mr-2" />
            Print
          </Button>
          <Button variant="outline" size="sm" onClick={handleDownload}>
            <Download className="h-4 w-4 mr-2" />
            Download PDF
          </Button>
        </div>
      </div>

      {/* Receipt Card */}
      <Card className="shadow-lg">
        <CardHeader className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-2xl mb-2">PAYMENT RECEIPT</CardTitle>
              <p className="text-blue-100">Receipt #{receipt.receiptNumber}</p>
            </div>
            <Badge className={`${getStatusColor(receipt.status)} text-lg px-4 py-2`}>
              {receipt.status}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-8">
          {/* Company Info (You can customize this) */}
          <div className="mb-8 pb-6 border-b">
            <h2 className="text-xl font-bold text-gray-900 mb-2">Your Company Name</h2>
            <p className="text-gray-600">Your Company Address</p>
            <p className="text-gray-600">Email: info@yourcompany.com</p>
          </div>

          {/* Receipt Details Grid */}
          <div className="grid grid-cols-2 gap-8 mb-8">
            <div>
              <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">Received From</h3>
              <p className="text-lg font-semibold text-gray-900">{receipt.receivedFrom}</p>
              {receipt.receivedFromEmail && (
                <p className="text-gray-600">{receipt.receivedFromEmail}</p>
              )}
              {receipt.receivedFromAddress && (
                <p className="text-gray-600 mt-1">{receipt.receivedFromAddress}</p>
              )}
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">Receipt Details</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Date:</span>
                  <span className="font-medium">{new Date(receipt.receiptDate).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Invoice:</span>
                  <span className="font-medium text-blue-600">{receipt.invoiceNumber}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Payment Information */}
          <div className="bg-gray-50 rounded-lg p-6 mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Payment Method</p>
                <p className="font-semibold text-gray-900">{receipt.paymentMethod.replace('_', ' ')}</p>
              </div>
              {receipt.paymentReference && (
                <div>
                  <p className="text-sm text-gray-600">Reference</p>
                  <p className="font-semibold text-gray-900">{receipt.paymentReference}</p>
                </div>
              )}
              {receipt.transactionId && (
                <div>
                  <p className="text-sm text-gray-600">Transaction ID</p>
                  <p className="font-semibold text-gray-900">{receipt.transactionId}</p>
                </div>
              )}
              {receipt.bankName && (
                <div>
                  <p className="text-sm text-gray-600">Bank Name</p>
                  <p className="font-semibold text-gray-900">{receipt.bankName}</p>
                </div>
              )}
              {receipt.chequeNumber && (
                <div>
                  <p className="text-sm text-gray-600">Cheque Number</p>
                  <p className="font-semibold text-gray-900">{receipt.chequeNumber}</p>
                </div>
              )}
              {receipt.chequeDate && (
                <div>
                  <p className="text-sm text-gray-600">Cheque Date</p>
                  <p className="font-semibold text-gray-900">{new Date(receipt.chequeDate).toLocaleDateString()}</p>
                </div>
              )}
            </div>
          </div>

          {/* Amount Section */}
          <div className="bg-blue-50 rounded-lg p-6 mb-8">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-gray-600 mb-1">Amount Received</p>
                <p className="text-4xl font-bold text-blue-600">{formatCurrency(receipt.amount)}</p>
                <p className="text-sm text-gray-600 mt-1">Currency: {receipt.currency}</p>
              </div>
              <div className="text-right">
                <div className="bg-green-100 text-green-800 px-6 py-3 rounded-lg">
                  <p className="text-sm font-semibold">PAID</p>
                </div>
              </div>
            </div>
          </div>

          {/* Notes */}
          {receipt.notes && (
            <div className="mb-8">
              <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">Notes</h3>
              <p className="text-gray-700">{receipt.notes}</p>
            </div>
          )}

          {/* Footer */}
          <div className="border-t pt-6 mt-8">
            <div className="flex justify-between items-center text-sm text-gray-600">
              <div>
                <p>Created by: {receipt.createdBy?.name || 'System'}</p>
                <p>Created on: {new Date(receipt.createdAt).toLocaleString()}</p>
              </div>
              <div className="text-right">
                <p className="font-semibold text-gray-900">Thank you for your payment!</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="mt-6 flex justify-end gap-4 print:hidden">
        <Button 
          variant="outline" 
          onClick={() => router.push(`/dashboard/finance/invoices/${receipt.invoiceId?._id || receipt.invoiceId}`)}
        >
          <FileText className="h-4 w-4 mr-2" />
          View Invoice
        </Button>
      </div>
    </div>
  );
}
