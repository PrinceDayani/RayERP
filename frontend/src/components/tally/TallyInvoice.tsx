'use client';

import { useState, useEffect } from 'react';
import { Plus, Download, Eye, FileText, Calculator } from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Switch } from '../ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Badge } from '../ui/badge';
import { toast } from 'react-hot-toast';
import InvoiceViewer from './InvoiceViewer';
import { tallyInvoiceAPI, TallyInvoice as TallyInvoiceType, TallyInvoiceData } from '../../lib/api/tallyInvoiceAPI';

interface LineItem {
  description: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  amount: number;
}

interface TallyInvoice {
  _id: string;
  invoiceNumber: string;
  workOrderNumber?: string;
  partyName: string;
  partyEmail?: string;
  partyAddress?: string;
  partyGSTIN?: string;
  totalAmount: number;
  subtotal: number;
  gstEnabled: boolean;
  gstRate?: number;
  cgstAmount?: number;
  sgstAmount?: number;
  igstAmount?: number;
  gstTotalAmount?: number;
  status: string;
  invoiceDate: string;
  dueDate: string;
  lineItems: LineItem[];
  notes?: string;
  currency?: string;
  exchangeRate?: number;
  paymentTerms?: string;
  paidAmount?: number;
  balanceAmount?: number;
}

export default function TallyInvoice() {
  const [invoices, setInvoices] = useState<TallyInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [viewingInvoice, setViewingInvoice] = useState<string | null>(null);

  useEffect(() => {
    fetchInvoices();
  }, []);

  const fetchInvoices = async () => {
    try {
      const result = await tallyInvoiceAPI.getAll();
      
      if (result.success && result.data) {
        setInvoices(result.data);
      } else {
        toast.error(result.message || 'Failed to fetch invoices');
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to fetch invoices');
    } finally {
      setLoading(false);
    }
  };

  const downloadPDF = async (invoiceId: string, invoiceNumber: string) => {
    try {
      const result = await tallyInvoiceAPI.downloadPDF(invoiceId, invoiceNumber);
      
      if (result.success) {
        toast.success(result.message || 'Invoice downloaded successfully');
      } else {
        toast.error(result.message || 'Failed to download invoice');
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to download invoice');
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Tally-Style Invoices</h1>
          <p className="text-gray-600 mt-1">Create and manage GST-compliant invoices with QR codes</p>
        </div>
        <Dialog open={showForm} onOpenChange={setShowForm}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus size={20} />
              New Tally Invoice
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create Tally-Style Invoice</DialogTitle>
            </DialogHeader>
            <TallyInvoiceForm onClose={() => setShowForm(false)} onSuccess={fetchInvoices} />
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Invoices</p>
                <p className="text-2xl font-bold">{invoices.length}</p>
              </div>
              <FileText className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">GST Invoices</p>
                <p className="text-2xl font-bold">{invoices.filter(inv => inv.gstEnabled).length}</p>
              </div>
              <Calculator className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div>
              <p className="text-sm text-gray-600">Total Amount</p>
              <p className="text-2xl font-bold">₹{invoices.reduce((sum, inv) => sum + inv.totalAmount, 0).toLocaleString()}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div>
              <p className="text-sm text-gray-600">GST Amount</p>
              <p className="text-2xl font-bold">₹{invoices.reduce((sum, inv) => sum + (inv.gstTotalAmount || 0), 0).toLocaleString()}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Invoices Table */}
      <Card>
        <CardHeader>
          <CardTitle>Invoice List</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Invoice Details
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Party
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    GST
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {invoices.map((invoice) => (
                  <tr key={invoice._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{invoice.invoiceNumber}</div>
                        {invoice.workOrderNumber && (
                          <div className="text-sm text-blue-600 font-medium">WO: {invoice.workOrderNumber}</div>
                        )}
                        <div className="text-sm text-gray-500">{new Date(invoice.invoiceDate).toLocaleDateString('en-IN')}</div>
                        <div className="text-xs text-gray-400">Due: {new Date(invoice.dueDate).toLocaleDateString('en-IN')}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{invoice.partyName}</div>
                        {invoice.partyGSTIN && (
                          <div className="text-sm text-gray-500">GSTIN: {invoice.partyGSTIN}</div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ₹{invoice.totalAmount.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {invoice.gstEnabled ? (
                        <div>
                          <Badge variant="secondary" className="mb-1">GST {invoice.gstRate}%</Badge>
                          <div className="text-sm text-green-600 font-medium">₹{(invoice.gstTotalAmount || 0).toLocaleString()}</div>
                          {invoice.cgstAmount > 0 && (
                            <div className="text-xs text-gray-500">
                              CGST: ₹{invoice.cgstAmount.toLocaleString()}<br/>
                              SGST: ₹{invoice.sgstAmount.toLocaleString()}
                            </div>
                          )}
                          {invoice.igstAmount > 0 && (
                            <div className="text-xs text-gray-500">
                              IGST: ₹{invoice.igstAmount.toLocaleString()}
                            </div>
                          )}
                        </div>
                      ) : (
                        <Badge variant="outline">No GST</Badge>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge className={getStatusColor(invoice.status)}>
                        {invoice.status}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => downloadPDF(invoice._id, invoice.invoiceNumber)}
                        >
                          <Download size={16} />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setViewingInvoice(invoice._id)}
                        >
                          <Eye size={16} />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Invoice Viewer Modal */}
      {viewingInvoice && (
        <Dialog open={!!viewingInvoice} onOpenChange={() => setViewingInvoice(null)}>
          <DialogContent className="max-w-6xl max-h-[95vh] overflow-y-auto">
            <InvoiceViewer 
              invoiceId={viewingInvoice} 
              onClose={() => setViewingInvoice(null)} 
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

function TallyInvoiceForm({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [formData, setFormData] = useState({
    partyName: '',
    partyEmail: '',
    partyAddress: '',
    partyGSTIN: '',
    workOrderNumber: '',
    gstEnabled: false,
    gstRate: 18,
    invoiceDate: new Date().toISOString().split('T')[0],
    dueDate: '',
    notes: '',
    lineItems: [{ description: '', quantity: 1, unitPrice: 0, discount: 0 }]
  });

  const [loading, setLoading] = useState(false);

  const addLineItem = () => {
    setFormData({
      ...formData,
      lineItems: [...formData.lineItems, { description: '', quantity: 1, unitPrice: 0, discount: 0 }]
    });
  };

  const removeLineItem = (index: number) => {
    const newItems = formData.lineItems.filter((_, i) => i !== index);
    setFormData({ ...formData, lineItems: newItems });
  };

  const updateLineItem = (index: number, field: string, value: any) => {
    const newItems = [...formData.lineItems];
    newItems[index] = { ...newItems[index], [field]: value };
    setFormData({ ...formData, lineItems: newItems });
  };

  const calculateTotals = () => {
    const subtotal = formData.lineItems.reduce((sum, item) => {
      const amount = (item.quantity * item.unitPrice) - (item.discount || 0);
      return sum + amount;
    }, 0);

    const gstAmount = formData.gstEnabled ? (subtotal * formData.gstRate) / 100 : 0;
    const total = subtotal + gstAmount;

    return { subtotal, gstAmount, total };
  };

  const { subtotal, gstAmount, total } = calculateTotals();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate GSTIN if provided
      if (formData.partyGSTIN && !tallyInvoiceAPI.validateGSTIN(formData.partyGSTIN)) {
        toast.error('Invalid GSTIN format. Please check and try again.');
        setLoading(false);
        return;
      }

      const invoiceData: TallyInvoiceData = {
        partyName: formData.partyName,
        partyEmail: formData.partyEmail || undefined,
        partyAddress: formData.partyAddress || undefined,
        partyGSTIN: formData.partyGSTIN || undefined,
        workOrderNumber: formData.workOrderNumber || undefined,
        gstEnabled: formData.gstEnabled,
        gstRate: formData.gstEnabled ? formData.gstRate : undefined,
        invoiceDate: formData.invoiceDate,
        dueDate: formData.dueDate,
        lineItems: formData.lineItems,
        notes: formData.notes || undefined
      };

      const result = await tallyInvoiceAPI.create(invoiceData);
      
      if (result.success) {
        toast.success('Tally invoice created successfully');
        onSuccess();
        onClose();
      } else {
        toast.error(result.message || 'Failed to create invoice');
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to create invoice');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Party Details */}
      <Card>
        <CardHeader>
          <CardTitle>Party Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="partyName">Party Name *</Label>
              <Input
                id="partyName"
                value={formData.partyName}
                onChange={(e) => setFormData({ ...formData, partyName: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="partyEmail">Party Email</Label>
              <Input
                id="partyEmail"
                type="email"
                value={formData.partyEmail}
                onChange={(e) => setFormData({ ...formData, partyEmail: e.target.value })}
              />
            </div>
          </div>
          <div>
            <Label htmlFor="partyAddress">Party Address</Label>
            <Textarea
              id="partyAddress"
              value={formData.partyAddress}
              onChange={(e) => setFormData({ ...formData, partyAddress: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="partyGSTIN">Party GSTIN</Label>
              <Input
                id="partyGSTIN"
                value={formData.partyGSTIN}
                onChange={(e) => {
                  const gstin = e.target.value.toUpperCase();
                  setFormData({ ...formData, partyGSTIN: gstin });
                }}
                placeholder="27XXXXXXXXXXXXX"
                className={formData.partyGSTIN && !tallyInvoiceAPI.validateGSTIN(formData.partyGSTIN) ? 'border-red-500' : ''}
              />
              {formData.partyGSTIN && !tallyInvoiceAPI.validateGSTIN(formData.partyGSTIN) && (
                <p className="text-sm text-red-600 mt-1">Invalid GSTIN format</p>
              )}
              {formData.partyGSTIN && tallyInvoiceAPI.validateGSTIN(formData.partyGSTIN) && (
                <p className="text-sm text-green-600 mt-1">Valid GSTIN format</p>
              )}
            </div>
            <div>
              <Label htmlFor="workOrderNumber">Work Order Number</Label>
              <Input
                id="workOrderNumber"
                value={formData.workOrderNumber}
                onChange={(e) => setFormData({ ...formData, workOrderNumber: e.target.value })}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Invoice Details */}
      <Card>
        <CardHeader>
          <CardTitle>Invoice Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="invoiceDate">Invoice Date *</Label>
              <Input
                id="invoiceDate"
                type="date"
                value={formData.invoiceDate}
                onChange={(e) => setFormData({ ...formData, invoiceDate: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="dueDate">Due Date *</Label>
              <Input
                id="dueDate"
                type="date"
                value={formData.dueDate}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                required
              />
            </div>
          </div>
          
          {/* GST Settings */}
          <div className="flex items-center space-x-2">
            <Switch
              id="gstEnabled"
              checked={formData.gstEnabled}
              onCheckedChange={(checked) => setFormData({ ...formData, gstEnabled: checked })}
            />
            <Label htmlFor="gstEnabled">Enable GST</Label>
          </div>
          
          {formData.gstEnabled && (
            <div>
              <Label htmlFor="gstRate">GST Rate (%)</Label>
              <Select
                value={formData.gstRate.toString()}
                onValueChange={(value) => setFormData({ ...formData, gstRate: parseInt(value) })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5%</SelectItem>
                  <SelectItem value="12">12%</SelectItem>
                  <SelectItem value="18">18%</SelectItem>
                  <SelectItem value="28">28%</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Line Items */}
      <Card>
        <CardHeader>
          <CardTitle className="flex justify-between items-center">
            Line Items
            <Button type="button" onClick={addLineItem} variant="outline" size="sm">
              <Plus size={16} className="mr-1" />
              Add Item
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {formData.lineItems.map((item, index) => (
              <div key={index} className="grid grid-cols-12 gap-2 items-end">
                <div className="col-span-4">
                  <Label>Description</Label>
                  <Input
                    value={item.description}
                    onChange={(e) => updateLineItem(index, 'description', e.target.value)}
                    placeholder="Item description"
                  />
                </div>
                <div className="col-span-2">
                  <Label>Quantity</Label>
                  <Input
                    type="number"
                    value={item.quantity}
                    onChange={(e) => updateLineItem(index, 'quantity', parseFloat(e.target.value) || 0)}
                    min="0"
                    step="0.01"
                  />
                </div>
                <div className="col-span-2">
                  <Label>Unit Price</Label>
                  <Input
                    type="number"
                    value={item.unitPrice}
                    onChange={(e) => updateLineItem(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                    min="0"
                    step="0.01"
                  />
                </div>
                <div className="col-span-2">
                  <Label>Discount</Label>
                  <Input
                    type="number"
                    value={item.discount}
                    onChange={(e) => updateLineItem(index, 'discount', parseFloat(e.target.value) || 0)}
                    min="0"
                    step="0.01"
                  />
                </div>
                <div className="col-span-1">
                  <Label>Amount</Label>
                  <div className="text-sm font-medium p-2 bg-gray-50 rounded">
                    ₹{((item.quantity * item.unitPrice) - (item.discount || 0)).toFixed(2)}
                  </div>
                </div>
                <div className="col-span-1">
                  {formData.lineItems.length > 1 && (
                    <Button
                      type="button"
                      onClick={() => removeLineItem(index)}
                      variant="outline"
                      size="sm"
                      className="text-red-600"
                    >
                      ×
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Enhanced Totals with GST Breakdown */}
      <Card className="border-2 border-green-200">
        <CardHeader className="bg-green-50">
          <CardTitle className="text-green-800">Invoice Summary</CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="space-y-3">
            <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
              <span className="font-medium">Subtotal:</span>
              <span className="font-bold">{tallyInvoiceAPI.formatCurrency(subtotal)}</span>
            </div>
            
            {formData.gstEnabled && (
              <div className="bg-blue-50 p-3 rounded border border-blue-200">
                <div className="text-sm font-medium text-blue-800 mb-2">GST Breakdown ({formData.gstRate}%)</div>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>CGST ({formData.gstRate / 2}%):</span>
                    <span>{tallyInvoiceAPI.formatCurrency(gstAmount / 2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>SGST ({formData.gstRate / 2}%):</span>
                    <span>{tallyInvoiceAPI.formatCurrency(gstAmount / 2)}</span>
                  </div>
                  <div className="flex justify-between font-medium border-t pt-1">
                    <span>Total GST:</span>
                    <span>{tallyInvoiceAPI.formatCurrency(gstAmount)}</span>
                  </div>
                </div>
              </div>
            )}
            
            <div className="flex justify-between items-center p-3 bg-green-100 rounded border-2 border-green-300">
              <span className="font-bold text-lg text-green-800">Grand Total:</span>
              <span className="font-bold text-xl text-green-900">{tallyInvoiceAPI.formatCurrency(total)}</span>
            </div>
            
            {formData.workOrderNumber && (
              <div className="bg-yellow-50 p-2 rounded border border-yellow-200">
                <div className="text-sm text-yellow-800">
                  <strong>Work Order:</strong> {formData.workOrderNumber}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Notes */}
      <div>
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          placeholder="Additional notes or terms..."
        />
      </div>

      {/* Actions */}
      <div className="flex gap-2 justify-end">
        <Button type="button" onClick={onClose} variant="outline">
          Cancel
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? 'Creating...' : 'Create Invoice'}
        </Button>
      </div>
    </form>
  );
}