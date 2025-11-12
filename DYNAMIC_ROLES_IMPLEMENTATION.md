# Dynamic Roles Implementation Summary

## What Changed

RayERP now supports **dynamic, organization-defined roles** instead of hardcoded role enums. Only 3 default roles exist:

1. **Root** (Level 100)
2. **Superadmin** (Level 90)  
3. **Admin** (Level 80)

Organizations can create unlimited custom roles with levels 1-79.

## Files Modified

### Backend

1. **`backend/src/models/User.ts`**
   - Changed `role` from enum to ObjectId reference
   - Removed `roles` array (consolidated to single role)

2. **`backend/src/models/Role.ts`**
   - Added `isDefault` field (true for Root, Superadmin, Admin)
   - Added `level` field for hierarchy (1-100)

3. **`backend/src/controllers/authController.ts`**
   - Updated registration to use `roleId` instead of role enum
   - Added automatic role seeding on first user
   - Added role level validation

4. **`backend/src/controllers/rbacController.ts`**
   - Protected default roles from deletion/modification
   - Updated role assignment to use single role
   - Added role level checks

5. **`backend/src/middleware/auth.middleware.ts`**
   - Updated to populate role reference
   - Removed UserRole enum import

6. **`backend/src/middleware/role.middleware.ts`**
   - Replaced enum-based checks with level-based checks
   - Added `authorizeMinLevel()` middleware
   - Updated `authorize()` to work with role names

### Backend - New Files

7. **`backend/src/utils/seedDefaultRoles.ts`**
   - Seeds 3 default roles on startup
   - Idempotent (safe to run multiple times)

8. **`backend/scripts/migrateToRoles.ts`**
   - Migration script for existing databases
   - Converts old enum values to role references

### Frontend

9. **`frontend/src/contexts/AuthContext.tsx`**
   - Removed `UserRole` enum
   - Added `Role` interface
   - Changed `hasMinimumRole()` to `hasMinimumLevel()`
   - Added `hasRole()` for name-based checks
   - Added `roles` state and `fetchRoles()` method

### Frontend - New Files

10. **`frontend/src/app/dashboard/roles/page.tsx`**
    - Role management UI
    - Create/delete custom roles
    - View all roles with levels

11. **`frontend/src/app/dashboard/users/create-user-dialog.tsx`**
    - Reusable user creation dialog
    - Dynamic role selection
    - Prevents privilege escalation

## How to Use

### 1. Run Migration (For Existing Systems)

```bash
cd backend
npm run migrate:roles
```

This will:
- Create default roles (Root, Superadmin, Admin)
- Convert existing users to use role references
- Create "Employee" role for users with old "normal" role

### 2. Create Custom Roles

**Via UI:**
1. Login as Superadmin or Root
2. Navigate to `/dashboard/roles`
3. Click "Create Role"
4. Enter name, description, and level (1-79)

**Via API:**
```bash
curl -X POST http://localhost:5000/api/rbac/roles \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Project Manager",
    "description": "Manages projects and teams",
    "level": 70,
    "permissions": ["view_projects", "create_project", "manage_teams"]
  }'
```

### 3. Create Users with Custom Roles

**Via UI:**
1. Navigate to `/dashboard/users`
2. Click "Add User"
3. Select role from dropdown (only shows roles with lower level)

**Via API:**
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "password123",
    "roleId": "ROLE_OBJECT_ID"
  }'
```

### 4. Check Permissions in Code

**Frontend:**
```typescript
const { hasMinimumLevel, hasRole, user } = useAuth();

// Check by level
if (hasMinimumLevel(70)) {
  // User has level 70+
}

// Check by name
if (hasRole('Project Manager')) {
  // User is Project Manager
}

// Access role details
console.log(user?.role.name);
console.log(user?.role.level);
console.log(user?.role.permissions);
```

**Backend Middleware:**
```typescript
// Check by role name
router.get('/projects', authorize('Root', 'Superadmin', 'Admin'), getProjects);

// Check by minimum level
router.post('/projects', authorizeMinLevel(70), createProject);
```

## Breaking Changes

### Frontend

❌ **Old Code:**
```typescript
import { UserRole } from '@/contexts/AuthContext';

if (hasMinimumRole(UserRole.ADMIN)) {
  // ...
}
```

✅ **New Code:**
```typescript
if (hasMinimumLevel(80)) { // Admin level
  // ...
}

// OR
if (hasRole('Admin')) {
  // ...
}
```

### Backend

❌ **Old Code:**
```typescript
import { UserRole } from '../models/User';

router.get('/admin', authorize(UserRole.ADMIN), handler);
```

✅ **New Code:**
```typescript
router.get('/admin', authorize('Admin'), handler);

// OR
router.get('/admin', authorizeMinLevel(80), handler);
```

## Role Levels Reference

| Level | Default Role | Description |
|-------|-------------|-------------|
| 100   | Root        | System owner |
| 90    | Superadmin  | Director/CEO |
| 80    | Admin       | Manager |
| 1-79  | Custom      | Organization-defined |

**Recommended Custom Levels:**
- 70: Senior Manager / Project Manager
- 60: Team Lead
- 50: Senior Employee
- 40: Employee
- 30: Junior Employee
- 20: Contractor
- 10: Intern / Guest

## Security Features

✅ **Default roles cannot be deleted**
✅ **Default roles cannot be modified** (core properties)
✅ **Users cannot create roles ≥ their own level**
✅ **Users cannot assign roles ≥ their own level**
✅ **Roles with assigned users cannot be deleted**

## Testing

### Test Default Roles Created
```bash
curl http://localhost:5000/api/rbac/roles \
  -H "Authorization: Bearer YOUR_TOKEN"
```

Expected: 3 roles (Root, Superadmin, Admin)

### Test Custom Role Creation
```bash
curl -X POST http://localhost:5000/api/rbac/roles \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Role",
    "description": "Test",
    "level": 50,
    "permissions": ["view_projects"]
  }'
```

Expected: 201 Created

### Test Default Role Protection
```bash
curl -X DELETE http://localhost:5000/api/rbac/roles/ROOT_ROLE_ID \
  -H "Authorization: Bearer YOUR_TOKEN"
```

Expected: 403 Forbidden - "Cannot delete default system roles"

## Troubleshooting

### Issue: Users can't login after migration
**Cause:** Role reference not populated
**Fix:** Ensure auth middleware populates role:
```typescript
const user = await User.findById(decoded.id).populate('role').select('-password');
```

### Issue: "Cannot read property 'level' of undefined"
**Cause:** Role not populated in user object
**Fix:** Always populate role when fetching users:
```typescript
await User.findById(userId).populate('role');
```

### Issue: Frontend shows "undefined" for role
**Cause:** Role is ObjectId instead of populated object
**Fix:** Backend should populate role in responses:
```typescript
const user = await User.findById(userId).populate('role').select('-password');
```

## Next Steps

1. ✅ Run migration script
2. ✅ Test login with existing users
3. ✅ Create custom roles for your organization
4. ✅ Update any custom middleware/guards
5. ✅ Update frontend components using old UserRole enum
6. ✅ Test role-based access control

## Support

For issues or questions:
1. Check `DYNAMIC_ROLES_GUIDE.md` for detailed documentation
2. Review migration script output for errors
3. Check backend logs for role-related errors
4. Verify role population in API responses

---

**Implementation Date:** 2024
**Status:** ✅ Complete
