# Dynamic Role System Guide

## Overview

RayERP now features a **dynamic role system** where organizations can create custom roles tailored to their needs. Only **3 default roles** are provided by the system:

1. **Root** (Level 100) - System owner with full access
2. **Superadmin** (Level 90) - Director/CEO with extended administrative access
3. **Admin** (Level 80) - Manager with administrative access

All other roles can be created by the organization based on their requirements.

## Key Features

### 1. Default Roles (Cannot be Deleted)
- **Root**: Full system access, can create and manage all user types
- **Superadmin**: Extended administrative access, can manage Admins and custom roles
- **Admin**: Administrative access to manage system content and users

### 2. Custom Roles (Organization-Defined)
- Organizations can create unlimited custom roles
- Each role has a **level** (1-79) that determines hierarchy
- Custom roles can be deleted if not assigned to any users
- Roles include permissions for fine-grained access control

## Role Hierarchy

Roles are organized by **level** (higher = more privileges):

```
Root (100)
  └─ Superadmin (90)
      └─ Admin (80)
          └─ Custom Roles (1-79)
              ├─ Project Manager (70)
              ├─ Team Lead (60)
              ├─ Developer (50)
              └─ Intern (10)
```

## Implementation Details

### Backend Changes

#### 1. User Model (`backend/src/models/User.ts`)
```typescript
// Before: Hardcoded enum
role: UserRole.NORMAL

// After: Dynamic reference
role: {
  type: Schema.Types.ObjectId,
  ref: 'Role',
  required: true
}
```

#### 2. Role Model (`backend/src/models/Role.ts`)
```typescript
{
  name: string;           // Role name (e.g., "Project Manager")
  description: string;    // Role description
  permissions: string[];  // Array of permission strings
  isActive: boolean;      // Active status
  isDefault: boolean;     // True for Root, Superadmin, Admin
  level: number;          // Hierarchy level (1-100)
}
```

#### 3. Seed Default Roles (`backend/src/utils/seedDefaultRoles.ts`)
Automatically creates the 3 default roles on first run:
- Root (level 100)
- Superadmin (level 90)
- Admin (level 80)

### Frontend Changes

#### 1. AuthContext (`frontend/src/contexts/AuthContext.tsx`)
```typescript
// Before: Hardcoded enum
export enum UserRole {
  ROOT = 'root',
  SUPER_ADMIN = 'super_admin',
  ADMIN = 'admin',
  NORMAL = 'normal'
}

// After: Dynamic role interface
export interface Role {
  _id: string;
  name: string;
  description?: string;
  permissions: string[];
  level: number;
  isDefault: boolean;
  isActive: boolean;
}

// New methods
hasMinimumLevel(requiredLevel: number): boolean
hasRole(roleName: string): boolean
```

#### 2. Role Management Page (`frontend/src/app/dashboard/roles/page.tsx`)
- View all roles (default + custom)
- Create new custom roles
- Delete custom roles (not default ones)
- Shows role level and description

#### 3. User Creation (`frontend/src/app/dashboard/users/create-user-dialog.tsx`)
- Dynamic role dropdown
- Only shows roles with lower level than current user
- Prevents privilege escalation

## API Endpoints

### Role Management
```
GET    /api/rbac/roles              - Get all roles
POST   /api/rbac/roles              - Create new role
PUT    /api/rbac/roles/:roleId      - Update role
DELETE /api/rbac/roles/:roleId      - Delete role
PATCH  /api/rbac/roles/:roleId/toggle-status - Toggle role status
```

### User Management
```
POST   /api/auth/register           - Create user with roleId
PUT    /api/rbac/users/:userId/role - Assign role to user
GET    /api/rbac/users/:userId/permissions - Get user permissions
```

## Usage Examples

### 1. Creating a Custom Role

**Frontend:**
```typescript
const response = await fetch(`${API_URL}/api/rbac/roles`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    name: 'Project Manager',
    description: 'Manages projects and teams',
    level: 70,
    permissions: ['view_projects', 'create_project', 'update_project', 'manage_teams']
  })
});
```

### 2. Creating a User with Custom Role

**Frontend:**
```typescript
const response = await fetch(`${API_URL}/api/auth/register`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    name: 'John Doe',
    email: 'john@example.com',
    password: 'password123',
    roleId: '507f1f77bcf86cd799439011' // Custom role ID
  })
});
```

### 3. Checking User Permissions

**Frontend:**
```typescript
const { hasMinimumLevel, hasRole } = useAuth();

// Check by level
if (hasMinimumLevel(70)) {
  // User has level 70 or higher
}

// Check by role name
if (hasRole('Project Manager')) {
  // User has Project Manager role
}
```

## Migration Guide

### For Existing Systems

1. **Run the seed script** to create default roles:
```bash
cd backend
npm run seed-roles
```

2. **Migrate existing users** to use role references instead of enum values:
```javascript
// Migration script needed to convert:
// user.role = 'root' 
// to:
// user.role = ObjectId(rootRoleId)
```

3. **Update frontend components** to use `hasMinimumLevel()` instead of `hasMinimumRole()`:
```typescript
// Before
hasMinimumRole(UserRole.ADMIN)

// After
hasMinimumLevel(80) // Admin level
```

## Security Considerations

1. **Default roles cannot be deleted** - System prevents deletion of Root, Superadmin, Admin
2. **Default roles cannot be modified** - Core properties are protected
3. **Privilege escalation prevention** - Users cannot create roles with equal or higher level
4. **Role assignment validation** - Users can only assign roles with lower level than their own

## Best Practices

1. **Use meaningful role names**: "Project Manager" instead of "PM1"
2. **Set appropriate levels**: Leave gaps for future roles (e.g., 70, 60, 50 instead of 71, 70, 69)
3. **Document permissions**: Add clear descriptions to roles
4. **Regular audits**: Review and clean up unused custom roles
5. **Principle of least privilege**: Assign minimum necessary permissions

## Troubleshooting

### Issue: "Cannot find default roles"
**Solution**: Run the seed script to create default roles:
```bash
cd backend
npm run seed-roles
```

### Issue: "Cannot delete role - assigned to users"
**Solution**: Reassign users to different roles before deleting:
1. Go to User Management
2. Change role for all users with that role
3. Then delete the role

### Issue: "Cannot create role with high level"
**Solution**: Only users with higher level can create roles. Root can create any level, Superadmin can create up to level 89.

## Future Enhancements

- [ ] Permission builder UI
- [ ] Role templates
- [ ] Bulk role assignment
- [ ] Role inheritance
- [ ] Audit logs for role changes
- [ ] Role-based dashboard customization

---

**Last Updated**: 2024
**Version**: 1.0.0
