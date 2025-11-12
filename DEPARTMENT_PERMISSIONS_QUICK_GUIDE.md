# Department Permissions - Quick Reference Guide

## 🚀 Quick Start

### 1. Add Permissions to a Department

```bash
# Using curl
curl -X PUT http://localhost:5000/api/departments/{departmentId}/permissions \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "permissions": ["projects.view", "tasks.create", "reports.view"]
  }'
```

### 2. Get Department Permissions

```bash
curl -X GET http://localhost:5000/api/departments/{departmentId}/permissions \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 3. Add Single Permission

```bash
curl -X POST http://localhost:5000/api/departments/{departmentId}/permissions/add \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"permission": "analytics.view"}'
```

### 4. Remove Single Permission

```bash
curl -X POST http://localhost:5000/api/departments/{departmentId}/permissions/remove \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"permission": "analytics.view"}'
```

## 📋 Common Permission Sets

### Finance Department
```json
[
  "finance.view", "finance.manage",
  "budgets.view", "budgets.create", "budgets.update",
  "expenses.view", "expenses.approve",
  "reports.view", "reports.export"
]
```

### HR Department
```json
[
  "employees.view", "employees.create", "employees.update",
  "attendance.view", "attendance.manage",
  "leave.view", "leave.approve",
  "reports.view"
]
```

### IT/Engineering Department
```json
[
  "projects.view", "projects.create", "projects.update",
  "tasks.view", "tasks.create", "tasks.update", "tasks.delete",
  "resources.view", "resources.allocate"
]
```

### Sales Department
```json
[
  "contacts.view", "contacts.create", "contacts.update",
  "projects.view", "reports.view"
]
```

## 🔧 Using in Routes

### Basic Usage
```typescript
import { requirePermission } from '../middleware/rbac.middleware';

router.get('/reports', 
  protect, 
  requirePermission('reports.view'), 
  getReports
);
```

### Department-Only Check
```typescript
import { requireDepartmentPermission } from '../middleware/departmentPermission.middleware';

router.get('/dept-reports', 
  protect, 
  requireDepartmentPermission('reports.view'), 
  getDepartmentReports
);
```

### Multiple Permission Options
```typescript
import { requireAnyPermission } from '../middleware/rbac.middleware';

router.get('/analytics', 
  protect, 
  requireAnyPermission(['analytics.view', 'reports.view']), 
  getAnalytics
);
```

## 📝 Permission Naming Convention

Format: `module.action`

### Common Modules
- `projects` - Project management
- `tasks` - Task management
- `employees` - Employee management
- `attendance` - Attendance tracking
- `leave` - Leave management
- `finance` - Financial operations
- `budgets` - Budget management
- `expenses` - Expense management
- `invoices` - Invoice management
- `payments` - Payment processing
- `contacts` - Contact management
- `reports` - Report generation
- `analytics` - Analytics and insights
- `settings` - System settings
- `users` - User management
- `departments` - Department management
- `resources` - Resource allocation
- `inventory` - Inventory management

### Common Actions
- `view` - Read/view access
- `create` - Create new records
- `update` - Modify existing records
- `delete` - Delete records
- `manage` - Full management access
- `approve` - Approval rights
- `export` - Export data
- `allocate` - Allocate resources
- `process` - Process transactions
- `assign` - Assign items/tasks

## 🔍 Testing Permissions

### Test Script
```javascript
// testDepartmentPermissions.js
const axios = require('axios');

const API_URL = 'http://localhost:5000/api';
let authToken = '';

async function testDepartmentPermissions() {
  // 1. Login as admin
  const loginRes = await axios.post(`${API_URL}/auth/login`, {
    email: 'admin@example.com',
    password: 'password'
  });
  authToken = loginRes.data.token;

  // 2. Get department ID
  const deptsRes = await axios.get(`${API_URL}/departments`, {
    headers: { Authorization: `Bearer ${authToken}` }
  });
  const deptId = deptsRes.data.data[0]._id;

  // 3. Update permissions
  await axios.put(`${API_URL}/departments/${deptId}/permissions`, {
    permissions: ['projects.view', 'tasks.create']
  }, {
    headers: { Authorization: `Bearer ${authToken}` }
  });

  // 4. Verify permissions
  const permsRes = await axios.get(`${API_URL}/departments/${deptId}/permissions`, {
    headers: { Authorization: `Bearer ${authToken}` }
  });
  console.log('Permissions:', permsRes.data.data.permissions);
}

testDepartmentPermissions();
```

## 🎯 Common Scenarios

### Scenario 1: New Department Setup
1. Create department
2. Assign employees
3. Set permissions based on department role
4. Test with a department member

### Scenario 2: Permission Update
1. Review current permissions
2. Add/remove as needed
3. Notify department members
4. Verify changes

### Scenario 3: Employee Transfer
1. Employee automatically gets new department permissions
2. Loses old department permissions (if removed from old dept)
3. Multi-department employees keep all permissions

## ⚠️ Important Notes

1. **Active Departments Only**: Only active departments grant permissions
2. **Email Matching**: Employee email must match user email
3. **Permission Accumulation**: Users get ALL permissions from:
   - Their user role
   - Their RBAC roles
   - All their departments
4. **Admin Override**: ROOT, SUPER_ADMIN, and ADMIN roles bypass permission checks
5. **Case Sensitive**: Permission strings are case-sensitive

## 🐛 Troubleshooting

### Permission Not Working?
```bash
# Check employee record
GET /api/employees?email=user@example.com

# Check department status
GET /api/departments/{deptId}

# Check department permissions
GET /api/departments/{deptId}/permissions

# Test with error details
# The 403 response includes userPermissions array
```

### Common Issues
- ❌ Employee email doesn't match user email
- ❌ Department is inactive
- ❌ Permission string typo
- ❌ Employee not assigned to department
- ❌ Middleware not applied to route

## 📚 Related Files

- `backend/src/models/Department.ts` - Department model
- `backend/src/middleware/departmentPermission.middleware.ts` - Department permission middleware
- `backend/src/middleware/rbac.middleware.ts` - Combined RBAC middleware
- `backend/src/controllers/departmentController.ts` - Department controllers
- `backend/src/routes/department.routes.ts` - Department routes
- `backend/scripts/seedDepartmentPermissions.js` - Seed script

## 🔗 API Endpoints Summary

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/departments/:id/permissions` | Get department permissions |
| PUT | `/api/departments/:id/permissions` | Replace all permissions |
| POST | `/api/departments/:id/permissions/add` | Add single permission |
| POST | `/api/departments/:id/permissions/remove` | Remove single permission |

---

**Need Help?** Check [DEPARTMENT_PERMISSIONS.md](DEPARTMENT_PERMISSIONS.md) for detailed documentation.
