# 🚀 Invoice & Journal Entry - Quick Start Guide

Get started with the enterprise Invoice Management and Journal Entry systems in **5 minutes**!

---

## 📦 Step 1: Install Dependencies

```bash
cd backend
npm install multer csv-parser
```

---

## 📁 Step 2: Create Upload Directories

```bash
# Windows
mkdir public\uploads\invoices
mkdir public\uploads\journal-entries

# Unix/Linux/Mac
mkdir -p public/uploads/invoices
mkdir -p public/uploads/journal-entries
```

---

## 🔌 Step 3: Register Routes

Add to `backend/src/server.ts`:

```typescript
import invoiceRoutes from './routes/invoice.routes';
import journalEntryRoutes from './routes/journalEntry.routes';
import invoiceTemplateRoutes from './routes/invoiceTemplate.routes';
import journalEntryTemplateRoutes from './routes/journalEntryTemplate.routes';

// Register routes
app.use('/api/invoices', invoiceRoutes);
app.use('/api/journal-entries', journalEntryRoutes);
app.use('/api/invoice-templates', invoiceTemplateRoutes);
app.use('/api/journal-entry-templates', journalEntryTemplateRoutes);
```

---

## 🎯 Step 4: Test Invoice Creation

```bash
# Create a sales invoice
curl -X POST http://localhost:5000/api/invoices \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "invoiceType": "SALES",
    "partyName": "ABC Corp",
    "partyEmail": "abc@example.com",
    "invoiceDate": "2024-01-15",
    "dueDate": "2024-02-14",
    "currency": "INR",
    "paymentTerms": "NET_30",
    "lineItems": [
      {
        "description": "Software License",
        "quantity": 10,
        "unitPrice": 100,
        "taxRate": 18,
        "taxAmount": 180,
        "amount": 1180
      }
    ],
    "subtotal": 1000,
    "totalTax": 180,
    "totalAmount": 1180
  }'
```

---

## 📝 Step 5: Test Journal Entry Creation

```bash
# Create a journal entry
curl -X POST http://localhost:5000/api/journal-entries \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "entryDate": "2024-01-31",
    "description": "Monthly Depreciation",
    "lines": [
      {
        "account": "ACCOUNT_ID_1",
        "debit": 5000,
        "credit": 0,
        "description": "Depreciation Expense"
      },
      {
        "account": "ACCOUNT_ID_2",
        "debit": 0,
        "credit": 5000,
        "description": "Accumulated Depreciation"
      }
    ],
    "totalDebit": 5000,
    "totalCredit": 5000
  }'
```

---

## 🔄 Step 6: Setup Recurring Entries (Optional)

Create a cron job file `backend/src/jobs/recurring.jobs.ts`:

```typescript
import cron from 'node-cron';
import axios from 'axios';

const API_URL = process.env.API_URL || 'http://localhost:5000';

// Run daily at 00:00
cron.schedule('0 0 * * *', async () => {
  try {
    // Generate recurring invoices
    await axios.post(`${API_URL}/api/invoices/generate-recurring`);
    
    // Generate recurring journal entries
    await axios.post(`${API_URL}/api/journal-entries/generate-recurring`);
    
    // Calculate late fees
    await axios.post(`${API_URL}/api/invoices/calculate-late-fees`);
    
    console.log('Recurring jobs completed');
  } catch (error) {
    console.error('Recurring jobs failed:', error);
  }
});

// Send reminders daily at 09:00
cron.schedule('0 9 * * *', async () => {
  try {
    await axios.post(`${API_URL}/api/invoices/send-reminders`);
    console.log('Reminders sent');
  } catch (error) {
    console.error('Reminder job failed:', error);
  }
});

export default {};
```

Install cron:
```bash
npm install node-cron
```

Import in `server.ts`:
```typescript
import './jobs/recurring.jobs';
```

---

## 📊 Step 7: Common Operations

### Create Invoice Template

```javascript
POST /api/invoice-templates
{
  "name": "Standard Template",
  "isDefault": true,
  "companyName": "Your Company",
  "companyAddress": "123 Main St",
  "companyEmail": "info@company.com",
  "layout": "MODERN",
  "colorScheme": "#3B82F6",
  "showTaxBreakdown": true,
  "showBankDetails": true,
  "bankName": "HDFC Bank",
  "accountNumber": "1234567890",
  "ifscCode": "HDFC0001234"
}
```

### Create Journal Entry Template

```javascript
POST /api/journal-entry-templates
{
  "name": "Monthly Depreciation",
  "category": "DEPRECIATION",
  "description": "Standard depreciation entry",
  "lines": [
    {
      "accountVariable": "EXPENSE_ACCOUNT",
      "debitVariable": "AMOUNT",
      "creditVariable": null,
      "description": "Depreciation Expense"
    },
    {
      "accountVariable": "ACCUMULATED_ACCOUNT",
      "debitVariable": null,
      "creditVariable": "AMOUNT",
      "description": "Accumulated Depreciation"
    }
  ],
  "variables": [
    {
      "name": "EXPENSE_ACCOUNT",
      "type": "ACCOUNT",
      "description": "Depreciation Expense Account",
      "required": true
    },
    {
      "name": "ACCUMULATED_ACCOUNT",
      "type": "ACCOUNT",
      "description": "Accumulated Depreciation Account",
      "required": true
    },
    {
      "name": "AMOUNT",
      "type": "AMOUNT",
      "description": "Depreciation Amount",
      "required": true
    }
  ],
  "isRecurring": true,
  "recurringFrequency": "MONTHLY",
  "autoPost": true
}
```

### Record Payment

```javascript
POST /api/invoices/:invoiceId/payment
{
  "date": "2024-02-10",
  "amount": 1180,
  "paymentMethod": "BANK",
  "reference": "TXN123456",
  "notes": "Payment received"
}
```

### Post Invoice (Create Journal Entry)

```javascript
POST /api/invoices/:invoiceId/post
```

This will:
1. Create journal entry automatically
2. Update invoice status to SENT
3. Link journal entry to invoice

### Approve and Post Journal Entry

```javascript
// Approve
POST /api/journal-entries/:entryId/approve
{
  "comments": "Approved"
}

// Post
POST /api/journal-entries/:entryId/post
```

### Reverse Journal Entry

```javascript
POST /api/journal-entries/:entryId/reverse
{
  "reason": "Correction needed"
}
```

### Get Aging Report

```javascript
GET /api/invoices/aging-report
```

Returns:
```json
{
  "success": true,
  "data": {
    "current": { "count": 5, "amount": 50000, "invoices": [...] },
    "days30": { "count": 3, "amount": 30000, "invoices": [...] },
    "days60": { "count": 2, "amount": 20000, "invoices": [...] },
    "days90": { "count": 1, "amount": 10000, "invoices": [...] },
    "days90Plus": { "count": 1, "amount": 15000, "invoices": [...] }
  }
}
```

---

## 🎨 Step 8: Frontend Integration (React/Next.js)

### Invoice List Component

```typescript
'use client';
import { useState, useEffect } from 'react';

export default function InvoiceList() {
  const [invoices, setInvoices] = useState([]);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    fetchInvoices();
    fetchStats();
  }, []);

  const fetchInvoices = async () => {
    const res = await fetch('/api/invoices');
    const data = await res.json();
    setInvoices(data.data);
  };

  const fetchStats = async () => {
    const res = await fetch('/api/invoices/stats');
    const data = await res.json();
    setStats(data.data);
  };

  return (
    <div>
      <h1>Invoices</h1>
      
      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-blue-100 p-4 rounded">
            <div className="text-2xl font-bold">{stats.total}</div>
            <div className="text-sm">Total Invoices</div>
          </div>
          <div className="bg-green-100 p-4 rounded">
            <div className="text-2xl font-bold">{stats.paid}</div>
            <div className="text-sm">Paid</div>
          </div>
          <div className="bg-yellow-100 p-4 rounded">
            <div className="text-2xl font-bold">{stats.sent}</div>
            <div className="text-sm">Sent</div>
          </div>
          <div className="bg-red-100 p-4 rounded">
            <div className="text-2xl font-bold">{stats.overdue}</div>
            <div className="text-sm">Overdue</div>
          </div>
        </div>
      )}

      {/* Invoice Table */}
      <table className="w-full">
        <thead>
          <tr>
            <th>Invoice #</th>
            <th>Customer</th>
            <th>Date</th>
            <th>Amount</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {invoices.map((inv: any) => (
            <tr key={inv._id}>
              <td>{inv.invoiceNumber}</td>
              <td>{inv.partyName}</td>
              <td>{new Date(inv.invoiceDate).toLocaleDateString()}</td>
              <td>{inv.totalAmount}</td>
              <td>
                <span className={`badge badge-${inv.status.toLowerCase()}`}>
                  {inv.status}
                </span>
              </td>
              <td>
                <button onClick={() => viewInvoice(inv._id)}>View</button>
                <button onClick={() => sendInvoice(inv._id)}>Send</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

---

## 🔥 Step 9: Key Features to Highlight

### 1. Auto-Numbering
- Invoices: `SI/2024-25/00001`
- Journal Entries: `JE/2024-25/00001`

### 2. Multi-Currency
- Support for any currency
- Automatic conversion to base currency
- Exchange rate tracking

### 3. Recurring Automation
- Set it once, forget it
- Auto-generate invoices/entries
- Configurable frequency

### 4. Payment Tracking
- Multiple payments per invoice
- Partial payment support
- Automatic balance calculation

### 5. Approval Workflow
- Multi-level approvals
- Comments and tracking
- Rejection handling

### 6. Integration
- Invoice → Journal Entry (automatic)
- Payment → Invoice (automatic)
- Voucher → Invoice (linked)

---

## 📈 Step 10: Monitor & Optimize

### Check Stats

```bash
# Invoice stats
curl http://localhost:5000/api/invoices/stats

# Journal entry stats
curl http://localhost:5000/api/journal-entries/stats

# Aging report
curl http://localhost:5000/api/invoices/aging-report
```

### Performance Tips

1. **Index Optimization**: Already configured in models
2. **Batch Operations**: Use batch endpoints for multiple records
3. **Caching**: Cache templates and frequently used data
4. **Pagination**: Add pagination for large datasets

---

## 🎉 You're Ready!

You now have a **fully functional** enterprise-grade Invoice and Journal Entry system!

### What You Can Do:

✅ Create invoices with auto-numbering
✅ Track payments and balances
✅ Generate recurring invoices
✅ Create journal entries with templates
✅ Auto-post recurring entries
✅ Approve and post entries
✅ Reverse entries with audit trail
✅ Generate aging reports
✅ Send payment reminders
✅ Calculate late fees
✅ Multi-currency support
✅ Complete audit trail

### Next Steps:

1. Build frontend components
2. Setup email service
3. Configure PDF generation
4. Add customer portal
5. Setup e-invoice integration

---

**Need Help?** Check the full documentation in `INVOICE_JOURNAL_ENTERPRISE.md`

**Built with ❤️ for RayERP**
