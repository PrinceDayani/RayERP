# Permission Delegation System

## Overview
Root user permanently manages all permissions but can delegate permission management capabilities to other users.

## How It Works

### 1. Root User (Level 100)
- Has `*` (wildcard) permission - automatic access to everything
- Cannot be modified or deleted
- Bypasses all permission checks in middleware
- Can grant any permission to any role

### 2. Permission Delegation
Root can create roles with permission management capabilities:

```typescript
// Example: Create a "Permission Manager" role
{
  name: "Permission Manager",
  permissions: [
    "permissions.view",
    "permissions.create", 
    "permissions.edit",
    "permissions.delete",
    "roles.view",
    "roles.create",
    "roles.edit",
    "roles.delete"
  ],
  level: 85
}
```

### 3. Available Permissions

#### Permission Management:
- `permissions.view` - View all system permissions
- `permissions.create` - Create new permissions
- `permissions.edit` - Modify existing permissions
- `permissions.delete` - Remove permissions

#### Role Management:
- `roles.view` - View all roles
- `roles.create` - Create new roles
- `roles.edit` - Modify existing roles
- `roles.delete` - Delete roles

#### User Management:
- `users.view` - View users
- `users.create` - Create users
- `users.edit` - Edit users
- `users.delete` - Delete users
- `users.assign_roles` - Assign roles to users

## Protection Rules

### Users with delegated permissions CANNOT:
1. ❌ Modify Root role
2. ❌ Delete Root role
3. ❌ Modify Root user
4. ❌ Delete Root user
5. ❌ Assign Root role to anyone
6. ❌ Remove Root's permissions

### Root user CAN:
1. ✅ Do everything (wildcard permission)
2. ✅ Grant permission management to others
3. ✅ Revoke permission management from others
4. ✅ Override any permission check

## Middleware Flow

```typescript
// In requirePermission middleware
if (roleName === 'Root') {
  return next(); // Root bypasses all checks
}

// Check if user has wildcard permission
if (userRole?.permissions?.includes('*')) {
  return next();
}

// Check specific permission
if (userPermissions.has(permission)) {
  return next();
}

// Deny access
return res.status(403).json({ message: 'Insufficient permissions' });
```

## Example Use Cases

### Use Case 1: HR Manager with User Management
```typescript
{
  name: "HR Manager",
  permissions: [
    "users.view",
    "users.create",
    "users.edit",
    "users.assign_roles",
    "roles.view"
  ],
  level: 70
}
```

### Use Case 2: System Administrator
```typescript
{
  name: "System Administrator", 
  permissions: [
    "permissions.view",
    "permissions.create",
    "roles.view",
    "roles.create",
    "roles.edit",
    "users.view",
    "users.create",
    "users.edit",
    "users.assign_roles"
  ],
  level: 85
}
```

### Use Case 3: Security Auditor (Read-Only)
```typescript
{
  name: "Security Auditor",
  permissions: [
    "permissions.view",
    "roles.view", 
    "users.view"
  ],
  level: 60
}
```

## API Endpoints

### Roles
- `GET /api/rbac/roles` - Requires `roles.view`
- `POST /api/rbac/roles` - Requires `roles.create`
- `PUT /api/rbac/roles/:id` - Requires `roles.edit`
- `DELETE /api/rbac/roles/:id` - Requires `roles.delete`

### Permissions
- `GET /api/rbac/permissions` - Requires `permissions.view`
- `POST /api/rbac/permissions` - Requires `permissions.create`

### Users
- `GET /api/users` - Requires `users.view`
- `POST /api/users` - Requires `users.create`
- `PUT /api/users/:id` - Requires `users.edit`
- `PUT /api/users/:id/role` - Requires `users.assign_roles`
- `DELETE /api/users/:id` - Requires `users.delete`

## Default Roles

### Root (Level 100)
- Permissions: `['*']`
- Cannot be modified
- Cannot be deleted
- Automatically created on system initialization

### Super Admin (Level 90)
- Full permission management capabilities
- Can manage all users, roles, and permissions
- Cannot modify Root

### Manager (Level 50)
- User viewing and editing
- Limited role viewing

### Employee (Level 30)
- Standard operational permissions
- No user/role management

### Viewer (Level 10)
- Read-only access
- No management capabilities

## Security Benefits

1. **Granular Control**: Root can delegate specific capabilities
2. **Audit Trail**: All permission changes are logged
3. **Fail-Safe**: Root always retains full access
4. **Flexibility**: Create custom roles with specific permissions
5. **Protection**: Root role/user cannot be compromised

## Testing

```bash
# Test Root access (should succeed)
curl -X GET http://localhost:5000/api/rbac/permissions \
  -H "Authorization: Bearer <root_token>"

# Test delegated access (should succeed if permission granted)
curl -X GET http://localhost:5000/api/rbac/permissions \
  -H "Authorization: Bearer <admin_token>"

# Test unauthorized access (should fail)
curl -X GET http://localhost:5000/api/rbac/permissions \
  -H "Authorization: Bearer <employee_token>"
```

---

**Status**: Production Ready ✅  
**Last Updated**: 2024
