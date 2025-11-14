# Voucher System - Quick Start Guide

## 🚀 Getting Started in 5 Minutes

### Step 1: Access Voucher Module
1. Login to RayERP
2. Navigate to **Dashboard → Finance → Vouchers**
3. You'll see 8 voucher type cards with statistics

### Step 2: Create Your First Voucher

#### Payment Voucher Example
```
1. Click "Create Voucher" button
2. Select Type: Payment
3. Fill in:
   - Date: Today's date
   - Party Name: "ABC Suppliers"
   - Payment Mode: Bank
   - Narration: "Payment for office supplies"
   
4. Add Lines:
   Line 1: Office Supplies Expense - Debit: ₹10,000
   Line 2: Bank Account - Credit: ₹10,000
   
5. Click "Create Voucher"
```

### Step 3: Post the Voucher
```
1. Find your voucher in the list (Status: Draft)
2. Click the eye icon to view
3. Click "Post Voucher"
4. Confirm the action
5. Status changes to "Posted" ✅
```

## 📋 Voucher Types Cheat Sheet

| Type | Code | When to Use | Example |
|------|------|-------------|---------|
| **Payment** | PAY | Paying money out | Vendor payment, expense payment |
| **Receipt** | REC | Receiving money | Customer payment, income receipt |
| **Contra** | CON | Cash/Bank transfer | Cash deposit, bank withdrawal |
| **Sales** | SAL | Recording sales | Customer invoice, sales revenue |
| **Purchase** | PUR | Recording purchases | Vendor invoice, inventory purchase |
| **Journal** | JOU | Adjustments | Depreciation, accruals, corrections |
| **Debit Note** | DN | Purchase returns | Return to supplier, vendor claims |
| **Credit Note** | CN | Sales returns | Customer refund, sales return |

## 💡 Common Scenarios

### Scenario 1: Pay Vendor by Cheque
```
Type: Payment
Party: Vendor Name
Payment Mode: Cheque
Cheque Number: 123456
Cheque Date: Select date

Lines:
- Vendor Account (Debit) - ₹50,000
- Bank Account (Credit) - ₹50,000
```

### Scenario 2: Receive Customer Payment
```
Type: Receipt
Party: Customer Name
Payment Mode: UPI

Lines:
- Bank Account (Debit) - ₹75,000
- Customer Account (Credit) - ₹75,000
```

### Scenario 3: Cash Deposit to Bank
```
Type: Contra
Narration: Cash deposit to HDFC Bank

Lines:
- Bank Account (Debit) - ₹100,000
- Cash Account (Credit) - ₹100,000
```

### Scenario 4: Record Sales Invoice
```
Type: Sales
Party: Customer Name
Invoice Number: INV-001
Invoice Date: Select date

Lines:
- Customer Account (Debit) - ₹59,000
- Sales Revenue (Credit) - ₹50,000
- GST Output (Credit) - ₹9,000
```

### Scenario 5: Record Purchase Invoice
```
Type: Purchase
Party: Vendor Name
Invoice Number: PINV-001
Invoice Date: Select date

Lines:
- Purchase Expense (Debit) - ₹50,000
- GST Input (Debit) - ₹9,000
- Vendor Account (Credit) - ₹59,000
```

### Scenario 6: Monthly Depreciation
```
Type: Journal
Narration: Monthly depreciation on assets

Lines:
- Depreciation Expense (Debit) - ₹25,000
- Accumulated Depreciation (Credit) - ₹25,000
```

### Scenario 7: Sales Return (Credit Note)
```
Type: Credit Note
Party: Customer Name
Invoice Number: Original invoice ref

Lines:
- Sales Returns (Debit) - ₹10,000
- Customer Account (Credit) - ₹10,000
```

### Scenario 8: Purchase Return (Debit Note)
```
Type: Debit Note
Party: Vendor Name
Invoice Number: Original invoice ref

Lines:
- Vendor Account (Debit) - ₹10,000
- Purchase Returns (Credit) - ₹10,000
```

## ⚡ Quick Tips

### ✅ Do's
- ✅ Always verify debit = credit before creating
- ✅ Use clear, descriptive narration
- ✅ Add reference numbers for traceability
- ✅ Review before posting (cannot edit after)
- ✅ Attach supporting documents when available

### ❌ Don'ts
- ❌ Don't post without reviewing
- ❌ Don't use vague descriptions
- ❌ Don't forget to select correct accounts
- ❌ Don't edit posted vouchers (cancel instead)
- ❌ Don't delete posted vouchers

## 🔍 Search & Filter

### Quick Filters
```
By Type: Select voucher type from dropdown
By Status: Draft / Posted / Cancelled
By Date: Use date range picker
By Search: Enter voucher number, party name, or narration
```

### Example Searches
- `PAY24` - Find all payment vouchers in 2024
- `ABC Suppliers` - Find all vouchers for ABC Suppliers
- `office supplies` - Find vouchers with "office supplies" in narration

## 🎯 Keyboard Shortcuts

| Action | Shortcut |
|--------|----------|
| Create New Voucher | `Ctrl + N` (planned) |
| Search | `Ctrl + F` (planned) |
| Save Draft | `Ctrl + S` (planned) |
| Post Voucher | `Ctrl + P` (planned) |

## 📊 Understanding Status

### Draft 📝
- Newly created voucher
- Can be edited or deleted
- Not affecting account balances
- Waiting for review

### Posted ✅
- Approved and locked
- Cannot be edited
- Account balances updated
- Journal entry created
- Can only be cancelled

### Cancelled ❌
- Previously posted, now reversed
- Account balances reversed
- Cancellation reason recorded
- Preserved for audit trail

## 🔄 Voucher Lifecycle

```
Create → Draft → Review → Post → Posted
                    ↓
                 Delete (if draft)
                    
Posted → Cancel → Cancelled
```

## 🛠️ Troubleshooting

### Problem: "Debits must equal credits"
**Solution**: Check your line items. Total debit amount must equal total credit amount.

### Problem: "Cannot edit posted voucher"
**Solution**: Posted vouchers are locked. Cancel it and create a new one.

### Problem: "Account not found"
**Solution**: Ensure the account exists in Chart of Accounts and is active.

### Problem: "Voucher not appearing in list"
**Solution**: Check your filters. Try "All Types" and "All Status".

## 📱 Mobile Access

The voucher system is fully responsive:
- View vouchers on mobile
- Create simple vouchers
- Post/Cancel vouchers
- Search and filter

## 🔐 Permissions

Different roles have different access:

| Role | Create | View | Post | Cancel | Delete |
|------|--------|------|------|--------|--------|
| ROOT | ✅ | ✅ | ✅ | ✅ | ✅ |
| SUPER_ADMIN | ✅ | ✅ | ✅ | ✅ | ✅ |
| ADMIN | ✅ | ✅ | ✅ | ✅ | ❌ |
| MANAGER | ✅ | ✅ | ✅ | ❌ | ❌ |
| EMPLOYEE | ✅ | ✅ | ❌ | ❌ | ❌ |

## 📈 Best Practices

### Daily Operations
1. Create vouchers as transactions occur
2. Review all draft vouchers at end of day
3. Post verified vouchers
4. Reconcile with bank statements

### Month-End
1. Post all pending vouchers
2. Review cancelled vouchers
3. Generate voucher reports
4. Archive supporting documents

### Year-End
1. Ensure all vouchers are posted
2. Review and reconcile all accounts
3. Generate annual voucher summary
4. Backup voucher data

## 🎓 Training Resources

### Video Tutorials (Planned)
- Creating your first voucher
- Understanding voucher types
- Posting and cancelling vouchers
- Advanced features

### Documentation
- Full documentation: `VOUCHER_SYSTEM.md`
- API documentation: See API section in main docs
- Accounting basics: Contact your accountant

## 📞 Support

Need help?
1. Check this quick start guide
2. Review full documentation
3. Contact system administrator
4. Email: support@rayerp.com (if configured)

## 🎉 You're Ready!

You now know how to:
- ✅ Create all 8 types of vouchers
- ✅ Post and cancel vouchers
- ✅ Search and filter vouchers
- ✅ Handle common scenarios
- ✅ Follow best practices

**Start creating vouchers now!** 🚀

---

**Pro Tip**: Bookmark this page for quick reference while working with vouchers.
