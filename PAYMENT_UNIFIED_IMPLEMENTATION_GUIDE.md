# Unified Payment Module - Implementation Guide

## 📋 Overview
This guide walks you through implementing the unified payment system that supports both invoice-based and independent payments.

---

## 🚀 Quick Start

### Step 1: Backend Setup

#### 1.1 Replace Payment Model
```bash
# Backup existing model
cp backend/src/models/Payment.ts backend/src/models/Payment.ts.backup

# Use new unified model
cp backend/src/models/PaymentUnified.ts backend/src/models/Payment.ts
```

#### 1.2 Add Unified Controller
```bash
# Keep existing controller as backup
mv backend/src/controllers/paymentController.ts backend/src/controllers/paymentController.ts.backup

# Use new unified controller
cp backend/src/controllers/paymentUnifiedController.ts backend/src/controllers/paymentController.ts
```

#### 1.3 Update Routes
Add to `backend/src/server.ts`:
```typescript
import paymentUnifiedRoutes from './routes/paymentUnified.routes';

// Add route
app.use('/api/payments', paymentUnifiedRoutes);
```

#### 1.4 Run Migration (Optional)
If you have existing data:
```bash
cd backend
node scripts/migratePayments.js
```

---

## 📝 API Usage Examples

### Example 1: Create Invoice-Based Payment

```bash
curl -X POST http://localhost:5000/api/payments/invoice-based \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "customerId": "64abc123...",
    "totalAmount": 50000,
    "paymentDate": "2024-01-15",
    "paymentMethod": "BANK_TRANSFER",
    "reference": "TXN123456",
    "allocations": [
      {
        "invoiceId": "64def456...",
        "amount": 30000
      },
      {
        "invoiceId": "64def789...",
        "amount": 20000
      }
    ]
  }'
```

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "...",
    "paymentNumber": "PAY-202401-0001",
    "paymentType": "invoice-based",
    "totalAmount": 50000,
    "allocatedAmount": 50000,
    "unappliedAmount": 0,
    "allocations": [
      {
        "invoiceId": "...",
        "invoiceNumber": "INV-2024-0001",
        "amount": 30000
      },
      {
        "invoiceId": "...",
        "invoiceNumber": "INV-2024-0002",
        "amount": 20000
      }
    ]
  },
  "message": "Payment created and applied to invoices successfully"
}
```

### Example 2: Create Independent Payment (Advance)

```bash
curl -X POST http://localhost:5000/api/payments/independent \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "customerId": "64abc123...",
    "totalAmount": 100000,
    "paymentDate": "2024-01-15",
    "paymentMethod": "CASH",
    "purpose": "Advance payment for Q1 orders",
    "category": "advance"
  }'
```

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "...",
    "paymentNumber": "PAY-202401-0002",
    "paymentType": "independent",
    "totalAmount": 100000,
    "allocatedAmount": 0,
    "unappliedAmount": 100000,
    "purpose": "Advance payment for Q1 orders",
    "category": "advance"
  },
  "message": "Independent payment created successfully"
}
```

### Example 3: Allocate Unapplied Payment to Invoice

```bash
curl -X POST http://localhost:5000/api/payments/PAY-202401-0002/allocate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "invoiceId": "64ghi012...",
    "amount": 40000
  }'
```

**Response:**
```json
{
  "success": true,
  "data": {
    "paymentNumber": "PAY-202401-0002",
    "totalAmount": 100000,
    "allocatedAmount": 40000,
    "unappliedAmount": 60000,
    "allocations": [
      {
        "invoiceId": "...",
        "invoiceNumber": "INV-2024-0003",
        "amount": 40000,
        "allocationDate": "2024-01-20T10:30:00Z"
      }
    ]
  },
  "message": "Payment allocated to invoice successfully"
}
```

### Example 4: Get Customer Outstanding Invoices

```bash
curl -X GET http://localhost:5000/api/payments/customer/64abc123.../outstanding-invoices \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "invoices": [
      {
        "invoiceNumber": "INV-2024-0004",
        "invoiceDate": "2024-01-10",
        "dueDate": "2024-02-10",
        "totalAmount": 75000,
        "paidAmount": 25000,
        "balanceAmount": 50000,
        "status": "PARTIALLY_PAID"
      },
      {
        "invoiceNumber": "INV-2024-0005",
        "invoiceDate": "2024-01-12",
        "dueDate": "2024-02-12",
        "totalAmount": 30000,
        "paidAmount": 0,
        "balanceAmount": 30000,
        "status": "SENT"
      }
    ],
    "totalOutstanding": 80000,
    "count": 2
  }
}
```

### Example 5: Get Customer Unapplied Payments

```bash
curl -X GET http://localhost:5000/api/payments/customer/64abc123.../unapplied-payments \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "payments": [
      {
        "paymentNumber": "PAY-202401-0002",
        "paymentDate": "2024-01-15",
        "totalAmount": 100000,
        "allocatedAmount": 40000,
        "unappliedAmount": 60000,
        "paymentMethod": "CASH"
      }
    ],
    "totalUnapplied": 60000,
    "count": 1
  }
}
```

### Example 6: Get Payments with Filters

```bash
# Get all invoice-based payments
curl -X GET "http://localhost:5000/api/payments?paymentType=invoice-based&page=1&limit=20" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Get payments with unapplied balance
curl -X GET "http://localhost:5000/api/payments?hasUnapplied=true" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Get customer payments
curl -X GET "http://localhost:5000/api/payments?customerId=64abc123..." \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 🎨 Frontend Implementation

### Component Structure
```
src/
├── app/
│   └── dashboard/
│       └── finance/
│           └── payments/
│               ├── page.tsx                    # Payment list
│               ├── create/
│               │   └── page.tsx                # Unified payment form
│               └── [id]/
│                   ├── view/
│                   │   └── page.tsx            # Payment details
│                   └── allocate/
│                       └── page.tsx            # Allocate unapplied
└── components/
    └── payments/
        ├── PaymentForm.tsx                     # Main form component
        ├── PaymentTypeToggle.tsx               # Invoice-based vs Independent
        ├── InvoiceAllocationSection.tsx        # Invoice selection & allocation
        ├── IndependentPaymentSection.tsx       # Purpose & category
        ├── PaymentDetailsSection.tsx           # Common fields
        ├── OutstandingInvoicesTable.tsx        # Customer invoices
        ├── UnappliedPaymentsList.tsx           # Unapplied payments
        └── AllocationModal.tsx                 # Allocate to invoice
```

### Key Components

#### 1. Payment Form (Unified)
```typescript
// components/payments/PaymentForm.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

export default function PaymentForm() {
  const router = useRouter();
  const [paymentType, setPaymentType] = useState<'invoice-based' | 'independent'>('invoice-based');
  const [formData, setFormData] = useState({
    customerId: '',
    totalAmount: 0,
    paymentDate: new Date().toISOString().split('T')[0],
    paymentMethod: 'BANK_TRANSFER',
    reference: '',
    allocations: [],
    purpose: '',
    category: 'advance'
  });
  
  const [outstandingInvoices, setOutstandingInvoices] = useState([]);
  const [loading, setLoading] = useState(false);

  // Load outstanding invoices when customer selected
  useEffect(() => {
    if (formData.customerId && paymentType === 'invoice-based') {
      fetchOutstandingInvoices(formData.customerId);
    }
  }, [formData.customerId, paymentType]);

  const fetchOutstandingInvoices = async (customerId: string) => {
    try {
      const res = await fetch(`/api/payments/customer/${customerId}/outstanding-invoices`);
      const data = await res.json();
      if (data.success) {
        setOutstandingInvoices(data.data.invoices);
      }
    } catch (error) {
      toast.error('Failed to load invoices');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const endpoint = paymentType === 'invoice-based' 
        ? '/api/payments/invoice-based'
        : '/api/payments/independent';

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await res.json();

      if (data.success) {
        toast.success(data.message);
        router.push('/dashboard/finance/payments');
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error('Failed to create payment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Payment Type Toggle */}
      <div className="flex gap-4">
        <button
          type="button"
          onClick={() => setPaymentType('invoice-based')}
          className={`px-4 py-2 rounded ${
            paymentType === 'invoice-based' ? 'bg-blue-600 text-white' : 'bg-gray-200'
          }`}
        >
          Pay Against Invoice
        </button>
        <button
          type="button"
          onClick={() => setPaymentType('independent')}
          className={`px-4 py-2 rounded ${
            paymentType === 'independent' ? 'bg-blue-600 text-white' : 'bg-gray-200'
          }`}
        >
          Independent Payment
        </button>
      </div>

      {/* Customer Selection */}
      <div>
        <label>Customer</label>
        <select
          value={formData.customerId}
          onChange={(e) => setFormData({ ...formData, customerId: e.target.value })}
          required
        >
          <option value="">Select Customer</option>
          {/* Load customers */}
        </select>
      </div>

      {/* Conditional Sections */}
      {paymentType === 'invoice-based' ? (
        <InvoiceAllocationSection
          invoices={outstandingInvoices}
          allocations={formData.allocations}
          totalAmount={formData.totalAmount}
          onChange={(allocations) => setFormData({ ...formData, allocations })}
        />
      ) : (
        <IndependentPaymentSection
          purpose={formData.purpose}
          category={formData.category}
          onChange={(data) => setFormData({ ...formData, ...data })}
        />
      )}

      {/* Common Payment Details */}
      <PaymentDetailsSection
        data={formData}
        onChange={(data) => setFormData({ ...formData, ...data })}
      />

      <button
        type="submit"
        disabled={loading}
        className="px-6 py-2 bg-blue-600 text-white rounded"
      >
        {loading ? 'Creating...' : 'Create Payment'}
      </button>
    </form>
  );
}
```

#### 2. Invoice Allocation Section
```typescript
// components/payments/InvoiceAllocationSection.tsx
interface Props {
  invoices: any[];
  allocations: any[];
  totalAmount: number;
  onChange: (allocations: any[]) => void;
}

export default function InvoiceAllocationSection({ 
  invoices, 
  allocations, 
  totalAmount,
  onChange 
}: Props) {
  const allocatedAmount = allocations.reduce((sum, a) => sum + a.amount, 0);
  const unappliedAmount = totalAmount - allocatedAmount;

  const handleAllocation = (invoiceId: string, invoiceNumber: string, amount: number) => {
    const existing = allocations.find(a => a.invoiceId === invoiceId);
    
    if (existing) {
      onChange(allocations.map(a => 
        a.invoiceId === invoiceId ? { ...a, amount } : a
      ));
    } else {
      onChange([...allocations, { invoiceId, invoiceNumber, amount }]);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <label>Total Payment Amount</label>
        <input
          type="number"
          value={totalAmount}
          onChange={(e) => onChange(allocations)}
          className="w-full px-3 py-2 border rounded"
        />
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr>
              <th>Invoice #</th>
              <th>Due Date</th>
              <th>Total</th>
              <th>Paid</th>
              <th>Balance</th>
              <th>Pay Amount</th>
            </tr>
          </thead>
          <tbody>
            {invoices.map(invoice => (
              <tr key={invoice._id}>
                <td>{invoice.invoiceNumber}</td>
                <td>{new Date(invoice.dueDate).toLocaleDateString()}</td>
                <td>₹{invoice.totalAmount.toLocaleString()}</td>
                <td>₹{invoice.paidAmount.toLocaleString()}</td>
                <td>₹{invoice.balanceAmount.toLocaleString()}</td>
                <td>
                  <input
                    type="number"
                    max={invoice.balanceAmount}
                    onChange={(e) => handleAllocation(
                      invoice._id,
                      invoice.invoiceNumber,
                      parseFloat(e.target.value) || 0
                    )}
                    className="w-24 px-2 py-1 border rounded"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="bg-gray-100 p-4 rounded">
        <div className="flex justify-between">
          <span>Total Payment:</span>
          <span className="font-bold">₹{totalAmount.toLocaleString()}</span>
        </div>
        <div className="flex justify-between">
          <span>Allocated:</span>
          <span className="font-bold text-green-600">₹{allocatedAmount.toLocaleString()}</span>
        </div>
        <div className="flex justify-between">
          <span>Unapplied:</span>
          <span className="font-bold text-blue-600">₹{unappliedAmount.toLocaleString()}</span>
        </div>
      </div>
    </div>
  );
}
```

---

## 🔄 Migration Script

Create `backend/scripts/migratePayments.js`:

```javascript
const mongoose = require('mongoose');
const Payment = require('../src/models/Payment');
const Invoice = require('../src/models/Invoice');

async function migratePayments() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // Update existing payments to have paymentType
    const result = await Payment.updateMany(
      { paymentType: { $exists: false } },
      {
        $set: {
          paymentType: 'invoice-based',
          allocatedAmount: '$totalAmount',
          unappliedAmount: 0
        }
      }
    );

    console.log(`Updated ${result.modifiedCount} payments`);

    // Migrate embedded invoice payments to Payment collection
    const invoices = await Invoice.find({ 'payments.0': { $exists: true } });
    
    for (const invoice of invoices) {
      for (const payment of invoice.payments) {
        const newPayment = new Payment({
          paymentNumber: `PAY-MIG-${Date.now()}`,
          paymentType: 'invoice-based',
          customerId: invoice.customerId,
          customerName: invoice.partyName,
          totalAmount: payment.amount,
          allocatedAmount: payment.amount,
          unappliedAmount: 0,
          paymentDate: payment.date,
          paymentMethod: payment.paymentMethod || 'CASH',
          reference: payment.reference,
          allocations: [{
            invoiceId: invoice._id,
            invoiceNumber: invoice.invoiceNumber,
            amount: payment.amount,
            allocationDate: payment.date
          }],
          status: 'COMPLETED',
          approvalStatus: 'APPROVED',
          createdBy: invoice.createdBy
        });

        await newPayment.save();
      }
    }

    console.log('Migration completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

migratePayments();
```

Run migration:
```bash
cd backend
node scripts/migratePayments.js
```

---

## ✅ Testing Checklist

### Backend Tests
- [ ] Create invoice-based payment with single invoice
- [ ] Create invoice-based payment with multiple invoices
- [ ] Create invoice-based payment with partial allocation
- [ ] Create independent payment (advance)
- [ ] Create independent payment (deposit)
- [ ] Allocate unapplied payment to invoice
- [ ] Validate allocation doesn't exceed invoice balance
- [ ] Validate allocation doesn't exceed unapplied amount
- [ ] Get customer outstanding invoices
- [ ] Get customer unapplied payments
- [ ] Filter payments by type
- [ ] Filter payments by unapplied balance

### Frontend Tests
- [ ] Toggle between payment types
- [ ] Load outstanding invoices on customer selection
- [ ] Calculate allocated/unapplied amounts correctly
- [ ] Validate allocation amounts
- [ ] Submit invoice-based payment
- [ ] Submit independent payment
- [ ] View payment details
- [ ] Allocate unapplied payment from UI

---

## 🎯 Next Steps

1. **Review** this implementation guide
2. **Test** API endpoints using Postman/curl
3. **Implement** frontend components
4. **Run** migration script (if needed)
5. **Test** end-to-end flows
6. **Deploy** to production

---

## 📞 Support

For issues or questions:
- Check logs: `backend/logs/`
- Review API responses
- Test with sample data first

---

**Status**: Implementation Ready ✅  
**Version**: 1.0.0  
**Last Updated**: 2024-01-15
