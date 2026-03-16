# Task System - Quick Reference

## Feature Comparison Matrix

| Feature | Individual Tasks | Project Tasks | Notes |
|---------|-----------------|---------------|-------|
| **Core** |
| Create/Read/Update/Delete | ✅ | ✅ | Full CRUD operations |
| Title & Description | ✅ | ✅ | Required fields |
| Status (5 states) | ✅ | ✅ | todo, in-progress, review, completed, blocked |
| Priority (4 levels) | ✅ | ✅ | low, medium, high, critical |
| Due Date | ✅ | ✅ | Optional |
| Estimated Hours | ✅ | ✅ | For planning |
| Actual Hours | ✅ | ✅ | Auto-calculated from time entries |
| **Assignment** |
| Manager-Assigned | ✅ | ✅ | Requires role level >= 50 |
| Self-Assigned | ✅ | ❌ | Individual tasks only |
| Assigned To | ✅ | ✅ | Employee reference |
| Assigned By | ✅ | ✅ | Employee reference |
| **Organization** |
| Tags with Colors | ✅ | ✅ | Multiple tags per task |
| Custom Fields | ✅ | ✅ | text, number, date, select, multiselect |
| Order & Column | ✅ | ✅ | For Kanban boards |
| **Collaboration** |
| Comments | ✅ | ✅ | With mentions support |
| Mentions | ✅ | ✅ | @username in comments |
| Watchers | ✅ | ✅ | Get notifications |
| Activity Timeline | ✅ | ✅ | Full audit trail |
| **Time Management** |
| Time Tracking | ✅ | ✅ | Start/stop timer |
| Time Entries | ✅ | ✅ | Multiple entries per task |
| Time Descriptions | ✅ | ✅ | Optional notes |
| Duration Calculation | ✅ | ✅ | Automatic |
| **Structure** |
| Checklist | ✅ | ✅ | Multiple items |
| Checklist Completion | ✅ | ✅ | Track who/when |
| Subtasks | ✅ | ✅ | Nested tasks |
| Parent Task | ✅ | ✅ | Task hierarchy |
| Subtask Progress | ✅ | ✅ | Percentage complete |
| **Dependencies** |
| Task Dependencies | ✅ | ✅ | 4 dependency types |
| Finish-to-Start | ✅ | ✅ | Most common |
| Start-to-Start | ✅ | ✅ | Parallel tasks |
| Finish-to-Finish | ✅ | ✅ | Synchronized completion |
| Start-to-Finish | ✅ | ✅ | Rare use case |
| Circular Detection | ✅ | ✅ | Prevents loops |
| Blocked Status | ✅ | ✅ | Auto-detection |
| **Files** |
| Attachments | ✅ | ✅ | Multiple files |
| File Metadata | ✅ | ✅ | Name, size, type, uploader |
| File Upload | ✅ | ✅ | Via multipart/form-data |
| File Delete | ✅ | ✅ | With disk cleanup |
| **Advanced** |
| Templates | ✅ | ✅ | Reusable task patterns |
| Recurring Tasks | ✅ | ✅ | With patterns |
| Clone Task | ✅ | ✅ | Duplicate with "(Copy)" |
| Bulk Operations | ✅ | ✅ | Update multiple tasks |
| Search & Filter | ✅ | ✅ | Advanced queries |
| **Real-Time** |
| Socket.IO Events | ✅ | ✅ | Live updates |
| Notifications | ✅ | ✅ | Assignment, mentions, etc. |
| **Project Link** |
| Linked to Project | ❌ | ✅ | Required for project tasks |
| Project Context | ❌ | ✅ | Inherits project settings |

---

## API Endpoint Quick Reference

### Individual Tasks
```
Base: /api/tasks

GET    /                          # List all tasks
GET    /?taskType=individual      # Filter individual tasks
POST   /                          # Create task
GET    /:id                       # Get task details
PUT    /:id                       # Update task
DELETE /:id                       # Delete task
PATCH  /:id/status                # Update status
POST   /:id/clone                 # Clone task
GET    /:id/timeline              # Get timeline

# Features
POST   /:id/comments              # Add comment
POST   /:id/time/start            # Start timer
POST   /:id/time/stop             # Stop timer
POST   /:id/tags                  # Add tag
DELETE /:id/tags                  # Remove tag
POST   /:id/attachments           # Upload file
DELETE /:id/attachments/:attachmentId
POST   /:id/checklist             # Add checklist item
PATCH  /:id/checklist             # Update item
DELETE /:id/checklist/:itemId     # Delete item
POST   /:id/subtasks              # Add subtask
DELETE /:id/subtasks/:subtaskId   # Delete subtask
GET    /:id/subtasks/progress     # Get progress
POST   /:id/dependencies          # Add dependency
DELETE /:id/dependencies/:dependencyId
POST   /:id/watchers              # Add watcher
DELETE /:id/watchers              # Remove watcher
```

### Project Tasks
```
Base: /api/projects/:projectId/tasks

GET    /                          # List project tasks
POST   /                          # Create task
PUT    /:taskId                   # Update task
DELETE /:taskId                   # Delete task
POST   /reorder                   # Reorder tasks
PATCH  /:taskId/status            # Update status
POST   /:taskId/clone             # Clone task
GET    /:taskId/timeline          # Get timeline

# Features (same as individual tasks)
POST   /:taskId/comments
POST   /:taskId/time/start
POST   /:taskId/time/stop
POST   /:taskId/tags
DELETE /:taskId/tags
POST   /:taskId/attachments
DELETE /:taskId/attachments/:attachmentId
POST   /:taskId/checklist
PATCH  /:taskId/checklist/:itemId
DELETE /:taskId/checklist/:itemId
POST   /:taskId/subtasks
DELETE /:taskId/subtasks/:subtaskId
GET    /:taskId/subtasks/progress
POST   /:taskId/dependencies
DELETE /:taskId/dependencies/:dependencyId
POST   /:taskId/watchers
DELETE /:taskId/watchers
```

---

## Permission Quick Reference

### Individual Tasks

| Action | Permission | Min Role Level | Notes |
|--------|-----------|----------------|-------|
| View own tasks | None | Any | Always allowed |
| Create self-assigned | None | Any | assignedTo = assignedBy |
| Assign to others | `tasks.assign` | 50 (Manager) | assignedTo ≠ assignedBy |
| Edit own tasks | None | Any | Creator or assignee |
| Edit others' tasks | `tasks.edit` | 50 (Manager) | Any task |
| Delete own tasks | None | Any | Creator only |
| Delete others' tasks | `tasks.delete` | 60 (Senior Manager) | Any task |
| Change status | `tasks.change_status` | Any | Own tasks only |
| View all tasks | `tasks.view_all` | 80 (Director) | System-wide |

### Project Tasks

| Action | Permission | Min Role Level | Notes |
|--------|-----------|----------------|-------|
| View project tasks | Project member | Any | Must be on team |
| Create task | Project access | 40 (Team Lead) | Project member |
| Edit task | Project access | 40 (Team Lead) | Project member |
| Delete task | Project manager | 50 (Manager) | Manager or owner |
| Manage team | `projects.manage_team` | 50 (Manager) | Add/remove members |

---

## Status Flow

```
todo → in-progress → review → completed
  ↓         ↓          ↓
blocked ← blocked ← blocked
```

**Status Descriptions:**
- `todo` - Not started
- `in-progress` - Currently being worked on
- `review` - Awaiting review/approval
- `completed` - Finished
- `blocked` - Cannot proceed (dependencies, issues)

---

## Priority Levels

| Priority | Color | Use Case |
|----------|-------|----------|
| `low` | 🟢 Green | Nice to have, no urgency |
| `medium` | 🟡 Yellow | Normal priority, standard timeline |
| `high` | 🟠 Orange | Important, needs attention soon |
| `critical` | 🔴 Red | Urgent, blocking other work |

---

## Dependency Types

| Type | Description | Example |
|------|-------------|---------|
| `finish-to-start` | Task B starts after Task A finishes | Design → Development |
| `start-to-start` | Task B starts when Task A starts | Testing → Documentation |
| `finish-to-finish` | Task B finishes when Task A finishes | Frontend → Backend |
| `start-to-finish` | Task B finishes when Task A starts | Old system → New system |

---

## Socket.IO Events

### Task Events
```javascript
socket.on('task:created', (task) => {})
socket.on('task:updated', (task) => {})
socket.on('task:deleted', ({ id }) => {})
socket.on('task:status:updated', (task) => {})
```

### Feature Events
```javascript
socket.on('task:comment:added', ({ taskId, comment }) => {})
socket.on('task:timer:started', ({ taskId, userId }) => {})
socket.on('task:timer:stopped', ({ taskId, userId, duration }) => {})
socket.on('task:tag:added', ({ taskId, tag }) => {})
socket.on('task:tag:removed', ({ taskId, tagName }) => {})
socket.on('task:attachment:added', ({ taskId, attachment }) => {})
socket.on('task:attachment:removed', ({ taskId, attachmentId }) => {})
socket.on('task:checklist:added', ({ taskId, item }) => {})
socket.on('task:checklist:updated', ({ taskId, item }) => {})
socket.on('task:checklist:deleted', ({ taskId, itemId }) => {})
socket.on('task:subtask:added', ({ taskId, subtask }) => {})
socket.on('task:subtask:deleted', ({ taskId, subtaskId }) => {})
socket.on('task:dependency:added', ({ taskId, dependsOn }) => {})
socket.on('task:dependency:removed', ({ taskId, dependencyId }) => {})
```

### Project Events
```javascript
socket.on('project:tasks:reordered', ({ projectId, tasks }) => {})
```

---

## Common Use Cases

### 1. Create Self-Assigned Task
```javascript
POST /api/tasks
{
  "title": "Review documentation",
  "description": "Read new API docs",
  "taskType": "individual",
  "assignmentType": "self-assigned",
  "assignedTo": currentEmployeeId,
  "assignedBy": currentEmployeeId,
  "priority": "medium"
}
```

### 2. Manager Assigns Task to Employee
```javascript
POST /api/tasks
{
  "title": "Prepare Q4 report",
  "description": "Financial summary",
  "taskType": "individual",
  "assignmentType": "assigned",
  "assignedTo": employeeId,
  "assignedBy": managerId,
  "priority": "high",
  "dueDate": "2024-12-31"
}
```

### 3. Create Project Task with Full Features
```javascript
POST /api/projects/:projectId/tasks
{
  "title": "Implement authentication",
  "description": "Add OAuth2 login",
  "assignedTo": developerId,
  "assignedBy": managerId,
  "priority": "critical",
  "dueDate": "2024-12-25",
  "estimatedHours": 16,
  "tags": [
    { "name": "backend", "color": "#3b82f6" },
    { "name": "security", "color": "#ef4444" }
  ],
  "checklist": [
    { "text": "Setup OAuth provider", "completed": false },
    { "text": "Implement login flow", "completed": false },
    { "text": "Add tests", "completed": false }
  ]
}
```

### 4. Track Time on Task
```javascript
// Start timer
POST /api/tasks/:id/time/start
{ "user": employeeId, "description": "Working on implementation" }

// ... work on task ...

// Stop timer
POST /api/tasks/:id/time/stop
{ "user": employeeId }

// Result: actualHours automatically updated
```

### 5. Add Subtasks with Dependencies
```javascript
// Create parent task
POST /api/projects/:projectId/tasks
{ "title": "Build feature", ... }

// Add subtasks
POST /api/projects/:projectId/tasks/:taskId/subtasks
{ "title": "Design UI", ... }

POST /api/projects/:projectId/tasks/:taskId/subtasks
{ "title": "Implement backend", ... }

POST /api/projects/:projectId/tasks/:taskId/subtasks
{ "title": "Write tests", ... }

// Add dependency: tests depend on backend
POST /api/projects/:projectId/tasks/:testTaskId/dependencies
{
  "dependsOn": backendTaskId,
  "type": "finish-to-start"
}
```

---

## Migration Checklist

- [ ] Backup database
- [ ] Run migration script: `npx ts-node src/scripts/migrateTaskTypes.ts`
- [ ] Verify task counts (project vs individual)
- [ ] Test individual task creation
- [ ] Test project task creation
- [ ] Test self-assignment
- [ ] Test all features on both task types
- [ ] Update frontend to use new fields
- [ ] Deploy to production

---

## Troubleshooting

### Issue: "Project is required for project tasks"
**Solution:** Ensure `taskType: 'project'` tasks include `project` field

### Issue: "Insufficient permissions to assign tasks"
**Solution:** User role level must be >= 50 to assign tasks to others

### Issue: "Circular dependency detected"
**Solution:** Remove dependency chain that loops back to original task

### Issue: "Timer already running"
**Solution:** Stop existing timer before starting new one

### Issue: Task not appearing in list
**Solution:** Check user permissions and project membership

---

**Quick Start:** See [UNIFIED_TASK_SYSTEM.md](./UNIFIED_TASK_SYSTEM.md) for complete documentation.
