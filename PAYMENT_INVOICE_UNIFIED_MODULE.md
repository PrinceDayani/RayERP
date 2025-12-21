# Payment-Invoice Unified Module

## Overview
Unified payment system that supports both **invoice-based payments** and **independent payments** in a single, cohesive module.

## Current State Analysis

### Existing Models
- **Invoice Model**: Has embedded `payments` array (IPaymentRecord[])
- **Payment Model**: Separate entity with `invoiceIds` and `allocations`
- **Issue**: Dual payment tracking creates confusion and data inconsistency

## Proposed Solution: Unified Payment Module

### Key Features
1. **Invoice-Based Payment** - Link payment to one or more invoices
2. **Independent Payment** - Standalone payments (advances, deposits, misc receipts)
3. **Partial Allocation** - Apply payment across multiple invoices
4. **Unapplied Balance** - Track unallocated payment amounts
5. **Auto-Allocation** - Suggest invoice allocation based on customer

---

## Enhanced Payment Model

```typescript
export interface IPayment extends Document {
  // Core Fields
  paymentNumber: string;
  paymentType: 'invoice-based' | 'independent' | 'advance';
  
  // Customer Info
  customerId: mongoose.Types.ObjectId;
  customerName: string;
  
  // Amount Details
  totalAmount: number;
  allocatedAmount: number;      // NEW: Amount applied to invoices
  unappliedAmount: number;      // NEW: Remaining balance
  currency: string;
  exchangeRate: number;
  baseAmount: number;
  
  // Payment Details
  paymentDate: Date;
  paymentMethod: 'CASH' | 'CHEQUE' | 'BANK_TRANSFER' | 'UPI' | 'CARD' | 'NEFT' | 'RTGS' | 'WALLET';
  bankAccount?: string;
  reference?: string;
  
  // Invoice Allocations (for invoice-based payments)
  allocations: Array<{
    invoiceId: mongoose.Types.ObjectId;
    invoiceNumber: string;
    amount: number;
    allocationDate: Date;
    accountId?: mongoose.Types.ObjectId;
  }>;
  
  // Independent Payment Fields
  purpose?: string;              // NEW: For non-invoice payments
  category?: string;             // NEW: Advance, Deposit, Misc
  
  // Status & Approval
  status: 'DRAFT' | 'PENDING_APPROVAL' | 'APPROVED' | 'COMPLETED' | 'FAILED' | 'CANCELLED' | 'REFUNDED';
  approvalStatus: 'PENDING' | 'APPROVED' | 'REJECTED';
  
  // Journal Entry
  journalEntryId?: mongoose.Types.ObjectId;
  
  // Receipt
  receiptGenerated: boolean;
  receiptUrl?: string;
  
  // Audit
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}
```

---

## API Endpoints

### Payment Creation

#### 1. Create Invoice-Based Payment
```http
POST /api/payments/invoice-based
Content-Type: application/json

{
  "paymentType": "invoice-based",
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
}
```

#### 2. Create Independent Payment
```http
POST /api/payments/independent
Content-Type: application/json

{
  "paymentType": "independent",
  "customerId": "64abc123...",
  "totalAmount": 10000,
  "paymentDate": "2024-01-15",
  "paymentMethod": "CASH",
  "purpose": "Advance payment for future orders",
  "category": "advance"
}
```

#### 3. Create Payment with Partial Allocation
```http
POST /api/payments
Content-Type: application/json

{
  "paymentType": "invoice-based",
  "customerId": "64abc123...",
  "totalAmount": 50000,
  "paymentDate": "2024-01-15",
  "paymentMethod": "UPI",
  "allocations": [
    {
      "invoiceId": "64def456...",
      "amount": 30000
    }
  ]
  // Remaining 20000 stays as unappliedAmount
}
```

### Payment Allocation Management

#### 4. Allocate Unapplied Payment to Invoice
```http
POST /api/payments/:id/allocate
Content-Type: application/json

{
  "invoiceId": "64def789...",
  "amount": 15000
}
```

#### 5. Get Customer Outstanding Invoices
```http
GET /api/payments/customer/:customerId/outstanding-invoices
```

Response:
```json
{
  "success": true,
  "data": [
    {
      "invoiceId": "64def456...",
      "invoiceNumber": "INV-2024-0001",
      "totalAmount": 50000,
      "paidAmount": 20000,
      "balanceAmount": 30000,
      "dueDate": "2024-02-15",
      "status": "PARTIALLY_PAID"
    }
  ]
}
```

---

## Business Logic

### Payment Creation Flow

```
1. User selects payment type:
   ├─ Invoice-Based
   │  ├─ Select customer → Auto-load outstanding invoices
   │  ├─ Select invoices to pay
   │  ├─ Enter payment amount
   │  └─ System validates: amount ≤ total outstanding
   │
   └─ Independent
      ├─ Select customer
      ├─ Enter amount
      ├─ Enter purpose/category
      └─ Can allocate to invoices later

2. System Processing:
   ├─ Create Payment record
   ├─ Update Invoice.paidAmount (if allocated)
   ├─ Update Invoice.status (PAID/PARTIALLY_PAID)
   ├─ Create Journal Entry
   ├─ Generate Receipt
   └─ Send Approval (if required)

3. Unapplied Balance Handling:
   ├─ Track in Payment.unappliedAmount
   ├─ Show in customer statement
   └─ Allow future allocation
```

### Journal Entry Logic

#### Invoice-Based Payment
```
Dr. Bank/Cash Account          50,000
    Cr. Accounts Receivable           50,000
```

#### Independent Payment (Advance)
```
Dr. Bank/Cash Account          10,000
    Cr. Customer Advances             10,000
```

#### Allocating Advance to Invoice
```
Dr. Customer Advances          10,000
    Cr. Accounts Receivable           10,000
```

---

## Frontend Components

### 1. Unified Payment Form

```typescript
// PaymentForm.tsx
interface PaymentFormProps {
  mode: 'create' | 'edit';
  initialData?: IPayment;
}

const PaymentForm = ({ mode, initialData }: PaymentFormProps) => {
  const [paymentType, setPaymentType] = useState<'invoice-based' | 'independent'>('invoice-based');
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [outstandingInvoices, setOutstandingInvoices] = useState([]);
  const [allocations, setAllocations] = useState([]);
  
  // When customer selected, load outstanding invoices
  useEffect(() => {
    if (selectedCustomer && paymentType === 'invoice-based') {
      loadOutstandingInvoices(selectedCustomer.id);
    }
  }, [selectedCustomer, paymentType]);
  
  return (
    <form>
      {/* Payment Type Toggle */}
      <RadioGroup value={paymentType} onChange={setPaymentType}>
        <Radio value="invoice-based">Pay Against Invoice</Radio>
        <Radio value="independent">Independent Payment</Radio>
      </RadioGroup>
      
      {/* Customer Selection */}
      <CustomerSelect onChange={setSelectedCustomer} />
      
      {/* Conditional Rendering */}
      {paymentType === 'invoice-based' ? (
        <InvoiceAllocationSection 
          invoices={outstandingInvoices}
          allocations={allocations}
          onChange={setAllocations}
        />
      ) : (
        <IndependentPaymentSection />
      )}
      
      {/* Common Fields */}
      <PaymentDetailsSection />
    </form>
  );
};
```

### 2. Invoice Allocation Component

```typescript
// InvoiceAllocationSection.tsx
const InvoiceAllocationSection = ({ invoices, allocations, onChange }) => {
  const [totalPayment, setTotalPayment] = useState(0);
  const allocatedAmount = allocations.reduce((sum, a) => sum + a.amount, 0);
  const unappliedAmount = totalPayment - allocatedAmount;
  
  return (
    <div>
      <Input 
        label="Total Payment Amount"
        value={totalPayment}
        onChange={setTotalPayment}
      />
      
      <Table>
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
            <tr key={invoice.id}>
              <td>{invoice.invoiceNumber}</td>
              <td>{invoice.dueDate}</td>
              <td>{invoice.totalAmount}</td>
              <td>{invoice.paidAmount}</td>
              <td>{invoice.balanceAmount}</td>
              <td>
                <Input 
                  type="number"
                  max={invoice.balanceAmount}
                  onChange={(amount) => handleAllocation(invoice.id, amount)}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
      
      <div className="summary">
        <div>Total Payment: {totalPayment}</div>
        <div>Allocated: {allocatedAmount}</div>
        <div>Unapplied: {unappliedAmount}</div>
      </div>
    </div>
  );
};
```

### 3. Payment List with Type Filter

```typescript
// PaymentList.tsx
const PaymentList = () => {
  const [filter, setFilter] = useState({
    paymentType: 'all', // 'all' | 'invoice-based' | 'independent'
    status: 'all',
    dateRange: null
  });
  
  return (
    <div>
      <FilterBar>
        <Select 
          label="Payment Type"
          value={filter.paymentType}
          onChange={(val) => setFilter({...filter, paymentType: val})}
        >
          <option value="all">All Payments</option>
          <option value="invoice-based">Invoice Payments</option>
          <option value="independent">Independent Payments</option>
        </Select>
      </FilterBar>
      
      <Table>
        {/* Payment list with type badge */}
      </Table>
    </div>
  );
};
```

---

## Database Migration

### Step 1: Update Payment Schema
```javascript
// Add new fields to existing Payment model
db.payments.updateMany(
  {},
  {
    $set: {
      paymentType: 'invoice-based',
      allocatedAmount: '$totalAmount',
      unappliedAmount: 0
    }
  }
);
```

### Step 2: Migrate Invoice Payments
```javascript
// Move embedded payments from Invoice to Payment collection
db.invoices.find({ 'payments.0': { $exists: true } }).forEach(invoice => {
  invoice.payments.forEach(payment => {
    db.payments.insertOne({
      paymentNumber: generatePaymentNumber(),
      paymentType: 'invoice-based',
      customerId: invoice.customerId,
      customerName: invoice.partyName,
      totalAmount: payment.amount,
      allocatedAmount: payment.amount,
      unappliedAmount: 0,
      paymentDate: payment.date,
      paymentMethod: payment.paymentMethod,
      reference: payment.reference,
      allocations: [{
        invoiceId: invoice._id,
        invoiceNumber: invoice.invoiceNumber,
        amount: payment.amount,
        allocationDate: payment.date
      }],
      status: 'COMPLETED',
      createdAt: payment.date
    });
  });
});
```

---

## Implementation Checklist

### Backend
- [ ] Update Payment model with new fields
- [ ] Create unified payment controller
- [ ] Add invoice allocation endpoints
- [ ] Update journal entry logic
- [ ] Add validation for allocations
- [ ] Create migration script
- [ ] Update payment approval integration
- [ ] Add tests for both payment types

### Frontend
- [ ] Create unified payment form
- [ ] Add payment type toggle
- [ ] Build invoice allocation component
- [ ] Add independent payment form
- [ ] Update payment list with filters
- [ ] Add unapplied balance indicator
- [ ] Create allocation management UI
- [ ] Update customer statement to show unapplied payments

### Documentation
- [ ] API documentation
- [ ] User guide for both payment types
- [ ] Migration guide
- [ ] Troubleshooting guide

---

## Benefits

✅ **Single Source of Truth** - One payment entity, no duplication  
✅ **Flexibility** - Handle both invoice and non-invoice payments  
✅ **Better UX** - Intuitive payment creation flow  
✅ **Accurate AR** - Real-time invoice payment tracking  
✅ **Advance Payments** - Proper handling of prepayments  
✅ **Partial Payments** - Apply payment across multiple invoices  
✅ **Unapplied Tracking** - Know exactly what's unallocated  
✅ **Future Allocation** - Apply advances to future invoices  

---

## Example Scenarios

### Scenario 1: Pay Multiple Invoices
Customer has 3 outstanding invoices:
- INV-001: ₹30,000
- INV-002: ₹20,000
- INV-003: ₹15,000

Payment of ₹50,000 received:
- Allocate ₹30,000 to INV-001 (PAID)
- Allocate ₹20,000 to INV-002 (PAID)
- Unapplied: ₹0

### Scenario 2: Advance Payment
Customer pays ₹100,000 advance before any invoice:
- Create independent payment
- Purpose: "Advance for Q1 orders"
- Unapplied: ₹100,000

Later, when invoices are created:
- Allocate ₹40,000 to INV-004
- Allocate ₹60,000 to INV-005
- Unapplied: ₹0

### Scenario 3: Partial Payment
Invoice INV-006 for ₹80,000:
- Payment 1: ₹30,000 (Status: PARTIALLY_PAID)
- Payment 2: ₹50,000 (Status: PAID)

---

## Next Steps

1. **Review & Approve** this design
2. **Implement Backend** changes (Payment model + controller)
3. **Create Frontend** components
4. **Test** both payment flows
5. **Migrate** existing data
6. **Deploy** to production

---

**Status**: Design Complete - Ready for Implementation  
**Priority**: High  
**Estimated Effort**: 3-4 days  
