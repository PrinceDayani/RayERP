# RayERP - Department Management User Manual

**Version**: 2.0.0  
**Module**: Department Management  
**Status**: Production Ready  
**Last Updated**: 2024

---

## Table of Contents

1. [Overview](#1-overview)
2. [Getting Started](#2-getting-started)
3. [Department Directory](#3-department-directory)
4. [Creating Departments](#4-creating-departments)
5. [Managing Departments](#5-managing-departments)
6. [Employee Assignment](#6-employee-assignment)
7. [Budget Management](#7-budget-management)
8. [Department Analytics](#8-department-analytics)
9. [Permissions Management](#9-permissions-management)
10. [Best Practices](#10-best-practices)
11. [Troubleshooting](#11-troubleshooting)

---

## 1. Overview

### Purpose
The Department Management module enables organizations to structure their workforce, manage departmental budgets, track performance, and control access through department-level permissions.

### Key Features
- Department creation and hierarchy management
- Employee assignment and tracking
- Budget allocation and monitoring
- Performance metrics and analytics
- Department-level permissions
- Project tracking by department
- Activity logging and audit trail
- Resource utilization monitoring
- Compliance tracking
- Goal management
- Real-time statistics with caching

### Access Requirements
- **View Departments**: `departments.view` permission
- **View Details**: `departments.details` permission
- **Create Departments**: `departments.create` permission
- **Edit Departments**: `departments.edit` permission
- **Delete Departments**: `departments.delete` permission
- **View Members**: `departments.view_members` permission
- **Assign Members**: `departments.assign_members` permission
- **View Budget**: `departments.view_budget` permission
- **View Expenses**: `departments.view_expenses` permission
- **Adjust Budget**: `departments.adjust_budget` permission
- **View Performance**: `departments.view_performance` permission
- **View Goals**: `departments.view_goals` permission
- **View Settings**: `departments.view_settings` permission
- **Manage Permissions**: `departments.manage_permissions` permission
- **View History**: `departments.view_history` permission

### Access Path
- Department List: `/dashboard/departments`
- Department Details: `/dashboard/departments/[id]`
- Create Department: `/dashboard/departments/new`
- Department Budgets: `/dashboard/department-budgets`

---

## 2. Getting Started

### Prerequisites
Before using the Department Management module:
1. Ensure you have appropriate permissions assigned to your role
2. Understand your organization's structure
3. Plan department hierarchy and reporting relationships
4. Prepare budget allocations

### Navigation
1. Log in to RayERP
2. Navigate to **Dashboard** from the main menu
3. Click on **Departments** in the sidebar
4. You will see the Department Directory

### Performance Features
- **5-Minute Cache**: Department data is cached for faster loading
- **Automatic Employee Count**: System automatically tracks and updates employee counts
- **Real-Time Updates**: Changes reflect immediately across the system

---

## 3. Department Directory

### Viewing All Departments

The Department Directory displays all departments with:
- Department Name
- Description
- Manager Information (Name, Email, Phone)
- Location
- Budget Allocation
- Employee Count (auto-updated)
- Status (Active, Inactive)
- Creation Date

### Search and Filter

#### Search Functionality
Search departments by:
- Department name
- Manager name
- Location

#### Filter Options
- **Status Filter**: All, Active, Inactive
- **Sort Options**: Name, Creation Date, Employee Count, Budget

### Department Statistics

View organization-wide statistics:
- **Total Departments**: Count of all departments
- **Active Departments**: Currently operational departments
- **Inactive Departments**: Temporarily disabled departments
- **Total Employees**: Sum of all employees across departments
- **Total Budget**: Combined budget allocation
- **Average Team Size**: Average employees per department

### Status Types
- **Active**: Department is operational and accepting assignments
- **Inactive**: Department is temporarily disabled (employees remain assigned)

---

## 4. Creating Departments

### Step-by-Step Process

#### Step 1: Navigate to Create Department
1. Go to Department Directory
2. Click **"Create Department"** or **"New Department"** button
3. The department creation form will open with three tabs:
   - **Basic Info**
   - **Details**
   - **Members**

#### Step 2: Fill Basic Information Tab
**Required Fields:**
- **Department Name**: Unique name (e.g., "Engineering", "Sales", "HR")
- **Description**: Purpose and responsibilities of the department

**Optional Fields:**
- **Status**: Active (default) or Inactive

**Validation:**
- Department name must be unique
- Name cannot be empty

#### Step 3: Fill Details Tab
**Required Fields:**
- **Location**: Physical or virtual location (e.g., "New York Office", "Remote")

**Optional Fields:**
- **Budget**: Annual or monthly budget allocation (defaults to 0)
- **Manager Information**:
  - Manager Name
  - Manager Email
  - Manager Phone

**Note**: Location is mandatory. You must complete the Details tab before creating the department.

#### Step 4: Assign Members Tab
**Optional but Recommended:**
- **Select Manager**: Choose from existing employees (will be added to department)
- **Select Employees**: Choose team members from employee list

**Multi-Selection:**
- Manager is automatically included in employee count
- You can select multiple employees at once
- Employees can be assigned to multiple departments

#### Step 5: Submit
1. Review all information across tabs
2. Click **"Create Department"**
3. System will:
   - Validate all required fields
   - Check for duplicate department names
   - Create department record
   - Assign selected employees
   - Update employee records with department assignment
   - Set primary department for employees without one
   - Calculate and set employee count
   - Log activity in audit trail
   - Clear department cache
   - Send real-time notification

### Automatic Employee Assignment

When creating a department with members:
1. **Manager Assignment**:
   - Manager is added to department's employee list
   - Manager's employee record updated with department
   - If manager has no primary department, this becomes primary

2. **Employee Assignment**:
   - All selected employees added to department
   - Employee records updated with department in `departments` array
   - Primary department set if employee doesn't have one
   - Employee count automatically calculated

3. **Multi-Department Support**:
   - Employees can belong to multiple departments
   - Primary department used for default reporting
   - All departments visible in employee profile

---

## 5. Managing Departments

### Viewing Department Details

To view comprehensive department information:
1. Go to Department Directory
2. Click on a department name or row
3. View complete details including:
   - Basic information
   - Manager details
   - Employee list
   - Budget summary
   - Projects
   - Analytics
   - Activity logs

### Editing Department Information

#### Basic Information Update
1. Open department details
2. Click **"Edit"** button
3. Modify required fields
4. Click **"Save Changes"**

**Editable Fields:**
- Name (updates all employee records if changed)
- Description
- Manager information
- Location
- Budget
- Status

**Important**: Changing department name automatically updates all employee records that reference the old name.

#### Name Change Impact
When you change a department name:
1. System finds all employees with old department name
2. Updates `departments` array in employee records
3. Updates `department` field (primary department)
4. Maintains data consistency across system
5. Logs activity for audit trail

### Employee Count Management

Employee count is automatically maintained:
- **Auto-Update**: Count updates when employees are assigned/unassigned
- **Manual Refresh**: Use "Update Employee Count" endpoint if needed
- **Real-Time**: Changes reflect immediately in department list

### Status Management

Change department status:
1. Edit department
2. Select new status:
   - **Active**: Department is operational
   - **Inactive**: Department is temporarily disabled
3. Save changes

**Impact of Status Change:**
- Inactive departments may be hidden from some views
- Employees remain assigned
- Budget and projects remain accessible
- Can be reactivated at any time

### Deleting Departments

**Warning**: This action is permanent and requires confirmation.

#### Deletion Requirements
- Department must have **zero employees**
- Must provide confirmation text matching department name

#### Deletion Process
1. Open department details
2. Click **"Delete Department"** button
3. Enter department name exactly as shown
4. Click **"Confirm Delete"**
5. System will:
   - Verify employee count is zero
   - Validate confirmation text
   - Remove department from all employee records
   - Delete department record
   - Log deletion in audit trail
   - Clear department cache
   - Send real-time notification

#### Before Deleting
1. **Reassign All Employees**: Move employees to other departments
2. **Close Projects**: Complete or reassign department projects
3. **Archive Budgets**: Save budget records for historical reference
4. **Document Reason**: Log why department is being deleted

**Alternative**: Consider changing status to "Inactive" instead of deleting to preserve historical data.rify employee count is zero
   - Validate confirmation text
   - Remove department from all employee records
   - Delete department record
   - Log deletion in audit trail
   - Clear department cache
   - Send real-time notification

#### Before Deleting
1. **Reassign All Employees**: Move employees to other departments
2. **Close Projects**: Complete or reassign department projects
3. **Archive Budgets**: Save budget records for historical reference
4. **Document Reason**: Log why department is being deleted

**Alternative**: Consider changing status to "Inactive" instead of deleting to preserve historical data.

---

## 6. Employee Assignment

### Viewing Department Employees

To view all employees in a department:
1. Open department details
2. Navigate to **"Employees"** or **"Members"** tab
3. View list with:
   - Employee name
   - Email
   - Position
   - Status
   - Department assignments (all departments)

### Assigning Employees to Department

#### Single Assignment
1. Open department details
2. Click **"Assign Employees"** button
3. Select employee(s) from dropdown
4. Click **"Assign"**

#### Bulk Assignment
1. Open department details
2. Click **"Assign Employees"** button
3. Select multiple employees using checkboxes
4. Click **"Assign All"**

#### Assignment Process
System automatically:
1. Adds department to employee's `departments` array
2. Sets as primary department if employee has none
3. Updates employee count
4. Logs activity
5. Sends notification

### Unassigning Employees from Department

To remove an employee from a department:
1. Open department details
2. Navigate to Employees tab
3. Find employee to remove
4. Click **"Remove"** or **"Unassign"** button
5. Confirm action

#### Unassignment Process
System automatically:
1. Removes department from employee's `departments` array
2. Updates primary department if this was primary:
   - Sets to first remaining department
   - Sets to empty string if no other departments
3. Updates employee count
4. Logs activity

### Multi-Department Employees

Employees can be assigned to multiple departments:
- **Primary Department**: Used for default reporting and display
- **All Departments**: Listed in `departments` array
- **Visibility**: Employee appears in all assigned department lists
- **Permissions**: Inherits permissions from all departments

### Manager Assignment

Assign department manager:
1. Edit department
2. Select manager from employee dropdown
3. Manager is automatically added to department employees
4. Manager information (name, email, phone) can be manually entered
5. Save changes

---

## 7. Budget Management

### Viewing Department Budget

To view budget information:
1. Open department details
2. Navigate to **"Budget"** tab
3. View:
   - Total allocated budget
   - Total spent budget
   - Remaining budget
   - Budget count (number of budget records)

**Permission Required**: `departments.view_budget`

### Budget History

View historical budget data:
1. Open department details
2. Navigate to **"Budget History"** tab
3. View monthly records showing:
   - Month/Year
   - Allocated amount
   - Spent amount
   - Remaining amount
   - Utilization percentage

**Data Source**: Retrieved from DepartmentBudget records sorted by fiscal year and month.

### Viewing Expenses

Track department spending:
1. Open department details
2. Navigate to **"Expenses"** tab
3. View breakdown by category:
   - Category name
   - Amount spent
   - Percentage of total budget
   - Trend (up, down, stable)

**Permission Required**: `departments.view_expenses`

**Trend Indicators**:
- **Up**: Spending > 90% of allocated
- **Down**: Spending < 50% of allocated
- **Stable**: Spending between 50-90% of allocated

### Adjusting Department Budget

To increase or decrease budget:
1. Open department details
2. Navigate to Budget section
3. Click **"Adjust Budget"** button
4. Fill adjustment form:
   - **Type**: Increase or Decrease
   - **Amount**: Adjustment value
   - **Reason**: Explanation for adjustment (required)
5. Click **"Submit"**

**Permission Required**: `departments.adjust_budget`

#### Adjustment Process
System will:
1. Validate adjustment type and amount
2. Calculate new budget (current ± adjustment)
3. Update department budget
4. Log activity with details:
   - Adjustment type
   - Amount
   - New total budget
   - Reason
5. Mark as medium severity in audit trail

**Example**:
- Current Budget: 100,000
- Adjustment: Increase by 20,000
- New Budget: 120,000

---

## 8. Department Analytics

### Overview Analytics

View comprehensive department metrics:
1. Open department details
2. Navigate to **"Analytics"** tab
3. View overview section:
   - Total employees
   - Total projects
   - Budget allocation
   - Budget utilization
   - Active projects
   - Completed projects

**Permission Required**: `departments.details`

### Employee Statistics

Analyze workforce composition:
- **By Position**: Count of employees per job title
- **By Status**: Active, Inactive, Terminated counts

### Project Statistics

Track project performance:
- **By Status**: Projects in each status (Active, Completed, On Hold, etc.)
- **Total Budget**: Combined budget of all department projects

### Activity Trends

Monitor department activity:
- **Total Activities**: Count of all logged activities
- **Recent Activities**: Last 10 activities
- **Activity by Type**: Breakdown by action (create, update, delete, assign)

### Performance Metrics

Measure department effectiveness:
1. Open department details
2. Navigate to **"Performance"** tab
3. View metrics:
   - **Productivity**: Based on project completion rate (0-100%)
   - **Satisfaction**: Based on active employee ratio (0-100%)
   - **Retention**: Based on employee retention rate (0-100%)
   - **Growth**: Employee growth compared to baseline (%)
   - **Efficiency**: Based on project completion rate (0-100%)
   - **Quality Score**: Based on project success rate (0-100%)

**Permission Required**: `departments.view_performance`

**Calculation Examples**:
- Productivity = 60 + (Completed Projects / Total Projects) × 40
- Satisfaction = 70 + (Active Employees / Total Employees) × 30
- Retention = 75 + (Active Employees / Total Employees) × 25

### Resource Utilization

Monitor resource allocation:
1. Open department details
2. Navigate to **"Resources"** tab
3. View utilization metrics:
   - **Capacity**: Overall capacity utilization (0-100%)
   - **Workload**: Current workload level (0-100%)
   - **Availability**: Employee availability (0-100%)
   - **Efficiency**: Resource efficiency (0-100%)
   - **Allocation**: Breakdown by function (Development, Testing, Management)

**Permission Required**: `departments.view_performance`

### Compliance Status

Track compliance metrics:
1. Open department details
2. Navigate to **"Compliance"** tab
3. View compliance scores:
   - **Training**: Training completion rate
   - **Certifications**: Certification compliance
   - **Policies**: Policy adherence
   - **Security**: Security compliance
   - **Overall**: Average compliance score
   - **Last Audit**: Date of last audit

**Permission Required**: `departments.view_settings` or `departments.details`

### Department Goals

View and track department objectives:
1. Open department details
2. Navigate to **"Goals"** tab
3. View goals with:
   - Goal title
   - Description
   - Target value
   - Current progress
   - Unit of measurement
   - Deadline
   - Priority (High, Medium, Low)
   - Status (Active, Completed, On Hold)

**Permission Required**: `departments.view_goals`

**Example Goals**:
- Team Expansion: Grow to X employees by date
- Project Completion: Complete all ongoing projects
- Budget Efficiency: Reduce spending by X%
- Quality Improvement: Achieve X% quality score

---

## 9. Permissions Management

### Understanding Department Permissions

Department permissions provide additional access control:
- **Inherited by Employees**: All employees in department inherit these permissions
- **Combined with Role Permissions**: Added to user's role-based permissions
- **Granular Control**: Fine-tune access at department level

### Viewing Department Permissions

To view current permissions:
1. Open department details
2. Navigate to **"Permissions"** or **"Settings"** tab
3. View list of assigned permissions

**Permission Required**: `departments.view_settings`

### Adding Permissions

To add a permission to department:
1. Open department details
2. Navigate to Permissions section
3. Click **"Add Permission"** button
4. Enter permission string (e.g., `projects.view`, `finance.view`)
5. Click **"Add"**

**Permission Required**: `departments.manage_permissions`

**Validation**:
- Permission cannot already exist in department
- Permission string must be valid format

### Removing Permissions

To remove a permission:
1. Open department details
2. Navigate to Permissions section
3. Find permission to remove
4. Click **"Remove"** button
5. Confirm action

**Permission Required**: `departments.manage_permissions`

### Updating All Permissions

To replace all permissions at once:
1. Open department details
2. Navigate to Permissions section
3. Click **"Edit Permissions"** button
4. Provide array of permission strings
5. Click **"Save"**

**Permission Required**: `departments.manage_permissions`

**Note**: This replaces all existing permissions with the new list.

### Common Permission Patterns

**View-Only Department**:
```
employees.view
projects.view
tasks.view
```

**Management Department**:
```
employees.view
employees.edit
projects.view
projects.edit
tasks.view
tasks.edit
```

**Finance Department**:
```
finance.view
finance.edit
finance.approve
budgets.view
budgets.edit
```

**HR Department**:
```
employees.view
employees.create
employees.edit
employees.view_salary
employees.edit_salary
departments.view
```

---

## 10. Best Practices

### Department Structure
1. **Clear Hierarchy**: Define reporting structure clearly
2. **Logical Grouping**: Group employees by function or location
3. **Reasonable Size**: Keep departments manageable (10-50 employees ideal)
4. **Avoid Overlap**: Minimize confusion with clear department boundaries
5. **Document Purpose**: Write clear descriptions for each department

### Employee Assignment
1. **Primary Department**: Assign clear primary department for each employee
2. **Multi-Department**: Use sparingly, only when employee truly works across departments
3. **Manager Assignment**: Ensure every department has a designated manager
4. **Regular Review**: Audit department assignments quarterly
5. **Onboarding**: Assign new employees to departments immediately

### Budget Management
1. **Annual Planning**: Set budgets at start of fiscal year
2. **Regular Monitoring**: Review budget utilization monthly
3. **Document Adjustments**: Always provide clear reasons for budget changes
4. **Expense Tracking**: Categorize expenses properly
5. **Forecasting**: Use historical data for future budget planning

### Performance Tracking
1. **Set Goals**: Define clear, measurable department goals
2. **Regular Reviews**: Monitor performance metrics monthly
3. **Benchmark**: Compare against industry standards
4. **Action Plans**: Create improvement plans for underperforming areas
5. **Celebrate Success**: Recognize high-performing departments

### Permissions Management
1. **Principle of Least Privilege**: Grant minimum necessary permissions
2. **Regular Audits**: Review department permissions quarterly
3. **Document Decisions**: Record why specific permissions were granted
4. **Consistency**: Apply similar permissions to similar departments
5. **Security First**: Protect sensitive data with strict permissions

### Data Maintenance
1. **Regular Updates**: Keep department information current
2. **Archive Inactive**: Change status to inactive rather than deleting
3. **Clean Data**: Remove duplicate or obsolete records
4. **Backup**: Ensure department data is included in backups
5. **Audit Trail**: Review activity logs regularly

---

## 11. Troubleshooting

### Common Issues and Solutions

#### Issue: Cannot Create Department
**Symptoms**: Error message when creating department

**Possible Causes & Solutions**:
1. **Duplicate Name**
   - Error: "Department already exists"
   - Solution: Choose a different department name

2. **Missing Location**
   - Error: "Location is required. Please fill the Details tab."
   - Solution: Complete the Details tab with location information

3. **Missing Required Fields**
   - Error: "Name and description are required"
   - Solution: Fill all required fields in Basic Info tab

#### Issue: Cannot Delete Department
**Symptoms**: Error when attempting to delete

**Possible Causes & Solutions**:
1. **Department Has Employees**
   - Error: "Cannot delete department with employees"
   - Solution: Reassign all employees to other departments first

2. **Incorrect Confirmation**
   - Error: "Confirmation text does not match department name"
   - Solution: Type department name exactly as shown

#### Issue: Employee Count Incorrect
**Symptoms**: Employee count doesn't match actual employees

**Solutions**:
1. Refresh the page
2. Use "Update Employee Count" function
3. Check if employees are in `departments` array
4. Verify department name matches exactly in employee records

#### Issue: Budget Not Showing
**Symptoms**: Budget information is hidden or shows zero

**Solutions**:
1. Verify you have `departments.view_budget` permission
2. Check if budget records exist in DepartmentBudget table
3. Ensure fiscal year and month are set correctly
4. Contact administrator if permission is needed

#### Issue: Cannot Adjust Budget
**Symptoms**: Budget adjustment button disabled or returns error

**Solutions**:
1. Request `departments.adjust_budget` permission
2. Verify amount and reason are provided
3. Check adjustment type is "increase" or "decrease"
4. Ensure you're not setting negative budget

#### Issue: Permissions Not Working
**Symptoms**: Department permissions not affecting employee access

**Solutions**:
1. Verify employee is assigned to department
2. Check permission string format is correct
3. Ensure employee's role doesn't override department permissions
4. Clear cache and refresh
5. Check if wildcard (*) permission exists at role level

#### Issue: Analytics Not Loading
**Symptoms**: Analytics tab shows no data or errors

**Solutions**:
1. Verify you have `departments.details` permission
2. Check if department has employees and projects
3. Wait for cache to refresh (5-minute TTL)
4. Check browser console for errors
5. Verify backend API is responding

#### Issue: Name Change Not Reflecting
**Symptoms**: Old department name still appears in employee records

**Solutions**:
1. Refresh the page
2. Check if update completed successfully
3. Verify employee records were updated in database
4. Clear department cache
5. Manually update employee records if needed

#### Issue: Real-Time Updates Not Working
**Symptoms**: Changes not reflected immediately

**Solutions**:
1. Refresh the page
2. Check WebSocket connection
3. Verify Socket.IO is running
4. Check browser console for errors
5. Clear cache manually

### Error Messages Reference

| Error Message | Cause | Solution |
|--------------|-------|----------|
| "Department already exists" | Duplicate name | Use different name |
| "Department not found" | Invalid ID | Verify department exists |
| "Location is required" | Missing location | Fill Details tab |
| "Cannot delete department with employees" | Has employees | Reassign employees first |
| "Confirmation text does not match" | Wrong confirmation | Type exact name |
| "Employee IDs are required" | Empty assignment | Select at least one employee |
| "One or more employees not found" | Invalid employee ID | Verify employees exist |
| "Permission already exists" | Duplicate permission | Permission already added |
| "Permission not found" | Invalid permission | Check permission string |
| "Amount, reason, and type are required" | Missing budget adjustment data | Fill all fields |
| "Type must be either increase or decrease" | Invalid adjustment type | Use correct type |

### Performance Issues

#### Slow Loading
**Symptoms**: Department list or details load slowly

**Solutions**:
1. **Cache is Working**: First load may be slow, subsequent loads faster
2. **Large Dataset**: Consider pagination or filtering
3. **Network Issues**: Check internet connection
4. **Server Load**: Contact administrator if persistent

#### Cache Not Refreshing
**Symptoms**: Old data showing after updates

**Solutions**:
1. Wait 5 minutes for cache TTL to expire
2. Perform an update action (triggers cache clear)
3. Restart backend server to clear all caches
4. Check cache invalidation is working

### Getting Help

If you encounter issues not covered in this manual:
1. Check system logs in `backend/logs/`
2. Review browser console for errors
3. Check activity logs for department
4. Contact your system administrator
5. Refer to technical documentation in project README
6. Review API endpoints in department.routes.ts

---

## Appendix A: API Endpoints

For developers and integrators:

### Department Endpoints

#### View Routes
- `GET /api/departments` - Get all departments
- `GET /api/departments/stats` - Get department statistics
- `GET /api/departments/:id` - Get department by ID
- `GET /api/departments/:id/analytics` - Get department analytics
- `GET /api/departments/:id/notifications` - Get department notifications
- `GET /api/departments/:id/activity-logs` - Get activity logs

#### Member Routes
- `GET /api/departments/:id/employees` - Get department employees
- `GET /api/departments/all-employees` - Get all employees for assignment
- `GET /api/departments/:id/projects` - Get department projects
- `POST /api/departments/:id/assign-employees` - Assign employees
- `DELETE /api/departments/:id/employees/:employeeId` - Unassign employee

#### Budget Routes
- `GET /api/departments/:id/budget-history` - Get budget history
- `GET /api/departments/:id/expenses` - Get expense breakdown
- `POST /api/departments/:id/adjust-budget` - Adjust budget

#### Performance Routes
- `GET /api/departments/:id/performance-metrics` - Get performance metrics
- `GET /api/departments/:id/resource-utilization` - Get resource utilization
- `GET /api/departments/:id/goals` - Get department goals
- `GET /api/departments/:id/compliance-status` - Get compliance status

#### Management Routes
- `POST /api/departments` - Create department
- `PUT /api/departments/:id` - Update department
- `PATCH /api/departments/:id/employee-count` - Update employee count
- `DELETE /api/departments/:id` - Delete department

#### Permission Routes
- `GET /api/departments/:id/permissions` - Get permissions
- `POST /api/departments/:id/permissions/add` - Add permission
- `POST /api/departments/:id/permissions/remove` - Remove permission
- `PUT /api/departments/:id/permissions` - Update all permissions

### Authentication
All endpoints require JWT authentication via `Authorization: Bearer <token>` header.

### Permissions
All endpoints enforce permission checks via middleware.

---

## Appendix B: Data Model

### Department Schema
```
{
  name: String (required, unique)
  description: String (required)
  manager: {
    name: String (default: '')
    email: String (default: '', lowercase)
    phone: String (default: '')
  }
  location: String (required)
  budget: Number (required, min: 0, default: 0)
  status: Enum ['active', 'inactive'] (default: 'active')
  employeeCount: Number (default: 0, min: 0, auto-updated)
  permissions: Array<String> (department-level permissions)
  createdAt: Date (auto-generated)
  updatedAt: Date (auto-generated)
}
```

### Indexes
- `name`: Unique index for fast lookups
- `status`: Index for filtering
- `manager.email`: Index for manager queries

---

## Appendix C: Cache Strategy

### Cache Implementation
- **Type**: In-memory cache with TTL
- **TTL**: 5 minutes (300,000 milliseconds)
- **Invalidation**: Automatic on create, update, delete operations

### Cached Data
1. **Department List**: All departments with filters
2. **Department Details**: Individual department data
3. **Statistics**: Organization-wide stats

### Cache Benefits
- 95% faster subsequent requests
- Reduced database load
- Better user experience
- Automatic refresh on changes

---

## Appendix D: Activity Logging

### Logged Actions
All department operations are logged:
- Create department
- Update department
- Delete department
- Assign employees
- Budget adjustments
- Permission changes

### Log Fields
- User ID and name
- Action type
- Resource (department name)
- Resource type (department)
- Resource ID
- Details (description of action)
- Metadata (additional context)
- IP address
- Timestamp
- Severity level

### Viewing Logs
1. Open department details
2. Navigate to Activity Logs tab
3. Filter by:
   - Action type
   - Date range
   - User
4. Paginated results (20 per page)

---

## Appendix E: Glossary

- **Department**: Organizational unit grouping employees by function or location
- **Primary Department**: Main department for employee reporting and default assignment
- **Multi-Department**: Employee assigned to multiple departments simultaneously
- **Employee Count**: Number of employees assigned to department (auto-updated)
- **Budget Allocation**: Total budget assigned to department
- **Budget Utilization**: Percentage of budget spent
- **Department Permissions**: Access control rules inherited by all department employees
- **Manager**: Department head responsible for oversight
- **Status**: Current operational state (Active, Inactive)
- **Cache**: Temporary storage for faster data retrieval (5-minute TTL)
- **Activity Log**: Audit trail of all department operations
- **Compliance**: Adherence to policies, training, and security requirements
- **Resource Utilization**: Efficiency of resource allocation and usage

---

**End of Department Management User Manual**

For technical support or questions, contact your system administrator.
