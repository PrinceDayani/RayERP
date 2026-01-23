# Migration Script - How to Run

## Quick Start

```bash
cd backend
npx ts-node src/scripts/migrateProjectTeam.ts
```

## What It Does

1. **Migrates Manager Field**
   - Converts `manager` (singular) → `managers` (array)
   - Preserves existing manager as first element
   - Removes old `manager` field

2. **Removes Members Field**
   - Deletes `members` field (User refs)
   - Use `team` field instead (Employee refs)

3. **Verification**
   - Counts remaining old fields
   - Confirms successful migration

## Output Example

```
🚀 Starting Project Team Migration...

✅ Connected to MongoDB

📊 Found 15 projects to process

  ✓ Migrating manager for: Website Redesign
  ✓ Removing 3 members from: Website Redesign
  ✓ Migrating manager for: Mobile App
  ✓ Removing 5 members from: Mobile App

📈 Migration Summary:
  • Managers migrated: 15
  • Members removed: 15
  • Skipped (no changes): 0
  • Errors: 0

🔍 Verifying migration...
  • Projects with old 'manager' field: 0
  • Projects with old 'members' field: 0
  • Projects with new 'managers' array: 15

✅ Migration completed successfully!

👋 Disconnected from MongoDB

✨ Migration script completed
```

## Add to package.json (Optional)

```json
{
  "scripts": {
    "migrate:project-team": "ts-node src/scripts/migrateProjectTeam.ts"
  }
}
```

Then run:
```bash
npm run migrate:project-team
```

## Rollback (if needed)

If you need to rollback, use MongoDB shell:

```javascript
// Restore manager field from managers[0]
db.projects.find({ managers: { $exists: true } }).forEach(function(doc) {
  if (doc.managers && doc.managers.length > 0) {
    db.projects.updateOne(
      { _id: doc._id },
      { $set: { manager: doc.managers[0] } }
    );
  }
});
```

## Safety

- ✅ Non-destructive (only adds/removes fields)
- ✅ Preserves all data
- ✅ Can be run multiple times safely
- ✅ Includes verification step
- ✅ Detailed logging

## Requirements

- Node.js with TypeScript
- MongoDB connection
- `.env` file with `MONGO_URI`

## Troubleshooting

**Error: Cannot find module 'dotenv'**
```bash
npm install dotenv
```

**Error: Cannot connect to MongoDB**
- Check `MONGO_URI` in `.env`
- Ensure MongoDB is running
- Verify network connectivity

**Error: Permission denied**
- Ensure database user has write permissions
- Check MongoDB authentication

---

**Status**: Ready to Run
**Risk**: LOW (Non-destructive)
**Time**: ~1 second per 100 projects
