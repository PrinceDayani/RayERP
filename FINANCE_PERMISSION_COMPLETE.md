# Finance Permission System - Complete Implementation

## ✅ IMPLEMENTATION STATUS: COMPLETE

The finance permission system is now fully implemented with **3-layer protection**:
1. **Backend API Protection** - All finance routes require permissions
2. **Frontend Sidebar Control** - Finance tab hidden without permissions
3. **Frontend Route Protection** - Direct URL access blocked without permissions

---

## 🔒 Permission Structure

### Module-Level Permissions (Required for ANY finance access)
- `finance.view` - View finance module and data
- `finance.manage` - Manage finance operations

### Feature-Level Permissions (Specific operations)
- `accounts.view` - View chart of accounts
- `accounts.create` - Create new accounts
- `accounts.edit` - Edit existing accounts
- `accounts.delete` - Delete accounts
- `journal.view` - View journal entries
- `journal.create` - Create journal entries
- `journal.edit` - Edit journal entries
- `journal.delete` - Delete journal entries
- `journal.post` - Post journal entries
- `ledger.view` - View general ledger
- `ledger.export` - Export ledger data
- `bills.view` - View bills
- `bills.create` - Create bills
- `bills.edit` - Edit bills
- `bills.delete` - Delete bills
- `payments.view` - View payments
- `payments.create` - Create payments
- `payments.edit` - Edit payments
- `payments.delete` - Delete payments
- `payments.approve` - Approve payments
- `invoices.view` - View invoices
- `invoices.create` - Create invoices
- `invoices.edit` - Edit invoices
- `invoices.delete` - Delete invoices
- `invoices.approve` - Approve invoices
- `reports.view` - View financial reports
- `reports.export` - Export reports

---

## 🏗️ Architecture

### Backend Protection

#### 1. Finance Permission Middleware
**File**: `backend/src/middleware/financePermission.middleware.ts`

```typescript
// Checks BOTH individual user permissions AND department permissions
const checkFinanceAccess = async (req: Request): Promise<boolean> => {
  // 1. Check user role level (80+ = Admin access)
  // 2. Check user's direct permissions
  // 3. Check user's department permissions
  // Returns true if user has finance.view OR finance.manage
}

export const requireFinanceAccess = (specificPermission: string) => {
  // 1. First checks module-level access (finance.view/manage)
  // 2. Then checks specific permission (e.g., journal.create)
  // Returns 403 if access denied
}
```

#### 2. Route Protection
**File**: `backend/src/routes/generalLedger.routes.ts`

All finance routes are protected:
```typescript
router.use(authenticateToken); // Authentication required

// Every route has permission check
router.get('/accounts', requireFinanceAccess('accounts.view'), getAccounts);
router.post('/journal-entries', requireFinanceAccess('journal.create'), createJournalEntry);
router.get('/trial-balance', requireFinanceAccess('ledger.view'), getTrialBalance);
```

### Frontend Protection

#### 1. Sidebar Visibility Control
**File**: `frontend/src/components/Layout.tsx`

```typescript
// Check finance access
const hasFinanceAccess = hasAnyPermission(['finance.view', 'finance.manage']);

// Finance menu item
{ 
  path: "/dashboard/finance", 
  name: "Finance", 
  icon: Wallet, 
  access: hasFinanceAccess  // ✅ Hidden if no access
}
```

#### 2. Route Protection Component
**File**: `frontend/src/components/FinancePermissionGuard.tsx`

```typescript
<FinancePermissionGuard requiredPermission="journal.create">
  <JournalEntryPage />
</FinancePermissionGuard>
```

Features:
- ✅ Checks authentication
- ✅ Checks finance module access (finance.view/manage)
- ✅ Checks specific permission (optional)
- ✅ Shows user-friendly error messages
- ✅ Provides navigation options
- ✅ Prevents URL-based access bypass

#### 3. Permission Hooks
**File**: `frontend/src/hooks/usePermissions.ts`

```typescript
const { hasPermission, hasAnyPermission, hasFinanceAccess } = usePermissions();

// Check single permission
if (hasPermission('journal.create')) { ... }

// Check multiple permissions (OR logic)
if (hasAnyPermission(['finance.view', 'finance.manage'])) { ... }

// Check finance access
if (hasFinanceAccess) { ... }
```

---

## 🎯 Permission Assignment

### Individual User Permissions

**Via Role Assignment:**
```typescript
// User inherits permissions from their role
User -> Role -> Permissions[]
```

**Example:**
```json
{
  "user": "john@company.com",
  "role": "Finance Manager",
  "permissions": [
    "finance.view",
    "finance.manage",
    "accounts.view",
    "accounts.create",
    "journal.view",
    "journal.create",
    "ledger.view"
  ]
}
```

### Department-Level Permissions

**Via Department Assignment:**
```typescript
// User gets additional permissions from their department(s)
User -> Employee -> Department(s) -> Permissions[]
```

**Example:**
```json
{
  "department": "Finance Department",
  "permissions": [
    "finance.view",
    "finance.manage",
    "accounts.view",
    "accounts.create",
    "journal.view",
    "journal.create"
  ]
}
```

**Combined Permissions:**
```typescript
// Final permissions = User Role Permissions + Department Permissions
const userPermissions = new Set([
  ...userRole.permissions,
  ...departmentPermissions
]);
```

---

## 🔧 How to Assign Finance Permissions

### Method 1: Via Role Management

1. Go to **Admin Panel** → **Role Management**
2. Select or create a role (e.g., "Finance Manager")
3. Enable finance permissions:
   - ✅ `finance.view` (Required)
   - ✅ `finance.manage` (For full access)
   - ✅ Additional specific permissions as needed
4. Assign role to users

### Method 2: Via Department Permissions

1. Go to **Departments** → Select Department
2. Add finance permissions to department:
   ```json
   {
     "name": "Finance Department",
     "permissions": [
       "finance.view",
       "finance.manage",
       "accounts.view",
       "accounts.create",
       "journal.view",
       "journal.create",
       "ledger.view"
     ]
   }
   ```
3. Assign employees to the department

### Method 3: Via Database Script

```javascript
// backend/scripts/addFinancePermissions.js
const User = require('../models/User');
const Role = require('../models/Role');

// Add to role
const role = await Role.findOne({ name: 'Finance Manager' });
role.permissions.push('finance.view', 'finance.manage');
await role.save();

// Or add to department
const dept = await Department.findOne({ name: 'Finance' });
dept.permissions.push('finance.view', 'finance.manage');
await dept.save();
```

---

## 🧪 Testing Finance Permissions

### Test Case 1: User WITHOUT Finance Permission

**Expected Behavior:**
1. ❌ Finance tab NOT visible in sidebar
2. ❌ Direct URL access to `/dashboard/finance` → Shows "Finance Access Required" error
3. ❌ API calls to finance endpoints → Returns 403 Forbidden

**Test Steps:**
```bash
# 1. Login as user without finance permissions
# 2. Check sidebar - Finance tab should be hidden
# 3. Try accessing: http://localhost:3000/dashboard/finance
# Expected: Access denied page with "Finance Access Required"
# 4. Open browser console and try API call:
fetch('/api/general-ledger/accounts', {
  headers: { Authorization: 'Bearer <token>' }
})
# Expected: 403 Forbidden
```

### Test Case 2: User WITH Finance Permission (Individual)

**Setup:**
```javascript
// Assign finance.view to user's role
const role = await Role.findOne({ name: 'Manager' });
role.permissions.push('finance.view');
await role.save();
```

**Expected Behavior:**
1. ✅ Finance tab visible in sidebar
2. ✅ Can access `/dashboard/finance`
3. ✅ Can view finance data
4. ❌ Cannot create/edit (needs specific permissions)

### Test Case 3: User WITH Finance Permission (Department)

**Setup:**
```javascript
// Assign finance.view to department
const dept = await Department.findOne({ name: 'Finance' });
dept.permissions.push('finance.view', 'finance.manage');
await dept.save();

// Assign user to department
const employee = await Employee.findOne({ email: 'user@company.com' });
employee.departments = ['Finance'];
await employee.save();
```

**Expected Behavior:**
1. ✅ Finance tab visible in sidebar
2. ✅ Can access all finance features
3. ✅ Inherits permissions from department

### Test Case 4: Admin/Super Admin

**Expected Behavior:**
1. ✅ Automatic access (role level >= 80)
2. ✅ Bypasses permission checks
3. ✅ Full access to all finance features

---

## 📋 Permission Matrix

| Role | finance.view | finance.manage | Sidebar Visible | URL Access | API Access |
|------|--------------|----------------|-----------------|------------|------------|
| **No Permission** | ❌ | ❌ | ❌ | ❌ | ❌ |
| **finance.view** | ✅ | ❌ | ✅ | ✅ | ✅ (Read-only) |
| **finance.manage** | ✅ | ✅ | ✅ | ✅ | ✅ (Full) |
| **Admin (Level 80+)** | ✅ | ✅ | ✅ | ✅ | ✅ (Full) |
| **Department Permission** | ✅ | ✅ | ✅ | ✅ | ✅ (Based on dept) |

---

## 🚨 Security Features

### 1. Multi-Layer Protection
- ✅ Backend API validation
- ✅ Frontend route guards
- ✅ Sidebar visibility control
- ✅ Component-level checks

### 2. Permission Inheritance
- ✅ User role permissions
- ✅ Department permissions
- ✅ Combined permission set

### 3. Granular Control
- ✅ Module-level access (finance.view/manage)
- ✅ Feature-level access (journal.create, accounts.edit)
- ✅ Operation-level access (approve, post, delete)

### 4. Audit Trail
- ✅ All permission checks logged
- ✅ Access attempts tracked
- ✅ Permission changes recorded

---

## 🔍 Troubleshooting

### Issue: User can't see Finance tab

**Check:**
1. User has `finance.view` OR `finance.manage` permission
2. User's role includes the permission
3. User's department includes the permission
4. User is assigned to the department (in Employee record)

**Debug:**
```javascript
// Check user permissions
const user = await User.findById(userId).populate('role');
console.log('Role permissions:', user.role.permissions);

// Check department permissions
const employee = await Employee.findOne({ email: user.email });
const departments = await Department.find({ 
  name: { $in: employee.departments },
  status: 'active'
});
console.log('Department permissions:', departments.map(d => d.permissions));
```

### Issue: User sees Finance tab but gets 403 on API calls

**Cause:** User has module access but missing specific permission

**Solution:**
```javascript
// Add specific permissions
role.permissions.push('accounts.view', 'journal.view', 'ledger.view');
await role.save();
```

### Issue: Admin can't access Finance

**Check:**
1. Role level should be >= 80
2. Role name should be 'Admin', 'Super_Admin', or 'Root'

**Fix:**
```javascript
const role = await Role.findOne({ name: 'Admin' });
role.level = 80;
await role.save();
```

---

## 📝 Implementation Checklist

- ✅ Backend middleware created (`financePermission.middleware.ts`)
- ✅ Backend routes protected (all finance routes)
- ✅ Frontend permission guard created (`FinancePermissionGuard.tsx`)
- ✅ Frontend sidebar updated (visibility control)
- ✅ Frontend pages protected (route guards)
- ✅ Permission hooks updated (`usePermissions.ts`)
- ✅ Permission library updated (`permissions.ts`)
- ✅ User model supports permissions
- ✅ Department model supports permissions
- ✅ Combined permission checking (user + department)
- ✅ Error messages user-friendly
- ✅ Documentation complete

---

## 🎓 Best Practices

1. **Always use module-level permissions first**
   - Check `finance.view` before checking `journal.create`

2. **Use permission guards on all finance pages**
   ```typescript
   <FinancePermissionGuard requiredPermission="journal.create">
     <JournalEntryPage />
   </FinancePermissionGuard>
   ```

3. **Check permissions in components**
   ```typescript
   const { hasPermission } = usePermissions();
   
   {hasPermission('journal.create') && (
     <Button onClick={createJournal}>Create Entry</Button>
   )}
   ```

4. **Assign permissions at role level for consistency**
   - Easier to manage
   - Applies to all users with that role

5. **Use department permissions for team-based access**
   - Automatic permission inheritance
   - Easier onboarding

---

## 📞 Support

For issues or questions:
1. Check this documentation
2. Review permission assignments in Admin Panel
3. Check browser console for permission errors
4. Review backend logs for API permission failures

---

**Status**: ✅ Production Ready
**Version**: 1.0.0
**Last Updated**: 2024
