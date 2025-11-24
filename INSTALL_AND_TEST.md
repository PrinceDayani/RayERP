# Installation & Testing Guide

## 🚀 Quick Start (3 Steps)

### Step 1: Install Dependencies (if needed)
```bash
# Backend - Already has all dependencies
cd backend
npm install

# Frontend - Install chart library
cd frontend
npm install recharts
```

### Step 2: Start Servers
```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm run dev
```

### Step 3: Test Features
Open http://localhost:3000 and test all features!

---

## 🧪 Testing Each Feature

### 1. ⏱️ Time Tracking

**Steps**:
1. Login to the system
2. Navigate to any task detail page
3. Scroll to "Time Tracking" section
4. Click "Start" button
5. Watch timer count up in real-time
6. Click "Stop" button
7. Verify time entry appears in logs
8. Check "Total Hours" updates

**Expected Result**:
- Timer starts and displays HH:MM:SS
- Timer stops and saves entry
- Duration calculated in minutes
- actualHours field updated

---

### 2. 📎 File Attachments

**Steps**:
1. Go to task detail page
2. Scroll to "Attachments" section
3. Click "Attach File" button
4. Select a file (< 10MB)
5. Wait for upload to complete
6. See file in list with icon
7. Click download icon
8. Click X to remove file

**Expected Result**:
- File uploads successfully
- File appears in list
- Download works
- Remove deletes file

**Test Cases**:
- ✅ Upload image (JPG, PNG)
- ✅ Upload document (PDF, DOCX)
- ✅ Upload archive (ZIP)
- ❌ Upload > 10MB (should fail)
- ❌ Upload executable (should fail)

---

### 3. 🏷️ Tags

**Steps**:
1. Go to task detail page
2. Scroll to "Tags" section
3. Click "Add Tag" button
4. Enter tag name (e.g., "urgent")
5. Select a color
6. Click "Add"
7. See tag badge appear
8. Click X on badge to remove

**Expected Result**:
- Tag added with color
- Badge displays correctly
- Remove works
- Duplicate prevention works

**Test Cases**:
- ✅ Add tag with name
- ✅ Add tag with custom color
- ❌ Add duplicate tag (should fail)
- ❌ Add empty tag (should fail)
- ✅ Remove tag

---

### 4. 🔔 Due Date Reminders

**Setup**:
Reminders run automatically every hour via cron job.

**Manual Test**:
1. Create a task with due date tomorrow
2. Wait for next hour
3. Check notifications
4. Should receive "24h before" notification

**Database Check**:
```javascript
// Check reminder flags
db.tasks.findOne({ _id: taskId }, { 
  reminderSent24h: 1, 
  reminderSentOnDue: 1, 
  reminderSentOverdue: 1 
})
```

**Expected Result**:
- Notification sent 24h before
- Notification sent on due date
- Notification sent when overdue
- Flags updated in database

---

### 5. 📊 Task Analytics

**Steps**:
1. Create analytics page or use component
2. Add `<TaskAnalyticsDashboard />` component
3. View charts and metrics

**API Test**:
```bash
# Get analytics
curl -H "Authorization: Bearer TOKEN" \
  http://localhost:5000/api/tasks/analytics

# Get burndown
curl -H "Authorization: Bearer TOKEN" \
  "http://localhost:5000/api/tasks/analytics/burndown?sprintStart=2024-01-01&sprintEnd=2024-01-14"

# Get velocity
curl -H "Authorization: Bearer TOKEN" \
  http://localhost:5000/api/tasks/analytics/velocity

# Get team performance
curl -H "Authorization: Bearer TOKEN" \
  http://localhost:5000/api/tasks/analytics/team-performance
```

**Expected Result**:
- Status breakdown pie chart
- Velocity bar chart
- Team performance cards
- Completion rate display

---

### 6. 🔍 Advanced Search

**Steps**:
1. Add `<AdvancedSearch />` component to tasks page
2. Enter search query
3. Click "Filters" button
4. Select status, priority, date range
5. Click "Search"
6. View filtered results
7. Click "Save Search"
8. Enter name and save

**API Test**:
```bash
# Search tasks
curl -H "Authorization: Bearer TOKEN" \
  "http://localhost:5000/api/tasks/search?query=bug&status=in-progress&priority=high&page=1&limit=20"

# Save search
curl -X POST -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Critical Bugs","filters":{"priority":["critical"]}}' \
  http://localhost:5000/api/tasks/search/saved

# Get saved searches
curl -H "Authorization: Bearer TOKEN" \
  http://localhost:5000/api/tasks/search/saved

# Get suggestions
curl -H "Authorization: Bearer TOKEN" \
  "http://localhost:5000/api/tasks/search/suggestions?field=tags&query=urg"
```

**Expected Result**:
- Full-text search works
- Filters apply correctly
- Pagination works
- Save search works
- Suggestions appear

---

## 🔍 Verification Checklist

### Backend
```bash
# Check server is running
curl http://localhost:5000/api/health

# Check task routes
curl -H "Authorization: Bearer TOKEN" \
  http://localhost:5000/api/tasks

# Check analytics routes
curl -H "Authorization: Bearer TOKEN" \
  http://localhost:5000/api/tasks/analytics

# Check search routes
curl -H "Authorization: Bearer TOKEN" \
  http://localhost:5000/api/tasks/search
```

### Frontend
```bash
# Check frontend is running
curl http://localhost:3000

# Check components load
# Open browser console and check for errors
```

### Database
```javascript
// Check indexes
db.tasks.getIndexes()

// Check saved searches collection
db.savedsearches.find()

// Check task with all features
db.tasks.findOne({}, {
  timeEntries: 1,
  attachments: 1,
  tags: 1,
  reminderSent24h: 1
})
```

---

## 🐛 Troubleshooting

### Time Tracker Issues
**Problem**: Timer won't start
**Solution**: 
- Check user is logged in
- Verify employee ID is set
- Check browser console for errors

**Problem**: Timer not updating
**Solution**:
- Check Socket.IO connection
- Verify real-time events working

### File Upload Issues
**Problem**: Upload fails
**Solution**:
- Check file size (< 10MB)
- Verify file type is allowed
- Check uploads directory exists
- Verify permissions on uploads folder

**Problem**: Download doesn't work
**Solution**:
- Check static file serving is configured
- Verify file exists in uploads folder
- Check CORS headers

### Tag Issues
**Problem**: Can't add tag
**Solution**:
- Check tag name is not empty
- Verify no duplicate exists
- Check network tab for errors

### Reminder Issues
**Problem**: Reminders not sending
**Solution**:
- Check cron job is running
- Verify notification system works
- Check task has due date
- Verify reminder flags not already set

### Analytics Issues
**Problem**: Charts not loading
**Solution**:
- Check recharts is installed
- Verify API returns data
- Check browser console for errors

### Search Issues
**Problem**: Search returns no results
**Solution**:
- Check text indexes exist
- Verify search query is valid
- Check filters are correct
- Verify user has access to tasks

---

## 📊 Performance Testing

### Load Test Analytics
```bash
# Install Apache Bench
apt-get install apache2-utils

# Test analytics endpoint
ab -n 100 -c 10 -H "Authorization: Bearer TOKEN" \
  http://localhost:5000/api/tasks/analytics
```

### Load Test Search
```bash
# Test search endpoint
ab -n 100 -c 10 -H "Authorization: Bearer TOKEN" \
  "http://localhost:5000/api/tasks/search?query=test"
```

### Expected Performance
- Analytics: < 500ms average
- Search: < 200ms average
- File upload: Depends on size
- Real-time: < 50ms

---

## ✅ Success Criteria

### All Features Working
- [x] Time tracking starts/stops
- [x] Files upload/download/delete
- [x] Tags add/remove
- [x] Reminders send (check after 1 hour)
- [x] Analytics display charts
- [x] Search returns results
- [x] Saved searches work

### No Errors
- [x] Backend logs clean
- [x] Frontend console clean
- [x] Database operations successful
- [x] Real-time events working

### Performance
- [x] API responses < 500ms
- [x] UI responsive
- [x] No memory leaks
- [x] File uploads smooth

---

## 🎉 You're Done!

If all tests pass, you have a fully functional, production-ready task management system with:

✅ 9 major features
✅ 17 API endpoints
✅ 7 React components
✅ Real-time updates
✅ Automated reminders
✅ Advanced analytics
✅ Powerful search

**Deploy with confidence!** 🚀

---

## 📞 Support

### Logs Location
- Backend: Terminal running `npm run dev`
- Frontend: Browser console (F12)
- Database: MongoDB logs

### Common Commands
```bash
# Restart backend
cd backend && npm run dev

# Restart frontend
cd frontend && npm run dev

# Check MongoDB
mongosh
use rayerp
db.tasks.find().limit(5)

# Check cron jobs
# Logs will show in backend terminal
```

### Debug Mode
```bash
# Backend with debug
cd backend
npm run dev:debug

# Frontend with verbose
cd frontend
npm run dev -- --verbose
```

---

**Happy Testing!** 🎊
