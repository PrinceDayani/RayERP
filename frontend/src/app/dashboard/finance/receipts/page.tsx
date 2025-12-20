'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { silentApiClient } from '@/lib/silentApi';
import { formatCurrency } from '@/lib/currency';
import { toast } from '@/lib/toast';
import { Search, Eye, FileText, Download } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface Receipt {
  _id: string;
  receiptNumber: string;
  receiptDate: string;
  amount: number;
  paymentMethod: string;
  receivedFrom: string;
  invoiceNumber: string;
  status: string;
}

export default function ReceiptsPage() {
  const router = useRouter();
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const fetchReceipts = async () => {
    setLoading(true);
    const response = await silentApiClient.get('/api/receipts');
    const data = response?.data;
    setReceipts(Array.isArray(data) ? data : []);
    setLoading(false);
  };

  useEffect(() => {
    fetchReceipts();
  }, []);

  const filteredReceipts = (Array.isArray(receipts) ? receipts : []).filter(receipt => {
    const matchesSearch = receipt.receiptNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         receipt.receivedFrom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         receipt.invoiceNumber?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || receipt.status?.toLowerCase() === statusFilter.toLowerCase();
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'valid': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'refunded': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPaymentMethodBadge = (method: string) => {
    const colors: any = {
      CASH: 'bg-blue-100 text-blue-800',
      BANK_TRANSFER: 'bg-purple-100 text-purple-800',
      CREDIT_CARD: 'bg-indigo-100 text-indigo-800',
      DEBIT_CARD: 'bg-cyan-100 text-cyan-800',
      UPI: 'bg-green-100 text-green-800',
      CHEQUE: 'bg-orange-100 text-orange-800',
      OTHER: 'bg-gray-100 text-gray-800'
    };
    return colors[method] || colors.OTHER;
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex justify-center items-center h-64">
          <div className="text-lg">Loading receipts...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Payment Receipts</h1>
          <p className="text-gray-600 mt-1">View and manage payment receipts</p>
        </div>
      </div>

      <Card className="mb-6 shadow-sm">
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search by receipt number, customer, or invoice..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 h-10"
                />
              </div>
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-w-[140px]"
            >
              <option value="all">All Status</option>
              <option value="valid">Valid</option>
              <option value="cancelled">Cancelled</option>
              <option value="refunded">Refunded</option>
            </select>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-sm">
        <CardHeader className="bg-gray-50 border-b">
          <CardTitle className="text-lg font-semibold text-gray-900">
            Receipt List ({filteredReceipts.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredReceipts.length === 0 ? (
            <div className="text-center py-16">
              <div className="mb-6">
                <div className="bg-blue-50 rounded-full w-20 h-20 mx-auto flex items-center justify-center mb-4">
                  <FileText className="h-10 w-10 text-blue-500" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No receipts found</h3>
                <p className="text-gray-500 mb-8 max-w-md mx-auto">
                  Receipts are automatically generated when payments are recorded on invoices
                </p>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="text-left py-4 px-4 font-semibold text-gray-700">Receipt #</th>
                    <th className="text-left py-4 px-4 font-semibold text-gray-700">Date</th>
                    <th className="text-left py-4 px-4 font-semibold text-gray-700">Received From</th>
                    <th className="text-left py-4 px-4 font-semibold text-gray-700">Invoice #</th>
                    <th className="text-right py-4 px-4 font-semibold text-gray-700">Amount</th>
                    <th className="text-center py-4 px-4 font-semibold text-gray-700">Payment Method</th>
                    <th className="text-center py-4 px-4 font-semibold text-gray-700">Status</th>
                    <th className="text-center py-4 px-4 font-semibold text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredReceipts.map((receipt) => (
                    <tr key={receipt._id} className="border-b border-gray-100 hover:bg-blue-50 transition-colors">
                      <td className="py-4 px-4">
                        <span className="font-semibold text-blue-600">{receipt.receiptNumber}</span>
                      </td>
                      <td className="py-4 px-4 text-gray-600">
                        {new Date(receipt.receiptDate).toLocaleDateString()}
                      </td>
                      <td className="py-4 px-4">
                        <span className="font-medium text-gray-900">{receipt.receivedFrom}</span>
                      </td>
                      <td className="py-4 px-4">
                        <span className="text-blue-600 font-medium">{receipt.invoiceNumber}</span>
                      </td>
                      <td className="py-4 px-4 text-right font-semibold text-green-600">
                        {formatCurrency(receipt.amount)}
                      </td>
                      <td className="py-4 px-4 text-center">
                        <Badge className={`${getPaymentMethodBadge(receipt.paymentMethod)} font-medium`}>
                          {receipt.paymentMethod.replace('_', ' ')}
                        </Badge>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <Badge className={`${getStatusColor(receipt.status)} font-medium`}>
                          {receipt.status}
                        </Badge>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <div className="flex gap-1 justify-center">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            title="View Receipt"
                            onClick={() => router.push(`/dashboard/finance/receipts/${receipt._id}`)}
                            className="hover:bg-blue-100 hover:text-blue-600"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            title="Download PDF"
                            onClick={() => toast.info('PDF download coming soon')}
                            className="hover:bg-green-100 hover:text-green-600"
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
