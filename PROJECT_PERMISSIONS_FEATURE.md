# Project-Specific Permissions Feature

## Overview
This feature allows you to set specific permissions for employees on individual projects, giving you granular control over what team members can do within each project.

## Features Implemented

### 1. Backend Components

#### ProjectPermission Model (`backend/src/models/ProjectPermission.ts`)
- Stores project-specific permissions for employees
- Links projects, employees, and their permissions
- Ensures unique employee-project combinations

#### Project Permission Controller (`backend/src/controllers/projectPermissionController.ts`)
- `getProjectPermissions` - Get all permissions for a project
- `setProjectPermissions` - Set/update permissions for an employee
- `removeProjectPermissions` - Remove permissions for an employee
- `getEmployeeProjectPermissions` - Get specific employee's permissions

#### Project Permission Middleware (`backend/src/middleware/projectPermission.middleware.ts`)
- `requireProjectPermission` - Check if user has specific project permission
- Supports manager override for project managers
- Falls back to role-based permissions

#### API Routes (`backend/src/routes/project.routes.ts`)
- `GET /api/projects/:id/permissions` - List project permissions
- `POST /api/projects/:id/permissions` - Set employee permissions
- `GET /api/projects/:id/permissions/:employeeId` - Get employee permissions
- `DELETE /api/projects/:id/permissions/:employeeId` - Remove permissions

### 2. Frontend Components

#### ProjectPermissionsManager (`frontend/src/components/projects/ProjectPermissionsManager.tsx`)
- Visual interface for managing project permissions
- Dropdown to select team members
- Permission selection with descriptions
- Real-time permission display and management

#### Updated ProjectForm (`frontend/src/components/projects/ProjectForm.tsx`)
- Integrated permissions manager
- Shows only when team members are selected
- Saves permissions during project creation

#### Project Detail Page (`frontend/src/app/dashboard/projects/[id]/page.tsx`)
- Added "Permissions" tab
- Shows current project permissions
- Allows editing permissions for existing projects

### 3. Available Permissions

The system includes 10 predefined permissions:

1. **projects.view** - View project details
2. **projects.edit** - Edit project information
3. **projects.manage_tasks** - Create, edit, and delete tasks
4. **projects.manage_files** - Upload, download, and delete files
5. **projects.manage_team** - Add/remove team members
6. **projects.view_budget** - View project budget information
7. **projects.manage_budget** - Modify project budget
8. **projects.view_reports** - Access project reports
9. **projects.manage_milestones** - Create and update milestones
10. **projects.manage_risks** - Manage project risks

## How It Works

### 1. During Project Creation
1. Select team members in the project form
2. The permissions manager appears automatically
3. Choose employees and assign specific permissions
4. Permissions are saved when the project is created

### 2. For Existing Projects
1. Go to project details page
2. Click on the "Permissions" tab
3. Add/modify/remove permissions for team members
4. Changes are saved immediately

### 3. Permission Hierarchy
1. **Root users** - Always have full access
2. **Project owners** - Always have full access
3. **Project managers** - Have full access (with manager override)
4. **Team members** - Use project-specific permissions
5. **Other users** - Use role-based permissions

## Usage Examples

### Setting Permissions During Project Creation
```typescript
// In ProjectForm component
const projectData = {
  name: "New Project",
  team: ["employee1", "employee2"],
  projectPermissions: {
    "employee1": ["projects.view", "projects.manage_tasks"],
    "employee2": ["projects.view", "projects.view_budget"]
  }
};
```

### Checking Permissions in Middleware
```typescript
// Require specific permission for an action
router.put('/:id/tasks', 
  requireProjectPermission('projects.manage_tasks'),
  updateProjectTask
);

// Allow managers to override permission check
router.post('/:id/members',
  requireProjectPermission('projects.manage_team', true),
  addProjectMember
);
```

## Benefits

1. **Granular Control** - Set specific permissions per project
2. **Security** - Limit access to sensitive project information
3. **Flexibility** - Different permissions for different projects
4. **Audit Trail** - Track who has what permissions
5. **Easy Management** - Visual interface for permission management

## Security Features

- Permissions are validated on both frontend and backend
- Project owners and managers always have full access
- Fallback to role-based permissions for non-team members
- Audit logging for permission changes
- Input validation and sanitization

## Future Enhancements

1. **Permission Templates** - Predefined permission sets
2. **Time-based Permissions** - Temporary access grants
3. **Bulk Permission Management** - Apply permissions to multiple employees
4. **Permission Inheritance** - Inherit permissions from department/role
5. **Advanced Audit Trail** - Detailed permission change history

This feature provides enterprise-level access control for projects while maintaining ease of use and flexibility.