# Task Management Module - Production Ready Documentation

## Overview
The Task Management module is a comprehensive, production-ready system for managing tasks, subtasks, dependencies, and team collaboration within the RayERP platform.

## Features

### ✅ Core Features (Production Ready)
- **Task CRUD Operations** - Create, read, update, delete tasks
- **Status Management** - Todo, In Progress, Review, Completed, Blocked
- **Priority Levels** - Low, Medium, High, Critical
- **Assignment System** - Assign tasks to team members
- **Due Date Tracking** - Set and monitor task deadlines
- **Time Tracking** - Start/stop timers, track actual hours
- **Comments & Mentions** - Collaborate with @mentions
- **File Attachments** - Upload and manage task files
- **Tags & Labels** - Organize tasks with custom tags
- **Real-time Updates** - Socket.IO for live collaboration

### ✅ Advanced Features (Production Ready)
- **Subtasks & Checklists** - Break down tasks into smaller items
- **Task Dependencies** - Define task relationships (finish-to-start, etc.)
- **Recurring Tasks** - Automate task creation (daily, weekly, monthly, custom)
- **Advanced Search** - Full-text search with filters
- **Task Templates** - Create reusable task templates
- **Bulk Operations** - Update multiple tasks at once
- **Task Watchers** - Subscribe to task updates
- **Custom Fields** - Add custom metadata to tasks
- **Task Analytics** - Performance metrics and insights
- **Dependency Graph** - Visualize task relationships
- **Critical Path** - Calculate project critical path
- **Blocked Task Detection** - Identify blocking dependencies

## API Endpoints

### Task Management
```
GET    /api/tasks                    - Get all tasks
GET    /api/tasks/:id                - Get task by ID
POST   /api/tasks                    - Create new task
PUT    /api/tasks/:id                - Update task
DELETE /api/tasks/:id                - Delete task
PATCH  /api/tasks/:id/status         - Update task status
```

### Comments & Timeline
```
POST   /api/tasks/:id/comments       - Add comment
GET    /api/tasks/:id/timeline       - Get task timeline
POST   /api/tasks/:id/timeline       - Add timeline entry
```

### Time Tracking
```
POST   /api/tasks/:id/time/start     - Start time tracking
POST   /api/tasks/:id/time/stop      - Stop time tracking
```

### Attachments
```
POST   /api/tasks/:id/attachments    - Upload attachment
DELETE /api/tasks/:id/attachments/:attachmentId - Remove attachment
```

### Tags
```
POST   /api/tasks/:id/tags           - Add tag
DELETE /api/tasks/:id/tags           - Remove tag
```

### Subtasks & Checklists
```
POST   /api/tasks/:id/subtasks       - Add subtask
POST   /api/tasks/:id/checklist      - Add checklist item
PATCH  /api/tasks/:id/checklist      - Update checklist item
GET    /api/tasks/:id/subtasks/progress - Get subtask progress
```

### Dependencies
```
POST   /api/tasks/:id/dependencies   - Add dependency
DELETE /api/tasks/:id/dependencies/:dependencyId - Remove dependency
GET    /api/tasks/dependencies/graph - Get dependency graph
GET    /api/tasks/dependencies/critical-path - Get critical path
GET    /api/tasks/:id/dependencies/blocked - Check if task is blocked
```

### Recurring Tasks
```
POST   /api/tasks/:id/recurring      - Set recurring pattern
```

### Search & Filters
```
GET    /api/tasks/search             - Advanced search
POST   /api/tasks/search/saved       - Save search
GET    /api/tasks/search/saved       - Get saved searches
DELETE /api/tasks/search/saved/:id   - Delete saved search
GET    /api/tasks/search/suggestions - Get search suggestions
```

### Templates & Bulk Operations
```
GET    /api/tasks/templates/all      - Get task templates
POST   /api/tasks/templates/:id/create - Create from template
POST   /api/tasks/:id/clone          - Clone task
PATCH  /api/tasks/bulk               - Bulk update tasks
```

### Watchers
```
POST   /api/tasks/:id/watchers       - Add watcher
DELETE /api/tasks/:id/watchers       - Remove watcher
```

### Statistics
```
GET    /api/tasks/stats              - Get task statistics
```

## Frontend Components

### Pages
- `/dashboard/tasks` - Main task board (Kanban view)
- `/dashboard/tasks/create` - Create new task
- `/dashboard/tasks/:id` - Task details view
- `/dashboard/tasks/:id/edit` - Edit task
- `/dashboard/tasks/analytics` - Task analytics dashboard

### Components
- `TaskEditor` - Comprehensive task editing interface
- `TaskCard` - Task card for board view
- `TaskList` - List view of tasks
- `TimeTracker` - Time tracking widget
- `AttachmentManager` - File attachment management
- `TagManager` - Tag management
- `SubtaskManager` - Subtask and checklist management
- `TaskDependencyManager` - Dependency management
- `RecurringTaskSetup` - Recurring task configuration
- `CustomFieldsManager` - Custom field management
- `MentionComment` - Comment with @mentions
- `TaskAnalyticsDashboard` - Analytics visualization
- `AdvancedSearch` - Advanced search interface
- `GanttChart` - Gantt chart visualization
- `TaskPriorityIndicator` - Priority visual indicator

## Database Schema

### Task Model
```typescript
{
  title: string;
  description: string;
  status: 'todo' | 'in-progress' | 'review' | 'completed' | 'blocked';
  priority: 'low' | 'medium' | 'high' | 'critical';
  project: ObjectId;
  assignedTo: ObjectId;
  assignedBy: ObjectId;
  dueDate: Date;
  estimatedHours: number;
  actualHours: number;
  tags: [{ name: string, color: string }];
  comments: [{ user: ObjectId, comment: string, mentions: [ObjectId], createdAt: Date }];
  dependencies: [{ taskId: ObjectId, type: string }];
  subtasks: [ObjectId];
  parentTask: ObjectId;
  checklist: [{ text: string, completed: boolean, completedBy: ObjectId, completedAt: Date }];
  timeEntries: [{ user: ObjectId, startTime: Date, endTime: Date, duration: number, description: string }];
  attachments: [{ filename: string, originalName: string, mimetype: string, size: number, url: string, uploadedBy: ObjectId, uploadedAt: Date }];
  customFields: [{ fieldName: string, fieldType: string, value: any }];
  isRecurring: boolean;
  recurrencePattern: string;
  nextRecurrence: Date;
  watchers: [ObjectId];
  isTemplate: boolean;
  templateName: string;
  reminderSent24h: boolean;
  reminderSentOnDue: boolean;
  reminderSentOverdue: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

## Real-time Events

### Socket.IO Events
```javascript
// Task events
'task:created' - New task created
'task:updated' - Task updated
'task:deleted' - Task deleted
'task:status:updated' - Task status changed
'task:comment:added' - Comment added
'task:timeline:added' - Timeline entry added

// Time tracking events
'task:timer:started' - Timer started
'task:timer:stopped' - Timer stopped

// Attachment events
'task:attachment:added' - Attachment uploaded
'task:attachment:removed' - Attachment deleted

// Tag events
'task:tag:added' - Tag added
'task:tag:removed' - Tag removed

// Subtask events
'task:subtask:added' - Subtask created
'task:checklist:added' - Checklist item added
'task:checklist:updated' - Checklist item updated

// Dependency events
'task:dependency:added' - Dependency added
'task:dependency:removed' - Dependency removed

// Recurring events
'task:recurring:created' - Recurring task instance created

// Bulk events
'tasks:bulk:updated' - Multiple tasks updated
```

## Security & Permissions

### Authentication
All task endpoints require JWT authentication via `authenticateToken` middleware.

### Authorization
- **Root/Super Admin** - Full access to all tasks
- **Regular Users** - Access to tasks in assigned projects or directly assigned tasks
- **Task Creators** - Can edit/delete their created tasks
- **Project Members** - Can view tasks in their projects

### Validation
- Object ID validation for all ID parameters
- Required field validation
- Status and priority enum validation
- File upload size limits (10MB)
- Rate limiting (2000 requests per 15 minutes)

## Performance Optimizations

### Database Indexes
```javascript
- { title: 'text', description: 'text' } // Full-text search
- { 'tags.name': 1 } // Tag filtering
- { dueDate: 1, status: 1 } // Due date queries
- { assignedTo: 1, status: 1 } // User task queries
- { project: 1, status: 1 } // Project task queries
```

### Caching
- Task statistics cached for 5 minutes
- Search results cached based on query parameters

### Pagination
- Default limit: 20 tasks per page
- Maximum limit: 100 tasks per page

## Automated Jobs

### Cron Jobs
- **Recurring Tasks** - Daily at midnight (0 0 * * *)
- **Task Reminders** - Every hour
- **Notification Cleanup** - Daily at 2 AM

## Error Handling

All endpoints return consistent error responses:
```json
{
  "success": false,
  "message": "Error description",
  "error": "Error details"
}
```

## Testing

### Health Check
```bash
curl http://localhost:5000/api/health
```

### Create Task
```bash
curl -X POST http://localhost:5000/api/tasks \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Task",
    "description": "Task description",
    "project": "PROJECT_ID",
    "assignedTo": "EMPLOYEE_ID",
    "assignedBy": "EMPLOYEE_ID",
    "priority": "high",
    "dueDate": "2024-12-31"
  }'
```

## Migration Notes

### From Previous Version
No breaking changes. All existing task data is compatible.

### New Features Added
1. Task dependencies with circular detection
2. Recurring task automation
3. Advanced search with saved searches
4. Task templates
5. Custom fields
6. Dependency graph visualization
7. Critical path calculation
8. Blocked task detection

## Production Checklist

- ✅ All CRUD operations tested
- ✅ Real-time updates working
- ✅ File uploads functional
- ✅ Authentication & authorization implemented
- ✅ Input validation in place
- ✅ Error handling comprehensive
- ✅ Database indexes created
- ✅ Cron jobs scheduled
- ✅ Socket.IO events configured
- ✅ API documentation complete
- ✅ Frontend components integrated
- ✅ Search functionality operational
- ✅ Dependencies system working
- ✅ Recurring tasks automated
- ✅ Analytics dashboard functional

## Support & Maintenance

### Monitoring
- Check task creation/update rates
- Monitor recurring task processing
- Track search performance
- Review error logs

### Backup
- Task data backed up with main database
- Attachments stored in `/uploads` directory
- Regular database snapshots recommended

## Version
**Current Version:** 2.0.0 (Production Ready)
**Last Updated:** 2024
**Status:** ✅ Production Ready
