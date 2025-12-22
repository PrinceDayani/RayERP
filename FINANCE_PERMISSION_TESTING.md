# Finance Permission Testing Checklist

## ✅ Complete Testing Guide

Use this checklist to verify finance permission implementation is working correctly.

---

## 🧪 Test Environment Setup

### Prerequisites
- [ ] Backend server running (`npm run dev` in backend/)
- [ ] Frontend server running (`npm run dev` in frontend/)
- [ ] MongoDB connected
- [ ] At least 3 test users created:
  - User 1: No finance permissions
  - User 2: With finance.view permission
  - User 3: Admin (level 80+)

---

## 📋 Test Cases

### Test 1: User WITHOUT Finance Permission

**Setup:**
```javascript
// Create test user with basic role
Role: "Employee"
Permissions: ["dashboard.view", "projects.view"]
Department: None or non-finance department
```

**Test Steps:**
1. [ ] Login as user without finance permission
2. [ ] Check sidebar navigation
   - **Expected**: Finance tab is NOT visible
   - **Actual**: _____________
3. [ ] Try direct URL: `http://localhost:3000/dashboard/finance`
   - **Expected**: Shows "Finance Access Required" error page
   - **Actual**: _____________
4. [ ] Check error page content:
   - [ ] Shows shield icon
   - [ ] Shows "Finance Access Required" heading
   - [ ] Lists required permissions
   - [ ] Has "Return to Dashboard" button
5. [ ] Click "Return to Dashboard"
   - **Expected**: Redirects to /dashboard
   - **Actual**: _____________
6. [ ] Open browser console, try API call:
   ```javascript
   fetch('/api/general-ledger/accounts', {
     headers: { 
       Authorization: `Bearer ${localStorage.getItem('auth-token')}` 
     }
   }).then(r => r.json()).then(console.log)
   ```
   - **Expected**: Returns 403 Forbidden with message
   - **Actual**: _____________

**Result**: [ ] PASS [ ] FAIL

---

### Test 2: User WITH finance.view Permission (Role-Based)

**Setup:**
```javascript
// Create test user with finance role
Role: "Finance Viewer"
Permissions: ["finance.view", "accounts.view", "ledger.view"]
Department: None
```

**Test Steps:**
1. [ ] Login as user with finance.view
2. [ ] Check sidebar navigation
   - **Expected**: Finance tab IS visible
   - **Actual**: _____________
3. [ ] Click Finance tab
   - **Expected**: Finance page loads successfully
   - **Actual**: _____________
4. [ ] Check page content:
   - [ ] Shows finance modules
   - [ ] Shows quick actions
   - [ ] Shows statistics
5. [ ] Try to view accounts: Click "Chart of Accounts"
   - **Expected**: Loads successfully (has accounts.view)
   - **Actual**: _____________
6. [ ] Try to create account: Look for "Create Account" button
   - **Expected**: Button hidden or disabled (no accounts.create)
   - **Actual**: _____________
7. [ ] Try API call to view accounts:
   ```javascript
   fetch('/api/general-ledger/accounts', {
     headers: { 
       Authorization: `Bearer ${localStorage.getItem('auth-token')}` 
     }
   }).then(r => r.json()).then(console.log)
   ```
   - **Expected**: Returns account data successfully
   - **Actual**: _____________
8. [ ] Try API call to create account:
   ```javascript
   fetch('/api/general-ledger/accounts', {
     method: 'POST',
     headers: { 
       'Content-Type': 'application/json',
       Authorization: `Bearer ${localStorage.getItem('auth-token')}` 
     },
     body: JSON.stringify({ name: 'Test', type: 'Asset' })
   }).then(r => r.json()).then(console.log)
   ```
   - **Expected**: Returns 403 Forbidden (no accounts.create)
   - **Actual**: _____________

**Result**: [ ] PASS [ ] FAIL

---

### Test 3: User WITH finance.manage Permission (Role-Based)

**Setup:**
```javascript
// Create test user with full finance role
Role: "Finance Manager"
Permissions: [
  "finance.view", 
  "finance.manage",
  "accounts.view",
  "accounts.create",
  "accounts.edit",
  "journal.view",
  "journal.create"
]
Department: None
```

**Test Steps:**
1. [ ] Login as user with finance.manage
2. [ ] Check sidebar navigation
   - **Expected**: Finance tab IS visible
   - **Actual**: _____________
3. [ ] Access finance page
   - **Expected**: Loads successfully
   - **Actual**: _____________
4. [ ] Try to create account
   - **Expected**: Can create (has accounts.create)
   - **Actual**: _____________
5. [ ] Try to create journal entry
   - **Expected**: Can create (has journal.create)
   - **Actual**: _____________
6. [ ] Try all CRUD operations
   - [ ] Create: Works
   - [ ] Read: Works
   - [ ] Update: Works
   - [ ] Delete: Check if permission exists

**Result**: [ ] PASS [ ] FAIL

---

### Test 4: User WITH Department Permission

**Setup:**
```javascript
// Create department with permissions
Department: "Finance Department"
Permissions: ["finance.view", "finance.manage", "accounts.view"]

// Create user with basic role
Role: "Employee"
Permissions: ["dashboard.view"]

// Assign user to Finance department
Employee.departments = ["Finance Department"]
```

**Test Steps:**
1. [ ] Login as user
2. [ ] Check sidebar navigation
   - **Expected**: Finance tab IS visible (inherited from dept)
   - **Actual**: _____________
3. [ ] Access finance page
   - **Expected**: Loads successfully
   - **Actual**: _____________
4. [ ] Verify inherited permissions work
   - [ ] Can view accounts (from department)
   - [ ] Can access finance module (from department)
5. [ ] Try API call:
   ```javascript
   fetch('/api/general-ledger/accounts', {
     headers: { 
       Authorization: `Bearer ${localStorage.getItem('auth-token')}` 
     }
   }).then(r => r.json()).then(console.log)
   ```
   - **Expected**: Returns data (department permission works)
   - **Actual**: _____________

**Result**: [ ] PASS [ ] FAIL

---

### Test 5: User WITH Combined Permissions (Role + Department)

**Setup:**
```javascript
// User role permissions
Role: "Manager"
Permissions: ["finance.view", "accounts.view"]

// Department permissions
Department: "Finance Department"
Permissions: ["journal.create", "journal.edit"]

// User assigned to department
Employee.departments = ["Finance Department"]
```

**Test Steps:**
1. [ ] Login as user
2. [ ] Verify combined permissions:
   - [ ] Has finance.view (from role)
   - [ ] Has accounts.view (from role)
   - [ ] Has journal.create (from department)
   - [ ] Has journal.edit (from department)
3. [ ] Test role permission: View accounts
   - **Expected**: Works
   - **Actual**: _____________
4. [ ] Test department permission: Create journal entry
   - **Expected**: Works
   - **Actual**: _____________
5. [ ] Verify permissions are additive (union)
   - **Expected**: Has all permissions from both sources
   - **Actual**: _____________

**Result**: [ ] PASS [ ] FAIL

---

### Test 6: Admin User (Level 80+)

**Setup:**
```javascript
// Admin user
Role: "Admin"
Level: 80
Permissions: [] // Can be empty, level overrides
```

**Test Steps:**
1. [ ] Login as admin
2. [ ] Check sidebar navigation
   - **Expected**: Finance tab IS visible
   - **Actual**: _____________
3. [ ] Access finance page
   - **Expected**: Loads successfully
   - **Actual**: _____________
4. [ ] Try all operations without specific permissions
   - [ ] Create accounts: Works
   - [ ] Create journal entries: Works
   - [ ] Delete records: Works
   - [ ] All operations: Work
5. [ ] Verify admin bypass:
   - **Expected**: Admin can do everything regardless of permissions
   - **Actual**: _____________

**Result**: [ ] PASS [ ] FAIL

---

### Test 7: Permission Removal (Dynamic Update)

**Setup:**
```javascript
// User with finance permission
Role: "Finance Manager"
Permissions: ["finance.view", "finance.manage"]
```

**Test Steps:**
1. [ ] Login as user with finance permission
2. [ ] Verify finance tab is visible
3. [ ] Access finance page successfully
4. [ ] In another tab/window, remove finance permission from role
   ```javascript
   // Admin removes permission
   role.permissions = role.permissions.filter(p => 
     !p.startsWith('finance.')
   );
   await role.save();
   ```
5. [ ] Back in user's browser, refresh page
6. [ ] Check sidebar navigation
   - **Expected**: Finance tab disappears
   - **Actual**: _____________
7. [ ] Try to access finance page
   - **Expected**: Shows error page
   - **Actual**: _____________

**Result**: [ ] PASS [ ] FAIL

---

### Test 8: Inactive Department

**Setup:**
```javascript
// Department with permissions but inactive
Department: "Old Finance Dept"
Status: "inactive"
Permissions: ["finance.view", "finance.manage"]

// User assigned to inactive department
Employee.departments = ["Old Finance Dept"]
```

**Test Steps:**
1. [ ] Login as user
2. [ ] Check sidebar navigation
   - **Expected**: Finance tab NOT visible (dept inactive)
   - **Actual**: _____________
3. [ ] Try to access finance page
   - **Expected**: Shows error page
   - **Actual**: _____________
4. [ ] Verify inactive departments don't grant permissions
   - **Expected**: Permissions not inherited from inactive dept
   - **Actual**: _____________

**Result**: [ ] PASS [ ] FAIL

---

### Test 9: Multiple Departments

**Setup:**
```javascript
// Department 1
Department: "Finance"
Permissions: ["finance.view", "accounts.view"]

// Department 2
Department: "Accounting"
Permissions: ["journal.create", "ledger.view"]

// User assigned to both
Employee.departments = ["Finance", "Accounting"]
```

**Test Steps:**
1. [ ] Login as user
2. [ ] Verify combined permissions from both departments:
   - [ ] Has finance.view (from Finance dept)
   - [ ] Has accounts.view (from Finance dept)
   - [ ] Has journal.create (from Accounting dept)
   - [ ] Has ledger.view (from Accounting dept)
3. [ ] Test permissions from first department
   - **Expected**: Works
   - **Actual**: _____________
4. [ ] Test permissions from second department
   - **Expected**: Works
   - **Actual**: _____________

**Result**: [ ] PASS [ ] FAIL

---

### Test 10: Error Page Navigation

**Setup:**
```javascript
// User without finance permission
```

**Test Steps:**
1. [ ] Login as user without permission
2. [ ] Try to access: `/dashboard/finance`
3. [ ] Verify error page shows:
   - [ ] Shield icon
   - [ ] "Finance Access Required" heading
   - [ ] Clear explanation
   - [ ] Required permissions list
   - [ ] "Return to Dashboard" button
4. [ ] Click "Return to Dashboard"
   - **Expected**: Redirects to /dashboard
   - **Actual**: _____________
5. [ ] Try to access: `/dashboard/finance/accounts`
6. [ ] Verify same error page shows
7. [ ] Use browser back button
   - **Expected**: Goes back to previous page
   - **Actual**: _____________

**Result**: [ ] PASS [ ] FAIL

---

## 🔍 Backend API Testing

### Test API Endpoints

**Test each endpoint with different permission levels:**

```bash
# 1. No Permission
curl -H "Authorization: Bearer <no-perm-token>" \
  http://localhost:5000/api/general-ledger/accounts
# Expected: 403 Forbidden

# 2. With finance.view
curl -H "Authorization: Bearer <view-token>" \
  http://localhost:5000/api/general-ledger/accounts
# Expected: 200 OK with data

# 3. Create without permission
curl -X POST \
  -H "Authorization: Bearer <view-token>" \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","type":"Asset"}' \
  http://localhost:5000/api/general-ledger/accounts
# Expected: 403 Forbidden (no accounts.create)

# 4. Create with permission
curl -X POST \
  -H "Authorization: Bearer <manage-token>" \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","type":"Asset"}' \
  http://localhost:5000/api/general-ledger/accounts
# Expected: 201 Created
```

**Checklist:**
- [ ] GET requests work with finance.view
- [ ] POST requests require specific create permission
- [ ] PUT requests require specific edit permission
- [ ] DELETE requests require specific delete permission
- [ ] Admin bypasses all checks
- [ ] 403 responses include clear error messages

---

## 📊 Test Results Summary

| Test Case | Status | Notes |
|-----------|--------|-------|
| 1. No Permission | [ ] PASS [ ] FAIL | |
| 2. finance.view (Role) | [ ] PASS [ ] FAIL | |
| 3. finance.manage (Role) | [ ] PASS [ ] FAIL | |
| 4. Department Permission | [ ] PASS [ ] FAIL | |
| 5. Combined Permissions | [ ] PASS [ ] FAIL | |
| 6. Admin Override | [ ] PASS [ ] FAIL | |
| 7. Permission Removal | [ ] PASS [ ] FAIL | |
| 8. Inactive Department | [ ] PASS [ ] FAIL | |
| 9. Multiple Departments | [ ] PASS [ ] FAIL | |
| 10. Error Page Navigation | [ ] PASS [ ] FAIL | |

---

## ✅ Final Verification

- [ ] All test cases passed
- [ ] No console errors
- [ ] Error messages are user-friendly
- [ ] Navigation works correctly
- [ ] API responses are appropriate
- [ ] Performance is acceptable
- [ ] Documentation is accurate

---

## 🐛 Issues Found

| Issue | Severity | Description | Status |
|-------|----------|-------------|--------|
| | | | |
| | | | |

---

## 📝 Notes

_Add any additional observations or notes here_

---

**Tested By**: _____________
**Date**: _____________
**Environment**: [ ] Development [ ] Staging [ ] Production
**Status**: [ ] All Tests Passed [ ] Issues Found

---

**For Implementation Details**: See `FINANCE_PERMISSION_COMPLETE.md`
**For Quick Reference**: See `FINANCE_PERMISSION_QUICK_REF.md`
