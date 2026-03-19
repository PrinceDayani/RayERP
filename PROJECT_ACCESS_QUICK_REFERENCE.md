# Project Access & Permissions - Quick Reference

## Who Can Access a Project?

A user can access a project if they meet **ANY** of these conditions:

| Access Type | Condition | Example |
|------------|-----------|---------|
| 🔴 **Root User** | Role name is "Root" | System administrator |
| 🟠 **View All Permission** | Has `projects.view_all` permission | Department head |
| 🟡 **Project Owner** | Created the project | User who clicked "Create Project" |
| 🟢 **Team Member** | In `project.team` array | Developer assigned to project |
| 🔵 **Project Manager** | In `project.managers` array | **ANY manager, not just first** |
| 🟣 **Assigned User** | Has ProjectPermission record | User with specific permissions |

## Multiple Managers Support

### Backend
```typescript
// ✅ CORRECT - Checks all managers
isManager = project.managers.some(managerId => 
  managerId.toString() === employee._id.toString()
);

// ❌ WRONG - Only checks first manager
isManager = project.managers[0].toString() === employee._id.toString();
```

### Frontend
```typescript
// ✅ CORRECT - Multiple manager selection
const [selectedManagers, setSelectedManagers] = useState<string[]>([]);

// Checkbox list for multiple selection
{managerOptions.map((employee) => (
  <input
    type="checkbox"
    checked={selectedManagers.includes(employee._id)}
    onChange={() => toggleManager(employee._id)}
  />
))}

// ❌ WRONG - Single manager dropdown
<Select value={formData.manager} onValueChange={setManager}>
  <SelectItem value={employee._id}>...</SelectItem>
</Select>
```

## ProjectPermission Model

### Schema
```typescript
{
  project: ObjectId,      // Reference to Project
  employee: ObjectId,     // Reference to Employee
  permissions: string[],  // Array of permission strings
  createdBy: ObjectId,    // Who granted the permissions
  createdAt: Date,
  updatedAt: Date
}
```

### Example Permissions
```typescript
const permissions = [
  'projects.view',        // Can view project
  'projects.edit',        // Can edit project
  'tasks.create',         // Can create tasks
  'tasks.edit',           // Can edit tasks
  'tasks.delete',         // Can delete tasks
  'budget.view',          // Can view budget
  'budget.edit',          // Can edit budget
  'files.upload',         // Can upload files
  'files.download',       // Can download files
  'team.manage',          // Can manage team members
];
```

### Creating ProjectPermission
```typescript
// Backend - When creating project
if (req.body.projectPermissions) {
  const permissionPromises = Object.entries(req.body.projectPermissions)
    .map(([employeeId, permissions]) => {
      return ProjectPermission.create({
        project: project._id,
        employee: employeeId,
        permissions: permissions as string[],
        createdBy: user._id
      });
    });
  await Promise.all(permissionPromises);
}
```

## Middleware Flow

### 1. checkProjectAccess Middleware
```typescript
// Used for: General project access
// Route: GET /api/projects/:id

// Checks in order:
1. Root user or projects.view_all → Allow
2. Project owner → Allow
3. Team member (User ID in team array) → Allow
4. Team member (Employee ID in team array) → Allow
5. Manager (ANY in managers array) → Allow
6. Has ProjectPermission record → Allow
7. Otherwise → Deny (403)
```

### 2. requireProjectPermission Middleware
```typescript
// Used for: Specific permission checks
// Route: PUT /api/projects/:id (with projects.edit permission)

// Checks in order:
1. Root user or projects.manage_all → Allow
2. Project owner → Allow
3. Manager (if managerOverride=true) → Allow
4. Has specific ProjectPermission → Allow
5. Has role permission → Allow
6. Otherwise → Deny (403)
```

## API Examples

### Get All Projects
```bash
GET /api/projects
Authorization: Bearer <token>

# Returns:
# - All projects for Root users
# - Assigned projects for regular users
# - Projects where user is owner/team/manager/has permissions
```

### Get Project by ID
```bash
GET /api/projects/:id
Authorization: Bearer <token>

# Returns:
# - Full project details if user has access
# - 403 if user doesn't have access
# - 404 if project doesn't exist
```

### Create Project with Permissions
```bash
POST /api/projects
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "New Project",
  "description": "Project description",
  "startDate": "2024-01-01",
  "endDate": "2024-12-31",
  "managers": ["employee1_id", "employee2_id"],  // Multiple managers
  "team": ["employee3_id", "employee4_id"],
  "projectPermissions": {
    "employee5_id": ["projects.view", "tasks.create"],
    "employee6_id": ["projects.view", "budget.view"]
  }
}
```

### Update Project
```bash
PUT /api/projects/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "managers": ["employee1_id", "employee2_id", "employee3_id"],  // Add/remove managers
  "team": ["employee4_id", "employee5_id"]
}
```

## Frontend Components

### ProjectForm - Multiple Managers
```tsx
// State
const [selectedManagers, setSelectedManagers] = useState<string[]>([]);

// Render
<div className="space-y-2">
  <Label>Project Managers</Label>
  <div className="border rounded-md p-3 max-h-40 overflow-y-auto">
    {managerOptions.map((employee) => (
      <div key={employee._id} className="flex items-center space-x-2">
        <input
          type="checkbox"
          checked={selectedManagers.includes(employee._id)}
          onChange={() => toggleManager(employee._id)}
        />
        <Label>{employee.firstName} {employee.lastName}</Label>
      </div>
    ))}
  </div>
  {selectedManagers.length > 0 && (
    <p className="text-sm text-muted-foreground">
      {selectedManagers.length} manager(s) selected
    </p>
  )}
</div>

// Submit
const projectData = {
  // ...
  managers: selectedManagers,  // Array of manager IDs
};
```

### ProjectPermissionsManager
```tsx
// Used in ProjectForm when team members are selected
{selectedTeam.length > 0 && (
  <ProjectPermissionsManager
    projectId={projectId}
    employees={employees}
    selectedTeam={selectedTeam}
    onPermissionsChange={setProjectPermissions}
    initialPermissions={projectPermissions}
  />
)}
```

## Common Issues & Solutions

### Issue: User can't see project
**Check:**
1. Is user in `project.managers` array?
2. Is user in `project.team` array?
3. Does user have ProjectPermission record?
4. Is user the project owner?
5. Does user have `projects.view_all` permission?

**Solution:**
- Add user to managers or team array, OR
- Create ProjectPermission record for user

### Issue: Only first manager can access
**Cause:** Using `project.managers[0]` instead of `project.managers.some()`

**Solution:** Already fixed in middleware

### Issue: Frontend shows single manager dropdown
**Cause:** Old ProjectForm code

**Solution:** Already updated to checkbox list

## Testing Checklist

- [ ] Root user can see all projects
- [ ] User with `projects.view_all` can see all projects
- [ ] Project owner can access their project
- [ ] Team members can access project
- [ ] All managers (not just first) can access project
- [ ] Users with ProjectPermission can access project
- [ ] Users without access get 403 error
- [ ] Frontend allows selecting multiple managers
- [ ] Creating project with multiple managers works
- [ ] Editing project to add/remove managers works
- [ ] ProjectPermission records are created correctly

## Related Files

### Backend
- `backend/src/middleware/projectAccess.middleware.ts` - General access control
- `backend/src/middleware/projectPermission.middleware.ts` - Permission-based access
- `backend/src/models/Project.ts` - Project schema
- `backend/src/models/ProjectPermission.ts` - Permission schema
- `backend/src/controllers/projectController.ts` - Project CRUD operations

### Frontend
- `frontend/src/components/projects/ProjectForm.tsx` - Project creation/editing
- `frontend/src/components/projects/ProjectPermissionsManager.tsx` - Permission management
- `frontend/src/lib/api/projectsAPI.ts` - API client
- `frontend/src/app/dashboard/projects/page.tsx` - Project list page

## Quick Commands

```bash
# Backend - Check project access logs
cd backend
npm run dev
# Look for: "=== GET ALL PROJECTS REQUEST ===" in console

# Frontend - Test project creation
cd frontend
npm run dev
# Navigate to: http://localhost:3000/dashboard/projects/create

# Database - Check ProjectPermission records
mongosh
use rayerp
db.projectpermissions.find().pretty()

# Database - Check project managers
db.projects.find({}, { name: 1, managers: 1 }).pretty()
```

---

**Last Updated:** 2024
**Version:** 2.0.1
**Status:** ✅ Production Ready
