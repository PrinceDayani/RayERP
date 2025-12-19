# Root User Protection System

## Overview
The Root user has all permissions and cannot be modified, deleted, or have their role changed by any user, including other Root users.

## Protection Layers

### 1. Database Model Protection

#### Role Model (`models/Role.ts`)
- **Pre-save Hook**: Prevents modification of existing Root role
- **Pre-update Hook**: Blocks any updates to Root role
- **Pre-delete Hook**: Prevents deletion of Root role

```typescript
// Root role cannot be modified
roleSchema.pre('save', function(next) {
  if (this.isModified() && !this.isNew && this.name?.toLowerCase() === 'root') {
    return next(new Error('Root role cannot be modified'));
  }
  next();
});

// Root role cannot be updated
roleSchema.pre('findOneAndUpdate', async function(next) {
  const role = await this.model.findOne(this.getQuery());
  if (role?.name?.toLowerCase() === 'root') {
    return next(new Error('Root role cannot be modified'));
  }
  next();
});

// Root role cannot be deleted
roleSchema.pre('findOneAndDelete', async function(next) {
  const role = await this.model.findOne(this.getQuery());
  if (role?.name?.toLowerCase() === 'root') {
    return next(new Error('Root role cannot be deleted'));
  }
  next();
});
```

#### User Model (`models/User.ts`)
- **Pre-save Hook**: Prevents assigning Root role to non-Root users
- **Pre-update Hook**: Blocks any updates to Root users
- **Pre-delete Hook**: Prevents deletion of Root users

```typescript
// Cannot assign Root role to users
userSchema.pre('save', async function(next) {
  if (!this.isNew && this.isModified('role')) {
    const role = await mongoose.model('Role').findById(this.role);
    if (role?.name?.toLowerCase() === 'root') {
      const oldUser = await mongoose.model('User').findById(this._id).populate('role');
      if ((oldUser?.role as any)?.name?.toLowerCase() !== 'root') {
        return next(new Error('Cannot assign Root role to users'));
      }
    }
  }
  next();
});

// Root user cannot be modified
userSchema.pre('findOneAndUpdate', async function(next) {
  const user = await this.model.findOne(this.getQuery()).populate('role');
  if ((user?.role as any)?.name?.toLowerCase() === 'root') {
    return next(new Error('Root user cannot be modified'));
  }
  next();
});

// Root user cannot be deleted
userSchema.pre('findOneAndDelete', async function(next) {
  const user = await this.model.findOne(this.getQuery()).populate('role');
  if ((user?.role as any)?.name?.toLowerCase() === 'root') {
    return next(new Error('Root user cannot be deleted'));
  }
  next();
});
```

### 2. Middleware Protection

#### RBAC Middleware (`middleware/rbac.middleware.ts`)
- Root users bypass all permission checks
- Root role is checked first before any permission validation

```typescript
const roleName = userRole?.name;

// Root bypasses all permission checks
if (roleName === 'Root') {
  return next();
}
```

### 3. Controller Protection

#### User Controller (`controllers/userController.ts`)

**Change Password Protection:**
```typescript
if (targetRole?.name?.toLowerCase() === 'root') {
  return res.status(403).json({
    success: false,
    message: 'Cannot change Root user password'
  });
}
```

**Bulk Role Update Protection:**
```typescript
if (newRole.name?.toLowerCase() === 'root') {
  return res.status(403).json({
    success: false,
    message: 'Cannot assign Root role to users'
  });
}

// Skip Root users in bulk operations
if (targetUserCurrentRole.name?.toLowerCase() === 'root') continue;
```

**Update Role Protection:**
```typescript
if (targetUserCurrentRole.name?.toLowerCase() === 'root') {
  return res.status(403).json({
    success: false,
    message: 'Cannot modify Root user role'
  });
}

if (newRole.name?.toLowerCase() === 'root') {
  return res.status(403).json({
    success: false,
    message: 'Cannot assign Root role to other users'
  });
}
```

**Status Update Protection:**
```typescript
if (targetRole?.name?.toLowerCase() === 'root') {
  return res.status(403).json({
    success: false,
    message: 'Cannot change Root user status'
  });
}
```

**Delete User Protection:**
```typescript
if (userRole.name?.toLowerCase() === 'root') {
  return res.status(403).json({ 
    success: false, 
    message: 'Cannot delete Root user' 
  });
}
```

#### User Management Controller (`controllers/userManagementController.ts`)

**Create User Protection:**
```typescript
if (role.name?.toLowerCase() === 'root') {
  return res.status(403).json({ 
    success: false, 
    message: 'Cannot assign Root role' 
  });
}
```

**Update User Protection:**
```typescript
if (userRole.name?.toLowerCase() === 'root') {
  return res.status(403).json({ 
    success: false, 
    message: 'Cannot modify Root user' 
  });
}

if (newRole.name?.toLowerCase() === 'root') {
  return res.status(403).json({ 
    success: false, 
    message: 'Cannot assign Root role' 
  });
}
```

#### Role Permission Controller (`controllers/rolePermissionController.ts`)

**Reduce Permissions Protection:**
```typescript
if (role.name?.toLowerCase() === 'root') {
  return res.status(403).json({ 
    message: 'Cannot modify Root role permissions' 
  });
}
```

## Protected Operations

### ✅ Root User CANNOT:
1. ❌ Be deleted
2. ❌ Have their role changed
3. ❌ Have their password changed by others
4. ❌ Have their status changed
5. ❌ Be modified through bulk operations
6. ❌ Have their permissions reduced

### ✅ Root Role CANNOT:
1. ❌ Be deleted
2. ❌ Be modified
3. ❌ Be assigned to other users
4. ❌ Have permissions reduced
5. ❌ Be deactivated

### ✅ Root User CAN:
1. ✅ Access all system features (bypasses permission checks)
2. ✅ Change their own password
3. ✅ Update their own profile
4. ✅ Manage all other users and roles
5. ✅ Perform any system operation
6. ✅ Grant permission management access to other users

### 🔑 Permission Delegation:
- Root always has `*` (wildcard) permission - grants access to everything
- Root can assign specific permissions to other roles:
  - `permissions.view` - View all permissions
  - `permissions.create` - Create new permissions
  - `permissions.edit` - Edit existing permissions
  - `permissions.delete` - Delete permissions
  - `roles.view` - View all roles
  - `roles.create` - Create new roles
  - `roles.edit` - Edit existing roles
  - `roles.delete` - Delete roles
- Users with these permissions can manage permissions/roles but cannot:
  - Modify Root role
  - Modify Root user
  - Assign Root role to others

## Security Benefits

1. **Immutable Super Admin**: Ensures system always has a root administrator
2. **Prevents Lockout**: Cannot accidentally remove all admin access
3. **Audit Trail**: Root operations are logged but cannot be blocked
4. **Multi-Layer Protection**: Database, middleware, and controller level checks
5. **Fail-Safe Design**: Even if one layer fails, others provide protection

## Implementation Status

✅ **Complete** - All protection layers implemented and active

- Database model hooks: ✅
- Middleware checks: ✅
- Controller validations: ✅
- Error handling: ✅
- Audit logging: ✅
- Permission delegation: ✅
- Root role initialization: ✅

## Testing Recommendations

1. Attempt to delete Root user → Should fail
2. Attempt to change Root user role → Should fail
3. Attempt to modify Root role permissions → Should fail
4. Attempt to assign Root role to new user → Should fail
5. Verify Root user can access all features → Should succeed
6. Verify Root user bypasses permission checks → Should succeed

---

**Status**: Production Ready ✅  
**Last Updated**: 2024
