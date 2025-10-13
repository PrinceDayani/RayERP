# Task Management System

## Overview
The Task Management system allows users to create, assign, track, and manage tasks within projects. It includes both administrative task management and personal task views.

## Features

### 1. Task Management (Admin/Manager View)
- **Location**: `/dashboard/projects/tasks`
- **Features**:
  - Create new tasks with project assignment
  - Assign tasks to employees
  - Set priority levels (Low, Medium, High, Critical)
  - Set due dates and estimated hours
  - Track task status (To Do, In Progress, Review, Completed)
  - Real-time updates via WebSocket
  - Search and filter tasks
  - Kanban-style board view

### 2. My Tasks (Personal View)
- **Location**: `/dashboard/projects/my-tasks`
- **Features**:
  - View only tasks assigned to current user
  - Update task status
  - Filter by status and priority
  - Search personal tasks
  - Quick task statistics

### 3. Task Summary Component
- **Component**: `TaskSummary.tsx`
- **Usage**: Can be embedded in dashboard
- **Features**:
  - Shows task statistics for current user
  - Displays overdue task alerts
  - Lists upcoming tasks
  - Quick link to full task view

## API Endpoints

### Tasks API (`/api/tasks`)
- `GET /api/tasks` - Get all tasks
- `POST /api/tasks` - Create new task
- `GET /api/tasks/:id` - Get task by ID
- `PUT /api/tasks/:id` - Update task
- `DELETE /api/tasks/:id` - Delete task
- `PATCH /api/tasks/:id/status` - Update task status
- `POST /api/tasks/:id/comments` - Add comment to task
- `GET /api/tasks/:id/timeline` - Get task timeline

## Data Models

### Task Interface
```typescript
interface Task {
  _id: string;
  title: string;
  description: string;
  status: 'todo' | 'in-progress' | 'review' | 'completed';
  priority: 'low' | 'medium' | 'high' | 'critical';
  project: {
    _id: string;
    name: string;
  };
  assignedTo: {
    _id: string;
    firstName: string;
    lastName: string;
  };
  assignedBy: {
    _id: string;
    firstName: string;
    lastName: string;
  };
  dueDate: string;
  estimatedHours?: number;
  actualHours?: number;
  tags?: string[];
  comments: Array<{
    user: {
      _id: string;
      firstName: string;
      lastName: string;
    };
    comment: string;
    createdAt: string;
  }>;
  createdAt: string;
  updatedAt: string;
}
```

## Navigation
Tasks are accessible through the Project Management section in the sidebar:
- **Projects** → **All Projects**
- **Projects** → **Task Management** (Admin view)
- **Projects** → **My Tasks** (Personal view)
- **Projects** → **Reports**

## Real-time Features
- Task creation, updates, and deletions are broadcast via WebSocket
- Status changes are immediately reflected across all connected clients
- Project statistics are updated in real-time

## Permissions
- **Task Management**: Available to all users with project access
- **My Tasks**: Available to all users (shows only assigned tasks)
- **Task Creation**: Requires project assignment permissions
- **Task Assignment**: Can assign to any employee in the system

## Usage Examples

### Creating a Task
1. Navigate to `/dashboard/projects/tasks`
2. Click "New Task" button
3. Fill in required fields:
   - Title
   - Description
   - Project selection
   - Employee assignment
   - Priority level
   - Due date (optional)
   - Estimated hours (optional)
4. Click "Create Task"

### Updating Task Status
1. In either Task Management or My Tasks view
2. Find the task card
3. Use the status dropdown to change status
4. Status is automatically saved and broadcast

### Viewing Personal Tasks
1. Navigate to `/dashboard/projects/my-tasks`
2. View tasks organized by status columns
3. Use search and filters to find specific tasks
4. Update status directly from the task cards

## Technical Implementation
- **Frontend**: React with TypeScript
- **Backend**: Express.js with MongoDB
- **Real-time**: Socket.io for WebSocket communication
- **UI Components**: Shadcn/ui components
- **State Management**: React hooks with context
- **API Layer**: Axios with centralized API configuration