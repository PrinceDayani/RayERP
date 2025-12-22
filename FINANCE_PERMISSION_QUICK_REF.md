# Finance Permission - Quick Reference

## ✅ COMPLETE IMPLEMENTATION

Finance permissions are now **fully enforced** at 3 levels:
1. **Backend API** - All routes protected
2. **Sidebar** - Tab hidden without permission
3. **URL Access** - Direct navigation blocked

---

## 🔑 Required Permissions

### To Access Finance Module
User needs **AT LEAST ONE** of:
- `finance.view` - View finance data
- `finance.manage` - Full finance access

### Permission Sources
Permissions can come from:
1. **User's Role** - Assigned via role
2. **User's Department** - Inherited from department(s)
3. **Combined** - Union of both sources

---

## 🎯 Quick Setup

### Give Finance Access to a User

**Option 1: Via Role**
```javascript
// In Admin Panel → Role Management
// Or via database:
const role = await Role.findOne({ name: 'Finance Manager' });
role.permissions.push('finance.view', 'finance.manage');
await role.save();
```

**Option 2: Via Department**
```javascript
// In Departments → Edit Department
// Or via database:
const dept = await Department.findOne({ name: 'Finance' });
dept.permissions.push('finance.view', 'finance.manage');
await dept.save();

// Assign user to department
const employee = await Employee.findOne({ email: 'user@company.com' });
employee.departments = ['Finance'];
await employee.save();
```

---

## 🧪 Quick Test

### Test 1: No Permission
1. Login as user without finance permission
2. **Expected**: Finance tab NOT in sidebar
3. Try: `http://localhost:3000/dashboard/finance`
4. **Expected**: "Finance Access Required" error page

### Test 2: With Permission
1. Add `finance.view` to user's role
2. **Expected**: Finance tab appears in sidebar
3. Click Finance tab
4. **Expected**: Finance page loads successfully

---

## 🔒 What's Protected

### Backend (API)
- ✅ All `/api/general-ledger/*` routes
- ✅ All `/api/finance/*` routes
- ✅ Returns 403 if no permission

### Frontend
- ✅ Sidebar Finance tab (hidden if no access)
- ✅ Finance page route (blocked if no access)
- ✅ All finance sub-pages (protected)

---

## 📋 Permission List

### Module Access (Required)
- `finance.view` - View finance module
- `finance.manage` - Manage finance

### Specific Features
- `accounts.view/create/edit/delete` - Chart of Accounts
- `journal.view/create/edit/delete/post` - Journal Entries
- `ledger.view/export` - General Ledger
- `bills.view/create/edit/delete` - Bills
- `payments.view/create/edit/delete/approve` - Payments
- `invoices.view/create/edit/delete/approve` - Invoices
- `reports.view/export` - Financial Reports

---

## 🚨 Common Issues

### "Finance tab not showing"
**Fix**: Add `finance.view` or `finance.manage` to user's role/department

### "403 Forbidden on API calls"
**Fix**: Add specific permission (e.g., `accounts.view`, `journal.create`)

### "User in Finance dept but no access"
**Fix**: 
1. Check department has permissions
2. Check employee is assigned to department
3. Check department status is 'active'

---

## 💡 Pro Tips

1. **Admins (level 80+) bypass all checks** - Automatic full access
2. **Department permissions are additive** - User gets union of role + dept permissions
3. **Use role permissions for consistency** - Easier to manage
4. **Use dept permissions for teams** - Automatic inheritance

---

## 📁 Key Files

### Backend
- `backend/src/middleware/financePermission.middleware.ts` - Permission checks
- `backend/src/routes/generalLedger.routes.ts` - Protected routes

### Frontend
- `frontend/src/components/FinancePermissionGuard.tsx` - Route protection
- `frontend/src/components/Layout.tsx` - Sidebar visibility
- `frontend/src/hooks/usePermissions.ts` - Permission hooks
- `frontend/src/lib/permissions.ts` - Permission utilities

---

## ✅ Verification Checklist

- [ ] User has `finance.view` or `finance.manage` permission
- [ ] Finance tab visible in sidebar
- [ ] Can access `/dashboard/finance` URL
- [ ] API calls return data (not 403)
- [ ] Users without permission see error page
- [ ] Direct URL access blocked for unauthorized users

---

**For detailed documentation, see**: `FINANCE_PERMISSION_COMPLETE.md`
