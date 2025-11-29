'use client';

import { useState, useEffect } from 'react';
import { Plus, DollarSign, AlertCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import BillsList from '@/components/bills/BillsList';
import CreateBillDialog from '@/components/bills/CreateBillDialog';
import PaymentDialog from '@/components/bills/PaymentDialog';
import { api } from '@/lib/api';

export default function BillsPage() {
  const [bills, setBills] = useState([]);
  const [summary, setSummary] = useState<any>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedBill, setSelectedBill] = useState<any>(null);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);

  useEffect(() => {
    fetchBills();
    fetchSummary();
  }, []);

  const fetchBills = async () => {
    try {
      const res = await api.get('/bills');
      setBills(res.data.data);
    } catch (error) {
      console.error('Fetch bills error:', error);
    }
  };

  const fetchSummary = async () => {
    try {
      const res = await api.get('/bills/summary');
      setSummary(res.data.data);
    } catch (error) {
      console.error('Fetch summary error:', error);
    }
  };

  const handlePayment = (bill: any) => {
    setSelectedBill(bill);
    setShowPaymentDialog(true);
  };

  const handlePaymentSuccess = () => {
    fetchBills();
    fetchSummary();
    setShowPaymentDialog(false);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Bills & Payments</h1>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="w-4 h-4 mr-2" />
          New Bill
        </Button>
      </div>

      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Bills</p>
                  <p className="text-2xl font-bold">
                    {summary.summary.reduce((sum: number, s: any) => sum + s.count, 0)}
                  </p>
                </div>
                <DollarSign className="w-8 h-8 text-blue-500 opacity-20" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Amount</p>
                  <p className="text-2xl font-bold">
                    ₹{summary.summary.reduce((sum: number, s: any) => sum + s.totalAmount, 0).toLocaleString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Balance Due</p>
                  <p className="text-2xl font-bold text-red-600">
                    ₹{summary.summary.reduce((sum: number, s: any) => sum + s.balanceAmount, 0).toLocaleString()}
                  </p>
                </div>
                <AlertCircle className="w-8 h-8 text-red-500 opacity-20" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Overdue</p>
                  <p className="text-2xl font-bold text-orange-600">{summary.overdue}</p>
                </div>
                <AlertCircle className="w-8 h-8 text-orange-500 opacity-20" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <BillsList bills={bills} onPayment={handlePayment} onRefresh={fetchBills} />

      {showCreateDialog && (
        <CreateBillDialog
          onClose={() => setShowCreateDialog(false)}
          onSuccess={() => {
            fetchBills();
            fetchSummary();
            setShowCreateDialog(false);
          }}
        />
      )}

      {showPaymentDialog && selectedBill && (
        <PaymentDialog
          bill={selectedBill}
          onClose={() => setShowPaymentDialog(false)}
          onSuccess={handlePaymentSuccess}
        />
      )}
    </div>
  );
}
