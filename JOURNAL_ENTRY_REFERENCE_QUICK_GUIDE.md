# Journal Entry Reference - Quick Guide 🚀

## What is Reference Allocation?

Reference allocation allows you to track and link journal entries to specific invoices, bills, or transactions - just like Tally!

## 4 Reference Types

### 1. 📝 On Account (Default)
**When to use**: General entries without specific reference tracking

**Example**: Monthly depreciation, salary accruals
```
Account: Depreciation Expense
Amount: $1,000
Ref Type: On Account
```

### 2. 🔗 Agst Ref (Against Reference)
**When to use**: Making payment against existing invoice/bill

**Example**: Paying an outstanding invoice
```
Account: Accounts Payable - Vendor A
Amount: $5,000
Ref Type: Agst Ref
Select: INV-001 (Outstanding: $5,000)
```

**What happens**: 
- Outstanding amount reduces from $5,000 to $0
- Reference status changes to PAID
- Payment is tracked against specific invoice

### 3. ✨ New Ref (New Reference)
**When to use**: Recording new invoice/bill that needs tracking

**Example**: Recording a new purchase invoice
```
Account: Accounts Payable - Vendor B
Amount: $3,000
Ref Type: New Ref
Enter: INV-2024-001
```

**What happens**:
- New reference created with number INV-2024-001
- Outstanding amount: $3,000
- Available for future payment allocation

### 4. 💰 Advance (Advance Payment)
**When to use**: Recording advance payments for future allocation

**Example**: Advance to supplier
```
Account: Advances to Suppliers
Amount: $2,000
Ref Type: Advance
```

## Step-by-Step Examples

### Example 1: Recording Purchase Invoice

**Scenario**: Received invoice INV-2024-100 from ABC Suppliers for $10,000

**Steps**:
1. Create new Journal Entry
2. Date: Invoice date
3. Reference: INV-2024-100
4. Line 1:
   - Account: Purchases
   - Debit: $10,000
   - Ref Type: On Account
5. Line 2:
   - Account: Accounts Payable - ABC Suppliers
   - Credit: $10,000
   - Ref Type: **New Ref**
   - Enter: INV-2024-100
6. Submit

**Result**: 
- Invoice recorded
- Reference INV-2024-100 created
- Outstanding: $10,000

### Example 2: Making Payment Against Invoice

**Scenario**: Paying $10,000 against invoice INV-2024-100

**Steps**:
1. Create new Journal Entry
2. Date: Payment date
3. Reference: PAYMENT-001
4. Line 1:
   - Account: Accounts Payable - ABC Suppliers
   - Debit: $10,000
   - Ref Type: **Agst Ref**
   - Select: INV-2024-100 (Outstanding: $10,000)
5. Line 2:
   - Account: Bank
   - Credit: $10,000
   - Ref Type: On Account
6. Submit

**Result**:
- Payment recorded
- INV-2024-100 outstanding reduces to $0
- Reference status: PAID

### Example 3: Partial Payment

**Scenario**: Paying $5,000 against invoice INV-2024-100 (Total: $10,000)

**Steps**:
1. Create new Journal Entry
2. Line 1:
   - Account: Accounts Payable - ABC Suppliers
   - Debit: $5,000
   - Ref Type: **Agst Ref**
   - Select: INV-2024-100 (Outstanding: $10,000)
3. Line 2:
   - Account: Bank
   - Credit: $5,000
   - Ref Type: On Account
4. Submit

**Result**:
- Partial payment recorded
- INV-2024-100 outstanding: $5,000
- Reference status: PARTIALLY_PAID

### Example 4: Advance Payment

**Scenario**: Giving $2,000 advance to supplier

**Steps**:
1. Create new Journal Entry
2. Line 1:
   - Account: Advances to Suppliers
   - Debit: $2,000
   - Ref Type: **Advance**
3. Line 2:
   - Account: Bank
   - Credit: $2,000
   - Ref Type: On Account
4. Submit

**Result**:
- Advance recorded
- Available for future allocation

## Tips & Best Practices

### ✅ DO's
- ✅ Use "New Ref" for all invoices and bills
- ✅ Use "Agst Ref" for all payments
- ✅ Enter clear reference numbers (INV-001, BILL-2024-001)
- ✅ Check outstanding amount before allocation
- ✅ Use consistent reference numbering

### ❌ DON'Ts
- ❌ Don't use "On Account" for invoices/bills
- ❌ Don't forget to select reference for "Agst Ref"
- ❌ Don't enter duplicate reference numbers
- ❌ Don't allocate more than outstanding amount
- ❌ Don't use special characters in reference numbers

## Keyboard Shortcuts

| Action | Shortcut |
|--------|----------|
| Save Entry | Ctrl + S |
| Add Line | Ctrl + Enter |
| Navigate Lines | Ctrl + Arrows |
| New Entry | Ctrl + N |

## Common Scenarios

### Scenario: Multiple Invoices, One Payment

**Problem**: Paying $15,000 against 3 invoices

**Solution**: Create 3 debit lines with "Agst Ref"
```
Line 1: AP - Vendor A, Debit $5,000, Agst Ref: INV-001
Line 2: AP - Vendor A, Debit $7,000, Agst Ref: INV-002
Line 3: AP - Vendor A, Debit $3,000, Agst Ref: INV-003
Line 4: Bank, Credit $15,000, On Account
```

### Scenario: One Invoice, Multiple Payments

**Problem**: Invoice $10,000, paying in 2 installments

**Payment 1**:
```
Line 1: AP - Vendor, Debit $6,000, Agst Ref: INV-001
Line 2: Bank, Credit $6,000, On Account
```

**Payment 2**:
```
Line 1: AP - Vendor, Debit $4,000, Agst Ref: INV-001
Line 2: Bank, Credit $4,000, On Account
```

### Scenario: Advance Adjustment

**Problem**: Adjusting $2,000 advance against new invoice $5,000

**Step 1 - Record Invoice**:
```
Line 1: Purchases, Debit $5,000, On Account
Line 2: AP - Vendor, Credit $5,000, New Ref: INV-100
```

**Step 2 - Adjust Advance**:
```
Line 1: AP - Vendor, Debit $2,000, Agst Ref: INV-100
Line 2: Advances to Suppliers, Credit $2,000, On Account
```

**Step 3 - Pay Balance**:
```
Line 1: AP - Vendor, Debit $3,000, Agst Ref: INV-100
Line 2: Bank, Credit $3,000, On Account
```

## Troubleshooting

### Error: "Please select a reference for Agst Ref lines"
**Solution**: Select an outstanding reference from the dropdown

### Error: "Amount exceeds outstanding reference amount"
**Solution**: Reduce the amount or split across multiple references

### Error: "Reference already exists for this account"
**Solution**: Use a different reference number or check existing references

### Reference dropdown is empty
**Solution**: 
1. Ensure account is selected first
2. Check if account has outstanding references
3. Verify references are in OUTSTANDING or PARTIALLY_PAID status

## Need Help?

- Check outstanding references: Finance → Reference Management
- View reference details: Click on reference in dropdown
- Contact support: support@rayerp.com

---

**Quick Tip**: Start with "New Ref" for invoices, use "Agst Ref" for payments. It's that simple! 🎯
