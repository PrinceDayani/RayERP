'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { budgetTransferAPI, BudgetTransfer } from '@/lib/api/budgetTransferAPI';
import CreateTransferDialog from '@/components/budget/CreateTransferDialog';
import TransferHistoryTable from '@/components/budget/TransferHistoryTable';
import { ArrowLeftRight, Clock, CheckCircle, XCircle } from 'lucide-react';

export default function BudgetTransfersPage() {
  const [transfers, setTransfers] = useState<BudgetTransfer[]>([]);
  const [pendingTransfers, setPendingTransfers] = useState<BudgetTransfer[]>([]);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'pending'>('all');

  useEffect(() => {
    fetchTransfers();
  }, []);

  const fetchTransfers = async () => {
    setLoading(true);
    try {
      const [allData, pendingData] = await Promise.all([
        budgetTransferAPI.getAllTransfers(),
        budgetTransferAPI.getPendingTransfers(),
      ]);
      setTransfers(allData.data || []);
      setPendingTransfers(pendingData.data || []);
    } catch (err) {
      console.error('Failed to fetch transfers:', err);
    } finally {
      setLoading(false);
    }
  };

  const stats = {
    total: transfers.length,
    pending: transfers.filter(t => t.status === 'pending').length,
    approved: transfers.filter(t => t.status === 'approved').length,
    rejected: transfers.filter(t => t.status === 'rejected').length,
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Budget Transfers</h1>
          <p className="text-gray-600 mt-1">Transfer budget amounts between departments</p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <ArrowLeftRight className="w-4 h-4 mr-2" />
          Create Transfer
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Total Transfers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <Clock className="w-4 h-4 text-yellow-600" />
              Pending
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              Approved
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.approved}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <XCircle className="w-4 h-4 text-red-600" />
              Rejected
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.rejected}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Transfer History</CardTitle>
              <CardDescription>View and manage budget transfer requests</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                variant={activeTab === 'all' ? 'default' : 'outline'}
                onClick={() => setActiveTab('all')}
              >
                All Transfers
              </Button>
              <Button
                variant={activeTab === 'pending' ? 'default' : 'outline'}
                onClick={() => setActiveTab('pending')}
              >
                Pending ({stats.pending})
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading transfers...</div>
          ) : (
            <TransferHistoryTable
              transfers={activeTab === 'all' ? transfers : pendingTransfers}
              onRefresh={fetchTransfers}
              showActions={activeTab === 'pending'}
            />
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>How Budget Transfers Work</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-3 gap-4">
            <div className="border rounded-lg p-4">
              <div className="font-semibold mb-2">1. Request Transfer</div>
              <p className="text-sm text-gray-600">
                Select source and destination budgets, specify amount and reason
              </p>
            </div>
            <div className="border rounded-lg p-4">
              <div className="font-semibold mb-2">2. Approval Process</div>
              <p className="text-sm text-gray-600">
                Transfer requires approval from authorized personnel
              </p>
            </div>
            <div className="border rounded-lg p-4">
              <div className="font-semibold mb-2">3. Automatic Execution</div>
              <p className="text-sm text-gray-600">
                Once approved, amounts are transferred automatically with full audit trail
              </p>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-semibold text-blue-900 mb-2">Key Features</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>✓ Real-time balance validation</li>
              <li>✓ Transaction-safe with MongoDB sessions</li>
              <li>✓ Complete transfer history tracking</li>
              <li>✓ Fiscal year validation</li>
              <li>✓ Approval workflow with rejection reasons</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      <CreateTransferDialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        onSuccess={fetchTransfers}
      />
    </div>
  );
}
