# Project Tasks - Quick Reference Guide

## Feature Comparison: BEFORE vs AFTER

### ❌ BEFORE (Missing Features)
- ❌ Time tracking (view-only)
- ❌ Attachments (view-only)
- ❌ Custom fields (not implemented)
- ❌ Dependencies (not implemented)
- ❌ Subtasks (not implemented)
- ❌ Comments (view-only last 3)
- ❌ Watchers (view-only count)
- ❌ Templates (not implemented)
- ❌ Parent task (not implemented)

### ✅ AFTER (All Features)
- ✅ Time tracking (start/stop timer)
- ✅ Attachments (upload/download/delete)
- ✅ Custom fields (add/remove, 4 types)
- ✅ Dependencies (add/remove, 4 types)
- ✅ Subtasks (display with status)
- ✅ Comments (add/view full thread)
- ✅ Watchers (add/remove)
- ✅ Templates (save as template)
- ✅ Parent task (select parent)

---

## Dialog Tabs Overview

### 1. Basic Tab
**Fields:**
- Title (required)
- Description
- Assignment Type (assigned/self-assigned)
- Assign To (employee selector)
- Priority (low/medium/high/critical)
- Status (todo/in-progress/review/completed/blocked)
- Due Date
- Estimated Hours
- Parent Task (optional)
- Blocked By (when status=blocked)

### 2. Features Tab
**Sections:**
- **Tags**: Add colored tags
- **Recurring**: Enable with pattern (daily/weekly/monthly/yearly)
- **Template**: Save as template with name
- **Watchers**: Select employees to watch task

### 3. Checklist Tab
**Features:**
- Add checklist items
- Toggle completion
- Remove items
- Visual completion indicator

### 4. Time Tab ⭐ NEW
**Features:**
- Start/Stop timer button
- Active timer indicator (green)
- Time entries list
- Total duration display
- Requires saved task

### 5. Files Tab ⭐ NEW
**Features:**
- File upload input
- Upload progress
- File list with:
  - Name and size
  - Upload date
  - Download button
  - Delete button
- Requires saved task

### 6. Advanced Tab ⭐ ENHANCED
**Sections:**

**Comments**
- Add comment textarea
- Comment thread with timestamps
- User names
- Requires saved task

**Custom Fields**
- Field name input
- Field type selector (text/number/date/select)
- Add/remove fields
- Field list display

**Dependencies**
- Task selector (same project)
- Dependency type (4 types)
- Add/remove dependencies
- Dependency list with task names

**Subtasks**
- Subtask list
- Task title and status
- View-only

---

## Kanban Card Display

### Visual Indicators
```
┌─────────────────────────────┐
│ Task Title                  │
│ Description preview...      │
│ [tag1] [tag2] [+2]         │
│ [High] [Self] [🔄] [📋] [👤]│
│ 📅 12/25 | ⏱️ 120m | 📎 3   │
│ 💬 5 | ✓ 3/5               │
└─────────────────────────────┘
```

### Badge Meanings
- **Priority Badge**: Low/Medium/High/Critical
- **Self Badge**: Self-assigned task
- **🔄**: Recurring task
- **📋**: Template task
- **👤**: Assigned user avatar
- **📅**: Due date
- **⏱️**: Total time logged
- **📎**: Attachment count
- **💬**: Comment count
- **✓**: Checklist progress

---

## API Endpoints Used

### Task Operations
```
GET    /api/tasks              - Get all tasks
GET    /api/tasks/:id          - Get task by ID
POST   /api/tasks              - Create task
PUT    /api/tasks/:id          - Update task
```

### Time Tracking
```
POST   /api/tasks/:id/time/start     - Start timer
POST   /api/tasks/:id/time/stop      - Stop timer
```

### Attachments
```
POST   /api/tasks/:id/attachments              - Upload file
DELETE /api/tasks/:id/attachments/:attachmentId - Delete file
```

### Comments
```
POST   /api/tasks/:id/comments    - Add comment
```

### Employees
```
GET    /api/employees             - Get all employees
```

---

## Usage Examples

### Creating a Task with All Features

1. **Basic Info**
   - Enter title: "Implement user authentication"
   - Add description
   - Select assignment type: "Assigned by Manager"
   - Assign to: John Doe
   - Set priority: High
   - Set due date: 2024-12-31
   - Estimated hours: 8

2. **Add Features**
   - Add tags: "Backend" (blue), "Security" (red)
   - Enable recurring: Weekly
   - Add watchers: Jane Smith, Bob Johnson

3. **Create Checklist**
   - "Set up JWT library"
   - "Create login endpoint"
   - "Add password hashing"
   - "Write tests"

4. **Save Task** → Task is created

5. **Track Time** (after save)
   - Click "Start Timer"
   - Work on task
   - Click "Stop Timer"

6. **Upload Files** (after save)
   - Click file input
   - Select "auth-diagram.png"
   - File uploads automatically

7. **Add Comments** (after save)
   - Type: "Started implementation, JWT setup complete"
   - Click Add

8. **Add Custom Fields**
   - Field: "API Version", Type: Text
   - Field: "Security Level", Type: Select

9. **Add Dependencies**
   - Select task: "Database setup"
   - Type: Finish-to-Start
   - Click Add

---

## Keyboard Shortcuts

- **Enter** in checklist input → Add item
- **Tab** → Navigate between fields
- **Esc** → Close dialog (when not editing)

---

## Tips & Best Practices

### Time Tracking
- Start timer when beginning work
- Stop timer during breaks
- Review time entries regularly

### Attachments
- Upload relevant documents early
- Use descriptive file names
- Delete outdated files

### Comments
- Add context for decisions
- Mention blockers
- Update on progress

### Custom Fields
- Use for project-specific data
- Keep field names consistent
- Choose appropriate field types

### Dependencies
- Map task relationships early
- Use correct dependency type
- Review dependency chain

### Tags
- Use consistent color scheme
- Create tags for categories
- Limit to 3-5 tags per task

### Watchers
- Add stakeholders
- Include team leads
- Remove when no longer relevant

---

## Troubleshooting

### "Save task first" Message
**Issue**: Trying to use time tracking/files/comments on new task
**Solution**: Save the task first, then use these features

### File Upload Fails
**Issue**: File too large or wrong format
**Solution**: Check file size limit and supported formats

### Timer Won't Start
**Issue**: Task not saved or already running
**Solution**: Ensure task is saved and no active timer

### Can't Add Dependency
**Issue**: Task already has this dependency
**Solution**: Check existing dependencies list

### Employee Not in List
**Issue**: Employee not loaded
**Solution**: Refresh dialog or check employee status

---

## Feature Availability

| Feature | New Task | Existing Task |
|---------|----------|---------------|
| Basic Info | ✅ | ✅ |
| Tags | ✅ | ✅ |
| Checklist | ✅ | ✅ |
| Recurring | ✅ | ✅ |
| Template | ✅ | ✅ |
| Watchers | ✅ | ✅ |
| Custom Fields | ✅ | ✅ |
| Dependencies | ✅ | ✅ |
| Time Tracking | ❌ | ✅ |
| Attachments | ❌ | ✅ |
| Comments | ❌ | ✅ |

**Note**: Time tracking, attachments, and comments require the task to be saved first.

---

## Quick Actions

### Start Working on Task
1. Open task
2. Go to Time tab
3. Click "Start Timer"

### Add Documentation
1. Open task
2. Go to Files tab
3. Upload document

### Report Progress
1. Open task
2. Go to Advanced tab
3. Add comment

### Link Related Task
1. Open task
2. Go to Advanced tab
3. Add dependency

### Track Custom Data
1. Open task
2. Go to Advanced tab
3. Add custom field

---

## Status Indicators

### Time Tracking
- **Green box**: Timer is running
- **No indicator**: Timer stopped
- **Duration**: Total time logged

### Attachments
- **📎 with number**: Files attached
- **No indicator**: No files

### Comments
- **💬 with number**: Comments exist
- **No indicator**: No comments

### Checklist
- **✓ X/Y**: X completed out of Y total
- **No indicator**: No checklist

---

## Common Workflows

### 1. Create Task from Template
1. Create new task
2. Go to Features tab
3. Check "Save as template"
4. Enter template name
5. Save task

### 2. Break Down Large Task
1. Create parent task
2. Create subtasks
3. Set parent task reference
4. Add dependencies between subtasks

### 3. Collaborate on Task
1. Add watchers
2. Upload relevant files
3. Add comments for updates
4. Track time spent

### 4. Track Recurring Work
1. Create task
2. Enable recurring
3. Select pattern (daily/weekly/monthly)
4. System creates new instances

---

**Last Updated**: 2024
**Version**: 2.0.0
**Status**: Production Ready ✅
