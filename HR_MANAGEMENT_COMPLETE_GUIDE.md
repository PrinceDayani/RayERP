# RayERP - HR Management Complete Guide

**Version**: 2.0.0  
**Status**: Production Ready  
**Last Updated**: 2024

---

## Table of Contents

1. [Overview](#1-overview)
2. [HR Module Architecture](#2-hr-module-architecture)
3. [Employee Management](#3-employee-management)
4. [Department Management](#4-department-management)
5. [Attendance Management](#5-attendance-management)
6. [Leave Management](#6-leave-management)
7. [Salary Management](#7-salary-management)
8. [Permissions & Access Control](#8-permissions--access-control)
9. [API Reference](#9-api-reference)
10. [Best Practices](#10-best-practices)

---

## 1. Overview

### Purpose
The HR Management system in RayERP provides comprehensive human resource management capabilities including employee lifecycle management, attendance tracking, leave management, salary administration, and department organization.

### Key Capabilities
- **Employee Lifecycle**: Onboarding to offboarding
- **Department Structure**: Organizational hierarchy and team management
- **Time & Attendance**: Check-in/out, manual entries, approval workflows
- **Leave Management**: Multiple leave types with approval system
- **Salary Administration**: Secure salary management with permission controls
- **Skills Tracking**: Enhanced skills with proficiency levels
- **Performance Monitoring**: Task tracking and productivity metrics
- **Real-Time Updates**: Socket.IO integration for instant notifications

### Technology Stack
- **Backend**: Express.js + TypeScript + MongoDB
- **Frontend**: Next.js 15 + TypeScript + Tailwind CSS
- **Real-Time**: Socket.IO
- **Authentication**: JWT with RBAC
- **Security**: Permission-based access control

---

## 2. HR Module Architecture

### Data Models

#### Employee Model
- **Core Fields**: employeeId, firstName, lastName, email, phone, position, salary
- **Department**: Primary department + multi-department support
- **Skills**: Enhanced skills with proficiency levels (Beginner, Intermediate, Advanced, Expert)
- **Documents**: Resume, certificates, ID documents
- **Social Profiles**: LinkedIn, GitHub, Twitter, Portfolio
- **Relationships**: Manager, supervisor, user account
- **Status**: active, inactive, terminated

#### Department Model
- **Core Fields**: name, description, location, budget, status
- **Manager**: name, email, phone
- **Employees**: Auto-updated employee count
- **Permissions**: Department-level access control
- **Status**: active, inactive

#### Attendance Model
- **Core Fields**: employee, date, checkIn, checkOut, totalHours, status
- **Approval System**: isManualEntry, approvalStatus, approvedBy
- **Card Integration**: cardEntryTime, cardExitTime, cardId
- **Entry Source**: manual, card, system
- **Status**: present, absent, late, half-day

#### Leave Model
- **Core Fields**: employee, leaveType, startDate, endDate, totalDays, reason
- **Leave Types**: sick, vacation, personal, maternity, paternity, emergency
- **Approval Workflow**: status, approvedBy, approvedDate, rejectionReason
- **Cancellation**: cancelledBy, cancelledDate, cancellationReason
- **Status**: pending, approved, rejected, cancelled

### Controllers
- **employeeController**: Employee CRUD, tasks, statistics
- **departmentController**: Department management, analytics, budgets
- **attendanceController**: Check-in/out, approval, card sync
- **leaveController**: Leave application, approval, balance
- **salaryController**: Salary view, update, history

### Routes Structure
```
/api/employees      - Employee management
/api/departments    - Department management
/api/attendance     - Attendance tracking
/api/leaves         - Leave management
/api/salary         - Salary administration
```

---

## 3. Employee Management

### Features

#### Employee Directory
- View all employees with search and filter
- Employee ID auto-generation (EMP0001, EMP0002, etc.)
- Multi-department assignment support
- Status management (active, inactive, terminated)
- Salary visibility based on permissions

#### Employee Creation
**Automatic User Account Creation**:
- User account created automatically
- Email as username
- Employee ID as default password
- "Normal" role assigned by default

**Required Fields**:
- First Name, Last Name
- Email (unique)
- Phone
- Position
- Salary
- Hire Date

**Optional Fields**:
- Department(s)
- Manager
- Address
- Emergency Contact
- Skills with proficiency levels
- Social profiles
- Avatar

#### Skills Management
**Enhanced Skills System**:
- Skill name
- Proficiency level: Beginner, Intermediate, Advanced, Expert
- Years of experience
- Last updated timestamp

#### Employee Profile
- Personal information
- Contact details
- Department assignments
- Skills and proficiencies
- Social profiles
- Manager information
- Task statistics
- Performance metrics

#### Task Tracking
**Access Control**:
- Non-admin users: View own tasks only
- Admin users: View all employee tasks

**Task Statistics**:
- Total tasks
- Completed tasks
- In progress tasks
- To do tasks
- Review tasks
- Overdue tasks

### Permissions
- `employees.view` - View employee directory
- `employees.create` - Create new employees
- `employees.edit` - Edit employee information
- `employees.delete` - Delete employees
- `employees.view_salary` - View salary information
- `employees.edit_salary` - Modify salary

### API Endpoints
```
GET    /api/employees              - Get all employees
GET    /api/employees/:id          - Get employee by ID
POST   /api/employees              - Create employee
PUT    /api/employees/:id          - Update employee
DELETE /api/employees/:id          - Delete employee
GET    /api/employees/:id/tasks    - Get employee tasks
GET    /api/employees/:id/tasks/stats - Get task statistics
```

---

## 4. Department Management

### Features

#### Department Directory
- View all departments with statistics
- Search and filter capabilities
- Auto-updated employee counts
- Budget tracking
- Status management (active, inactive)
- 5-minute cache for performance

#### Department Creation
**Required Fields**:
- Name (unique)
- Description
- Location

**Optional Fields**:
- Manager information (name, email, phone)
- Budget allocation
- Initial employee assignment
- Department permissions

#### Department Analytics
**Overview Metrics**:
- Total employees
- Total projects
- Budget allocation
- Budget utilization
- Active/completed projects

**Performance Metrics**:
- Productivity score (0-100%)
- Satisfaction score (0-100%)
- Retention rate (0-100%)
- Growth percentage
- Efficiency score (0-100%)
- Quality score (0-100%)

**Resource Utilization**:
- Capacity utilization
- Workload level
- Employee availability
- Resource efficiency
- Allocation breakdown

**Compliance Status**:
- Training completion
- Certification compliance
- Policy adherence
- Security compliance
- Overall compliance score
- Last audit date

#### Budget Management
- View allocated budget
- Track spent budget
- Calculate remaining budget
- Budget history by month
- Expense breakdown by category
- Budget adjustment with approval

#### Employee Assignment
- Assign employees to departments
- Multi-department support
- Primary department designation
- Auto-update employee counts
- Bulk assignment capabilities

#### Department Permissions
- Department-level access control
- Inherited by all department employees
- Combined with role permissions
- Add/remove permissions
- Bulk permission updates

### Permissions
- `departments.view` - View department list
- `departments.details` - View department details
- `departments.create` - Create departments
- `departments.edit` - Edit departments
- `departments.delete` - Delete departments
- `departments.view_members` - View department members
- `departments.assign_members` - Assign employees
- `departments.view_budget` - View budget information
- `departments.view_expenses` - View expense breakdown
- `departments.adjust_budget` - Adjust budget allocation
- `departments.view_performance` - View performance metrics
- `departments.view_goals` - View department goals
- `departments.view_settings` - View settings
- `departments.manage_permissions` - Manage permissions
- `departments.view_history` - View activity history

### API Endpoints
```
GET    /api/departments                    - Get all departments
GET    /api/departments/stats              - Get statistics
GET    /api/departments/:id                - Get department by ID
POST   /api/departments                    - Create department
PUT    /api/departments/:id                - Update department
DELETE /api/departments/:id                - Delete department
GET    /api/departments/:id/employees      - Get department employees
POST   /api/departments/:id/assign-employees - Assign employees
DELETE /api/departments/:id/employees/:employeeId - Unassign employee
GET    /api/departments/:id/analytics      - Get analytics
GET    /api/departments/:id/budget-history - Get budget history
GET    /api/departments/:id/expenses       - Get expenses
POST   /api/departments/:id/adjust-budget  - Adjust budget
GET    /api/departments/:id/performance-metrics - Get performance
GET    /api/departments/:id/resource-utilization - Get resources
GET    /api/departments/:id/goals          - Get goals
GET    /api/departments/:id/compliance-status - Get compliance
GET    /api/departments/:id/permissions    - Get permissions
POST   /api/departments/:id/permissions/add - Add permission
POST   /api/departments/:id/permissions/remove - Remove permission
PUT    /api/departments/:id/permissions    - Update all permissions
```

---

## 5. Attendance Management

### Features

#### Attendance Tracking
**Check-In/Check-Out**:
- Manual check-in/check-out
- Automatic time calculation
- Break time tracking
- Total hours calculation
- Status determination (present, absent, late, half-day)

**Entry Sources**:
- Manual entry by employee
- Card system integration
- System-generated entries

#### Approval System
**Manual Entry Approval**:
- Manual entries require approval
- Approval status: pending, approved, rejected, auto-approved
- Approver tracking
- Rejection reason
- Approval date logging

**Approval Workflow**:
- Employee requests attendance
- Manager reviews request
- Manager approves/rejects
- System logs activity
- Real-time notifications

#### Card System Integration
- Card entry time tracking
- Card exit time tracking
- Card ID logging
- Automatic attendance creation
- Sync with manual entries

#### Attendance Statistics
**Today's Stats**:
- Total employees
- Present count
- Absent count
- Late arrivals
- Average check-in time

**Historical Stats**:
- Attendance by date range
- Employee attendance history
- Department-wise attendance
- Trend analysis

### Permissions
- `attendance.view` - View attendance records
- `attendance.mark` - Mark own attendance
- `attendance.edit` - Edit attendance (managers only)
- `attendance.approve` - Approve attendance requests (managers only)

### API Endpoints
```
GET    /api/attendance                 - Get all attendance
GET    /api/attendance/stats           - Get statistics
GET    /api/attendance/today-stats     - Get today's stats
GET    /api/attendance/:id             - Get attendance by ID
POST   /api/attendance/checkin         - Check in
POST   /api/attendance/checkout        - Check out
POST   /api/attendance/request         - Request attendance
PUT    /api/attendance/:id/approve     - Approve attendance
POST   /api/attendance/card-sync       - Sync card data
PUT    /api/attendance/:id             - Update attendance
DELETE /api/attendance/:id             - Delete attendance
```

---

## 6. Leave Management

### Features

#### Leave Types
- **Sick Leave**: Medical reasons
- **Vacation**: Planned time off
- **Personal**: Personal matters
- **Maternity**: Maternity leave
- **Paternity**: Paternity leave
- **Emergency**: Urgent situations

#### Leave Application
**Application Process**:
- Employee selects leave type
- Specifies start and end dates
- System calculates total days
- Provides reason
- Attaches supporting documents (optional)
- Submits for approval

**Automatic Calculations**:
- Total days calculation
- Leave balance deduction
- Overlap detection
- Holiday consideration

#### Approval Workflow
**Status Flow**:
- **Pending**: Awaiting manager approval
- **Approved**: Manager approved
- **Rejected**: Manager rejected with reason
- **Cancelled**: Cancelled by manager or employee

**Approval Process**:
- Manager reviews leave request
- Checks leave balance
- Verifies team availability
- Approves or rejects
- System sends notification
- Leave balance updated

#### Leave Cancellation
**Cancellation Process**:
- Manager can cancel approved leaves
- Cancellation reason required
- Leave balance restored
- Employee notified
- Activity logged

#### Leave Balance
**Balance Tracking**:
- Annual leave quota
- Used leave days
- Remaining balance
- Leave type breakdown
- Carry-forward rules

### Permissions
- `leaves.view` - View leave records
- `leaves.apply` - Apply for leave
- `leaves.approve` - Approve leave requests (managers only)
- `leaves.cancel` - Cancel leaves (managers only)

### API Endpoints
```
GET    /api/leaves                     - Get all leaves
GET    /api/leaves/balance/:employeeId - Get leave balance
POST   /api/leaves                     - Apply for leave
PUT    /api/leaves/:id/status          - Update leave status
PUT    /api/leaves/:id/cancel          - Cancel leave
```

---

## 7. Salary Management

### Features

#### Salary Information
**View Salary**:
- Employee ID
- Employee name
- Current salary
- Permission-based visibility

**Salary History**:
- Historical salary records
- Effective dates
- Adjustment reasons
- Approver information

#### Salary Updates
**Update Process**:
- Enter new salary amount
- Specify effective date
- Provide reason for change
- System logs activity
- Real-time notification
- Audit trail created

**Activity Logging**:
- Old salary amount
- New salary amount
- Effective date
- Reason for change
- Updated by (user)
- Timestamp

#### Security
**Permission-Based Access**:
- Salary hidden by default
- View requires `employees.view_salary`
- Edit requires `employees.edit_salary`
- Typically restricted to HR and management

**Audit Trail**:
- All salary changes logged
- User tracking
- Timestamp recording
- Reason documentation
- Metadata preservation

### Permissions
- `employees.view_salary` - View salary information
- `employees.edit_salary` - Update salary

### API Endpoints
```
GET    /api/salary/:id          - Get employee salary
PUT    /api/salary/:id          - Update employee salary
GET    /api/salary/:id/history  - Get salary history
```

---

## 8. Permissions & Access Control

### Permission Structure

#### Employee Permissions
```
employees.view          - View employee directory
employees.create        - Create new employees
employees.edit          - Edit employee information
employees.delete        - Delete employees
employees.view_salary   - View salary information
employees.edit_salary   - Modify salary
```

#### Department Permissions
```
departments.view              - View department list
departments.details           - View department details
departments.create            - Create departments
departments.edit              - Edit departments
departments.delete            - Delete departments
departments.view_members      - View members
departments.assign_members    - Assign employees
departments.view_budget       - View budget
departments.view_expenses     - View expenses
departments.adjust_budget     - Adjust budget
departments.view_performance  - View performance
departments.view_goals        - View goals
departments.view_settings     - View settings
departments.manage_permissions - Manage permissions
departments.view_history      - View history
```

#### Attendance Permissions
```
attendance.view     - View attendance records
attendance.mark     - Mark own attendance
attendance.edit     - Edit attendance (managers)
attendance.approve  - Approve requests (managers)
```

#### Leave Permissions
```
leaves.view     - View leave records
leaves.apply    - Apply for leave
leaves.approve  - Approve leaves (managers)
leaves.cancel   - Cancel leaves (managers)
```

### Role-Based Access

#### Standard Roles
**Employee (Normal)**:
- View own profile
- Mark own attendance
- Apply for leave
- View own tasks
- Update own information

**Manager**:
- All employee permissions
- View team members
- Approve attendance
- Approve leaves
- View team performance
- Assign tasks

**HR**:
- All employee management
- View/edit salary
- Manage departments
- View all attendance
- Manage all leaves
- Generate reports

**Admin (Root/Super Admin)**:
- Full system access
- All permissions (*)
- User management
- System configuration
- Audit logs

### Permission Inheritance
**Multi-Level Permissions**:
1. **Role Permissions**: Base permissions from user role
2. **Department Permissions**: Additional permissions from department
3. **Combined Permissions**: Union of role + department permissions

**Wildcard Permission**:
- `*` grants all permissions
- Typically for Root/Super Admin only
- Overrides all other permissions

---

## 9. API Reference

### Authentication
All HR API endpoints require JWT authentication:
```
Authorization: Bearer <jwt_token>
```

### Response Format
**Success Response**:
```json
{
  "success": true,
  "message": "Operation successful",
  "data": { }
}
```

**Error Response**:
```json
{
  "success": false,
  "message": "Error message",
  "error": "Detailed error"
}
```

### Common Status Codes
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `500` - Internal Server Error

### Real-Time Events
**Socket.IO Events**:
- `employee:created` - New employee created
- `employee:updated` - Employee updated
- `employee:deleted` - Employee deleted
- `department:created` - New department created
- `department:updated` - Department updated
- `attendance:marked` - Attendance marked
- `leave:applied` - Leave application submitted
- `leave:approved` - Leave approved
- `salary:updated` - Salary updated

---

## 10. Best Practices

### Employee Management
1. **Complete Profiles**: Fill all employee information during onboarding
2. **Unique Emails**: Ensure email addresses are unique across system
3. **Skills Documentation**: Maintain updated skills with proficiency levels
4. **Manager Assignment**: Assign reporting managers for all employees
5. **Status Management**: Use status changes instead of deletion
6. **Password Security**: Instruct employees to change default password
7. **Multi-Department**: Use sparingly, only when truly necessary
8. **Regular Updates**: Keep employee information current

### Department Management
1. **Clear Structure**: Define logical department hierarchy
2. **Reasonable Size**: Keep departments manageable (10-50 employees)
3. **Budget Planning**: Set realistic budgets at fiscal year start
4. **Regular Monitoring**: Review department metrics monthly
5. **Permission Control**: Apply principle of least privilege
6. **Documentation**: Maintain clear department descriptions
7. **Archive vs Delete**: Use inactive status instead of deletion

### Attendance Management
1. **Daily Monitoring**: Review attendance daily
2. **Timely Approval**: Approve manual entries promptly
3. **Card Integration**: Use card system for accuracy
4. **Exception Handling**: Document reasons for manual entries
5. **Regular Audits**: Review attendance patterns monthly
6. **Policy Enforcement**: Apply attendance policies consistently

### Leave Management
1. **Clear Policies**: Define leave policies clearly
2. **Balance Tracking**: Monitor leave balances regularly
3. **Advance Planning**: Encourage advance leave requests
4. **Team Coverage**: Ensure team coverage during leaves
5. **Timely Approval**: Process leave requests promptly
6. **Documentation**: Require supporting documents for sick leave
7. **Carry-Forward**: Define clear carry-forward rules

### Salary Management
1. **Restricted Access**: Limit salary permissions to HR/management
2. **Regular Reviews**: Conduct salary reviews annually
3. **Market Alignment**: Benchmark against industry standards
4. **Documentation**: Document all salary changes with reasons
5. **Confidentiality**: Maintain strict salary confidentiality
6. **Audit Trail**: Review salary change logs regularly
7. **Compliance**: Ensure compliance with labor laws

### Security
1. **Permission Audits**: Review permissions quarterly
2. **Access Logs**: Monitor activity logs regularly
3. **Data Privacy**: Respect employee data privacy
4. **Secure Storage**: Ensure secure document storage
5. **Password Policies**: Enforce strong password policies
6. **Session Management**: Implement proper session timeouts
7. **Backup**: Regular backups of HR data

### Data Quality
1. **Validation**: Validate all input data
2. **Consistency**: Maintain data consistency across modules
3. **Deduplication**: Prevent duplicate records
4. **Regular Cleanup**: Remove obsolete data
5. **Data Integrity**: Ensure referential integrity
6. **Standardization**: Use standard formats for dates, names, etc.

---

## Appendix A: Data Models Reference

### Employee Schema
```typescript
{
  employeeId: string (unique, auto-generated)
  firstName: string (required)
  lastName: string (required)
  email: string (required, unique)
  phone: string (required)
  department: string (primary)
  departments: string[] (all departments)
  position: string (required)
  salary: number (required)
  hireDate: Date (required)
  status: 'active' | 'inactive' | 'terminated'
  address: {
    street: string
    city: string
    state: string
    zipCode: string
    country: string
  }
  emergencyContact: {
    name: string
    relationship: string
    phone: string
  }
  skillsEnhanced: [{
    skill: string
    level: 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert'
    yearsOfExperience: number
    lastUpdated: Date
  }]
  socialProfiles: {
    linkedin: string
    github: string
    twitter: string
    portfolio: string
  }
  documents: [{
    name: string
    type: 'Resume' | 'Certificate' | 'ID' | 'Other'
    url: string
    size: number
    uploadDate: Date
  }]
  avatarUrl: string
  manager: ObjectId (ref: Employee)
  user: ObjectId (ref: User, required)
  createdAt: Date
  updatedAt: Date
}
```

### Department Schema
```typescript
{
  name: string (required, unique)
  description: string (required)
  manager: {
    name: string
    email: string
    phone: string
  }
  location: string (required)
  budget: number (default: 0)
  status: 'active' | 'inactive'
  employeeCount: number (auto-updated)
  permissions: string[]
  createdAt: Date
  updatedAt: Date
}
```

### Attendance Schema
```typescript
{
  employee: ObjectId (ref: Employee, required)
  date: Date (required)
  checkIn: Date (required)
  checkOut: Date
  breakTime: number (default: 0)
  totalHours: number (default: 0)
  status: 'present' | 'absent' | 'late' | 'half-day'
  notes: string
  isManualEntry: boolean (default: false)
  approvalStatus: 'pending' | 'approved' | 'rejected' | 'auto-approved'
  requestedBy: ObjectId (ref: Employee)
  approvedBy: ObjectId (ref: Employee)
  approvedDate: Date
  rejectionReason: string
  cardEntryTime: Date
  cardExitTime: Date
  cardId: string
  entrySource: 'manual' | 'card' | 'system'
  createdAt: Date
  updatedAt: Date
}
```

### Leave Schema
```typescript
{
  employee: ObjectId (ref: Employee, required)
  leaveType: 'sick' | 'vacation' | 'personal' | 'maternity' | 'paternity' | 'emergency'
  startDate: Date (required)
  endDate: Date (required)
  totalDays: number (required)
  reason: string (required)
  status: 'pending' | 'approved' | 'rejected' | 'cancelled'
  appliedDate: Date
  approvedBy: ObjectId (ref: Employee)
  approvedDate: Date
  rejectionReason: string
  cancelledBy: ObjectId (ref: Employee)
  cancelledDate: Date
  cancellationReason: string
  documents: string[]
  createdAt: Date
  updatedAt: Date
}
```

---

## Appendix B: Troubleshooting Guide

### Common Issues

#### Employee Creation Fails
**Issue**: Cannot create employee
**Causes**:
- Duplicate email
- Duplicate employee ID
- Missing required fields
- "Normal" role doesn't exist

**Solutions**:
- Use unique email address
- Verify all required fields
- Ensure "Normal" role exists in system
- Check user creation logs

#### Salary Not Visible
**Issue**: Salary field hidden or shows N/A
**Cause**: Missing `employees.view_salary` permission
**Solution**: Request permission from administrator

#### Attendance Approval Not Working
**Issue**: Cannot approve attendance
**Cause**: Missing manager permissions
**Solution**: Verify user has `attendance.edit` or `attendance.approve` permission

#### Leave Balance Incorrect
**Issue**: Leave balance doesn't match
**Causes**:
- Approved leaves not deducted
- Cancelled leaves not restored
- Manual balance adjustment needed

**Solutions**:
- Verify leave status
- Check leave calculations
- Contact administrator for manual adjustment

#### Department Employee Count Wrong
**Issue**: Employee count doesn't match actual employees
**Solutions**:
- Refresh page
- Use "Update Employee Count" endpoint
- Verify employee department assignments
- Check for orphaned records

---

## Appendix C: Glossary

- **Employee ID**: Unique identifier (format: EMP0001)
- **Primary Department**: Main department for reporting
- **Multi-Department**: Employee assigned to multiple departments
- **Skills Enhanced**: Skills with proficiency levels
- **Approval Workflow**: Multi-step approval process
- **Manual Entry**: Attendance marked manually (requires approval)
- **Card System**: Physical card-based attendance tracking
- **Leave Balance**: Remaining leave days available
- **Salary History**: Historical salary change records
- **Permission Inheritance**: Combining role and department permissions
- **Wildcard Permission**: (*) grants all permissions
- **Real-Time Updates**: Instant notifications via Socket.IO
- **Activity Log**: Audit trail of all operations
- **RBAC**: Role-Based Access Control

---

**End of HR Management Complete Guide**

For detailed module-specific documentation, refer to:
- `Documentation/USER_MANUAL_EMPLOYEE_MANAGEMENT.md`
- `Documentation/USER_MANUAL_DEPARTMENT_MANAGEMENT.md`

For technical support, contact your system administrator.
