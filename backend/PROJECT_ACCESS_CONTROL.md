# Project Access Control System

## Overview
This system implements secure project access control where only authorized users can view or access specific projects based on their role and project membership.

## User Roles
- **root**: Complete administrative control, can view and manage all projects
- **super_admin**: Can create projects, manage their own projects, and assign/remove members
- **member**: Can only view and interact with projects they are assigned to

## Access Rules

### Root User
- Automatic global access to all projects
- Can perform all operations without restrictions
- Does not need to be manually added to project members

### Super Admin
- Can create new projects (becomes owner automatically)
- Can view and manage projects they own
- Can add/remove members from their projects
- Can view projects they are assigned to as members

### Members
- Can only view projects they are explicitly assigned to
- Cannot see or access other projects
- Cannot create projects or manage members

## Database Schema Changes

### User Model
```typescript
export enum UserRole {
  ROOT = 'root',
  SUPER_ADMIN = 'super_admin',
  MEMBER = 'member'
}
```

### Project Model
```typescript
interface IProject {
  // ... existing fields
  owner: mongoose.Types.ObjectId;    // Project owner (super_admin who created it)
  members: mongoose.Types.ObjectId[]; // Array of assigned member IDs
}
```

## API Endpoints

### Core Project Routes
- `GET /api/projects` - Returns projects accessible to current user
- `GET /api/projects/:id` - Get specific project (access controlled)
- `POST /api/projects` - Create project (root/super_admin only)
- `PUT /api/projects/:id` - Update project (owner/root only)
- `DELETE /api/projects/:id` - Delete project (root/super_admin only)

### Member Management Routes
- `GET /api/projects/:id/members` - Get project members
- `POST /api/projects/:id/members` - Add member (root/super_admin only)
- `DELETE /api/projects/:id/members/:memberId` - Remove member (root/super_admin only)

## Middleware

### Authentication Middleware
- `protect`: Verifies JWT token and attaches user to request

### Project Access Middleware
- `checkProjectAccess`: Verifies user has access to specific project
- `checkProjectManagementAccess`: Verifies user can manage projects (root/super_admin only)

## Security Features

1. **Strict Access Control**: Users can only access projects they have permission for
2. **Role-based Permissions**: Different capabilities based on user role
3. **403 Access Denied**: Unauthorized access attempts return proper error
4. **Immediate Revocation**: Removing a member immediately revokes their access
5. **Centralized Logic**: Reusable middleware prevents code duplication

## Usage Examples

### Creating a Project (Super Admin)
```javascript
POST /api/projects
Authorization: Bearer <token>
{
  "name": "New Project",
  "description": "Project description",
  "startDate": "2024-01-01",
  "endDate": "2024-12-31",
  "manager": "employeeId",
  "members": ["userId1", "userId2"]
}
```

### Adding a Member (Root/Super Admin)
```javascript
POST /api/projects/:id/members
Authorization: Bearer <token>
{
  "memberId": "userId"
}
```

### Removing a Member (Root/Super Admin)
```javascript
DELETE /api/projects/:id/members/:memberId
Authorization: Bearer <token>
```

## Error Responses

- `401 Unauthorized`: Missing or invalid authentication token
- `403 Access Denied`: User lacks permission for the requested operation
- `404 Not Found`: Project does not exist or user has no access
- `400 Bad Request`: Invalid request data

## Implementation Notes

1. All project routes require authentication
2. Access control is enforced at the middleware level
3. Project queries are filtered based on user role and permissions
4. Owner and members fields are populated in responses
5. Timeline events track access control changes