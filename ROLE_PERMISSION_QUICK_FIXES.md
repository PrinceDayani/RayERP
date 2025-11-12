# Quick Fixes for Critical Role & Permission Issues

## 🚨 CRITICAL FIX #1: Frontend RoleGuard Bypass

**File:** `frontend/src/components/RoleGuard.tsx`

**Current Code (BROKEN):**
```typescript
const hasPermission = (roles: UserRole[]) => {
  // Root has all permissions
  return true;  // ❌ ALWAYS RETURNS TRUE!
};
```

**Fixed Code:**
```typescript
const hasPermission = (roles: UserRole[]): boolean => {
  if (!user || !user.role) return false;
  
  // Root has all permissions
  if (user.role.name === 'Root') return true;
  
  // Check if user's role is in the required roles
  return roles.some(role => {
    // Handle both string and enum comparisons
    const roleName = typeof role === 'string' ? role : role.toString();
    return user.role.name === roleName || 
           user.role.name.toLowerCase() === roleName.toLowerCase();
  });
};
```

---

## 🚨 CRITICAL FIX #2: Standardize Role Names

**Create:** `backend/src/constants/roles.ts`

```typescript
export const ROLE_NAMES = {
  ROOT: 'Root',
  SUPERADMIN: 'Superadmin',
  ADMIN: 'Admin',
  MANAGER: 'Manager',
  EMPLOYEE: 'Employee',
  NORMAL: 'Normal'
} as const;

export const ROLE_LEVELS = {
  [ROLE_NAMES.ROOT]: 100,
  [ROLE_NAMES.SUPERADMIN]: 90,
  [ROLE_NAMES.ADMIN]: 80,
  [ROLE_NAMES.MANAGER]: 70,
  [ROLE_NAMES.EMPLOYEE]: 60,
  [ROLE_NAMES.NORMAL]: 50
} as const;

export type RoleName = typeof ROLE_NAMES[keyof typeof ROLE_NAMES];

export const normalizeRoleName = (role: string): string => {
  const normalized = role.toLowerCase().replace(/[_\s]/g, '');
  
  switch (normalized) {
    case 'root': return ROLE_NAMES.ROOT;
    case 'superadmin': return ROLE_NAMES.SUPERADMIN;
    case 'admin': return ROLE_NAMES.ADMIN;
    case 'manager': return ROLE_NAMES.MANAGER;
    case 'employee': return ROLE_NAMES.EMPLOYEE;
    case 'normal': return ROLE_NAMES.NORMAL;
    default: return role;
  }
};
```

**Update all route files to use constants:**

```typescript
// backend/src/routes/admin.routes.ts
import { ROLE_NAMES } from '../constants/roles';

router.use(requireRole([ROLE_NAMES.ADMIN, ROLE_NAMES.SUPERADMIN, ROLE_NAMES.ROOT]));
```

---

## 🚨 CRITICAL FIX #3: Remove Conflicting Permission Middleware

**Action:** Delete or deprecate `backend/src/middleware/permission.middleware.ts`

**Update all imports:**

```typescript
// OLD (DELETE):
import { requirePermission } from '../middleware/permission.middleware';

// NEW (USE):
import { requirePermission } from '../middleware/rbac.middleware';
```

**Files to update:**
- All route files that import from `permission.middleware.ts`

---

## 🚨 CRITICAL FIX #4: Protect Root User

**File:** `backend/src/controllers/userController.ts`

**Add to `updateUserRole` function:**

```typescript
export const updateUserRole = async (req: Request, res: Response) => {
  try {
    const { roleId } = req.body;
    const userId = req.params.id;
    
    // ... existing validation ...
    
    const userToUpdate = await User.findById(userId).populate('role');
    if (!userToUpdate) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // ✅ ADD THIS: Prevent modifying Root user
    const targetUserCurrentRole = (userToUpdate.role as any);
    if (targetUserCurrentRole.name === 'Root') {
      return res.status(403).json({
        success: false,
        message: 'Cannot modify Root user role. Root role is permanent.'
      });
    }
    
    // ✅ ADD THIS: Prevent assigning Root role to others
    const newRole = await Role.findById(roleId);
    if (newRole?.name === 'Root') {
      return res.status(403).json({
        success: false,
        message: 'Cannot assign Root role. Only one Root user is allowed.'
      });
    }
    
    // ... rest of existing code ...
  } catch (error: any) {
    // ... error handling ...
  }
};
```

---

## ⚠️ HIGH PRIORITY FIX #5: Consolidate Role Middleware

**File:** `backend/src/middleware/role.middleware.ts`

**Replace all three functions with one:**

```typescript
import { Request, Response, NextFunction } from 'express';
import { ROLE_NAMES, ROLE_LEVELS, normalizeRoleName } from '../constants/roles';

interface RoleCheckOptions {
  roles?: string[];
  minLevel?: number;
  requireAll?: boolean;
}

export const checkRole = (options: RoleCheckOptions | string[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user || !req.user.role) {
        return res.status(403).json({ 
          success: false,
          message: 'Access forbidden: No role assigned'
        });
      }

      const userRole = req.user.role as any;
      const userRoleName = normalizeRoleName(userRole.name || userRole);
      const userRoleLevel = userRole.level || ROLE_LEVELS[userRoleName] || 0;

      // Handle array of roles (backward compatibility)
      if (Array.isArray(options)) {
        const normalizedRoles = options.map(r => normalizeRoleName(r));
        if (!normalizedRoles.includes(userRoleName)) {
          return res.status(403).json({
            success: false,
            message: 'Access forbidden: Insufficient permissions'
          });
        }
        return next();
      }

      // Handle options object
      const { roles, minLevel } = options;

      // Check specific roles
      if (roles && roles.length > 0) {
        const normalizedRoles = roles.map(r => normalizeRoleName(r));
        if (!normalizedRoles.includes(userRoleName)) {
          return res.status(403).json({
            success: false,
            message: 'Access forbidden: Insufficient permissions'
          });
        }
      }

      // Check minimum level
      if (minLevel !== undefined && userRoleLevel < minLevel) {
        return res.status(403).json({
          success: false,
          message: 'Access forbidden: Insufficient role level'
        });
      }

      next();
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Error checking authorization'
      });
    }
  };
};

// Backward compatibility aliases
export const authorize = (...roleNames: string[]) => checkRole(roleNames);
export const authorizeMinLevel = (minimumLevel: number) => checkRole({ minLevel: minimumLevel });
export const requireRole = (allowedRoles: string[]) => checkRole(allowedRoles);
```

---

## ⚠️ HIGH PRIORITY FIX #6: Add Permission Validation

**File:** `backend/src/controllers/rbacController.ts`

**Update `createRole` function:**

```typescript
export const createRole = async (req: Request, res: Response) => {
  try {
    const { name, description, permissions, level } = req.body;
    
    // ... existing validation ...
    
    // ✅ ADD THIS: Validate permissions exist
    if (permissions && permissions.length > 0) {
      const validPermissions = await Permission.find({ 
        name: { $in: permissions },
        isActive: true 
      });
      
      const validPermissionNames = validPermissions.map(p => p.name);
      const invalidPermissions = permissions.filter(
        (p: string) => !validPermissionNames.includes(p)
      );
      
      if (invalidPermissions.length > 0) {
        return res.status(400).json({ 
          message: 'Invalid permissions provided',
          invalidPermissions 
        });
      }
    }
    
    // ... rest of existing code ...
  } catch (error) {
    res.status(500).json({ message: 'Error creating role', error });
  }
};
```

**Update `updateRole` function similarly:**

```typescript
export const updateRole = async (req: Request, res: Response) => {
  try {
    const { roleId } = req.params;
    const { name, description, permissions, isActive, level } = req.body;

    const role = await Role.findById(roleId);
    if (!role) {
      return res.status(404).json({ message: 'Role not found' });
    }

    // ✅ ADD THIS: Prevent modification of Root role
    if (role.name === 'Root') {
      return res.status(403).json({ 
        message: 'Cannot modify Root role. Root role is system-protected.' 
      });
    }

    // Prevent modification of default roles' core properties
    if (role.isDefault && (name || level !== undefined)) {
      return res.status(403).json({ 
        message: 'Cannot modify name or level of default system roles. You can only update permissions.' 
      });
    }

    // ✅ ADD THIS: Validate permissions
    if (permissions && permissions.length > 0) {
      const validPermissions = await Permission.find({ 
        name: { $in: permissions },
        isActive: true 
      });
      
      const validPermissionNames = validPermissions.map(p => p.name);
      const invalidPermissions = permissions.filter(
        (p: string) => !validPermissionNames.includes(p)
      );
      
      if (invalidPermissions.length > 0) {
        return res.status(400).json({ 
          message: 'Invalid permissions provided',
          invalidPermissions 
        });
      }
    }

    // ... rest of existing code ...
  } catch (error) {
    res.status(500).json({ message: 'Error updating role', error });
  }
};
```

---

## ⚠️ HIGH PRIORITY FIX #7: Add Rate Limiting

**File:** `backend/src/routes/auth.routes.ts`

**Install package:**
```bash
npm install express-rate-limit
```

**Add rate limiting:**

```typescript
import express from 'express';
import rateLimit from 'express-rate-limit';
import { register, login, getCurrentUser, logout, checkInitialSetup, checkAuth } from '../controllers/authController';
import { protect } from '../middleware/auth.middleware';
import { authorizeMinLevel } from '../middleware/role.middleware';
import { updateUserRole, getAllUsers } from '../controllers/userController';

const router = express.Router();

// ✅ ADD THIS: Rate limiters
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requests per window
  message: { 
    success: false,
    message: 'Too many authentication attempts. Please try again in 15 minutes.' 
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { 
    success: false,
    message: 'Too many requests. Please try again later.' 
  }
});

// Public routes with rate limiting
router.post('/login', authLimiter, login);
router.post('/logout', generalLimiter, logout);
router.post('/initial-setup', authLimiter, register);
router.get('/initial-setup', generalLimiter, checkInitialSetup);

// Protected routes
router.get('/me', protect, getCurrentUser);
router.get('/check', protect, checkAuth);
router.post('/register', protect, register);

// User management routes with role-based access
router.get('/users', protect, authorizeMinLevel(80), getAllUsers);
router.patch('/users/:id/role', protect, authorizeMinLevel(90), updateUserRole);
router.put('/users/:id/role', protect, authorizeMinLevel(90), updateUserRole);

export default router;
```

---

## 📝 VERIFICATION CHECKLIST

After applying fixes, verify:

- [ ] Frontend RoleGuard properly restricts access
- [ ] All role names are consistent (use constants)
- [ ] Only one permission middleware is used (rbac.middleware)
- [ ] Root user cannot be modified or deleted
- [ ] Root role cannot be assigned to other users
- [ ] Invalid permissions are rejected when creating/updating roles
- [ ] Rate limiting works on auth endpoints
- [ ] All tests pass
- [ ] No console errors in browser
- [ ] No server errors in logs

---

## 🧪 TESTING COMMANDS

```bash
# Backend tests
cd backend
npm test

# Test auth endpoints
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password"}'

# Test rate limiting (should fail after 5 attempts)
for i in {1..10}; do
  curl -X POST http://localhost:5000/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test@example.com","password":"wrong"}'
done
```

---

## 📚 NEXT STEPS

After applying these critical fixes:

1. Review the full analysis in `ROLE_PERMISSION_ANALYSIS.md`
2. Implement medium and low priority fixes
3. Add comprehensive unit tests
4. Update API documentation
5. Create developer guide for permission management

---

**Last Updated:** $(date)
**Priority:** CRITICAL - Apply immediately
