# Quick Start - Task Enhancements

## 🚀 Start Using New Features in 3 Steps

### Step 1: Start Backend
```bash
cd backend
npm run dev
```

### Step 2: Start Frontend
```bash
cd frontend
npm run dev
```

### Step 3: Test Features
1. Login to http://localhost:3000
2. Navigate to any task detail page
3. Try the new features!

---

## 📋 Feature Checklist

### ⏱️ Time Tracking
- [ ] Click "Start" button
- [ ] Watch timer count up
- [ ] Add description (optional)
- [ ] Click "Stop" to save
- [ ] View time logs below

### 📎 File Attachments
- [ ] Click "Attach File"
- [ ] Select file (max 10MB)
- [ ] See file in list
- [ ] Download file
- [ ] Remove file

### 🏷️ Tags
- [ ] Click "Add Tag"
- [ ] Enter tag name
- [ ] Pick a color
- [ ] Click "Add"
- [ ] Remove tag with X

---

## 🎯 API Endpoints

All endpoints require authentication token in header:
```
Authorization: Bearer YOUR_TOKEN
```

### Time Tracking
```
POST   /api/tasks/:id/time/start
POST   /api/tasks/:id/time/stop
```

### Attachments
```
POST   /api/tasks/:id/attachments
DELETE /api/tasks/:id/attachments/:attachmentId
```

### Tags
```
POST   /api/tasks/:id/tags
DELETE /api/tasks/:id/tags
```

---

## 🔍 Where to Find Features

1. **Dashboard** → **Tasks** → Click any task
2. Scroll down to see three new sections:
   - ⏱️ Time Tracking
   - 🏷️ Tags
   - 📎 Attachments

---

## 💡 Tips

### Time Tracking
- Only one timer can run per user
- Timer continues even if you close the page
- Duration auto-calculates in minutes
- Total hours updates automatically

### File Attachments
- Supported: images, PDFs, docs, spreadsheets, archives
- Max size: 10MB per file
- Files stored in `backend/uploads/`
- Download works immediately

### Tags
- Choose from 10 preset colors
- Tags are task-specific
- Can't add duplicate tags
- Great for filtering (coming soon)

---

## 🐛 Troubleshooting

### Timer won't start
- Check you're logged in
- Verify employee ID is set
- Check browser console for errors

### File upload fails
- Check file size (max 10MB)
- Verify file type is supported
- Check backend uploads folder exists

### Tags not saving
- Check tag name isn't empty
- Verify no duplicate tag exists
- Check network tab for errors

---

## 📞 Support

Check logs:
- Backend: Terminal running `npm run dev`
- Frontend: Browser console (F12)

---

**Ready to go!** 🎉

All features are production-ready and fully functional.
