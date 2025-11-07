# Root User Guide

## Overview

The **Root user** is the first user created in the system and has ultimate control over the entire RayERP application. There can only be **ONE Root user** per organization.

## Key Characteristics

### 1. Root User Creation
- **First user** registered in the system automatically becomes Root
- **Only one Root user** is allowed per organization
- Root user is **hardcoded** and cannot be deleted or modified
- Root role has **level 100** (highest privilege)

### 2. Root Responsibilities

The Root user is responsible for:

✅ **Creating all roles** in the organization
✅ **Managing system-wide settings**
✅ **Creating Superadmin and Admin users**
✅ **Defining custom roles** for the organization
✅ **Full access** to all system features

### 3. Default Organization Roles

When Root creates the organization structure, two default roles are available:

1. **Superadmin** (Level 90)
   - Director/CEO level access
   - Can manage users and most system features
   - Multiple Superadmins allowed

2. **Admin** (Level 80)
   - Manager level access
   - Can manage day-to-day operations
   - Multiple Admins allowed

## Root User Workflow

### Step 1: Initial Setup
```
1. First user signs up → Automatically becomes Root
2. Root user logs in
3. System creates default Superadmin and Admin roles
```

### Step 2: Create Organization Roles
```
Root → Dashboard → Roles → Create Role

Examples:
- Project Manager (Level 70)
- Team Lead (Level 60)
- Senior Developer (Level 50)
- Developer (Level 40)
- Junior Developer (Level 30)
- Intern (Level 10)
```

### Step 3: Create Users with Roles
```
Root → Dashboard → Users → Add User

Assign appropriate roles:
- Superadmin for executives
- Admin for managers
- Custom roles for team members
```

## Role Hierarchy

```
Root (100) ← Only ONE user
  ├─ Superadmin (90) ← Multiple allowed
  ├─ Admin (80) ← Multiple allowed
  └─ Custom Roles (1-79) ← Unlimited, created by Root
      ├─ Project Manager (70)
      ├─ Team Lead (60)
      ├─ Developer (50)
      └─ Intern (10)
```

## Root Exclusive Permissions

Only Root can:

❌ **Create new roles**
❌ **Delete custom roles**
❌ **Modify role structure**
❌ **Access role management**
❌ **Create other Root users** (blocked by system)

## Security Features

### 1. Single Root User
- System prevents creation of multiple Root users
- Attempting to create another Root user returns error:
  ```
  "Root user already exists. Only one Root user is allowed."
  ```

### 2. Root Role Protection
- Root role cannot be deleted
- Root role cannot be modified
- Root role is marked as `isDefault: true`

### 3. Role Creation Restriction
- Only Root user can access role management UI
- API endpoints for role creation require Root authentication
- Non-Root users see: "Only Root user can manage roles"

## API Endpoints (Root Only)

### Create Role
```bash
POST /api/rbac/roles
Authorization: Bearer <ROOT_TOKEN>

{
  "name": "Project Manager",
  "description": "Manages projects and teams",
  "level": 70,
  "permissions": ["view_projects", "create_project", "manage_teams"]
}
```

### Delete Role
```bash
DELETE /api/rbac/roles/:roleId
Authorization: Bearer <ROOT_TOKEN>
```

### Get All Roles
```bash
GET /api/rbac/roles
Authorization: Bearer <ANY_TOKEN>
```

## Best Practices

### 1. Root User Management
- ✅ Keep Root credentials **extremely secure**
- ✅ Use Root account **only for administrative tasks**
- ✅ Create Superadmin accounts for daily operations
- ✅ Document Root user credentials in secure location
- ✅ Never share Root credentials

### 2. Role Creation Strategy
- ✅ Plan role hierarchy before creating roles
- ✅ Use meaningful role names
- ✅ Leave gaps in levels (70, 60, 50 vs 71, 70, 69)
- ✅ Document each role's responsibilities
- ✅ Assign minimum necessary permissions

### 3. User Assignment
- ✅ Create Superadmins for executives
- ✅ Create Admins for department managers
- ✅ Use custom roles for specific job functions
- ✅ Review and update roles regularly

## Common Scenarios

### Scenario 1: New Organization Setup
```
1. CEO signs up → Becomes Root
2. Root creates roles:
   - Superadmin (for CTO, CFO)
   - Admin (for Department Heads)
   - Project Manager (Level 70)
   - Developer (Level 50)
3. Root creates users and assigns roles
4. Root delegates daily operations to Superadmins
```

### Scenario 2: Adding New Role
```
1. Root logs in
2. Navigate to Dashboard → Roles
3. Click "Create Role"
4. Enter:
   - Name: "QA Lead"
   - Description: "Quality Assurance Team Lead"
   - Level: 65
   - Permissions: [test-related permissions]
5. Create users with QA Lead role
```

### Scenario 3: Root User Transition
```
If Root user leaves organization:
1. Root creates new Superadmin user
2. New Superadmin handles daily operations
3. Root credentials stored securely for emergencies
4. Consider creating new Root user (requires system reset)
```

## Troubleshooting

### Issue: "Only Root user can manage roles"
**Solution**: You are not logged in as Root. Only the first user (Root) can manage roles.

### Issue: "Root user already exists"
**Solution**: System already has a Root user. Cannot create another one.

### Issue: "Cannot create Root role"
**Solution**: Root role is hardcoded and automatically created. Cannot be manually created.

### Issue: Lost Root credentials
**Solution**: 
1. Check secure credential storage
2. If unavailable, requires database-level intervention
3. Contact system administrator for password reset

## Technical Details

### Root Role Structure
```typescript
{
  name: 'Root',
  description: 'System owner with full access - Only one Root user allowed',
  permissions: ['*'], // All permissions
  isDefault: true,
  isActive: true,
  level: 100
}
```

### Root User Check
```typescript
// Backend
const currentUserRole = currentUser?.role as any;
if (currentUserRole?.name !== 'Root') {
  return res.status(403).json({ 
    message: 'Only Root user can create roles' 
  });
}

// Frontend
if (!hasRole('Root')) {
  return <div>Only Root user can manage roles.</div>;
}
```

## Summary

- ✅ **One Root user** per organization (first user)
- ✅ **Root creates all roles** (Superadmin, Admin, Custom)
- ✅ **Multiple Superadmins and Admins** allowed
- ✅ **Root has level 100** (highest privilege)
- ✅ **Root role is hardcoded** and protected
- ✅ **Only Root can manage roles**

---

**Important**: The Root user is the foundation of your organization's access control. Protect Root credentials and use them responsibly.
