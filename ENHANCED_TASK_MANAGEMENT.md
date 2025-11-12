# Enhanced Task Management System

## Overview
Comprehensive task management improvements including dependencies, subtasks, templates, recurring tasks, blocking, cloning, bulk operations, and watchers.

## New Features

### 1. Task Dependencies
Track relationships between tasks with four dependency types:
- **finish-to-start**: Task B starts when Task A finishes
- **start-to-start**: Task B starts when Task A starts
- **finish-to-finish**: Task B finishes when Task A finishes
- **start-to-finish**: Task B finishes when Task A starts

**Model Fields:**
```typescript
dependencies: [{
  taskId: ObjectId,
  type: 'finish-to-start' | 'start-to-start' | 'finish-to-finish' | 'start-to-finish'
}]
```

### 2. Subtasks & Hierarchical Structure
Create parent-child task relationships for better organization.

**Model Fields:**
```typescript
subtasks: [ObjectId]
parentTask: ObjectId
```

### 3. Task Templates
Create reusable task templates for common workflows.

**Model Fields:**
```typescript
isTemplate: Boolean
templateName: String
```

**API Endpoints:**
- `GET /api/tasks/templates/all` - Get all templates
- `POST /api/tasks/templates/:id/create` - Create task from template

### 4. Recurring Tasks
Support for periodic tasks with recurrence patterns.

**Model Fields:**
```typescript
isRecurring: Boolean
recurrencePattern: String  // e.g., "daily", "weekly", "monthly"
```

### 5. Task Blocking
Mark tasks as blocked with reasons.

**Model Fields:**
```typescript
status: 'todo' | 'in-progress' | 'review' | 'completed' | 'blocked'
blockedBy: String  // Reason for blocking
```

### 6. Task Cloning
Duplicate tasks with all properties.

**API Endpoint:**
- `POST /api/tasks/:id/clone` - Clone a task

### 7. Bulk Operations
Update multiple tasks simultaneously.

**API Endpoint:**
- `PATCH /api/tasks/bulk` - Bulk update tasks

**Request Body:**
```json
{
  "taskIds": ["id1", "id2", "id3"],
  "updates": {
    "status": "in-progress",
    "priority": "high"
  }
}
```

### 8. Task Watchers
Allow users to watch/follow tasks for notifications.

**Model Fields:**
```typescript
watchers: [ObjectId]
```

**API Endpoints:**
- `POST /api/tasks/:id/watchers` - Add watcher
- `DELETE /api/tasks/:id/watchers` - Remove watcher

## Updated API Endpoints

### Existing Endpoints (Enhanced)
- `GET /api/tasks` - Now populates dependencies, subtasks, and parentTask
- `GET /api/tasks/:id` - Full task details with relationships
- `POST /api/tasks` - Create task with new fields
- `PUT /api/tasks/:id` - Update task with new fields

### New Endpoints
- `POST /api/tasks/:id/clone` - Clone task
- `PATCH /api/tasks/bulk` - Bulk update
- `POST /api/tasks/:id/watchers` - Add watcher
- `DELETE /api/tasks/:id/watchers` - Remove watcher
- `GET /api/tasks/templates/all` - Get templates
- `POST /api/tasks/templates/:id/create` - Create from template

## Usage Examples

### Create Task with Dependencies
```json
POST /api/tasks
{
  "title": "Backend API",
  "description": "Develop API endpoints",
  "project": "projectId",
  "assignedTo": "employeeId",
  "assignedBy": "managerId",
  "dependencies": [
    {
      "taskId": "designTaskId",
      "type": "finish-to-start"
    }
  ]
}
```

### Create Task with Subtasks
```json
POST /api/tasks
{
  "title": "Parent Task",
  "description": "Main task",
  "project": "projectId",
  "assignedTo": "employeeId",
  "assignedBy": "managerId",
  "subtasks": ["subtask1Id", "subtask2Id"]
}
```

### Create Task Template
```json
POST /api/tasks
{
  "title": "Code Review Template",
  "description": "Standard code review checklist",
  "isTemplate": true,
  "templateName": "Code Review",
  "project": "projectId",
  "assignedTo": "employeeId",
  "assignedBy": "managerId",
  "estimatedHours": 2
}
```

### Create Recurring Task
```json
POST /api/tasks
{
  "title": "Weekly Status Report",
  "description": "Submit weekly progress",
  "project": "projectId",
  "assignedTo": "employeeId",
  "assignedBy": "managerId",
  "isRecurring": true,
  "recurrencePattern": "weekly"
}
```

### Block a Task
```json
PUT /api/tasks/:id
{
  "status": "blocked",
  "blockedBy": "Waiting for client approval"
}
```

### Clone a Task
```json
POST /api/tasks/:id/clone
```

### Bulk Update Tasks
```json
PATCH /api/tasks/bulk
{
  "taskIds": ["id1", "id2", "id3"],
  "updates": {
    "priority": "high",
    "dueDate": "2024-12-31"
  }
}
```

### Add Watcher
```json
POST /api/tasks/:id/watchers
{
  "userId": "employeeId"
}
```

### Remove Watcher
```json
DELETE /api/tasks/:id/watchers
{
  "userId": "employeeId"
}
```

## Database Schema Changes

### Task Model Updates
```typescript
interface ITask {
  // Existing fields...
  
  // New fields
  dependencies: [{
    taskId: ObjectId;
    type: 'finish-to-start' | 'start-to-start' | 'finish-to-finish' | 'start-to-finish';
  }];
  subtasks: ObjectId[];
  parentTask?: ObjectId;
  isRecurring: boolean;
  recurrencePattern?: string;
  blockedBy?: string;
  watchers: ObjectId[];
  isTemplate: boolean;
  templateName?: string;
}
```

## Real-time Updates

All operations emit Socket.IO events:
- `task:created` - New task created
- `task:updated` - Task updated
- `task:deleted` - Task deleted
- `tasks:bulk:updated` - Bulk update completed

## Migration Notes

Existing tasks will have default values:
- `dependencies: []`
- `subtasks: []`
- `isRecurring: false`
- `watchers: []`
- `isTemplate: false`

No data migration required - new fields are optional.

## Frontend Integration

Update frontend to support:
1. Dependency visualization (Gantt chart)
2. Subtask tree view
3. Template selector
4. Recurring task scheduler
5. Blocked task indicators
6. Watcher management UI
7. Bulk selection and update

## Benefits

1. **Better Planning**: Dependencies enable critical path analysis
2. **Organization**: Subtasks break down complex work
3. **Efficiency**: Templates reduce repetitive task creation
4. **Automation**: Recurring tasks for routine work
5. **Transparency**: Blocking status clarifies delays
6. **Collaboration**: Watchers keep stakeholders informed
7. **Productivity**: Bulk operations save time

---

**Status**: ✅ Backend Implementation Complete
**Next Steps**: Frontend UI components for new features
