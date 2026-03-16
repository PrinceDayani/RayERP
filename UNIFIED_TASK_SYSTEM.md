# Unified Task System - Complete Guide

## Overview

The RayERP task system now supports **two distinct task types** with **full feature parity**:

1. **Individual Tasks** - Standalone tasks not linked to projects
2. **Project Tasks** - Tasks linked to specific projects

Both task types support the same rich feature set including time tracking, attachments, comments, tags, checklists, subtasks, dependencies, and more.

---

## Task Types

### Individual Tasks
- **Purpose**: Personal tasks, department tasks, or standalone work items
- **Assignment**: Can be assigned by managers OR self-assigned
- **Scope**: Not linked to any project
- **Use Cases**:
  - Personal to-do items
  - Department-level tasks
  - Administrative work
  - Training assignments
  - General work items

### Project Tasks
- **Purpose**: Tasks within a specific project context
- **Assignment**: Assigned by project managers/team leads
- **Scope**: Always linked to a project
- **Use Cases**:
  - Project deliverables
  - Sprint tasks
  - Project milestones
  - Team collaboration work

---

## Assignment Types

### Assigned Tasks
- Created by a manager/lead and assigned to an employee
- Requires appropriate permissions (role level >= 50)
- Notification sent to assignee
- Tracked in manager's dashboard

### Self-Assigned Tasks
- Created by employee for themselves
- No special permissions required
- `assignedTo` and `assignedBy` are the same employee
- Useful for personal task management

---

## Features (Available for Both Task Types)

### ✅ Core Features
- Title, description, status, priority
- Due dates and time estimates
- Task ordering and columns (Kanban)
- Custom fields

### ✅ Collaboration
- **Comments** with mentions
- **Watchers** for notifications
- **Activity timeline** with full history

### ✅ Time Management
- **Time tracking** (start/stop timer)
- Estimated vs actual hours
- Time entries with descriptions
- Automatic hour calculations

### ✅ Organization
- **Tags** with colors
- **Checklists** with completion tracking
- **Subtasks** with progress tracking
- **Dependencies** (finish-to-start, etc.)

### ✅ Attachments
- File uploads
- Multiple file types supported
- Metadata tracking (uploader, date, size)

### ✅ Advanced
- **Templates** for recurring task patterns
- **Recurring tasks** with patterns
- **Bulk operations**
- **Search and filters**
- **Calendar integration**

---

## API Endpoints

### Individual Tasks (Standalone)

```
GET    /api/tasks                    # Get all tasks (filtered by permissions)
GET    /api/tasks?taskType=individual # Get only individual tasks
POST   /api/tasks                    # Create individual task
GET    /api/tasks/:id                # Get task details
PUT    /api/tasks/:id                # Update task
DELETE /api/tasks/:id                # Delete task

# Comments
POST   /api/tasks/:id/comments       # Add comment

# Time Tracking
POST   /api/tasks/:id/time/start     # Start timer
POST   /api/tasks/:id/time/stop      # Stop timer

# Tags
POST   /api/tasks/:id/tags           # Add tag
DELETE /api/tasks/:id/tags           # Remove tag

# Attachments
POST   /api/tasks/:id/attachments    # Upload file
DELETE /api/tasks/:id/attachments/:attachmentId

# Checklist
POST   /api/tasks/:id/checklist      # Add checklist item
PATCH  /api/tasks/:id/checklist      # Update checklist item
DELETE /api/tasks/:id/checklist/:itemId

# Watchers
POST   /api/tasks/:id/watchers       # Add watcher
DELETE /api/tasks/:id/watchers       # Remove watcher

# Advanced
POST   /api/tasks/:id/clone          # Clone task
PATCH  /api/tasks/bulk               # Bulk update
GET    /api/tasks/templates/all      # Get templates
POST   /api/tasks/templates/:id/create # Create from template
```

### Project Tasks

```
GET    /api/projects/:id/tasks                    # Get project tasks
POST   /api/projects/:id/tasks                    # Create project task
PUT    /api/projects/:id/tasks/:taskId            # Update project task
DELETE /api/projects/:id/tasks/:taskId            # Delete project task
POST   /api/projects/:id/tasks/reorder            # Reorder tasks

# Comments
POST   /api/projects/:id/tasks/:taskId/comments   # Add comment

# Time Tracking
POST   /api/projects/:id/tasks/:taskId/time/start # Start timer
POST   /api/projects/:id/tasks/:taskId/time/stop  # Stop timer

# Tags
POST   /api/projects/:id/tasks/:taskId/tags       # Add tag
DELETE /api/projects/:id/tasks/:taskId/tags       # Remove tag

# Attachments
POST   /api/projects/:id/tasks/:taskId/attachments # Upload file
DELETE /api/projects/:id/tasks/:taskId/attachments/:attachmentId # Delete file

# Checklist
POST   /api/projects/:id/tasks/:taskId/checklist  # Add checklist item
PATCH  /api/projects/:id/tasks/:taskId/checklist/:itemId # Update item
DELETE /api/projects/:id/tasks/:taskId/checklist/:itemId # Delete item

# Watchers
POST   /api/projects/:id/tasks/:taskId/watchers   # Add watcher
DELETE /api/projects/:id/tasks/:taskId/watchers   # Remove watcher

# Subtasks
POST   /api/projects/:id/tasks/:taskId/subtasks   # Add subtask
DELETE /api/projects/:id/tasks/:taskId/subtasks/:subtaskId # Delete subtask
GET    /api/projects/:id/tasks/:taskId/subtasks/progress # Get progress

# Dependencies
POST   /api/projects/:id/tasks/:taskId/dependencies # Add dependency
DELETE /api/projects/:id/tasks/:taskId/dependencies/:dependencyId # Remove dependency

# Status & Actions
PATCH  /api/projects/:id/tasks/:taskId/status     # Update status
POST   /api/projects/:id/tasks/:taskId/clone      # Clone task

# Timeline
GET    /api/projects/:id/tasks/:taskId/timeline   # Get timeline
```

---

## Request Examples

### Create Individual Task (Assigned by Manager)

```json
POST /api/tasks
{
  "title": "Complete Q4 Report",
  "description": "Prepare quarterly financial report",
  "taskType": "individual",
  "assignmentType": "assigned",
  "assignedTo": "employee_id",
  "assignedBy": "manager_id",
  "priority": "high",
  "dueDate": "2024-12-31",
  "estimatedHours": 8
}
```

### Create Individual Task (Self-Assigned)

```json
POST /api/tasks
{
  "title": "Review documentation",
  "description": "Read new API docs",
  "taskType": "individual",
  "assignmentType": "self-assigned",
  "assignedTo": "employee_id",
  "assignedBy": "employee_id",
  "priority": "medium",
  "dueDate": "2024-12-20"
}
```

### Create Project Task

```json
POST /api/projects/project_id/tasks
{
  "title": "Implement login feature",
  "description": "Add OAuth2 authentication",
  "assignedTo": "developer_id",
  "assignedBy": "manager_id",
  "priority": "critical",
  "dueDate": "2024-12-25",
  "estimatedHours": 16,
  "tags": [
    { "name": "backend", "color": "#3b82f6" },
    { "name": "security", "color": "#ef4444" }
  ]
}
```

### Add Comment with Mentions

```json
POST /api/tasks/:id/comments
{
  "comment": "@john Can you review this?",
  "user": "current_user_id",
  "mentions": ["john_employee_id"]
}
```

### Start Time Tracking

```json
POST /api/tasks/:id/time/start
{
  "user": "employee_id",
  "description": "Working on implementation"
}
```

### Stop Time Tracking

```json
POST /api/tasks/:id/time/stop
{
  "user": "employee_id"
}
```

### Add Tag

```json
POST /api/tasks/:id/tags
{
  "name": "urgent",
  "color": "#ef4444"
}
```

### Add Checklist Item

```json
POST /api/tasks/:id/checklist
{
  "text": "Review code changes"
}
```

### Update Checklist Item

```json
PATCH /api/tasks/:id/checklist
{
  "itemId": "checklist_item_id",
  "completed": true,
  "completedBy": "employee_id"
}
```

### Delete Checklist Item

```json
DELETE /api/tasks/:id/checklist/:itemId
```

### Add Subtask

```json
POST /api/tasks/:id/subtasks
{
  "title": "Subtask title",
  "description": "Subtask description",
  "assignedTo": "employee_id",
  "assignedBy": "manager_id"
}
```

### Delete Subtask

```json
DELETE /api/tasks/:id/subtasks/:subtaskId
```

### Get Subtask Progress

```json
GET /api/tasks/:id/subtasks/progress

Response:
{
  "total": 5,
  "completed": 3,
  "progress": 60
}
```

### Add Dependency

```json
POST /api/tasks/:id/dependencies
{
  "dependsOn": "other_task_id",
  "type": "finish-to-start"  // or start-to-start, finish-to-finish, start-to-finish
}
```

### Remove Dependency

```json
DELETE /api/tasks/:id/dependencies/:dependencyId
```

### Add Watcher

```json
POST /api/tasks/:id/watchers
{
  "userId": "employee_id"
}
```

### Remove Watcher

```json
DELETE /api/tasks/:id/watchers
{
  "userId": "employee_id"
}
```

### Remove Tag

```json
DELETE /api/tasks/:id/tags
{
  "name": "urgent"
}
```

### Upload Attachment

```javascript
const formData = new FormData();
formData.append('file', fileInput.files[0]);
formData.append('uploadedBy', 'employee_id');

fetch('/api/tasks/:id/attachments', {
  method: 'POST',
  body: formData
});
```

### Remove Attachment

```json
DELETE /api/tasks/:id/attachments/:attachmentId
```

### Update Task Status

```json
PATCH /api/tasks/:id/status
{
  "status": "in-progress",
  "user": "employee_id"
}
```

### Clone Task

```json
POST /api/tasks/:id/clone

Response: Returns cloned task with "(Copy)" appended to title
```

### Get Task Timeline

```json
GET /api/tasks/:id/timeline

Response: Array of timeline events with user, action, timestamp
```

---

## Project Task Examples

All individual task endpoints work the same for project tasks, just use the project-scoped URLs:

### Add Comment to Project Task

```json
POST /api/projects/:projectId/tasks/:taskId/comments
{
  "comment": "Great progress!",
  "user": "employee_id"
}
```

### Start Timer on Project Task

```json
POST /api/projects/:projectId/tasks/:taskId/time/start
{
  "user": "employee_id",
  "description": "Working on feature implementation"
}
```

### Add Subtask to Project Task

```json
POST /api/projects/:projectId/tasks/:taskId/subtasks
{
  "title": "Write unit tests",
  "description": "Add test coverage",
  "assignedTo": "developer_id",
  "assignedBy": "lead_id"
}
```

### Add Dependency to Project Task

```json
POST /api/projects/:projectId/tasks/:taskId/dependencies
{
  "dependsOn": "prerequisite_task_id",
  "type": "finish-to-start"
}
```

### Clone Project Task

```json
POST /api/projects/:projectId/tasks/:taskId/clone
```

---

## Permissions

### Individual Tasks

| Action | Required Permission | Role Level |
|--------|-------------------|------------|
| View own tasks | None | Any |
| Create self-assigned task | None | Any |
| Assign task to others | `tasks.assign` | >= 50 (Manager+) |
| Edit own tasks | None | Any |
| Edit others' tasks | `tasks.edit` | >= 50 (Manager+) |
| Delete own tasks | None | Any |
| Delete others' tasks | `tasks.delete` | >= 60 (Senior Manager+) |

### Project Tasks

| Action | Required Permission | Role Level |
|--------|-------------------|------------|
| View project tasks | Project member | Any |
| Create project task | Project access | >= 40 (Team Lead+) |
| Edit project task | Project access | >= 40 (Team Lead+) |
| Delete project task | Project manager | >= 50 (Manager+) |

---

## Database Schema

```typescript
interface ITask {
  // Core Fields
  title: string;
  description: string;
  taskType: 'individual' | 'project';
  assignmentType: 'assigned' | 'self-assigned';
  status: 'todo' | 'in-progress' | 'review' | 'completed' | 'blocked';
  priority: 'low' | 'medium' | 'high' | 'critical';
  
  // References
  project?: ObjectId;  // Optional - only for project tasks
  assignedTo: ObjectId;  // Employee
  assignedBy: ObjectId;  // Employee
  
  // Dates
  dueDate?: Date;
  createdAt: Date;
  updatedAt: Date;
  
  // Time Management
  estimatedHours: number;
  actualHours: number;
  timeEntries: [{
    user: ObjectId;
    startTime: Date;
    endTime?: Date;
    duration: number;
    description?: string;
  }];
  
  // Organization
  order: number;
  column: string;
  tags: [{ name: string; color: string }];
  
  // Collaboration
  comments: [{
    user: ObjectId;
    comment: string;
    mentions: ObjectId[];
    createdAt: Date;
  }];
  watchers: ObjectId[];
  
  // Structure
  checklist: [{
    text: string;
    completed: boolean;
    completedBy?: ObjectId;
    completedAt?: Date;
  }];
  subtasks: ObjectId[];
  parentTask?: ObjectId;
  dependencies: [{
    taskId: ObjectId;
    type: 'finish-to-start' | 'start-to-start' | 'finish-to-finish' | 'start-to-finish';
  }];
  
  // Files
  attachments: [{
    filename: string;
    originalName: string;
    mimetype: string;
    size: number;
    url: string;
    uploadedBy: ObjectId;
    uploadedAt: Date;
  }];
  
  // Advanced
  customFields: [{
    fieldName: string;
    fieldType: 'text' | 'number' | 'date' | 'select' | 'multiselect';
    value: any;
  }];
  isRecurring: boolean;
  recurrencePattern?: string;
  nextRecurrence?: Date;
  blockedBy?: string;
  isTemplate: boolean;
  templateName?: string;
}
```

---

## Migration

### Run Migration Script

```bash
cd backend
npx ts-node src/scripts/migrateTaskTypes.ts
```

This will:
1. Add `taskType` field to all existing tasks
   - Tasks with `project` → `taskType: 'project'`
   - Tasks without `project` → `taskType: 'individual'`
2. Add `assignmentType` field
   - If `assignedTo === assignedBy` → `assignmentType: 'self-assigned'`
   - Otherwise → `assignmentType: 'assigned'`

### Rollback (if needed)

```javascript
// Remove new fields
await Task.updateMany(
  {},
  { $unset: { taskType: "", assignmentType: "" } }
);
```

---

## Frontend Integration

### Task Creation Form

```typescript
// Individual Task Form
const createIndividualTask = async (data: {
  title: string;
  description: string;
  assignmentType: 'assigned' | 'self-assigned';
  assignedTo?: string;  // Required if assignmentType === 'assigned'
  priority: string;
  dueDate?: Date;
}) => {
  const response = await fetch('/api/tasks', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ...data,
      taskType: 'individual',
      assignedBy: currentUserId
    })
  });
  return response.json();
};

// Project Task Form
const createProjectTask = async (projectId: string, data: {
  title: string;
  description: string;
  assignedTo: string;
  priority: string;
  dueDate?: Date;
}) => {
  const response = await fetch(`/api/projects/${projectId}/tasks`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ...data,
      assignedBy: currentUserId
    })
  });
  return response.json();
};
```

### Task List Filtering

```typescript
// Get all tasks
const allTasks = await fetch('/api/tasks').then(r => r.json());

// Get only individual tasks
const individualTasks = await fetch('/api/tasks?taskType=individual').then(r => r.json());

// Get only project tasks
const projectTasks = await fetch('/api/tasks?taskType=project').then(r => r.json());

// Get tasks for specific project
const projectSpecificTasks = await fetch(`/api/projects/${projectId}/tasks`).then(r => r.json());
```

---

## Best Practices

### 1. Task Type Selection
- Use **individual tasks** for personal work, training, admin tasks
- Use **project tasks** for deliverables tied to specific projects

### 2. Assignment Strategy
- Managers should use **assigned** type when delegating work
- Employees should use **self-assigned** for personal task management
- Always set realistic due dates and estimates

### 3. Time Tracking
- Start timer when beginning work
- Stop timer when taking breaks or switching tasks
- Add descriptions to time entries for better tracking

### 4. Collaboration
- Add watchers for stakeholders who need updates
- Use comments with mentions for quick communication
- Keep task descriptions updated as work progresses

### 5. Organization
- Use tags consistently across similar tasks
- Break large tasks into subtasks
- Set dependencies to manage task order

---

## Real-Time Updates

All task operations emit Socket.IO events:

```typescript
// Listen for task events
socket.on('task:created', (task) => { /* Update UI */ });
socket.on('task:updated', (task) => { /* Update UI */ });
socket.on('task:deleted', ({ id }) => { /* Remove from UI */ });
socket.on('task:comment:added', ({ taskId, comment }) => { /* Add comment */ });
socket.on('task:timer:started', ({ taskId, userId }) => { /* Show timer */ });
socket.on('task:timer:stopped', ({ taskId, userId, duration }) => { /* Update hours */ });
```

---

## Summary

✅ **Unified System** - One model, two task types, full feature parity
✅ **Flexible Assignment** - Manager-assigned OR self-assigned
✅ **Rich Features** - Time tracking, comments, tags, attachments, checklists
✅ **Permission-Based** - Role-based access control
✅ **Real-Time** - Socket.IO for live updates
✅ **Backward Compatible** - Migration script included

---

**Status**: ✅ Production Ready
**Version**: 2.1.0
**Last Updated**: December 2024
