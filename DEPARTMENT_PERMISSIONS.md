# Department-Based Permissions System

## Overview

The RayERP system now supports department-based permissions, allowing organizations to grant custom privileges to employees based on their department membership. This feature works alongside the existing role-based access control (RBAC) system.

## How It Works

### Permission Hierarchy

Employees can have permissions from multiple sources:
1. **User Role Permissions** - Based on their assigned role (ROOT, SUPER_ADMIN, ADMIN, etc.)
2. **RBAC Role Permissions** - From assigned RBAC roles
3. **Department Permissions** - From their department(s) membership

All permissions are combined, giving employees the union of all their permissions.

### Multi-Department Support

Employees can belong to multiple departments (using the `departments` array in the Employee model). They will inherit permissions from all departments they belong to.

## Database Schema Changes

### Department Model

The Department model now includes a `permissions` field:

```typescript
{
  name: string;
  description: string;
  manager: { name, email, phone };
  location: string;
  budget: number;
  status: 'active' | 'inactive';
  employeeCount: number;
  permissions: string[];  // NEW: Array of permission strings
}
```

## API Endpoints

### Get Department Permissions
```
GET /api/departments/:id/permissions
```

**Response:**
```json
{
  "success": true,
  "data": {
    "permissions": ["projects.view", "tasks.create", "tasks.update"]
  }
}
```

### Update Department Permissions (Replace All)
```
PUT /api/departments/:id/permissions
```

**Request Body:**
```json
{
  "permissions": ["projects.view", "tasks.create", "tasks.update", "tasks.delete"]
}
```

**Response:**
```json
{
  "success": true,
  "data": { /* department object */ },
  "message": "Department permissions updated successfully"
}
```

### Add Single Permission
```
POST /api/departments/:id/permissions/add
```

**Request Body:**
```json
{
  "permission": "reports.view"
}
```

**Response:**
```json
{
  "success": true,
  "data": { /* department object */ },
  "message": "Permission added successfully"
}
```

### Remove Single Permission
```
POST /api/departments/:id/permissions/remove
```

**Request Body:**
```json
{
  "permission": "reports.view"
}
```

**Response:**
```json
{
  "success": true,
  "data": { /* department object */ },
  "message": "Permission removed successfully"
}
```

## Middleware Usage

### Using Department Permissions in Routes

#### Option 1: Department-Only Permission Check

Use this when you want to check ONLY department permissions:

```typescript
import { requireDepartmentPermission } from '../middleware/departmentPermission.middleware';

router.get('/reports', 
  protect, 
  requireDepartmentPermission('reports.view'), 
  getReports
);
```

#### Option 2: Combined Permission Check (Recommended)

The RBAC middleware automatically includes department permissions:

```typescript
import { requirePermission } from '../middleware/rbac.middleware';

router.get('/reports', 
  protect, 
  requirePermission('reports.view'),  // Checks role + RBAC + department permissions
  getReports
);
```

#### Option 3: Multiple Permission Options

```typescript
import { requireAnyDepartmentPermission } from '../middleware/departmentPermission.middleware';

router.get('/analytics', 
  protect, 
  requireAnyDepartmentPermission(['analytics.view', 'reports.view']), 
  getAnalytics
);
```

## Permission Naming Convention

Use a hierarchical naming structure:

```
module.action
```

### Examples:

- `projects.view` - View projects
- `projects.create` - Create projects
- `projects.update` - Update projects
- `projects.delete` - Delete projects
- `tasks.view` - View tasks
- `tasks.create` - Create tasks
- `employees.view` - View employees
- `employees.manage` - Manage employees
- `finance.view` - View financial data
- `finance.manage` - Manage financial data
- `reports.view` - View reports
- `reports.export` - Export reports
- `analytics.view` - View analytics
- `settings.manage` - Manage settings

## Use Cases

### Example 1: Finance Department

Grant the Finance department access to financial modules:

```json
{
  "permissions": [
    "finance.view",
    "finance.manage",
    "budgets.view",
    "budgets.create",
    "budgets.update",
    "expenses.view",
    "expenses.approve",
    "reports.view",
    "reports.export"
  ]
}
```

### Example 2: HR Department

Grant the HR department access to employee management:

```json
{
  "permissions": [
    "employees.view",
    "employees.create",
    "employees.update",
    "attendance.view",
    "attendance.manage",
    "leave.view",
    "leave.approve",
    "reports.view"
  ]
}
```

### Example 3: Project Management Department

Grant the PM department access to projects and tasks:

```json
{
  "permissions": [
    "projects.view",
    "projects.create",
    "projects.update",
    "tasks.view",
    "tasks.create",
    "tasks.update",
    "tasks.assign",
    "resources.view",
    "resources.allocate"
  ]
}
```

### Example 4: Sales Department

Grant the Sales department limited access:

```json
{
  "permissions": [
    "contacts.view",
    "contacts.create",
    "contacts.update",
    "projects.view",
    "reports.view"
  ]
}
```

## Implementation Details

### Permission Resolution Flow

When a user makes a request:

1. **Authentication** - User is authenticated via JWT
2. **User Lookup** - User record is fetched from database
3. **Permission Collection**:
   - Collect permissions from user's role (ROOT, ADMIN, etc.)
   - Collect permissions from user's RBAC roles
   - Find employee record by email
   - Collect permissions from all employee's departments
4. **Permission Check** - Verify if required permission exists in collected set
5. **Authorization** - Grant or deny access

### Code Flow

```typescript
// In rbac.middleware.ts
const userPermissions = new Set<string>();

// 1. Add role-based permissions
if (user.roles && user.roles.length > 0) {
  for (const role of user.roles) {
    role.permissions.forEach(perm => userPermissions.add(perm));
  }
}

// 2. Add department permissions
const employee = await Employee.findOne({ email: user.email });
if (employee) {
  const departmentNames = employee.departments || [employee.department];
  const departments = await Department.find({ 
    name: { $in: departmentNames },
    status: 'active'
  });
  departments.forEach(dept => {
    dept.permissions.forEach(perm => userPermissions.add(perm));
  });
}

// 3. Check permission
if (!userPermissions.has(requiredPermission)) {
  return res.status(403).json({ message: 'Insufficient permissions' });
}
```

## Best Practices

1. **Principle of Least Privilege**: Grant only the minimum permissions needed
2. **Regular Audits**: Periodically review department permissions
3. **Consistent Naming**: Use the `module.action` naming convention
4. **Active Departments Only**: Permissions are only inherited from active departments
5. **Documentation**: Document what each permission allows
6. **Testing**: Test permission changes before deploying to production

## Migration Guide

### For Existing Departments

Existing departments will have an empty `permissions` array by default. To add permissions:

1. Identify the department's responsibilities
2. List the required permissions
3. Use the API to update department permissions
4. Test with a non-admin user from that department

### Example Migration Script

```javascript
const updateDepartmentPermissions = async () => {
  // Finance Department
  await axios.put('/api/departments/finance-id/permissions', {
    permissions: ['finance.view', 'finance.manage', 'budgets.view']
  });

  // HR Department
  await axios.put('/api/departments/hr-id/permissions', {
    permissions: ['employees.view', 'employees.manage', 'attendance.view']
  });

  // Engineering Department
  await axios.put('/api/departments/eng-id/permissions', {
    permissions: ['projects.view', 'tasks.view', 'tasks.create', 'tasks.update']
  });
};
```

## Security Considerations

1. **Admin Access Required**: Only admins should be able to modify department permissions
2. **Audit Logging**: Log all permission changes for security audits
3. **Permission Validation**: Validate permission strings before saving
4. **Department Status**: Inactive departments don't grant permissions
5. **Employee Verification**: Ensure employee-user email matching is secure

## Troubleshooting

### User Not Getting Department Permissions

**Check:**
1. Employee record exists with matching email
2. Employee is assigned to the department
3. Department status is 'active'
4. Department has the required permission
5. Middleware is properly configured in routes

### Permission Not Working

**Debug Steps:**
1. Check the permission string spelling
2. Verify the middleware is applied to the route
3. Check the response error message for details
4. Review the `userPermissions` array in error response
5. Ensure the employee-user link is correct

## Future Enhancements

Potential improvements for the department permission system:

1. **Permission Templates**: Pre-defined permission sets for common department types
2. **Permission Inheritance**: Child departments inherit parent permissions
3. **Time-Based Permissions**: Temporary permissions with expiration
4. **Permission Groups**: Group related permissions for easier management
5. **UI Dashboard**: Visual interface for managing department permissions
6. **Audit Trail**: Complete history of permission changes
7. **Bulk Operations**: Update permissions for multiple departments at once

## Related Documentation

- [README.md](README.md) - Main project documentation
- [API_FIXES_SUMMARY.md](API_FIXES_SUMMARY.md) - API documentation
- [EMPLOYEE_PROJECT_MANAGEMENT.md](EMPLOYEE_PROJECT_MANAGEMENT.md) - Employee management
- [MULTI_DEPARTMENT_EMPLOYEES.md](MULTI_DEPARTMENT_EMPLOYEES.md) - Multi-department support

---

**Last Updated**: 2024
**Version**: 1.0.0
