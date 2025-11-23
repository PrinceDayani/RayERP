# Activity Feed - Migration Guide

## 🔄 Upgrading Existing Deployments

### Prerequisites
- Existing RayERP installation
- MongoDB running
- Node.js v22.x
- npm v10.0.0+

### Migration Steps

#### Step 1: Backup Database
```bash
# Backup MongoDB
mongodump --db rayerp --out ./backup/$(date +%Y%m%d)

# Verify backup
ls -lh ./backup/
```

#### Step 2: Pull Latest Code
```bash
cd RayERP
git pull origin main
```

#### Step 3: Install Dependencies
```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install --legacy-peer-deps
```

#### Step 4: Update Environment Variables
```bash
# backend/.env
# No new variables required - existing setup works
```

#### Step 5: Restart Services
```bash
# Stop existing services
pm2 stop rayerp-backend
pm2 stop rayerp-frontend

# Start with new code
pm2 start rayerp-backend
pm2 start rayerp-frontend

# Verify
pm2 status
```

#### Step 6: Verify Activity Feed
1. Login as Root user
2. Perform any action (create employee, project, etc.)
3. Check activity feed for new activity
4. Verify 🔴 indicator appears
5. Verify toast notification shows

### Database Changes

#### ActivityLog Collection
The `ActivityLog` collection already exists but has been enhanced:

**Before:**
```javascript
{
  user: { required: true },
  userName: { required: true },
  action: { enum: [...], required: true },
  details: { required: true },
  ipAddress: { required: true }
}
```

**After:**
```javascript
{
  user: { required: false },
  userName: { default: 'System' },
  action: { required: true },
  details: { required: false },
  ipAddress: { required: false },
  description: { type: String },
  type: { type: String }
}
```

**Migration Script:**
```javascript
// No migration needed - schema is backward compatible
// Existing documents will continue to work
// New documents use enhanced schema
```

### Socket.IO Changes

#### New Rooms
- `root-users` - For Root user priority notifications

#### New Events
- `root:activity` - High-priority activities for Root users

**No client changes required** - existing socket connections will work.

### Rollback Plan

If issues occur, rollback using:

```bash
# Stop services
pm2 stop all

# Restore previous code
git checkout <previous-commit-hash>

# Reinstall dependencies
cd backend && npm install
cd ../frontend && npm install --legacy-peer-deps

# Restore database (if needed)
mongorestore --db rayerp ./backup/<backup-date>/rayerp

# Restart services
pm2 start all
```

### Testing After Migration

#### 1. Basic Functionality
```bash
# Test activity feed
curl -X POST http://localhost:5000/api/employees \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"firstName":"Test","lastName":"User","email":"test@example.com"}'

# Check activity in dashboard
# Should see "New employee Test User added"
```

#### 2. Root User Notifications
```bash
# Login as Root user
# Perform any action in another browser/tab
# Verify Root user sees:
# - 🔴 indicator
# - Toast notification
# - Activity at top of feed
```

#### 3. Database Persistence
```bash
# Check MongoDB
mongo rayerp
db.activitylogs.find().sort({timestamp:-1}).limit(5).pretty()

# Should see recent activities
```

### Performance Impact

#### Before Migration
- Activities: Not tracked
- Database writes: N/A
- Socket events: Basic stats only

#### After Migration
- Activities: Fully tracked
- Database writes: +1 per activity (minimal impact)
- Socket events: +2 per activity (broadcast + root)

**Expected Impact:** < 5ms per operation

### Monitoring

#### Check Activity Volume
```bash
# Activities per hour
mongo rayerp --eval "
  db.activitylogs.aggregate([
    { \$group: {
      _id: { \$hour: '\$timestamp' },
      count: { \$sum: 1 }
    }},
    { \$sort: { _id: -1 }},
    { \$limit: 24 }
  ])
"
```

#### Check Socket Connections
```bash
# Connected users
curl http://localhost:5000/api/socket/stats
```

#### Check Database Size
```bash
# ActivityLog collection size
mongo rayerp --eval "db.activitylogs.stats()"
```

### Troubleshooting

#### Issue: Activities Not Appearing
**Solution:**
```bash
# Check Socket.IO connection
# Browser console should show:
# "Socket connected: <socket-id>"

# If not, check CORS settings
# backend/.env
CORS_ORIGIN=http://localhost:3000
```

#### Issue: Root Notifications Not Working
**Solution:**
```bash
# Verify Root user role
mongo rayerp
db.users.findOne({email: "root@example.com"}, {role: 1})

# Should show role with name: "Root"
```

#### Issue: Database Errors
**Solution:**
```bash
# Check MongoDB connection
mongo rayerp --eval "db.runCommand({ping: 1})"

# Recreate indexes
mongo rayerp --eval "db.activitylogs.createIndex({timestamp: -1})"
```

### Cleanup Old Data

After successful migration, optionally clean old data:

```javascript
// Remove activities older than 90 days
const ninetyDaysAgo = new Date();
ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

db.activitylogs.deleteMany({
  timestamp: { $lt: ninetyDaysAgo }
});
```

### Support

If you encounter issues:

1. Check logs:
   ```bash
   pm2 logs rayerp-backend
   pm2 logs rayerp-frontend
   ```

2. Check documentation:
   - `ACTIVITY_FEED_PRODUCTION.md`
   - `ACTIVITY_FEED_QUICK_START.md`

3. Verify environment:
   ```bash
   node --version  # Should be v22.x
   npm --version   # Should be v10.x
   mongo --version # Should be v4.x+
   ```

### Success Criteria

Migration is successful when:
- ✅ Activities appear in dashboard
- ✅ Root users receive notifications
- ✅ Activities stored in database
- ✅ No errors in logs
- ✅ Performance is acceptable
- ✅ All existing features work

### Estimated Downtime

- **Zero downtime** - Hot reload supported
- If restart needed: < 30 seconds

### Post-Migration Tasks

1. Monitor for 24 hours
2. Check activity volume
3. Verify database growth
4. Test with production load
5. Update documentation
6. Train users on new features

## 🎉 Migration Complete!

Your activity feed is now production-ready with:
- ✅ Real-time tracking
- ✅ Root user notifications
- ✅ Database persistence
- ✅ Full audit trail

**Root users will now know about EVERY activity!** 🔴
