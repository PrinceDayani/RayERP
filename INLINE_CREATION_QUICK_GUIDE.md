# Inline Account/Group Creation - Quick Guide

## 🚀 Quick Start (2 Minutes)

### For Developers

**1. Import the Component**
```tsx
import { AccountSelector } from '@/components/finance/AccountSelector';
// OR
import { GroupSelector } from '@/components/finance/GroupSelector';
```

**2. Replace Existing Select**
```tsx
// OLD WAY ❌
<Select value={accountId} onValueChange={setAccountId}>
  <SelectTrigger><SelectValue placeholder="Select account" /></SelectTrigger>
  <SelectContent>
    {accounts.map(acc => (
      <SelectItem key={acc._id} value={acc._id}>
        {acc.code} - {acc.name}
      </SelectItem>
    ))}
  </SelectContent>
</Select>

// NEW WAY ✅
<AccountSelector
  value={accountId}
  onValueChange={setAccountId}
  accounts={accounts}
  onAccountCreated={fetchAccounts}
/>
```

**3. Done!** 🎉

---

## 📋 For Users

### How to Create Account While Filling Form

1. **Click the (+) button** next to account dropdown
2. **Fill in the form:**
   - Account Code (e.g., 1000)
   - Account Name (e.g., Cash)
   - Type (Asset/Liability/Equity/Revenue/Expense)
   - Description (optional)
3. **Click "Create"**
4. **Account is auto-selected** in the dropdown

### How to Create Group While Filling Form

1. **Click the (+) button** next to group dropdown
2. **Fill in the form:**
   - Group Code (e.g., GRP001)
   - Group Name (e.g., Current Assets)
   - Type (Assets/Liabilities/Income/Expenses)
   - Description (optional)
3. **Click "Create"**
4. **Group is auto-selected** in the dropdown

---

## 🎯 Where It Works

| Form | Status | Location |
|------|--------|----------|
| Journal Entry | ✅ Live | `/dashboard/finance/journal-entry` |
| GL Budgets | ✅ Live | `/dashboard/finance/gl-budgets` |
| Vouchers | ✅ Live | `/dashboard/finance/vouchers` |
| Invoices | ⏳ Coming | `/dashboard/finance/invoices` |
| Payments | ⏳ Coming | `/dashboard/finance/payments` |

---

## 💡 Pro Tips

1. **Use descriptive names** - Makes searching easier
2. **Follow code conventions** - Use consistent numbering (1000, 1001, etc.)
3. **Add descriptions** - Helps team understand account purpose
4. **Create as needed** - Don't pre-create all accounts

---

## 🐛 Troubleshooting

**Problem:** (+) button not showing
- **Solution:** Check if you're using AccountSelector/GroupSelector component

**Problem:** Account not appearing after creation
- **Solution:** Ensure `onAccountCreated` callback is passed and calls fetch function

**Problem:** Duplicate code error
- **Solution:** Use unique account codes

**Problem:** Permission denied
- **Solution:** Check user has permission to create accounts

---

## 📞 Support

For issues or questions:
1. Check [INLINE_ACCOUNT_CREATION.md](./INLINE_ACCOUNT_CREATION.md) for detailed docs
2. Review component code in `frontend/src/components/finance/`
3. Contact development team

---

**Last Updated:** 2024
**Version:** 1.0.0
