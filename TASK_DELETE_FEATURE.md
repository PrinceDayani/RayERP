# Task Delete Feature Documentation

## Overview
The delete task feature allows users to remove tasks from the system. This feature is implemented across both backend and frontend with proper confirmation dialogs and real-time updates.

## Backend Implementation

### API Endpoint
- **Route**: `DELETE /api/tasks/:id`
- **Controller**: `deleteTask` in `backend/src/controllers/taskController.ts`
- **Authentication**: Required (JWT token)
- **Validation**: ObjectId validation middleware

### Features
- Deletes task from database
- Creates timeline event for audit trail
- Emits real-time socket event (`task:deleted`)
- Updates project statistics
- Logs activity for tracking
- Returns success message

### Response
```json
{
  "message": "Task deleted successfully"
}
```

## Frontend Implementation

### API Client
**File**: `frontend/src/lib/api/tasksAPI.ts`
```typescript
delete: async (id: string) => {
  const response = await api.delete(`/tasks/${id}`);
  return response.data;
}
```

### Context Integration
**File**: `frontend/src/contexts/TaskContext.tsx`
- `deleteTask(id: string)`: Deletes single task
- `bulkDelete()`: Deletes multiple selected tasks
- Real-time socket listener for `task:deleted` event
- Automatic state update on deletion

### UI Components

#### 1. TaskBoard Component
**File**: `frontend/src/components/tasks/TaskBoard.tsx`
- Delete button with Trash2 icon
- Confirmation dialog before deletion
- Loading state during deletion
- Integrated in main task management page

#### 2. TaskCard Component
**File**: `frontend/src/components/tasks/TaskCard.tsx`
- Optional `onDelete` prop
- Delete button with Trash2 icon
- Confirmation dialog
- Can be used in any task list view

#### 3. TaskList Component
**File**: `frontend/src/components/tasks/TaskList.tsx`
- Passes `onDelete` prop to TaskCard
- Supports delete functionality in list view

#### 4. Task Details Page
**File**: `frontend/src/app/dashboard/tasks/[id]/page.tsx`
- Delete button in header
- Confirmation dialog
- Redirects to tasks list after deletion
- Error handling with user feedback

## Usage Examples

### Using TaskContext
```typescript
import { useTaskContext } from '@/contexts/TaskContext';

function MyComponent() {
  const { actions } = useTaskContext();
  
  const handleDelete = async (taskId: string) => {
    if (confirm('Are you sure?')) {
      await actions.deleteTask(taskId);
    }
  };
  
  return <button onClick={() => handleDelete(taskId)}>Delete</button>;
}
```

### Using TaskCard with Delete
```typescript
import TaskCard from '@/components/tasks/TaskCard';
import { useTaskContext } from '@/contexts/TaskContext';

function MyTaskList() {
  const { actions } = useTaskContext();
  
  return (
    <TaskCard
      task={task}
      onView={(id) => router.push(`/tasks/${id}`)}
      onEdit={(id) => openEditDialog(id)}
      onDelete={(id) => actions.deleteTask(id)}
    />
  );
}
```

### Bulk Delete
```typescript
import { useTaskContext } from '@/contexts/TaskContext';

function BulkActions() {
  const { state, actions } = useTaskContext();
  
  const handleBulkDelete = async () => {
    if (confirm(`Delete ${state.selectedTasks.length} tasks?`)) {
      await actions.bulkDelete();
    }
  };
  
  return (
    <button 
      onClick={handleBulkDelete}
      disabled={state.selectedTasks.length === 0}
    >
      Delete Selected ({state.selectedTasks.length})
    </button>
  );
}
```

## Security & Permissions

### Backend
- JWT authentication required
- User must have access to the task's project
- Only authorized users can delete tasks
- Activity logging for audit trail

### Frontend
- Confirmation dialog prevents accidental deletion
- Loading states prevent duplicate requests
- Error handling with user feedback
- Real-time updates across all connected clients

## Real-Time Updates

When a task is deleted:
1. Backend emits `task:deleted` socket event
2. All connected clients receive the event
3. Task is removed from local state
4. UI updates automatically
5. Project statistics refresh

## Error Handling

### Backend Errors
- 404: Task not found
- 401: Authentication required
- 500: Server error

### Frontend Handling
- User-friendly error messages
- Console logging for debugging
- State rollback on failure
- Alert notifications

## Testing

### Manual Testing
1. Navigate to task management page
2. Click delete button on any task
3. Confirm deletion in dialog
4. Verify task is removed from list
5. Check task is deleted from database

### API Testing
```bash
curl -X DELETE http://localhost:5000/api/tasks/{taskId} \
  -H "Authorization: Bearer {token}"
```

## Best Practices

1. **Always confirm before deletion** - Use confirmation dialogs
2. **Handle errors gracefully** - Show user-friendly messages
3. **Update UI optimistically** - Remove from UI immediately
4. **Log activities** - Maintain audit trail
5. **Real-time sync** - Use socket events for multi-user scenarios

## Future Enhancements

- Soft delete with restore functionality
- Bulk delete with progress indicator
- Delete with cascade options (subtasks, attachments)
- Undo delete functionality
- Archive instead of delete option
- Permission-based delete restrictions

---

**Status**: ✅ Fully Implemented
**Version**: 2.0.0
**Last Updated**: 2024
