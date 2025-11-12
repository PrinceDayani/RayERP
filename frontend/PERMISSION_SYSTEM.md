# Permission-Based Access Control System

## Overview
The app now uses a **permission-based** access control system instead of checking role names. This provides more flexibility and security.

## Key Files

1. **`/lib/permissions.ts`** - Core permission utilities
2. **`/components/PermissionGuard.tsx`** - Component for conditional rendering
3. **`/hooks/usePermissions.ts`** - Hook for permission checks

## Usage Examples

### 1. Using the Hook (Recommended)

```tsx
import { usePermissions } from '@/hooks/usePermissions';
import { PERMISSIONS, ROLE_LEVELS } from '@/lib/permissions';

function MyComponent() {
  const { hasPermission, hasMinimumLevel } = usePermissions();

  // Check specific permission
  if (hasPermission(PERMISSIONS.MANAGE_USERS)) {
    // Show user management UI
  }

  // Check role level
  if (hasMinimumLevel(ROLE_LEVELS.ADMIN)) {
    // Show admin features
  }

  return <div>...</div>;
}
```

### 2. Using PermissionGuard Component

```tsx
import { PermissionGuard } from '@/components/PermissionGuard';
import { PERMISSIONS, ROLE_LEVELS } from '@/lib/permissions';

function Dashboard() {
  return (
    <div>
      {/* Show only if user has permission */}
      <PermissionGuard permission={PERMISSIONS.VIEW_ANALYTICS}>
        <AnalyticsPanel />
      </PermissionGuard>

      {/* Show only if user has minimum level */}
      <PermissionGuard minLevel={ROLE_LEVELS.ADMIN}>
        <AdminPanel />
      </PermissionGuard>

      {/* Show only if user has ANY of these permissions */}
      <PermissionGuard 
        permissions={[PERMISSIONS.EDIT_PROJECT, PERMISSIONS.DELETE_PROJECT]}
      >
        <ProjectActions />
      </PermissionGuard>

      {/* Show only if user has ALL of these permissions */}
      <PermissionGuard 
        permissions={[PERMISSIONS.VIEW_FINANCE, PERMISSIONS.MANAGE_FINANCE]}
        requireAll
      >
        <FinanceManagement />
      </PermissionGuard>
    </div>
  );
}
```

### 3. Direct Permission Checks

```tsx
import { useAuth } from '@/contexts/AuthContext';
import { hasPermission, PERMISSIONS } from '@/lib/permissions';

function MyComponent() {
  const { user } = useAuth();

  const canManageUsers = hasPermission(user, PERMISSIONS.MANAGE_USERS);

  return (
    <Button disabled={!canManageUsers}>
      Manage Users
    </Button>
  );
}
```

## Available Permissions

```typescript
PERMISSIONS = {
  // Dashboard
  VIEW_DASHBOARD: 'view:dashboard',
  VIEW_ANALYTICS: 'view:analytics',
  
  // Admin
  MANAGE_USERS: 'manage:users',
  MANAGE_ROLES: 'manage:roles',
  MANAGE_SYSTEM: 'manage:system',
  VIEW_ADMIN_PANEL: 'view:admin_panel',
  
  // Employees
  VIEW_EMPLOYEES: 'view:employees',
  CREATE_EMPLOYEE: 'create:employee',
  EDIT_EMPLOYEE: 'edit:employee',
  DELETE_EMPLOYEE: 'delete:employee',
  
  // Projects
  VIEW_PROJECTS: 'view:projects',
  CREATE_PROJECT: 'create:project',
  EDIT_PROJECT: 'edit:project',
  DELETE_PROJECT: 'delete:project',
  
  // Tasks
  VIEW_TASKS: 'view:tasks',
  CREATE_TASK: 'create:task',
  EDIT_TASK: 'edit:task',
  DELETE_TASK: 'delete:task',
  
  // Finance
  VIEW_FINANCE: 'view:finance',
  MANAGE_FINANCE: 'manage:finance',
}
```

## Role Levels

```typescript
ROLE_LEVELS = {
  ROOT: 100,
  SUPER_ADMIN: 90,
  ADMIN: 80,
  MANAGER: 70,
  EMPLOYEE: 60,
  NORMAL: 50,
}
```

## Migration Guide

### Before (Role Name Checking)
```tsx
// ❌ Old way - checking role names
if (user.role.name === 'Admin' || user.role.name === 'admin') {
  // Show admin features
}
```

### After (Permission Checking)
```tsx
// ✅ New way - checking permissions
import { usePermissions } from '@/hooks/usePermissions';
import { ROLE_LEVELS } from '@/lib/permissions';

const { hasMinimumLevel } = usePermissions();

if (hasMinimumLevel(ROLE_LEVELS.ADMIN)) {
  // Show admin features
}
```

## Benefits

1. **Case-insensitive** - No more uppercase/lowercase issues
2. **Flexible** - Check specific permissions, not just roles
3. **Secure** - Permissions are stored in the database
4. **Maintainable** - Centralized permission definitions
5. **Type-safe** - Full TypeScript support

## Backend Integration

Ensure your backend returns user objects with this structure:

```typescript
{
  _id: string;
  name: string;
  email: string;
  role: {
    _id: string;
    name: string;
    permissions: string[];  // Array of permission strings
    level: number;          // Numeric level (50-100)
  }
}
```
