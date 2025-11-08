# Department Permissions - Setup & Usage Guide

## ✅ What's Been Implemented

### Backend (Already Working)
- ✅ Department model with `permissions: string[]` field
- ✅ API endpoints for permission management
- ✅ Permission inheritance for employees

### Frontend (Just Added)
- ✅ Shield button on each department card
- ✅ Permission management dialog
- ✅ Add/remove permissions interface
- ✅ Permission count display on cards
- ✅ API client methods

## 🚀 How to Use

### 1. Access Department Permissions

1. Navigate to **Dashboard → Departments**
2. Find the department you want to manage
3. Click the **Shield icon** button on the department card
4. The "Manage Permissions" dialog will open

### 2. Add Permissions

In the permission dialog:
1. Type a permission in the format: `module.action`
2. Press **Enter** or click **Add** button
3. The permission is immediately saved

**Examples:**
```
projects.view
projects.create
projects.update
projects.delete
tasks.view
tasks.create
tasks.assign
employees.view
employees.manage
finance.view
finance.manage
reports.view
reports.export
```

### 3. Remove Permissions

1. In the permission list, find the permission to remove
2. Click the **X** button next to it
3. The permission is immediately removed

### 4. View Permission Count

Each department card shows:
- **Employees**: Number of assigned employees
- **Budget**: Department budget
- **Permissions**: Number of assigned permissions ← NEW!

## 🔧 Testing the Implementation

### Test Backend (Optional)

```bash
cd backend
node testDepartmentPermissionsAPI.js
```

This will:
- Connect to your database
- Find a department
- Show current permissions
- Add a test permission
- Verify it was saved

### Test Frontend

1. **Start the application:**
   ```bash
   # Terminal 1 - Backend
   cd backend
   npm run dev

   # Terminal 2 - Frontend
   cd frontend
   npm run dev
   ```

2. **Open browser:** http://localhost:3000

3. **Navigate to Departments page**

4. **Test the Shield button:**
   - Click Shield icon on any department
   - Add permission: `projects.view`
   - Verify it appears in the list
   - Add more: `tasks.create`, `employees.view`
   - Remove one permission
   - Close and reopen dialog - permissions should persist

## 📊 API Endpoints

All endpoints require authentication token.

### Get Department Permissions
```http
GET /api/departments/:id/permissions
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "permissions": ["projects.view", "tasks.create"]
  }
}
```

### Update All Permissions (Replace)
```http
PUT /api/departments/:id/permissions
Authorization: Bearer <token>
Content-Type: application/json

{
  "permissions": ["projects.view", "tasks.create", "employees.view"]
}
```

### Add Single Permission
```http
POST /api/departments/:id/permissions/add
Authorization: Bearer <token>
Content-Type: application/json

{
  "permission": "reports.view"
}
```

### Remove Single Permission
```http
POST /api/departments/:id/permissions/remove
Authorization: Bearer <token>
Content-Type: application/json

{
  "permission": "reports.view"
}
```

## 🎯 Permission Naming Convention

Use the format: `module.action`

### Common Modules:
- `projects` - Project management
- `tasks` - Task management
- `employees` - Employee management
- `attendance` - Attendance tracking
- `leave` - Leave management
- `finance` - Financial operations
- `budgets` - Budget management
- `expenses` - Expense tracking
- `reports` - Report generation
- `analytics` - Analytics access
- `settings` - System settings
- `contacts` - Contact management

### Common Actions:
- `view` - Read access
- `create` - Create new records
- `update` - Modify existing records
- `delete` - Delete records
- `manage` - Full management access
- `approve` - Approval rights
- `export` - Export data
- `assign` - Assignment rights

### Examples:
```
projects.view          - View projects
projects.create        - Create new projects
projects.update        - Edit projects
projects.delete        - Delete projects
tasks.view            - View tasks
tasks.create          - Create tasks
tasks.assign          - Assign tasks to users
employees.view        - View employee list
employees.manage      - Full employee management
finance.view          - View financial data
finance.manage        - Manage finances
reports.view          - View reports
reports.export        - Export reports
attendance.view       - View attendance
attendance.manage     - Manage attendance
leave.approve         - Approve leave requests
```

## 🔐 How Permissions Work

### Permission Inheritance

Employees inherit permissions from:
1. **User Role** (ROOT, ADMIN, etc.)
2. **RBAC Roles** (if assigned)
3. **Department(s)** ← This is what we just added!

All permissions are combined (union), giving employees the maximum access.

### Example Scenario

**Engineering Department** has permissions:
- `projects.view`
- `projects.create`
- `tasks.view`
- `tasks.create`

**John (Employee)** is in Engineering Department:
- ✅ Can view projects
- ✅ Can create projects
- ✅ Can view tasks
- ✅ Can create tasks
- ❌ Cannot delete projects (not in department permissions)

## 🐛 Troubleshooting

### Shield Button Not Visible
- **Check:** Make sure you're on the Departments page
- **Check:** Refresh the page (Ctrl+R or Cmd+R)
- **Check:** Clear browser cache

### Permissions Not Saving
- **Check:** Backend is running (http://localhost:5000)
- **Check:** You're logged in with valid token
- **Check:** Browser console for errors (F12)
- **Check:** Network tab shows successful API calls

### Permissions Not Loading
- **Check:** Department exists in database
- **Check:** API endpoint returns data
- **Test:** Run `node testDepartmentPermissionsAPI.js`

### Permission Count Shows 0
- **Check:** Permissions were actually added
- **Check:** Refresh the departments list
- **Check:** Department model has permissions field

## 📝 Code Changes Summary

### Files Modified:

1. **`frontend/src/lib/api/departments.ts`**
   - Added `permissions?: string[]` to Department interface
   - Added `getPermissions()` method
   - Added `updatePermissions()` method
   - Added `addPermission()` method
   - Added `removePermission()` method

2. **`frontend/src/app/dashboard/departments/page.tsx`**
   - Added Shield icon import
   - Added permission state variables
   - Added `openPermissionDialog()` handler
   - Added `handleAddPermission()` handler
   - Added `handleRemovePermission()` handler
   - Added Shield button to department cards
   - Added permission count display
   - Added permission management dialog

### Files Created:

1. **`backend/testDepartmentPermissionsAPI.js`**
   - Test script to verify backend functionality

2. **`DEPARTMENT_PERMISSIONS_SETUP.md`** (this file)
   - Complete setup and usage documentation

## 🎉 Success Checklist

- [ ] Backend is running
- [ ] Frontend is running
- [ ] Can see Departments page
- [ ] Can see Shield button on department cards
- [ ] Can click Shield button
- [ ] Permission dialog opens
- [ ] Can add permissions
- [ ] Can remove permissions
- [ ] Permission count updates on card
- [ ] Permissions persist after closing dialog

## 📚 Related Documentation

- [DEPARTMENT_PERMISSIONS.md](DEPARTMENT_PERMISSIONS.md) - Detailed technical documentation
- [README.md](README.md) - Main project documentation
- [API_FIXES_SUMMARY.md](API_FIXES_SUMMARY.md) - API documentation

---

**Need Help?**
- Check browser console (F12) for errors
- Check backend logs for API errors
- Run test script: `node testDepartmentPermissionsAPI.js`
- Review the API endpoints section above
