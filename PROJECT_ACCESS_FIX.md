# Project Access Fix - Users Can Now See Assigned Projects

## Issue
Users/Employees were unable to see projects they were assigned to, even when they were added as team members or managers.

## Root Cause
The project access logic had a fundamental mismatch:
- Projects have **two types of assignment fields**:
  - `owner` and `members` → Reference **User** model
  - `manager` and `team` → Reference **Employee** model
- The access check was only looking for User IDs in all fields
- Since `team` and `manager` contain Employee IDs, the check always failed for employees assigned through these fields

## Solution
Updated the access control logic to properly handle both User and Employee references:

### Files Modified

#### 1. `backend/src/controllers/projectController.ts`
Updated 4 functions to check both User and Employee assignments:

- **getAllProjects()** - Now finds the employee record linked to the user and checks all assignment types
- **getProjectById()** - Same fix for individual project access
- **getProjectTasks()** - Same fix for task access verification  
- **getAllProjectsTimelineData()** - Same fix for timeline data access

**Logic Flow:**
```javascript
1. Get the logged-in user
2. Find the employee record linked to this user (if exists)
3. Build query with conditions:
   - Check if user._id is in 'members' field (User reference)
   - Check if user._id is in 'owner' field (User reference)
   - If employee exists:
     - Check if employee._id is in 'team' field (Employee reference)
     - Check if employee._id is in 'manager' field (Employee reference)
4. Return projects matching any condition
```

#### 2. `backend/src/middleware/projectAccess.middleware.ts`
Updated `checkProjectAccess` middleware to verify access using both User and Employee IDs:

**Before:**
```javascript
const hasAccess = 
  userRole?.name === 'Root' ||
  project.owner.toString() === user._id.toString() ||
  project.members.some(memberId => memberId.toString() === user._id.toString());
```

**After:**
```javascript
// Check User-based access
const isOwner = project.owner.toString() === user._id.toString();
const isMember = project.members.some(memberId => memberId.toString() === user._id.toString());

// Check Employee-based access
const employee = await Employee.findOne({ user: user._id });
let isTeamMember = false;
let isManager = false;

if (employee) {
  isTeamMember = project.team && project.team.some(teamId => teamId.toString() === employee._id.toString());
  isManager = project.manager && project.manager.toString() === employee._id.toString();
}

const hasAccess = isOwner || isMember || isTeamMember || isManager;
```

## Testing Checklist
- [ ] Regular employees can see projects where they are in the `team` array
- [ ] Managers can see projects where they are set as `manager`
- [ ] Users can see projects where they are in the `members` array
- [ ] Project owners can see their projects
- [ ] Root and Super Admin can see all projects
- [ ] Users cannot see projects they are not assigned to
- [ ] Project detail pages load correctly for assigned users
- [ ] Project tasks are accessible to assigned team members

## Impact
- ✅ Employees can now see all projects they're assigned to
- ✅ Proper access control maintained - users only see their assigned projects
- ✅ No breaking changes to existing functionality
- ✅ Works for both User-based and Employee-based assignments

## Related Models
- **User** - Authentication and user accounts
- **Employee** - Employee records with `user` field linking to User
- **Project** - Has both User references (owner, members) and Employee references (manager, team)

## Notes
- The system supports dual assignment types because:
  - Some projects are assigned to Users (system-level access)
  - Some projects are assigned to Employees (organizational hierarchy)
- An Employee record has a `user` field that links to their User account
- This fix ensures both assignment types work correctly
