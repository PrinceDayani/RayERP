# RayERP - Employee Management User Manual

**Version**: 2.0.0  
**Module**: Employee Management  
**Status**: Production Ready  
**Last Updated**: 2024

---

## Table of Contents

1. [Overview](#1-overview)
2. [Getting Started](#2-getting-started)
3. [Employee Directory](#3-employee-directory)
4. [Creating Employees](#4-creating-employees)
5. [Managing Employee Information](#5-managing-employee-information)
6. [Employee Tasks & Performance](#6-employee-tasks--performance)
7. [Permissions & Access Control](#7-permissions--access-control)
8. [Best Practices](#8-best-practices)
9. [Troubleshooting](#9-troubleshooting)

---

## 1. Overview

### Purpose
The Employee Management module provides complete lifecycle management for employees, from onboarding to offboarding, including profile management, task tracking, and performance monitoring.

### Key Features
- Employee directory with comprehensive profiles
- Automatic user account creation
- Multi-department assignment support
- Enhanced skills tracking with proficiency levels
- Manager-employee relationships
- Task assignment and tracking
- Performance statistics
- Social profile integration
- Real-time updates and notifications
- Permission-based salary visibility

### Access Requirements
- **View Employees**: `employees.view` permission
- **Create Employees**: `employees.create` permission
- **Edit Employees**: `employees.edit` permission
- **Delete Employees**: `employees.delete` permission
- **View Salary**: `employees.view_salary` permission
- **Edit Salary**: `employees.edit_salary` permission

### Access Path
- Employee List: `/dashboard/employees`
- Employee Profile: `/dashboard/employees/[id]`
- Create Employee: `/dashboard/employees/create`

---

## 2. Getting Started

### Prerequisites
Before using the Employee Management module:
1. Ensure you have appropriate permissions assigned to your role
2. Verify that departments are created (if assigning employees to departments)
3. Confirm that the "Normal" role exists in the system (required for auto-user creation)

### Navigation
1. Log in to RayERP
2. Navigate to **Dashboard** from the main menu
3. Click on **Employees** in the sidebar
4. You will see the Employee Directory

---

## 3. Employee Directory

### Viewing All Employees

The Employee Directory displays all employees in the system with the following information:
- Employee ID (auto-generated)
- Full Name (First Name + Last Name)
- Email Address
- Phone Number
- Department(s)
- Position/Job Title
- Employment Status (Active, Inactive, Terminated)
- Hire Date
- Salary (visible only with `employees.view_salary` permission)

### Search and Filter
- Use the search bar to find employees by name, email, or employee ID
- Filter by department, status, or position
- Sort by any column (name, hire date, department, etc.)

### Employee Status Types
- **Active**: Currently employed and working
- **Inactive**: Temporarily not working (leave, suspension, etc.)
- **Terminated**: Employment ended

---

## 4. Creating Employees

### Step-by-Step Process

#### Step 1: Navigate to Create Employee
1. Go to Employee Directory
2. Click the **"Create Employee"** or **"Add Employee"** button
3. The employee creation form will open

#### Step 2: Fill Basic Information
**Required Fields:**
- **First Name**: Employee's first name
- **Last Name**: Employee's last name
- **Email**: Unique email address (will be used for login)
- **Phone**: Contact phone number
- **Position**: Job title or role
- **Salary**: Annual or monthly salary
- **Hire Date**: Date of joining

**Optional Fields:**
- **Department**: Primary department (can be changed later)
- **Manager**: Reporting manager (select from existing employees)
- **Status**: Employment status (defaults to "Active")

#### Step 3: Add Address Information
Complete the address section:
- Street Address
- City
- State/Province
- ZIP/Postal Code
- Country

#### Step 4: Add Emergency Contact
Provide emergency contact details:
- Contact Name
- Relationship (spouse, parent, sibling, etc.)
- Phone Number

#### Step 5: Add Skills (Optional)
Add employee skills with proficiency levels:
- **Skill Name**: Technology, tool, or competency
- **Level**: Beginner, Intermediate, Advanced, Expert
- **Years of Experience**: Number of years (optional)
- Click **"Add Skill"** to add multiple skills

#### Step 6: Add Social Profiles (Optional)
Link professional social profiles:
- LinkedIn URL
- GitHub URL
- Twitter Handle
- Portfolio Website
- Other Professional Links

#### Step 7: Upload Avatar (Optional)
- Upload a profile picture
- Supported formats: JPG, PNG, GIF
- Recommended size: 200x200 pixels

#### Step 8: Submit
1. Review all information
2. Click **"Create Employee"**
3. System will automatically:
   - Generate unique Employee ID (format: EMP0001, EMP0002, etc.)
   - Create user account with email and Employee ID as password
   - Assign "Normal" role to the user
   - Send real-time notification
   - Update dashboard statistics

### Automatic User Account Creation

When you create an employee, the system automatically:
- Creates a user account linked to the employee
- Sets email as username
- Sets Employee ID as default password (e.g., EMP0001)
- Assigns "Normal" role by default
- Activates the account

**Important**: Inform the employee to change their password on first login.

### Employee ID Generation

Employee IDs are automatically generated:
- Format: `EMP` + 4-digit number (e.g., EMP0001, EMP0002)
- Sequential numbering based on creation order
- Unique and cannot be duplicated
- Retry logic handles concurrent creation

---

## 5. Managing Employee Information

### Viewing Employee Profile

To view detailed employee information:
1. Go to Employee Directory
2. Click on an employee's name or row
3. View complete profile including:
   - Personal information
   - Contact details
   - Department assignments
   - Skills and proficiencies
   - Social profiles
   - Manager information
   - Employment history

### Editing Employee Information

#### Basic Information Update
1. Open employee profile
2. Click **"Edit"** button
3. Modify required fields
4. Click **"Save Changes"**

**Editable Fields:**
- Name (First Name, Last Name)
- Email (updates linked user account)
- Phone
- Position
- Department
- Manager
- Status
- Address
- Emergency Contact
- Skills
- Social Profiles
- Avatar

#### Salary Update
**Special Permission Required**: `employees.edit_salary`

1. Open employee profile
2. Navigate to salary section
3. Click **"Edit Salary"**
4. Enter new salary amount
5. Click **"Save"**

**Note**: Only users with `employees.edit_salary` permission can modify salary information.

### Multi-Department Assignment

Employees can be assigned to multiple departments:
1. Edit employee profile
2. In the department field, select primary department
3. System automatically adds to `departments` array
4. Employee appears in all assigned department lists
5. Primary department is used for default reporting

### Manager Assignment

Assign a reporting manager:
1. Edit employee profile
2. Select manager from dropdown (populated with existing employees)
3. Save changes
4. Manager can now view employee's tasks and performance

### Skills Management

#### Adding Skills
1. Edit employee profile
2. Navigate to Skills section
3. Click **"Add Skill"**
4. Enter skill name
5. Select proficiency level:
   - **Beginner**: Learning or basic knowledge
   - **Intermediate**: Working knowledge
   - **Advanced**: Expert-level proficiency
   - **Expert**: Master-level, can teach others
6. Enter years of experience (optional)
7. Click **"Save"**

#### Updating Skills
1. Edit existing skill
2. Update level or years of experience
3. System automatically updates `lastUpdated` timestamp

#### Removing Skills
1. Click remove icon next to skill
2. Confirm deletion

### Status Management

Change employee status:
1. Edit employee profile
2. Select new status:
   - **Active**: Regular working status
   - **Inactive**: Temporary leave or suspension
   - **Terminated**: Employment ended
3. Save changes

**Impact of Status Change:**
- Inactive/Terminated employees may lose system access
- Tasks may be reassigned
- Reports reflect status changes
- Dashboard statistics update automatically

### Deleting Employees

**Warning**: This action is permanent and cannot be undone.

To delete an employee:
1. Open employee profile
2. Click **"Delete Employee"** button
3. Confirm deletion
4. System will:
   - Delete employee record
   - Delete linked user account
   - Remove from all departments
   - Emit real-time notification
   - Update dashboard statistics

**Note**: Consider changing status to "Terminated" instead of deleting to preserve historical data.

---

## 6. Employee Tasks & Performance

### Viewing Employee Tasks

To view tasks assigned to an employee:
1. Open employee profile
2. Navigate to **"Tasks"** tab
3. View list of all assigned tasks with:
   - Task name
   - Project name
   - Status (To Do, In Progress, Review, Completed)
   - Priority
   - Due date
   - Assigned by

### Task Statistics

View employee performance metrics:
1. Open employee profile
2. Navigate to **"Statistics"** tab
3. View metrics:
   - **Total Tasks**: All tasks assigned
   - **Completed Tasks**: Successfully finished tasks
   - **In Progress Tasks**: Currently working on
   - **To Do Tasks**: Not yet started
   - **Review Tasks**: Awaiting review
   - **Overdue Tasks**: Past due date and not completed

### Performance Tracking

Monitor employee productivity:
- Completion rate: (Completed / Total) × 100
- On-time delivery rate
- Task distribution by project
- Workload analysis

### Access Control for Tasks

**Non-Admin Users**:
- Can only view their own tasks
- Cannot view other employees' tasks
- Attempting to access others' tasks returns 403 Forbidden

**Admin Users** (Root, Super Admin):
- Can view all employees' tasks
- Can access task statistics for any employee
- Full visibility across organization

---

## 7. Permissions & Access Control

### Permission Structure

The Employee Management module uses granular permissions:

#### View Permissions
- **employees.view**: View employee directory and basic information
- **employees.view_salary**: View salary information (hidden by default)

#### Management Permissions
- **employees.create**: Create new employees
- **employees.edit**: Edit employee information
- **employees.edit_salary**: Modify salary information
- **employees.delete**: Delete employees

### Salary Visibility

Salary information is protected:
- Hidden by default for all users
- Requires `employees.view_salary` permission to view
- Requires `employees.edit_salary` permission to modify
- API automatically filters salary data based on permissions

### Department-Based Permissions

Permissions can be assigned at department level:
1. Employees inherit permissions from their departments
2. Combined with role-based permissions
3. Wildcard permission (*) grants all access

---

## 8. Best Practices

### Employee Creation
1. **Verify Email Uniqueness**: Ensure email is not already in use
2. **Complete All Required Fields**: Avoid partial records
3. **Set Correct Department**: Assign to appropriate department from start
4. **Add Skills**: Document employee competencies for better resource allocation
5. **Inform Employee**: Share login credentials (email + Employee ID as password)
6. **Request Password Change**: Instruct employee to change password on first login

### Data Management
1. **Regular Updates**: Keep employee information current
2. **Skill Updates**: Update skills as employees learn and grow
3. **Status Management**: Use status changes instead of deletion when possible
4. **Manager Assignment**: Ensure reporting structure is accurate
5. **Multi-Department**: Assign to multiple departments when employee works across teams

### Security
1. **Limit Salary Access**: Only grant `view_salary` and `edit_salary` to HR and management
2. **Regular Audits**: Review employee access and permissions periodically
3. **Offboarding**: Change status to "Terminated" and disable user account
4. **Data Privacy**: Respect employee privacy and data protection regulations

### Performance Tracking
1. **Regular Reviews**: Monitor task statistics regularly
2. **Workload Balance**: Ensure fair task distribution
3. **Skill Utilization**: Assign tasks matching employee skills
4. **Manager Oversight**: Managers should review their team's performance

---

## 9. Troubleshooting

### Common Issues and Solutions

#### Issue: Cannot Create Employee
**Symptoms**: Error message when creating employee

**Possible Causes & Solutions**:
1. **Duplicate Email**
   - Error: "Employee with this email already exists"
   - Solution: Use a different email address or update existing employee

2. **Duplicate Employee ID**
   - Error: "Employee with this employeeId already exists"
   - Solution: System auto-generates ID; if error persists, contact administrator

3. **User Creation Failed**
   - Error: "Failed to create user"
   - Solution: Ensure "Normal" role exists in system; contact administrator

4. **Missing Required Fields**
   - Error: "Name and description are required" or similar
   - Solution: Fill all required fields marked with asterisk (*)

#### Issue: Cannot View Salary
**Symptoms**: Salary field is hidden or shows "N/A"

**Solution**: Request `employees.view_salary` permission from administrator

#### Issue: Cannot Edit Salary
**Symptoms**: Salary field is read-only or edit button is disabled

**Solution**: Request `employees.edit_salary` permission from administrator

#### Issue: Cannot View Other Employees' Tasks
**Symptoms**: 403 Forbidden error when accessing tasks

**Solution**: This is expected behavior for non-admin users. Only admins can view all employees' tasks.

#### Issue: Employee Not Appearing in Department
**Symptoms**: Employee created but not showing in department list

**Solutions**:
1. Verify department assignment in employee profile
2. Check if employee is in `departments` array
3. Refresh department employee list
4. Update employee count in department settings

#### Issue: User Account Not Created
**Symptoms**: Employee created but cannot login

**Solutions**:
1. Verify "Normal" role exists in system
2. Check if user was created in Users table
3. Manually create user account and link to employee
4. Contact system administrator

#### Issue: Real-Time Updates Not Working
**Symptoms**: Changes not reflected immediately

**Solutions**:
1. Refresh the page
2. Check WebSocket connection
3. Verify Socket.IO is running
4. Check browser console for errors

### Error Messages Reference

| Error Message | Cause | Solution |
|--------------|-------|----------|
| "Employee with this email already exists" | Duplicate email | Use different email |
| "Employee with this employeeId already exists" | Duplicate ID | System issue; contact admin |
| "User must exist" | Invalid user reference | Verify user account exists |
| "Employee must have an associated user" | Missing user link | Create user account first |
| "Insufficient permissions to edit salary" | Missing permission | Request `employees.edit_salary` |
| "Access denied: You can only view your own tasks" | Permission restriction | Expected for non-admin users |
| "Failed to generate unique employee ID" | System error | Retry or contact administrator |

### Getting Help

If you encounter issues not covered in this manual:
1. Check system logs in `backend/logs/`
2. Review browser console for errors
3. Contact your system administrator
4. Refer to technical documentation in project README

---

## Appendix A: API Endpoints

For developers and integrators:

### Employee Endpoints
- `GET /api/employees` - Get all employees
- `GET /api/employees/:id` - Get employee by ID
- `POST /api/employees` - Create new employee
- `PUT /api/employees/:id` - Update employee
- `DELETE /api/employees/:id` - Delete employee
- `GET /api/employees/:id/tasks` - Get employee tasks
- `GET /api/employees/:id/tasks/stats` - Get task statistics

### Authentication
All endpoints require JWT authentication via `Authorization: Bearer <token>` header.

### Permissions
All endpoints enforce permission checks via middleware.

---

## Appendix B: Data Model

### Employee Schema
```
{
  employeeId: String (unique, auto-generated)
  firstName: String (required)
  lastName: String (required)
  email: String (required, unique)
  phone: String (required)
  department: String (primary department)
  departments: Array<String> (all departments)
  position: String (required)
  salary: Number (required)
  hireDate: Date (required)
  status: Enum ['active', 'inactive', 'terminated']
  address: {
    street: String
    city: String
    state: String
    zipCode: String
    country: String
  }
  emergencyContact: {
    name: String
    relationship: String
    phone: String
  }
  skills: Array<String> (legacy)
  skillsEnhanced: Array<{
    skill: String
    level: Enum ['Beginner', 'Intermediate', 'Advanced', 'Expert']
    yearsOfExperience: Number
    lastUpdated: Date
  }>
  socialProfiles: {
    linkedin: String
    github: String
    twitter: String
    portfolio: String
    other: String
  }
  avatarUrl: String
  manager: ObjectId (ref: Employee)
  user: ObjectId (ref: User, required)
  createdAt: Date
  updatedAt: Date
}
```

---

## Appendix C: Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl + N` | Create new employee (if on employee page) |
| `Ctrl + S` | Save changes (when editing) |
| `Esc` | Close modal/cancel edit |
| `Ctrl + F` | Focus search bar |

---

## Appendix D: Glossary

- **Employee ID**: Unique identifier auto-generated for each employee (format: EMP0001)
- **Primary Department**: Main department for reporting and default assignment
- **Multi-Department**: Employee assigned to multiple departments simultaneously
- **Skills Enhanced**: New skill tracking system with proficiency levels
- **Manager**: Reporting manager who oversees employee's work
- **Status**: Current employment state (Active, Inactive, Terminated)
- **User Account**: System login account automatically created for each employee
- **Permission**: Access control rule determining what actions user can perform
- **Real-Time Updates**: Instant notifications via WebSocket/Socket.IO

---

**End of Employee Management User Manual**

For technical support or questions, contact your system administrator.
