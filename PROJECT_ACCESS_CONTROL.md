# Project-Level Access Control

## Overview

The system implements **project-level access control** where users only see projects they are **explicitly assigned to**, not all department projects.

## How It Works

### Access Rules

Users can access a project if they are:
1. **Owner** - Created the project
2. **Member** - Added to `members` array
3. **Team Member** - Added to `team` array
4. **Manager** - Assigned as project manager
5. **Root/Super Admin** - Can see all projects

### Department vs Project Access

```
Department: Engineering
├── Project A (User assigned) ✅ CAN SEE
├── Project B (User NOT assigned) ❌ CANNOT SEE
└── Project C (User assigned) ✅ CAN SEE
```

**Key Point:** Being in a department does NOT automatically grant access to all department projects.

## Implementation

### Backend Filter (projectController.ts)

```typescript
// Non-admin users only see assigned projects
query = { 
  $or: [
    { members: user._id },      // Explicit member
    { owner: user._id },        // Project owner
    { team: user._id },         // Team member
    { manager: user._id }       // Project manager
  ]
};
```

### Access Check

```typescript
const isMember = project.members.includes(user._id);
const isOwner = project.owner === user._id;
const isTeamMember = project.team.includes(user._id);
const isManager = project.manager === user._id;

if (!isMember && !isOwner && !isTeamMember && !isManager) {
  return 403; // Access Denied
}
```

## User Scenarios

### Scenario 1: Department Member
**User:** John (Engineering Department)
**Projects in Engineering:**
- Project A: John is in `team` ✅ Can see
- Project B: John not assigned ❌ Cannot see
- Project C: John is `manager` ✅ Can see

**Result:** John sees only Projects A and C

### Scenario 2: Project Manager
**User:** Sarah (Manager of Project X)
**Access:**
- Project X ✅ Can see (is manager)
- Other projects ❌ Cannot see (not assigned)

### Scenario 3: Root/Admin
**User:** Admin (Root role)
**Access:**
- All projects ✅ Can see everything

## Permission Inheritance

### Combined System

```
User Access = 
  Role Permissions 
  + Department Permissions 
  + Project Assignment
```

### Example

**John's Access:**
1. **Role**: `EMPLOYEE` → Basic permissions
2. **Department**: `Engineering` → `projects.view`, `tasks.create`
3. **Project Assignment**: Assigned to Project A only

**Result:**
- ✅ Has `projects.view` permission (from department)
- ✅ Can see Project A (explicitly assigned)
- ❌ Cannot see Project B (not assigned, even though in same department)

## API Endpoints

### Get All Projects
```http
GET /api/projects
Authorization: Bearer <token>
```

**Returns:** Only projects where user is owner, member, team member, or manager

### Get Project by ID
```http
GET /api/projects/:id
Authorization: Bearer <token>
```

**Returns:** 
- Project details if user has access
- 403 Forbidden if user not assigned

### Get Project Tasks
```http
GET /api/projects/:id/tasks
Authorization: Bearer <token>
```

**Returns:**
- Tasks if user has project access
- 403 Forbidden if user not assigned

## Assigning Users to Projects

### When Creating Project

```json
{
  "name": "Project A",
  "owner": "user_id",
  "manager": "manager_id",
  "team": ["user1_id", "user2_id"],
  "members": ["user3_id", "user4_id"],
  "departments": ["dept_id"]
}
```

### Adding Members Later

```http
POST /api/projects/:id/members
{
  "memberId": "user_id"
}
```

## Benefits

✅ **Fine-grained Control** - Assign users to specific projects
✅ **Security** - Users can't see projects they're not part of
✅ **Privacy** - Department members don't see all department projects
✅ **Flexibility** - Easy to add/remove project access
✅ **Clear Boundaries** - Explicit assignment required

## Best Practices

1. **Always assign project members** when creating projects
2. **Use team array** for core project team
3. **Use members array** for stakeholders/observers
4. **Set manager** for project lead
5. **Review access** regularly

## Troubleshooting

### User Can't See Project

**Check:**
1. Is user in `members` array?
2. Is user in `team` array?
3. Is user the `manager`?
4. Is user the `owner`?
5. Does user have Root/Admin role?

### User Sees Too Many Projects

**Check:**
1. User might be Root/Super Admin (sees all)
2. User might be assigned to multiple projects

## Summary

**Department membership ≠ Project access**

Users must be **explicitly assigned** to projects through:
- Owner
- Members
- Team
- Manager

This ensures **project-level security** and **privacy** within departments.

## Task-Level Access Control

### Task Access Rules

Users can access a task if they are:
1. **Assigned To** - Task is assigned to them
2. **Assigned By** - They created/assigned the task
3. **Project Member** - They have access to the task's project
4. **Root/Super Admin** - Can see all tasks

### Task Filtering

```typescript
// Users only see tasks where:
tasks = {
  $or: [
    { project: { $in: userProjectIds } },  // From accessible projects
    { assignedTo: userEmployeeId },        // Directly assigned
    { assignedBy: userEmployeeId }         // Created by user
  ]
}
```

### Example Scenario

**John (Engineering Department):**
- Assigned to Project A
- NOT assigned to Project B

**Tasks:**
- Task 1 (Project A) ✅ Can see (has project access)
- Task 2 (Project B, assigned to John) ✅ Can see (directly assigned)
- Task 3 (Project B, NOT assigned to John) ❌ Cannot see
- Task 4 (Project A, created by John) ✅ Can see (task creator)

### Benefits

✅ **Task Privacy** - Users only see relevant tasks
✅ **Project-based** - Task access follows project access
✅ **Direct Assignment** - Can see tasks assigned to you
✅ **Creator Access** - Can see tasks you created

---

**Last Updated:** 2024
