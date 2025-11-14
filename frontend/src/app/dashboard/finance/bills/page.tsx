'use client';

import { useState, useEffect } from 'react';
import { getBillDetails, createBillDetail, updateBillPayment, getBillStatement, getAccounts } from '@/lib/api/generalLedgerAPI';

export default function BillsPage() {
  const [accounts, setAccounts] = useState<any[]>([]);
  const [selectedAccount, setSelectedAccount] = useState('');
  const [bills, setBills] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    accountId: '',
    billReference: '',
    billDate: '',
    billAmount: 0,
    dueDate: ''
  });

  useEffect(() => {
    loadAccounts();
  }, []);

  const loadAccounts = async () => {
    try {
      const res = await getAccounts({ enableBillTracking: true });
      setAccounts(res.accounts || []);
    } catch (error) {
      console.error('Error loading accounts:', error);
    }
  };

  const loadBills = async (accountId: string) => {
    try {
      const data = await getBillStatement(accountId);
      setBills(data.bills || []);
      setSummary(data.summary);
    } catch (error) {
      console.error('Error loading bills:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createBillDetail(formData);
      setShowForm(false);
      if (selectedAccount) loadBills(selectedAccount);
      setFormData({ accountId: '', billReference: '', billDate: '', billAmount: 0, dueDate: '' });
    } catch (error) {
      console.error('Error creating bill:', error);
    }
  };

  const handlePayment = async (billId: string, amount: number) => {
    try {
      await updateBillPayment(billId, { paymentAmount: amount });
      if (selectedAccount) loadBills(selectedAccount);
    } catch (error) {
      console.error('Error recording payment:', error);
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Bill-wise Details</h1>
        <button onClick={() => setShowForm(!showForm)} className="px-4 py-2 bg-blue-600 text-white rounded">
          {showForm ? 'Cancel' : 'New Bill'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded shadow mb-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block mb-2">Account</label>
              <select value={formData.accountId} onChange={(e) => setFormData({...formData, accountId: e.target.value})} className="w-full border p-2 rounded" required>
                <option value="">Select Account</option>
                {accounts.map(acc => <option key={acc._id} value={acc._id}>{acc.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block mb-2">Bill Reference</label>
              <input type="text" value={formData.billReference} onChange={(e) => setFormData({...formData, billReference: e.target.value})} className="w-full border p-2 rounded" required />
            </div>
            <div>
              <label className="block mb-2">Bill Date</label>
              <input type="date" value={formData.billDate} onChange={(e) => setFormData({...formData, billDate: e.target.value})} className="w-full border p-2 rounded" required />
            </div>
            <div>
              <label className="block mb-2">Amount</label>
              <input type="number" value={formData.billAmount} onChange={(e) => setFormData({...formData, billAmount: Number(e.target.value)})} className="w-full border p-2 rounded" required />
            </div>
            <div>
              <label className="block mb-2">Due Date</label>
              <input type="date" value={formData.dueDate} onChange={(e) => setFormData({...formData, dueDate: e.target.value})} className="w-full border p-2 rounded" />
            </div>
          </div>
          <button type="submit" className="mt-4 px-4 py-2 bg-green-600 text-white rounded">Create Bill</button>
        </form>
      )}

      <div className="bg-white p-6 rounded shadow mb-6">
        <label className="block mb-2">Select Account</label>
        <select value={selectedAccount} onChange={(e) => { setSelectedAccount(e.target.value); loadBills(e.target.value); }} className="w-full border p-2 rounded">
          <option value="">Select Account</option>
          {accounts.map(acc => <option key={acc._id} value={acc._id}>{acc.name}</option>)}
        </select>
      </div>

      {summary && (
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded shadow">
            <div className="text-sm text-gray-600">Total Bills</div>
            <div className="text-2xl font-bold">{summary.totalBills}</div>
          </div>
          <div className="bg-white p-4 rounded shadow">
            <div className="text-sm text-gray-600">Total Amount</div>
            <div className="text-2xl font-bold">₹{summary.totalAmount?.toFixed(2)}</div>
          </div>
          <div className="bg-white p-4 rounded shadow">
            <div className="text-sm text-gray-600">Total Paid</div>
            <div className="text-2xl font-bold text-green-600">₹{summary.totalPaid?.toFixed(2)}</div>
          </div>
          <div className="bg-white p-4 rounded shadow">
            <div className="text-sm text-gray-600">Balance</div>
            <div className="text-2xl font-bold text-red-600">₹{summary.totalBalance?.toFixed(2)}</div>
          </div>
        </div>
      )}

      <div className="bg-white rounded shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left">Bill Ref</th>
              <th className="px-4 py-3 text-left">Date</th>
              <th className="px-4 py-3 text-right">Amount</th>
              <th className="px-4 py-3 text-right">Paid</th>
              <th className="px-4 py-3 text-right">Balance</th>
              <th className="px-4 py-3 text-center">Status</th>
              <th className="px-4 py-3 text-center">Action</th>
            </tr>
          </thead>
          <tbody>
            {bills.map(bill => (
              <tr key={bill._id} className="border-t">
                <td className="px-4 py-3">{bill.billReference}</td>
                <td className="px-4 py-3">{new Date(bill.billDate).toLocaleDateString()}</td>
                <td className="px-4 py-3 text-right">₹{bill.billAmount.toFixed(2)}</td>
                <td className="px-4 py-3 text-right">₹{bill.paidAmount.toFixed(2)}</td>
                <td className="px-4 py-3 text-right">₹{bill.balanceAmount.toFixed(2)}</td>
                <td className="px-4 py-3 text-center">
                  <span className={`px-2 py-1 rounded text-xs ${bill.status === 'paid' ? 'bg-green-100 text-green-800' : bill.status === 'partial' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>
                    {bill.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-center">
                  {bill.status !== 'paid' && (
                    <button onClick={() => {
                      const amt = prompt('Enter payment amount:', bill.balanceAmount.toString());
                      if (amt) handlePayment(bill._id, Number(amt));
                    }} className="text-blue-600 hover:underline">Pay</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
