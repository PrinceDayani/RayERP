# Access Control Implementation - Project & Task Visibility

## Overview
Implemented role-based access control to restrict users from seeing projects and tasks they are not assigned to.

## Changes Made

### 1. Project Controller (`projectController.ts`)

#### `getAllProjects()`
- **Root & Super Admin**: Can see all projects
- **Other Users**: Only see projects where they are:
  - Listed as a member (`members` array)
  - Listed as the owner (`owner` field)

#### `getProjectById()`
- Added access verification before returning project details
- Returns `403 Forbidden` if user is not assigned to the project
- Root & Super Admin bypass this check

#### `getProjectTasks()`
- Verifies user has access to the project before showing tasks
- Returns `403 Forbidden` if user is not a project member or owner

#### `getAllProjectsTimelineData()`
- Filters projects based on user assignment
- Only shows tasks from projects the user has access to

### 2. Task Controller (`taskController.ts`)

#### `getAllTasks()`
- **Root & Super Admin**: Can see all tasks
- **Other Users**: Only see tasks where:
  - They are assigned to the task (`assignedTo` field)
  - The task belongs to a project they're assigned to

#### `getTaskById()`
- Verifies user has access before returning task details
- Checks if user is:
  - Directly assigned to the task, OR
  - Has access to the project the task belongs to
- Returns `403 Forbidden` if neither condition is met

### 3. Employee Controller (`employeeController.ts`)

#### `getEmployeeTasks()`
- Non-admin users can only view their own tasks
- Returns `403 Forbidden` if trying to view another employee's tasks

#### `getEmployeeTaskStats()`
- Non-admin users can only view their own statistics
- Returns `403 Forbidden` if trying to view another employee's stats

## Access Control Matrix

| Role | Projects | Tasks | Employee Tasks |
|------|----------|-------|----------------|
| **Root** | All projects | All tasks | All employees |
| **Super Admin** | All projects | All tasks | All employees |
| **Admin/Manager** | Assigned projects only | Tasks in assigned projects + directly assigned tasks | Own tasks only |
| **Employee/Normal** | Assigned projects only | Tasks in assigned projects + directly assigned tasks | Own tasks only |

## Security Features

1. **Authentication Required**: All endpoints verify user authentication
2. **Role-Based Access**: Different access levels based on user role
3. **Ownership Verification**: Users can only access resources they own or are assigned to
4. **Project Membership**: Access to tasks is tied to project membership
5. **Employee Linking**: User accounts are linked to employee records for task assignment

## API Response Codes

- `200 OK`: Successful request with data
- `401 Unauthorized`: Authentication required or token invalid
- `403 Forbidden`: User doesn't have permission to access the resource
- `404 Not Found`: Resource doesn't exist

## Testing Recommendations

1. **Test as Root User**: Verify all projects and tasks are visible
2. **Test as Regular Employee**: 
   - Should only see assigned projects
   - Should only see tasks from assigned projects
   - Should not see other employees' tasks
3. **Test Project Access**:
   - Try accessing a project not assigned to the user
   - Verify 403 error is returned
4. **Test Task Access**:
   - Try accessing a task from an unassigned project
   - Verify 403 error is returned

## Implementation Notes

- User-to-Employee linking is done via the `user` field in Employee model
- Project membership is tracked in the `members` array (User IDs)
- Task assignment is tracked via `assignedTo` field (Employee ID)
- Role names are case-sensitive: 'Root', 'Super Admin', etc.

## Future Enhancements

Consider implementing:
1. Department-based access control
2. Project-level permissions (read-only, contributor, admin)
3. Task watchers with view-only access
4. Audit logging for access attempts
5. Fine-grained permissions per action (view, edit, delete)
