'use client';

import { useState, useEffect } from 'react';
import { Plus, DollarSign, AlertCircle, Receipt, TrendingUp, Clock, FileText, Search, Filter, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import BillsList from '@/components/bills/BillsList';
import CreateBillDialog from '@/components/bills/CreateBillDialog';
import PaymentDialog from '@/components/bills/PaymentDialog';
import { api } from '@/lib/api';

export default function BillsPage() {
  const [bills, setBills] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedBill, setSelectedBill] = useState<any>(null);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState({ from: '', to: '' });
  const [vendorFilter, setVendorFilter] = useState('');

  useEffect(() => {
    fetchBills();
    fetchSummary();
  }, []);

  const fetchBills = async () => {
    try {
      const res = await api.get('/bills');
      const billsData = res.data?.data || res.data?.bills || (Array.isArray(res.data) ? res.data : []);
      setBills(billsData);
    } catch (error: any) {
      console.error('Failed to fetch bills:', error?.message || error);
      setBills([]);
    }
  };

  const fetchSummary = async () => {
    try {
      const res = await api.get('/bills/summary');
      setSummary(res.data.data);
    } catch (error: any) {
      console.error('Failed to fetch summary:', error?.message || error);
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

  const filteredBills = bills.filter(bill => {
    const matchesSearch = searchTerm === '' || 
      bill.billNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      bill.vendor?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      bill.invoiceNumber?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesVendor = vendorFilter === '' || bill.vendor?.toLowerCase().includes(vendorFilter.toLowerCase());
    
    const matchesDate = (!dateFilter.from || new Date(bill.billDate) >= new Date(dateFilter.from)) &&
                        (!dateFilter.to || new Date(bill.billDate) <= new Date(dateFilter.to));
    
    return matchesSearch && matchesVendor && matchesDate;
  });

  const stats = {
    total: filteredBills.length,
    totalAmount: filteredBills.reduce((sum, b) => sum + (b.totalAmount || 0), 0),
    paidAmount: filteredBills.reduce((sum, b) => sum + (b.paidAmount || 0), 0),
    balanceAmount: filteredBills.reduce((sum, b) => sum + (b.balanceAmount || 0), 0),
    overdue: filteredBills.filter(b => b.dueDate && new Date(b.dueDate) < new Date() && b.status !== 'paid').length
  };

  const pendingBills = filteredBills.filter(b => b.status === 'pending');
  const partialBills = filteredBills.filter(b => b.status === 'partial');
  const paidBills = filteredBills.filter(b => b.status === 'paid');

  const uniqueVendors = Array.from(new Set(bills.map(b => b.vendor).filter(Boolean)));

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Bills & Payments</h1>
          <p className="text-muted-foreground mt-1">Manage bills with custom payment allocation</p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)} size="lg">
          <Plus className="w-4 h-4 mr-2" />
          New Bill
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-t-4 border-t-blue-500">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase">Total Bills</p>
                <p className="text-3xl font-bold mt-2">{stats.total}</p>
                <p className="text-xs text-muted-foreground mt-1">{pendingBills.length} pending</p>
              </div>
              <FileText className="w-10 h-10 text-blue-500 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-t-4 border-t-purple-500">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase">Total Amount</p>
                <p className="text-3xl font-bold mt-2">₹{stats.totalAmount.toLocaleString()}</p>
                <p className="text-xs text-green-600 mt-1">₹{stats.paidAmount.toLocaleString()} paid</p>
              </div>
              <DollarSign className="w-10 h-10 text-purple-500 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-t-4 border-t-red-500">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase">Balance Due</p>
                <p className="text-3xl font-bold mt-2 text-red-600">₹{stats.balanceAmount.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground mt-1">{partialBills.length} partial paid</p>
              </div>
              <AlertCircle className="w-10 h-10 text-red-500 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-t-4 border-t-orange-500">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase">Overdue Bills</p>
                <p className="text-3xl font-bold mt-2 text-orange-600">{stats.overdue}</p>
                <p className="text-xs text-muted-foreground mt-1">Requires attention</p>
              </div>
              <Clock className="w-10 h-10 text-orange-500 opacity-20" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Search & Filter</CardTitle>
            {(searchTerm || dateFilter.from || dateFilter.to || vendorFilter) && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => {
                  setSearchTerm('');
                  setDateFilter({ from: '', to: '' });
                  setVendorFilter('');
                }}
              >
                <X className="w-4 h-4 mr-1" />
                Clear All
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search bill number, vendor, invoice..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div>
              <Input
                type="date"
                placeholder="From Date"
                value={dateFilter.from}
                onChange={(e) => setDateFilter({ ...dateFilter, from: e.target.value })}
              />
            </div>
            <div>
              <Input
                type="date"
                placeholder="To Date"
                value={dateFilter.to}
                onChange={(e) => setDateFilter({ ...dateFilter, to: e.target.value })}
              />
            </div>
            <div>
              <select
                className="w-full border rounded px-3 py-2 h-10"
                value={vendorFilter}
                onChange={(e) => setVendorFilter(e.target.value)}
              >
                <option value="">All Vendors</option>
                {uniqueVendors.map((vendor: any) => (
                  <option key={vendor} value={vendor}>{vendor}</option>
                ))}
              </select>
            </div>
          </div>
          {(searchTerm || dateFilter.from || dateFilter.to || vendorFilter) && (
            <div className="mt-3 text-sm text-muted-foreground">
              Showing {filteredBills.length} of {bills.length} bills
            </div>
          )}
        </CardContent>
      </Card>

      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">All Bills ({filteredBills.length})</TabsTrigger>
          <TabsTrigger value="pending">Pending ({pendingBills.length})</TabsTrigger>
          <TabsTrigger value="partial">Partial ({partialBills.length})</TabsTrigger>
          <TabsTrigger value="paid">Paid ({paidBills.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          <BillsList bills={filteredBills} onPayment={handlePayment} onRefresh={fetchBills} />
        </TabsContent>

        <TabsContent value="pending">
          <BillsList bills={pendingBills} onPayment={handlePayment} onRefresh={fetchBills} />
        </TabsContent>

        <TabsContent value="partial">
          <BillsList bills={partialBills} onPayment={handlePayment} onRefresh={fetchBills} />
        </TabsContent>

        <TabsContent value="paid">
          <BillsList bills={paidBills} onPayment={handlePayment} onRefresh={fetchBills} />
        </TabsContent>
      </Tabs>

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
