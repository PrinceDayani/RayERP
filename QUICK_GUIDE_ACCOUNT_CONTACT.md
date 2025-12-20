# Quick Guide: Create Account with Customer Contact

## 🎯 What This Does
Create an account and automatically create a linked customer contact in one step. The customer will immediately appear in invoice creation.

## ⚡ Quick Steps (2 Minutes)

### 1. Open Account Creation
```
Dashboard → Finance → Chart of Accounts → Create Account
```

### 2. Check the Box
At the top of the form, check:
```
☑ Link this account to a contact
```

### 3. Fill Account Details
**Required:**
- Account Name: e.g., "ABC Corp - Receivables"
- Account Type: Select "Asset" or "Revenue"

**Optional:**
- Account Code (auto-generated)
- Opening Balance
- Description

### 4. Fill Contact Details (Blue Section)
**Required:**
- ✓ Contact Name: "ABC Corporation"
- ✓ Phone: "+91-9876543210"

**Optional:**
- Email: "billing@abc.com"
- Company: "ABC Corporation"
- Address: "123 Business Street"

### 5. Mark as Customer
Check the box:
```
☑ Mark as Customer
```

You'll see a green message:
```
✓ This contact will be marked as a customer and will appear in invoice creation.
```

### 6. Save
Click **"Save"** button

## ✅ What Happens

1. ✅ Contact "ABC Corporation" is created
2. ✅ Contact is marked as customer
3. ✅ Account "ABC Corp - Receivables" is created
4. ✅ Account is linked to contact
5. ✅ Customer appears in invoice dropdown

## 🎨 Visual Guide

```
┌─────────────────────────────────────────────────┐
│  ☑ Link this account to a contact              │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│  Account Details                                │
│  ─────────────────────────────────────────────  │
│  Account Name: ABC Corp - Receivables           │
│  Account Type: Asset                            │
│  Opening Balance: 0.00                          │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│  Contact Details          ☑ Mark as Customer    │
│  ─────────────────────────────────────────────  │
│  Contact Name: ABC Corporation *                │
│  Phone: +91-9876543210 *                        │
│  Email: billing@abc.com                         │
│  Company: ABC Corporation                       │
│  Address: 123 Business Street                   │
│                                                 │
│  ✓ This contact will be marked as a customer   │
│    and will appear in invoice creation.         │
└─────────────────────────────────────────────────┘

                    [Save]
```

## 💡 Pro Tips

### Tip 1: Customer Accounts
For customer accounts, use:
- Account Type: **Asset** (for Accounts Receivable)
- Account Name: "[Customer Name] - Receivables"
- Always check "Mark as Customer"

### Tip 2: Vendor Accounts
For vendor accounts, use:
- Account Type: **Liability** (for Accounts Payable)
- Account Name: "[Vendor Name] - Payables"
- Don't check "Mark as Customer"

### Tip 3: Skip Contact Linking
If you don't need a contact:
- Just leave the checkbox unchecked
- Fill only account details
- Save normally

### Tip 4: Required Fields
Only 3 fields are absolutely required:
1. Account Name
2. Account Type
3. Contact Name (if linking)
4. Contact Phone (if linking)

## 🔄 Common Workflows

### Workflow 1: New Customer
```
1. Create Account: "John Doe - Receivables"
2. Link to Contact: ☑
3. Contact Name: "John Doe"
4. Phone: "+91-9876543210"
5. Mark as Customer: ☑
6. Save
7. Go to Invoices → Create Invoice
8. Select "John Doe" from customer dropdown
```

### Workflow 2: Business Customer
```
1. Create Account: "ABC Corp - Receivables"
2. Link to Contact: ☑
3. Contact Name: "ABC Corporation"
4. Phone: "+91-9876543210"
5. Email: "billing@abc.com"
6. Company: "ABC Corporation"
7. Mark as Customer: ☑
8. Save
```

### Workflow 3: Vendor/Supplier
```
1. Create Account: "XYZ Suppliers - Payables"
2. Link to Contact: ☑
3. Contact Name: "XYZ Suppliers"
4. Phone: "+91-9876543210"
5. Mark as Customer: ☐ (unchecked)
6. Save
```

### Workflow 4: Regular Account
```
1. Create Account: "Cash in Hand"
2. Link to Contact: ☐ (unchecked)
3. Fill account details only
4. Save
```

## ❓ FAQ

### Q: Do I have to link every account to a contact?
**A:** No! It's optional. Only link when you need to track a person/company.

### Q: What if I forget to mark as customer?
**A:** Go to Contacts page, find the contact, edit it, and check "Customer Status".

### Q: Can I link multiple accounts to one contact?
**A:** Yes! Create multiple accounts and link them to the same contact (future feature).

### Q: What happens if I don't fill phone number?
**A:** You'll get an error. Phone is required when linking to contact.

### Q: Can I edit the contact later?
**A:** Yes! Go to Contacts page, find the contact, and edit it.

### Q: Will the customer appear immediately in invoices?
**A:** Yes! As soon as you save, the customer is available for invoice creation.

## ⚠️ Important Notes

### Required When Linking
- ✓ Contact Name
- ✓ Phone Number

### Optional But Recommended
- Email (for sending invoices)
- Company (for business customers)
- Address (for delivery/billing)

### Customer Checkbox
- Check it for customers (people who buy from you)
- Uncheck it for vendors (people you buy from)
- Uncheck it for other contacts

## 🎯 Success Checklist

Before clicking Save, verify:
- [ ] Account name is filled
- [ ] Account type is selected
- [ ] If linking: Contact name is filled
- [ ] If linking: Phone is filled
- [ ] If customer: "Mark as Customer" is checked
- [ ] All details are correct

## 🚀 Next Steps

After creating account with customer:

1. **Create Invoice**
   ```
   Finance → Invoices → Create Invoice
   Select your customer from dropdown
   ```

2. **View Contact**
   ```
   Dashboard → Contacts
   Find your contact
   View details
   ```

3. **View Account**
   ```
   Finance → Chart of Accounts
   Find your account
   View ledger
   ```

## 📞 Need Help?

### Check These:
1. **ACCOUNT_CONTACT_LINKING.md** - Detailed technical guide
2. **CUSTOMER_WORKFLOW.md** - Customer management guide
3. **README.md** - General documentation

### Common Issues:
- **Contact not created**: Check if name and phone were filled
- **Not marked as customer**: Check if "Mark as Customer" was checked
- **Customer not in invoice**: Refresh the invoice page

---

**Quick Guide Version**: 1.0.0
**Last Updated**: 2024
**Status**: ✅ Ready to Use
