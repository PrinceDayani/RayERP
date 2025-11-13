# Employee-User Relationship

## Overview
This document explains the relationship between Employee and User entities in RayERP.

## Key Rules

### 1. User Independence
- **Users can exist without being employees**
- Users can be created independently through the user management system
- Not all users need to be employees (e.g., external stakeholders, clients)

### 2. Employee Dependency
- **Every employee MUST have an associated user account**
- When creating an employee, a user account is automatically created
- The `user` field in Employee model is required
- Employees cannot exist without a valid user reference

## Implementation Details

### Employee Model
```typescript
user: { type: Schema.Types.ObjectId, ref: 'User', required: true }
```

- The `user` field is marked as required
- Pre-save and pre-update hooks validate user existence
- Prevents orphaned employee records

### Employee Creation Flow
1. Client sends employee data (firstName, lastName, email, etc.)
2. System generates employee ID (EMP0001, EMP0002, etc.)
3. **System automatically creates a user account** with:
   - Name: `${firstName} ${lastName}`
   - Email: employee's email
   - Password: employee ID (default)
   - Role: Normal
   - Status: active
4. Employee record is created with reference to the user
5. If employee creation fails, the user is automatically deleted (rollback)

### Employee Update
- Cannot remove or nullify the user reference
- Can update the user reference only if the new user exists
- Validates user existence before updating

### Employee Deletion
- Deletes the associated user account
- Ensures no orphaned user accounts remain

## Benefits

### Data Integrity
- Enforces referential integrity between employees and users
- Prevents inconsistent states
- Automatic cleanup on failures

### Simplified Management
- Automatic user creation reduces manual steps
- Consistent user setup for all employees
- Default credentials based on employee ID

### Security
- Every employee has login credentials
- Role-based access control through user accounts
- Audit trail through user activity

## API Behavior

### POST /api/employees
**Request:**
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john.doe@company.com",
  "phone": "+1-555-0100",
  "department": "IT",
  "position": "Developer",
  "salary": 75000,
  "hireDate": "2024-01-15"
}
```

**What Happens:**
1. Generates employee ID: `EMP0010`
2. Creates user account automatically
3. Creates employee record
4. Returns employee with user reference

**Response:**
```json
{
  "_id": "...",
  "employeeId": "EMP0010",
  "firstName": "John",
  "lastName": "Doe",
  "email": "john.doe@company.com",
  "user": "user_id_here",
  ...
}
```

### PUT /api/employees/:id
- Cannot set `user` to null or empty
- Validates user exists if updating user reference

### DELETE /api/employees/:id
- Deletes employee record
- Automatically deletes associated user account

## Error Handling

### User Creation Fails
```json
{
  "message": "Failed to create user",
  "error": "Email already exists"
}
```
- Employee is not created
- No partial records

### Employee Creation Fails
- User account is automatically deleted
- Rollback ensures consistency

### Invalid User Reference
```json
{
  "message": "User does not exist"
}
```

## Migration Notes

### Existing Data
If you have existing employees without user accounts:
1. Run a migration script to create users for all employees
2. Update employee records with user references
3. Ensure all employees have valid user accounts

### Sample Migration
```javascript
const employees = await Employee.find({ user: { $exists: false } });
for (const emp of employees) {
  const user = await User.create({
    name: `${emp.firstName} ${emp.lastName}`,
    email: emp.email,
    password: emp.employeeId,
    role: normalRoleId,
    status: 'active'
  });
  emp.user = user._id;
  await emp.save();
}
```

## Best Practices

1. **Never manually create employees without users**
2. **Use the API endpoints** - they handle user creation automatically
3. **Don't delete users directly** - delete the employee instead
4. **Update user details through employee updates** when possible
5. **Maintain email consistency** between user and employee records

## Summary

- ✅ Users can exist independently
- ✅ Employees always have users (automatically created)
- ✅ Deleting employee deletes user
- ✅ Rollback on failures ensures consistency
- ✅ Validation prevents invalid states
