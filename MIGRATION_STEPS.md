# Complete Team/Member Migration Guide

## ✅ Step 1: DONE - Model Reverted
The Project model now has BOTH old and new fields:
- `manager` (old) + `managers` (new)
- `members` (old) + `team` (keep)

This allows the system to work while we migrate.

## 🚀 Step 2: Run Data Migration

```bash
cd backend
npx ts-node src/scripts/migrateProjectTeam.ts
```

This will:
- Copy `manager` → `managers[0]`
- Remove `members` field
- Keep `team` as-is

## 📝 Step 3: Update Controller (After Migration)

**File: `backend/src/controllers/projectController.ts`**

### A. Update all populate calls (Find & Replace):

```typescript
// Find: .populate({ path: 'manager',
// Replace: .populate({ path: 'managers',
```

### B. Remove members populate:

```typescript
// Remove all lines like:
.populate({ path: 'members', select: 'name email', strictPopulate: false })
```

### C. Update access checks:

```typescript
// Find:
const isMember = project.members.some(m => m && m._id && m._id.toString() === user._id.toString());
const isOwner = project.owner && project.owner._id && project.owner._id.toString() === user._id.toString();
...
isManager = project.manager && project.manager._id && project.manager._id.toString() === employee._id.toString();
const isAssigned = isMember || isOwner || isTeamMember || isManager;

// Replace with:
const isOwner = project.owner && project.owner._id && project.owner._id.toString() === user._id.toString();
...
isManager = project.managers && project.managers.some((m: any) => m && m._id && m._id.toString() === employee._id.toString());
const isAssigned = isOwner || isTeamMember || isManager;
```

### D. Update manager references:

```typescript
// Find: project.manager ? project.manager.toString() : null
// Replace: project.managers && project.managers.length > 0 ? project.managers[0].toString() : null
```

### E. Update createProject:

```typescript
// Find:
manager: req.body.manager || undefined,
team: Array.isArray(req.body.team) ? req.body.team : [],
departments: Array.isArray(req.body.departments) ? req.body.departments : [],
tags: Array.isArray(req.body.tags) ? req.body.tags : [],
owner: user._id,
members: Array.isArray(req.body.members) ? req.body.members : [],

// Replace:
manager: req.body.managers && req.body.managers.length > 0 ? req.body.managers[0] : req.body.manager,
managers: Array.isArray(req.body.managers) ? req.body.managers : (req.body.manager ? [req.body.manager] : []),
team: Array.isArray(req.body.team) ? req.body.team : [],
departments: Array.isArray(req.body.departments) ? req.body.departments : [],
tags: Array.isArray(req.body.tags) ? req.body.tags : [],
owner: user._id,
```

### F. Update updateProject:

```typescript
// Find:
if (req.body.manager !== undefined) updateData.manager = req.body.manager;

// Replace:
if (req.body.manager !== undefined) updateData.manager = req.body.manager;
if (req.body.managers !== undefined) updateData.managers = Array.isArray(req.body.managers) ? req.body.managers : [];
```

### G. Remove members from queries:

```typescript
// Find and remove:
{ members: user._id },
```

## 🔧 Step 4: Update Model (Remove Old Fields)

**File: `backend/src/models/Project.ts`**

```typescript
// Remove:
manager: { type: Schema.Types.ObjectId, ref: 'Employee', required: true },
members: [{ type: Schema.Types.ObjectId, ref: 'User' }],

// Keep only:
managers: [{ type: Schema.Types.ObjectId, ref: 'Employee', required: true }],
team: [{ type: Schema.Types.ObjectId, ref: 'Employee' }],
owner: { type: Schema.Types.ObjectId, ref: 'User', required: true },

// Add virtual for backward compatibility:
projectSchema.virtual('manager').get(function() {
  return this.managers && this.managers.length > 0 ? this.managers[0] : null;
});

// Update indexes - remove:
projectSchema.index({ manager: 1, status: 1 });
projectSchema.index({ members: 1, status: 1 });
```

## ✅ Step 5: Update Frontend Interface

**File: `frontend/src/lib/api/projectsAPI.ts`**

```typescript
// Remove:
manager: string;
members: string[];

// Keep only:
managers: string[];
team: string[];
owner: string;
```

## 🧪 Step 6: Test

```bash
# Backend
cd backend
npm run dev

# Frontend
cd frontend
npm run dev

# Test:
# 1. Load projects page
# 2. Create new project with managers
# 3. View project details
# 4. Update project
```

## 📋 Checklist

- [ ] Step 1: Model reverted (DONE ✅)
- [ ] Step 2: Run migration script
- [ ] Step 3: Update controller
- [ ] Step 4: Update model (remove old fields)
- [ ] Step 5: Update frontend interface
- [ ] Step 6: Test everything

## ⚠️ Important Notes

1. **Do steps in order** - Don't skip ahead
2. **Test after each step** - Ensure backend starts
3. **Backup database** - Before running migration
4. **Keep old fields** - Until migration is verified

## 🔄 Rollback (if needed)

If something goes wrong:

```javascript
// MongoDB shell
db.projects.find({ managers: { $exists: true } }).forEach(function(doc) {
  if (doc.managers && doc.managers.length > 0) {
    db.projects.updateOne(
      { _id: doc._id },
      { $set: { manager: doc.managers[0] } }
    );
  }
});
```

---

**Current Status**: Step 1 Complete ✅
**Next Action**: Run migration script (Step 2)
