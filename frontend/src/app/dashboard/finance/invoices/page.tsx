'use client';

import { useState, useEffect, useRef } from 'react';
import { Plus, Download, Eye, Mail, Trash2, Edit, X } from 'lucide-react';
import { invoicesAPI } from '@/lib/api/financeAPI';
import { validateInvoice } from '@/utils/validation';
import { useKeyboardShortcuts, financePageShortcuts, ShortcutsHelp } from '@/hooks/useKeyboardShortcuts';
import { useToast } from '@/hooks/use-toast';

interface LineItem {
  description: string;
  quantity: number;
  unitPrice: number;
  gstRate: number;
  amount: number;
  cgst: number;
  sgst: number;
  igst: number;
  total: number;
}

interface Invoice {
  _id: string;
  invoiceNumber: string;
  customerName: string;
  customerEmail?: string;
  customerGSTNo?: string;
  items: LineItem[];
  subtotal: number;
  totalGST: number;
  totalAmount: number;
  paidAmount: number;
  balanceAmount: number;
  status: string;
  issueDate: string;
  dueDate: string;
  notes?: string;
}

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showShortcutsHelp, setShowShortcutsHelp] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchInvoices();
  }, []);

  const fetchInvoices = async () => {
    try {
      const data = await invoicesAPI.getAll();
      setInvoices(data.data || []);
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to load invoices', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (invoice: Invoice) => {
    setEditingInvoice(invoice);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this invoice?')) return;
    try {
      await invoicesAPI.delete(id);
      toast({ title: 'Success', description: 'Invoice deleted' });
      fetchInvoices();
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to delete invoice', variant: 'destructive' });
    }
  };

  const handleSendEmail = async (id: string) => {
    try {
      await invoicesAPI.sendEmail(id, {});
      toast({ title: 'Success', description: 'Invoice sent via email' });
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to send email', variant: 'destructive' });
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      draft: 'bg-gray-100 text-gray-800',
      sent: 'bg-blue-100 text-blue-800',
      paid: 'bg-green-100 text-green-800',
      partial: 'bg-yellow-100 text-yellow-800',
      overdue: 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  if (loading) return <div className="p-6">Loading invoices...</div>;

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Invoices</h1>
        <button
          onClick={() => { setEditingInvoice(null); setShowForm(true); }}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          <Plus size={20} /> New Invoice
        </button>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Invoice #</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Paid</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Balance</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Due Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {invoices.map((invoice) => (
              <tr key={invoice._id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">{invoice.invoiceNumber}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">{invoice.customerName}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">₹{invoice.totalAmount.toLocaleString()}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">₹{invoice.paidAmount.toLocaleString()}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">₹{invoice.balanceAmount.toLocaleString()}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(invoice.status)}`}>
                    {invoice.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">{new Date(invoice.dueDate).toLocaleDateString()}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <div className="flex gap-2">
                    <button onClick={() => handleEdit(invoice)} className="text-blue-600 hover:text-blue-800" title="Edit">
                      <Edit size={18} />
                    </button>
                    <button className="text-purple-600 hover:text-purple-800" title="View">
                      <Eye size={18} />
                    </button>
                    <button className="text-green-600 hover:text-green-800" title="Download PDF">
                      <Download size={18} />
                    </button>
                    <button onClick={() => handleSendEmail(invoice._id)} className="text-indigo-600 hover:text-indigo-800" title="Send Email">
                      <Mail size={18} />
                    </button>
                    <button onClick={() => handleDelete(invoice._id)} className="text-red-600 hover:text-red-800" title="Delete">
                      <Trash2 size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showForm && (
        <InvoiceForm
          invoice={editingInvoice}
          onClose={() => { setShowForm(false); setEditingInvoice(null); }}
          onSuccess={fetchInvoices}
        />
      )}
    </div>
  );
}

function InvoiceForm({ invoice, onClose, onSuccess }: { invoice?: Invoice | null; onClose: () => void; onSuccess: () => void }) {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    customerName: invoice?.customerName || '',
    customerEmail: invoice?.customerEmail || '',
    customerGSTNo: invoice?.customerGSTNo || '',
    issueDate: invoice?.issueDate?.split('T')[0] || new Date().toISOString().split('T')[0],
    dueDate: invoice?.dueDate?.split('T')[0] || '',
    items: invoice?.items || [{ description: '', quantity: 1, unitPrice: 0, gstRate: 18 }],
    notes: invoice?.notes || '',
    isInterState: false // For IGST vs CGST+SGST
  });

  const calculateLineItem = (item: any) => {
    const quantity = parseFloat(item.quantity) || 0;
    const unitPrice = parseFloat(item.unitPrice) || 0;
    const gstRate = parseFloat(item.gstRate) || 0;
    const amount = quantity * unitPrice;
    const gstAmount = (amount * gstRate) / 100;

    if (formData.isInterState) {
      return {
        ...item,
        amount,
        igst: gstAmount,
        cgst: 0,
        sgst: 0,
        total: amount + gstAmount
      };
    } else {
      return {
        ...item,
        amount,
        cgst: gstAmount / 2,
        sgst: gstAmount / 2,
        igst: 0,
        total: amount + gstAmount
      };
    }
  };

  const addLineItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { description: '', quantity: 1, unitPrice: 0, gstRate: 18 }]
    });
  };

  const removeLineItem = (index: number) => {
    setFormData({
      ...formData,
      items: formData.items.filter((_, i) => i !== index)
    });
  };

  const updateLineItem = (index: number, field: string, value: any) => {
    const updatedItems = [...formData.items];
    updatedItems[index] = { ...updatedItems[index], [field]: value };
    setFormData({ ...formData, items: updatedItems });
  };

  const calculatedItems = formData.items.map(calculateLineItem);
  const subtotal = calculatedItems.reduce((sum, item) => sum + item.amount, 0);
  const totalGST = calculatedItems.reduce((sum, item) => sum + item.cgst + item.sgst + item.igst, 0);
  const grandTotal = subtotal + totalGST;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const payload = {
      ...formData,
      items: calculatedItems,
      subtotal,
      totalGST,
      totalAmount: grandTotal
    };

    // Validation
    const validation = validateInvoice(payload);
    if (!validation.isValid) {
      toast({
        title: 'Validation Error',
        description: validation.errors.join(', '),
        variant: 'destructive'
      });
      return;
    }

    try {
      if (invoice) {
        await invoicesAPI.update(invoice._id, payload);
        toast({ title: 'Success', description: 'Invoice updated' });
      } else {
        await invoicesAPI.create(payload);
        toast({ title: 'Success', description: 'Invoice created' });
      }
      onSuccess();
      onClose();
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to save invoice', variant: 'destructive' });
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-5xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">{invoice ? 'Edit Invoice' : 'Create Invoice'}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Customer Details */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Customer Name *</label>
              <input
                type="text"
                className="w-full border rounded px-3 py-2"
                value={formData.customerName}
                onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Customer Email</label>
              <input
                type="email"
                className="w-full border rounded px-3 py-2"
                value={formData.customerEmail}
                onChange={(e) => setFormData({ ...formData, customerEmail: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Customer GST No</label>
              <input
                type="text"
                className="w-full border rounded px-3 py-2"
                placeholder="22AAAAA0000A1Z5"
                value={formData.customerGSTNo}
                onChange={(e) => setFormData({ ...formData, customerGSTNo: e.target.value })}
              />
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Issue Date *</label>
              <input
                type="date"
                className="w-full border rounded px-3 py-2"
                value={formData.issueDate}
                onChange={(e) => setFormData({ ...formData, issueDate: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Due Date *</label>
              <input
                type="date"
                className="w-full border rounded px-3 py-2"
                value={formData.dueDate}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                required
              />
            </div>
            <div className="flex items-center pt-6">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.isInterState}
                  onChange={(e) => setFormData({ ...formData, isInterState: e.target.checked })}
                />
                <span className="text-sm">Inter-state (IGST)</span>
              </label>
            </div>
          </div>

          {/* Line Items */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-medium">Line Items</h3>
              <button type="button" onClick={addLineItem} className="text-blue-600 text-sm hover:underline">
                + Add Item
              </button>
            </div>
            <div className="border rounded overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Description</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Qty</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Unit Price</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">GST %</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Amount</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Tax</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Total</th>
                    <th className="px-3 py-2"></th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {formData.items.map((item, index) => {
                    const calc = calculatedItems[index];
                    return (
                      <tr key={index}>
                        <td className="px-3 py-2">
                          <input
                            type="text"
                            className="w-full border rounded px-2 py-1 text-sm"
                            value={item.description}
                            onChange={(e) => updateLineItem(index, 'description', e.target.value)}
                            placeholder="Item description"
                          />
                        </td>
                        <td className="px-3 py-2">
                          <input
                            type="number"
                            className="w-20 border rounded px-2 py-1 text-sm"
                            value={item.quantity}
                            onChange={(e) => updateLineItem(index, 'quantity', e.target.value)}
                            min="0.01"
                            step="0.01"
                          />
                        </td>
                        <td className="px-3 py-2">
                          <input
                            type="number"
                            className="w-24 border rounded px-2 py-1 text-sm"
                            value={item.unitPrice}
                            onChange={(e) => updateLineItem(index, 'unitPrice', e.target.value)}
                            min="0"
                            step="0.01"
                          />
                        </td>
                        <td className="px-3 py-2">
                          <select
                            className="w-20 border rounded px-2 py-1 text-sm"
                            value={item.gstRate}
                            onChange={(e) => updateLineItem(index, 'gstRate', e.target.value)}
                          >
                            <option value="0">0%</option>
                            <option value="5">5%</option>
                            <option value="12">12%</option>
                            <option value="18">18%</option>
                            <option value="28">28%</option>
                          </select>
                        </td>
                        <td className="px-3 py-2 text-sm">₹{calc.amount.toFixed(2)}</td>
                        <td className="px-3 py-2 text-sm">₹{(calc.cgst + calc.sgst + calc.igst).toFixed(2)}</td>
                        <td className="px-3 py-2 text-sm font-medium">₹{calc.total.toFixed(2)}</td>
                        <td className="px-3 py-2">
                          {formData.items.length > 1 && (
                            <button type="button" onClick={() => removeLineItem(index)} className="text-red-600 hover:text-red-800">
                              <X size={16} />
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Totals */}
          <div className="flex justify-end">
            <div className="w-80 space-y-2 bg-gray-50 p-4 rounded">
              <div className="flex justify-between text-sm">
                <span>Subtotal:</span>
                <span>₹{subtotal.toFixed(2)}</span>
              </div>
              {formData.isInterState ? (
                <div className="flex justify-between text-sm">
                  <span>IGST:</span>
                  <span>₹{totalGST.toFixed(2)}</span>
                </div>
              ) : (
                <>
                  <div className="flex justify-between text-sm">
                    <span>CGST:</span>
                    <span>₹{(totalGST / 2).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>SGST:</span>
                    <span>₹{(totalGST / 2).toFixed(2)}</span>
                  </div>
                </>
              )}
              <div className="flex justify-between font-bold text-lg border-t pt-2">
                <span>Grand Total:</span>
                <span>₹{grandTotal.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium mb-1">Notes</label>
            <textarea
              className="w-full border rounded px-3 py-2"
              rows={3}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Additional notes or terms..."
            />
          </div>

          {/* Actions */}
          <div className="flex gap-2 justify-end">
            <button type="button" onClick={onClose} className="px-4 py-2 border rounded hover:bg-gray-50">
              Cancel
            </button>
            <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
              {invoice ? 'Update Invoice' : 'Create Invoice'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
