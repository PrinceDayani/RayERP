# URGENT: Rollback Project Model Changes

The backend is crashing because the model was changed but the controller wasn't updated.

## Quick Fix: Revert Model Changes

**File: `backend/src/models/Project.ts`**

Change this back temporarily:

```typescript
// REVERT TO THIS:
manager: { type: Schema.Types.ObjectId, ref: 'Employee', required: true },
managers: [{ type: Schema.Types.ObjectId, ref: 'Employee' }],
team: [{ type: Schema.Types.ObjectId, ref: 'Employee' }],
owner: { type: Schema.Types.ObjectId, ref: 'User', required: true },
members: [{ type: Schema.Types.ObjectId, ref: 'User' }],

// Remove the virtual field temporarily
```

And remove these index changes:

```typescript
// REVERT TO:
projectSchema.index({ owner: 1, status: 1 });
projectSchema.index({ manager: 1, status: 1 });
projectSchema.index({ team: 1, status: 1 });
projectSchema.index({ members: 1, status: 1 });
projectSchema.index({ departments: 1, status: 1 });
```

## Why This Happened

The model was changed but the controller still has:
- `.populate('manager', ...)` 
- `.populate('members', ...)`
- `project.manager` references
- `project.members` references

## Proper Fix Order

1. **First**: Update controller to use new fields
2. **Then**: Update model
3. **Finally**: Run migration

## Next Steps

1. Revert the model changes above
2. Restart backend: `npm run dev`
3. Verify projects load
4. Then we'll do the proper migration

---

**Status**: URGENT - Backend is down
**Action**: Revert model changes immediately
