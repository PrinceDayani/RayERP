# Activity Feed System

## Overview
The Activity Feed system tracks and displays organizational activities in real-time, providing visibility to management and project teams about important events like file sharing, comments, and project updates.

## Features

### 1. **Role-Based Visibility**
- **Top Management (ROOT, SUPER_ADMIN, ADMIN, MANAGER)**: See all organizational activities
- **Project Team Members**: See activities from their assigned projects
- **Individual Users**: See their own activities and project-related updates

### 2. **Activity Types**
- **File Sharing**: When files are uploaded to projects
- **Comments**: When team members comment on tasks
- **Project Updates**: Project status changes
- **Task Assignments**: When tasks are assigned or completed
- **Employee Activities**: HR-related activities

### 3. **Visibility Levels**
- `all`: Visible to everyone
- `management`: Only visible to management roles
- `project_team`: Visible to project team members
- `private`: Only visible to the user who created it

## Backend Implementation

### Enhanced ActivityLog Model
```typescript
{
  user: ObjectId,              // User who performed the action
  userName: string,            // User's display name
  action: string,              // create, update, delete, share, comment, etc.
  resource: string,            // Description of the resource
  resourceType: string,        // project, task, file, comment, etc.
  resourceId: ObjectId,        // ID of the affected resource
  projectId: ObjectId,         // Associated project (if applicable)
  details: string,             // Detailed description
  metadata: Object,            // Additional context data
  visibility: string,          // all, management, project_team, private
  status: string,              // success, error, warning
  timestamp: Date              // When the activity occurred
}
```

### Activity Logger Utility
Location: `backend/src/utils/activityLogger.ts`

Usage example:
```typescript
import { logActivity } from '../utils/activityLogger';

await logActivity({
  userId: user.id,
  userName: user.name,
  action: 'share',
  resource: 'Project File',
  resourceType: 'file',
  resourceId: fileId,
  projectId: projectId,
  details: 'Shared file "document.pdf" in project',
  visibility: 'project_team',
  metadata: { fileName: 'document.pdf' }
});
```

### API Endpoints

#### Get Activities
```
GET /api/activity?page=1&limit=20&resourceType=file&projectId=xxx
```

**Query Parameters:**
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20)
- `resourceType`: Filter by type (project, task, file, comment, etc.)
- `projectId`: Filter by specific project

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "...",
      "userName": "John Doe",
      "action": "share",
      "resource": "File: report.pdf",
      "resourceType": "file",
      "details": "Shared file in Project Alpha",
      "projectId": { "_id": "...", "name": "Project Alpha" },
      "timestamp": "2024-01-15T10:30:00Z",
      "status": "success"
    }
  ],
  "pagination": {
    "total": 150,
    "page": 1,
    "limit": 20,
    "pages": 8
  }
}
```

#### Create Activity
```
POST /api/activity
```

**Request Body:**
```json
{
  "action": "comment",
  "resource": "Task: Implement feature",
  "resourceType": "comment",
  "resourceId": "task_id",
  "projectId": "project_id",
  "details": "Added comment on task",
  "visibility": "project_team",
  "metadata": { "comment": "Great progress!" }
}
```

## Frontend Implementation

### Activity Feed Page
Location: `frontend/src/app/dashboard/activity/page.tsx`

**Features:**
- Real-time activity stream
- Filter by activity type
- Pagination support
- Time-ago formatting
- Color-coded activity icons
- Project badges
- Status indicators

**Access:** `/dashboard/activity`

### UI Components
- Activity cards with icons
- Filter dropdown (All, Projects, Tasks, Files, Comments, Employees)
- Pagination controls
- Loading states
- Empty states

## Integration Points

### 1. File Sharing
When a file is uploaded to a project:
```typescript
// In projectFileController.ts
await logActivity({
  userId: userId,
  userName: user.name,
  action: 'share',
  resource: `File: ${fileName}`,
  resourceType: 'file',
  projectId: projectId,
  details: `Shared file "${fileName}" in project`,
  visibility: 'project_team'
});
```

### 2. Task Comments
When a comment is added to a task:
```typescript
// In taskController.ts
await logActivity({
  userId: userId,
  userName: userName,
  action: 'comment',
  resource: `Task: ${taskTitle}`,
  resourceType: 'comment',
  projectId: task.project._id,
  details: `Commented on task "${taskTitle}"`,
  visibility: 'project_team'
});
```

### 3. Project Updates
When project status changes:
```typescript
await logActivity({
  userId: userId,
  userName: userName,
  action: 'update',
  resource: `Project: ${projectName}`,
  resourceType: 'project',
  resourceId: projectId,
  details: `Changed project status to ${newStatus}`,
  visibility: 'management'
});
```

## Usage Examples

### For Top Management
Management users will see:
- All file shares across all projects
- All comments and updates
- Employee activities
- Budget changes
- System-wide events

### For Project Team Members
Team members will see:
- File shares in their projects
- Comments on tasks they're involved in
- Project updates for their projects
- Task assignments

### For Regular Employees
Regular employees will see:
- Their own activities
- Activities in projects they're assigned to
- Public announcements

## Best Practices

1. **Always log important activities**: File shares, comments, status changes
2. **Use appropriate visibility levels**: Don't expose sensitive data unnecessarily
3. **Include meaningful details**: Help users understand what happened
4. **Add metadata**: Store additional context for future reference
5. **Keep it concise**: Activity descriptions should be brief but informative

## Future Enhancements

- [ ] Real-time updates via WebSocket
- [ ] Activity notifications
- [ ] Export activity logs
- [ ] Advanced filtering (date range, user, status)
- [ ] Activity analytics dashboard
- [ ] Bulk activity operations
- [ ] Activity search functionality
- [ ] Custom activity types per organization

## Security Considerations

- Activities are filtered based on user role and project access
- Sensitive information is not exposed in activity logs
- Only authorized users can view management-level activities
- Activity logs are immutable (no editing/deletion)
- IP addresses are logged for audit purposes

## Performance

- Indexed fields: timestamp, user, projectId, resourceType, visibility
- Pagination prevents large data loads
- Lean queries for better performance
- Caching can be implemented for frequently accessed activities

## Troubleshooting

### Activities not showing
1. Check user role and permissions
2. Verify project assignments
3. Check visibility settings
4. Ensure activities are being logged

### Performance issues
1. Add database indexes
2. Implement caching
3. Reduce page size
4. Archive old activities

## Related Documentation
- [Project Management](PROJECT_MANAGEMENT_IMPROVEMENTS.md)
- [Task Management](TASK_MANAGEMENT.md)
- [File Sharing System](FILE_SHARING_SYSTEM.md)
- [Notification System](NOTIFICATION_SYSTEM.md)
