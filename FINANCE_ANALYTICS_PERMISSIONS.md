# Finance & Analytics Access Control

## Overview

Finance and Analytics modules are **restricted** and require specific permissions. Only authorized users can access these sensitive areas.

## Required Permissions

### Analytics Access
- **Permission**: `analytics.view`
- **Who has access**:
  - Root (level 100)
  - Super Admin (level 90+)
  - Users with `analytics.view` permission (role or department)

### Finance Access
- **Permission**: `finance.view` (read), `finance.manage` (write)
- **Who has access**:
  - Root (level 100)
  - Super Admin (level 90+)
  - Users with `finance.view` or `finance.manage` permission

## Protected Routes

### Analytics
```
GET /api/analytics/dashboard  → Requires: analytics.view
GET /api/analytics/stats       → Requires: analytics.view
```

### Finance
```
All /api/integrated-finance/*  → Requires: finance.view
All /api/general-ledger/*      → Requires: finance.view
```

### Budgets
```
All /api/budgets/*             → Uses existing budget auth middleware
```

## Access Logic

```typescript
User can access if:
  - User.role.level >= 90 (Super Admin or above)
  OR
  - User has permission in role.permissions
  OR
  - User has permission from department.permissions
```

## Granting Access

### Option 1: Via Custom Role
1. Go to **Roles** page
2. Create/Edit role
3. Check `analytics.view` or `finance.view`
4. Assign role to user

### Option 2: Via Department
1. Go to **Departments** page
2. Click Shield button on department
3. Check `analytics.view` or `finance.view`
4. All department members get access

## Example Scenarios

### Scenario 1: Finance Department
```
Finance Department permissions:
✅ finance.view
✅ finance.manage
✅ budgets.view
✅ expenses.view

Result: All finance team members can access finance modules
```

### Scenario 2: Management Role
```
Management Role permissions:
✅ analytics.view
✅ reports.view
✅ projects.view

Result: Managers can view analytics and reports
```

### Scenario 3: Regular Employee
```
Employee Role permissions:
❌ No analytics.view
❌ No finance.view

Result: Cannot access analytics or finance
```

## Security Benefits

✅ **Restricted Access** - Only authorized users see sensitive data
✅ **Role-based** - Easy to manage via roles
✅ **Department-based** - Grant access to entire teams
✅ **Flexible** - Multiple ways to grant access
✅ **Secure** - Default deny, explicit allow

## Best Practices

1. **Limit finance access** to finance team and management
2. **Limit analytics access** to decision makers
3. **Regular audits** of who has these permissions
4. **Use departments** for team-based access
5. **Use roles** for individual access

## Troubleshooting

### User Can't Access Analytics
**Check:**
1. Does user have `analytics.view` permission?
2. Is user Super Admin or above?
3. Is user's department assigned `analytics.view`?

### User Can't Access Finance
**Check:**
1. Does user have `finance.view` permission?
2. Is user Super Admin or above?
3. Is user's department assigned `finance.view`?

---

**Last Updated:** 2024
