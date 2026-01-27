# RayERP - User Manual
## Authentication & User Management | Dashboard & Analytics

**Version**: 2.0.0  
**Status**: Production Ready  
**Document Type**: Print-Ready User Manual  
**Last Updated**: 2024

---

## Table of Contents

1. [Authentication & User Management](#1-authentication--user-management)
   - [1.1 System Access](#11-system-access)
   - [1.2 User Login](#12-user-login)
   - [1.3 User Registration](#13-user-registration)
   - [1.4 Password Management](#14-password-management)
   - [1.5 Session Management](#15-session-management)
   - [1.6 User Roles & Permissions](#16-user-roles--permissions)
   - [1.7 User Profile Management](#17-user-profile-management)
   - [1.8 Security Features](#18-security-features)

2. [Dashboard & Analytics](#2-dashboard--analytics)
   - [2.1 Dashboard Overview](#21-dashboard-overview)
   - [2.2 Real-Time Statistics](#22-real-time-statistics)
   - [2.3 Financial Overview](#23-financial-overview)
   - [2.4 Analytics & Charts](#24-analytics--charts)
   - [2.5 Quick Actions](#25-quick-actions)
   - [2.6 Recent Activity Feed](#26-recent-activity-feed)
   - [2.7 Role-Based Dashboard Views](#27-role-based-dashboard-views)
   - [2.8 Connection Status](#28-connection-status)

---

## 1. Authentication & User Management

### 1.1 System Access

#### Initial Setup
When RayERP is first installed, the system requires initial setup:

1. **First User Creation**
   - The first user created automatically receives Root role
   - Root role has complete system access
   - Only one Root user is allowed per system

2. **Access URLs**
   - Frontend Application: `http://localhost:3000`
   - Backend API: `http://localhost:5000`
   - Login Page: `http://localhost:3000/login`

#### System Requirements
- Modern web browser (Chrome, Firefox, Safari, Edge)
- Active internet connection
- JavaScript enabled
- Cookies enabled for session management

---

### 1.2 User Login

#### Accessing the Login Page

1. **Navigate to Login**
   - Open your web browser
   - Go to: `http://localhost:3000/login`
   - Or click "Login" from the home page

2. **Login Interface**
   - Email address field
   - Password field (with show/hide toggle)
   - "Sign In" button
   - "Create Account" link for new users

#### Login Process

**Step 1: Enter Credentials**
```
Email Address: your.email@company.com
Password: ••••••••
```

**Step 2: Submit**
- Click "Sign In" button
- System validates credentials
- Loading indicator appears during authentication

**Step 3: Authentication**
- System verifies email and password
- Checks account status (active/inactive/disabled)
- Creates secure session
- Generates JWT token

**Step 4: Redirect**
- Successful login redirects to Dashboard
- Failed login shows error message

#### Login Features

**Password Visibility Toggle**
- Click eye icon to show/hide password
- Helps verify password entry
- Automatically hides after submission

**Remember Session**
- Session persists for 30 days
- Automatic logout after token expiration
- Secure HTTP-only cookies

**Error Messages**
- "Invalid credentials" - Wrong email or password
- "Account disabled" - Contact administrator
- "Account inactive" - Contact administrator
- "Account pending approval" - Wait for approval

#### Rate Limiting
- Maximum 5 login attempts per 10 seconds
- Prevents brute force attacks
- Automatic reset after time window
- Bypassed in development mode

---

### 1.3 User Registration

#### Creating New User Accounts

**Access Requirements**
- Must be logged in as existing user
- Requires minimum role level permissions
- Cannot create users with equal or higher role level

**Registration Process**

**Step 1: Navigate to Registration**
- From Dashboard, go to User Management
- Click "Create User" or "Register"
- Or use: `/dashboard/users/create`

**Step 2: Enter User Information**
```
Required Fields:
- Full Name
- Email Address
- Password (minimum 6 characters)
- Role Assignment
```

**Step 3: Role Assignment**
- Select appropriate role from dropdown
- Available roles depend on your permission level
- Cannot assign Root role (system protected)

**Step 4: Submit**
- Click "Register" or "Create User"
- System validates all fields
- Creates user account
- Sends confirmation

#### Role Assignment Rules

**Hierarchy Restrictions**
- Cannot create users with higher role level than yours
- Cannot create users with equal role level
- Root role cannot be assigned (system protected)
- Only one Root user allowed

**Default Role**
- If no role specified, system assigns default role
- Default role is lowest level (Employee)
- Can be changed later by authorized users

#### Registration Success
- User account created successfully
- User can immediately login
- Appears in user management list
- Activity logged in audit trail

---

### 1.4 Password Management

#### Changing Your Password

**Access Path**
- Dashboard → Settings → Change Password
- Or: `/dashboard/settings/change-password`

**Change Password Process**

**Step 1: Navigate to Password Change**
- Click on your profile
- Select "Change Password"
- Or go to Settings menu

**Step 2: Enter Password Information**
```
Required Fields:
- Current Password
- New Password (minimum 6 characters)
- Confirm New Password
```

**Step 3: Validation**
- Current password must be correct
- New password must meet requirements
- New password must match confirmation
- Cannot reuse current password

**Step 4: Submit**
- Click "Change Password"
- System validates and updates
- Success confirmation displayed
- Logged in audit trail

#### Password Requirements
- Minimum length: 6 characters
- No maximum length restriction
- Case-sensitive
- Special characters allowed
- No complexity requirements enforced

#### Password Security
- Passwords hashed using bcrypt
- Salt rounds: 10
- Never stored in plain text
- Never displayed in logs
- Secure transmission over HTTPS

---

### 1.5 Session Management

#### Session Features

**Session Creation**
- Created upon successful login
- JWT token generated
- Stored in HTTP-only cookie
- Expires after 30 days

**Session Limit**
- Maximum 2 active sessions per user
- Oldest session automatically revoked
- Prevents unauthorized access
- Maintains security

**Session Information Tracked**
```
- User ID
- Device Information
  - User Agent
  - Device Type
  - Browser
  - Operating System
- IP Address
- Login Time
- Expiration Time
```

#### Session Security

**Token Storage**
- HTTP-only cookies (cannot be accessed by JavaScript)
- Secure flag in production (HTTPS only)
- SameSite policy (CSRF protection)
- 30-day expiration

**Token Validation**
- Verified on every request
- Checked against database
- Expired tokens rejected
- Invalid tokens rejected

#### Logout Process

**Manual Logout**
1. Click profile menu
2. Select "Logout"
3. Session terminated immediately
4. Token invalidated
5. Redirected to login page

**Automatic Logout**
- Token expiration (30 days)
- Session limit exceeded
- Account status changed
- Security violation detected

---

### 1.6 User Roles & Permissions

#### Role Hierarchy

RayERP uses a 4-tier role system with hierarchical permissions:

**1. Root (Level 100)**
- Complete system access
- Cannot be modified or deleted
- Only one Root user allowed
- Full administrative privileges
- Access to all modules and features

**2. Super Admin (Level 90)**
- Elevated administrative access
- Can manage most system features
- Cannot modify Root user
- Can create Admin and lower roles

**3. Admin (Level 80)**
- Standard administrative access
- Can manage business operations
- Cannot create Super Admin or Root
- Can manage employees and projects

**4. Employee (Level 1-70)**
- Standard user access
- Limited to assigned tasks
- Cannot create other users
- Access based on permissions

#### Permission System

**Permission Format**
```
module.action
Examples:
- dashboard.view
- employees.create
- projects.edit
- finance.approve
```

**Common Permissions**
- `dashboard.view` - View dashboard
- `analytics.view` - View analytics
- `employees.manage` - Manage employees
- `projects.manage` - Manage projects
- `finance.view` - View financial data
- `finance.approve` - Approve transactions
- `system.manage` - System administration

#### Role Assignment

**Who Can Assign Roles**
- Root: Can assign any role except Root
- Super Admin: Can assign Admin and below
- Admin: Can assign Employee roles only
- Employee: Cannot assign roles

**Role Modification**
- Only higher-level users can modify roles
- Root role cannot be modified
- Role changes logged in audit trail
- Immediate effect on permissions

---

### 1.7 User Profile Management

#### Viewing Your Profile

**Access Path**
- Click profile icon in header
- Select "Profile"
- Or: `/dashboard/profile`

**Profile Information Displayed**
```
- Full Name
- Email Address
- Role
- Account Status
- Last Login Time
- Account Creation Date
```

#### Editing Profile

**Editable Fields**
- Full Name
- Email Address (with verification)
- Profile Picture (if enabled)

**Non-Editable Fields**
- Role (requires admin)
- Account Status (requires admin)
- Creation Date
- User ID

#### Account Status Types

**Active**
- Normal operational status
- Full access to assigned features
- Can login and use system

**Inactive**
- Temporarily disabled
- Cannot login
- Data preserved
- Can be reactivated

**Disabled**
- Permanently disabled
- Cannot login
- Requires admin intervention
- Data preserved

**Pending Approval**
- New account awaiting approval
- Cannot login until approved
- Admin must activate

---

### 1.8 Security Features

#### Authentication Security

**JWT Token Security**
- Signed with secret key
- 30-day expiration
- HTTP-only cookies
- Secure transmission
- Token refresh not implemented

**Password Security**
- Bcrypt hashing (10 rounds)
- Salt per password
- Never stored plain text
- Secure comparison
- No password hints

**Rate Limiting**
- Login: 5 attempts per 10 seconds
- General API: 50 requests per 10 seconds
- Per-user tracking
- Automatic reset
- Bypassed in development

#### Session Security

**Session Protection**
- 2-session limit per user
- Automatic old session revocation
- Device tracking
- IP address logging
- Session expiration

**CSRF Protection**
- SameSite cookie policy
- Token validation
- Origin checking
- Secure headers

#### Account Protection

**Account Status Checks**
- Verified on every login
- Disabled accounts rejected
- Inactive accounts rejected
- Pending accounts rejected

**Activity Logging**
- All logins logged
- All logouts logged
- Failed attempts logged
- Role changes logged
- Password changes logged

#### Security Best Practices

**For Users**
- Use strong passwords
- Don't share credentials
- Logout when finished
- Report suspicious activity
- Change password regularly

**For Administrators**
- Assign minimum required permissions
- Review user access regularly
- Monitor failed login attempts
- Disable unused accounts
- Review audit logs

---

## 2. Dashboard & Analytics

### 2.1 Dashboard Overview

#### Accessing the Dashboard

**Login Required**
- Must be authenticated
- Valid session required
- Appropriate permissions needed

**Dashboard URL**
- Main Dashboard: `/dashboard`
- Direct access after login
- Bookmark for quick access

#### Dashboard Layout

**Header Section**
```
- Welcome message with user name
- Current date and time
- User role display
- Connection status indicator
- Refresh button
```

**Main Content Area**
```
- Role-specific welcome card
- Statistics cards
- Financial overview
- Analytics charts
- Quick actions
- Recent activity feed
```

**Navigation Tabs**
```
- Overview (default)
- Employees
- Projects
- Tasks
```

#### Dashboard Features

**Real-Time Updates**
- Live data refresh every 30 seconds
- Socket.IO for instant updates
- Automatic cache invalidation
- Manual refresh available

**Responsive Design**
- Desktop optimized
- Tablet compatible
- Mobile responsive
- Touch-friendly interface

**Theme Support**
- Light mode
- Dark mode
- System preference detection
- Toggle in header

---

### 2.2 Real-Time Statistics

#### Statistics Overview

The dashboard displays key business metrics in real-time:

**Employee Statistics**
```
- Total Employees: Count of all employees
- Active Employees: Currently active staff
- Department Count: Number of departments
```

**Project Statistics**
```
- Total Projects: All projects in system
- Active Projects: Currently running projects
- Completed Projects: Finished projects
- Average Progress: Overall completion rate
```

**Task Statistics**
```
- Total Tasks: All tasks in system
- Completed Tasks: Finished tasks
- In Progress Tasks: Currently active tasks
- Pending Tasks: Not yet started tasks
```

**Financial Statistics**
```
- Sales Revenue: Total invoice amount
- Amount Received: Paid invoices
- Pending Amount: Outstanding invoices
- Project Revenue: Total project budgets
- Project Expenses: Spent budget
- Project Profit: Budget minus expenses
```

#### Statistics Cards

**Card Layout**
```
┌─────────────────────────┐
│ Metric Name             │
│ ──────────────────────  │
│ 123        [Icon]       │
│ Subtitle/Trend          │
└─────────────────────────┘
```

**Color Coding**
- Green: Positive metrics (revenue, completed)
- Red: Expenses, costs
- Blue: Neutral metrics
- Orange: Pending, warnings

**Interactive Features**
- Click to view details
- Hover for additional info
- Trend indicators (up/down arrows)
- Percentage changes

#### Data Refresh

**Automatic Refresh**
- Every 30 seconds
- Background updates
- No page reload required
- Smooth transitions

**Manual Refresh**
- Click refresh button in header
- Clears cache
- Fetches latest data
- Shows loading indicator

**Cache System**
- 5-minute cache TTL
- In-memory storage
- Automatic invalidation
- Improved performance

---

### 2.3 Financial Overview

#### Revenue View Toggle

**Two View Modes**

**1. Sales Revenue View**
```
Displays:
- Sales Revenue: Total from invoices
- Amount Received: Paid amount
- Pending Amount: Outstanding balance
- Invoice Count: Number of invoices
- Collection Rate: Percentage collected
```

**2. Project Budgets View**
```
Displays:
- Project Revenue: Total project budgets
- Project Expenses: Spent budget
- Project Profit: Budget minus expenses
- Project Count: Number of projects
- Utilization Rate: Expense percentage
```

**Switching Views**
- Click "Sales Revenue" button
- Click "Project Budgets" button
- View persists during session
- Independent data sources

#### Financial Metrics

**Sales Revenue Metrics**

**Total Sales Revenue**
- Sum of all invoice amounts
- Includes paid and unpaid
- Displayed in INR format
- Updates in real-time

**Amount Received**
- Total paid amount
- Green color indicator
- Collection percentage shown
- Tracks payment progress

**Pending Amount**
- Outstanding balance
- Orange color indicator
- Percentage of total shown
- Aging analysis available

**Invoice Statistics**
- Total invoice count
- Overdue invoices count
- Overdue amount
- Payment trends

**Project Budget Metrics**

**Project Revenue**
- Sum of all project budgets
- Total allocated funds
- Purple color indicator
- Per-project breakdown available

**Project Expenses**
- Total spent budget
- Red color indicator
- Expense tracking
- Cost center allocation

**Project Profit**
- Budget minus expenses
- Green if positive
- Red if over budget
- Margin percentage shown

#### Financial Cards

**Card Features**
```
┌─────────────────────────────┐
│ Metric Name                 │
│ ₹1,234,567                  │
│ Additional Info             │
│ [Trend Icon]                │
└─────────────────────────────┘
```

**Border Color Coding**
- Green border: Revenue/Income
- Red border: Expenses/Costs
- Blue border: Received/Paid
- Orange border: Pending/Outstanding

**Interactive Elements**
- Click for detailed view
- Hover for tooltips
- Drill-down capability
- Export options

---

### 2.4 Analytics & Charts

#### Available Charts

**1. Monthly Revenue Chart**
```
Type: Line/Bar Chart
Data: 12 months of current year
Displays:
- Monthly revenue
- Monthly expenses
- Trend lines
```

**Features:**
- Interactive tooltips
- Zoom capability
- Export as image
- Data table view

**2. Task Distribution Chart**
```
Type: Pie/Donut Chart
Categories:
- Completed Tasks
- In Progress Tasks
- Pending Tasks
```

**Features:**
- Percentage display
- Color-coded segments
- Click to filter
- Legend toggle

**3. Team Productivity Chart**
```
Type: Bar Chart
Data: By department
Displays:
- Completed tasks per department
- Pending tasks per department
- Productivity comparison
```

**Features:**
- Department comparison
- Sortable data
- Filter by date range
- Export capability

**4. Project Progress Chart**
```
Type: Progress Bars
Data: Active projects
Displays:
- Project name
- Completion percentage
- Status indicator
```

**Features:**
- Real-time updates
- Click to view project
- Sort by progress
- Filter by status

#### Chart Interactions

**Hover Actions**
- Display exact values
- Show percentages
- Highlight related data
- Display tooltips

**Click Actions**
- Drill down to details
- Filter dashboard data
- Navigate to module
- Export data

**Chart Controls**
- Zoom in/out
- Pan view
- Reset view
- Toggle legend
- Change chart type

#### Analytics Data

**Data Sources**
- Real-time database queries
- Aggregation pipelines
- Cached results (5 minutes)
- Automatic updates

**Data Accuracy**
- Updated every 30 seconds
- Manual refresh available
- Cache invalidation on changes
- Audit trail maintained

---

### 2.5 Quick Actions

#### Available Quick Actions

**Employee Management**
```
- Add New Employee
- View Employee List
- Attendance Management
- Leave Requests
```

**Project Management**
```
- Create New Project
- View All Projects
- Project Analytics
- My Tasks
```

**Task Management**
```
- Create New Task
- View My Tasks
- Task Dependencies
- Task Templates
```

**Financial Actions**
```
- Create Invoice
- Record Payment
- Journal Entry
- Financial Reports
```

#### Quick Action Features

**One-Click Access**
- Direct navigation to forms
- Pre-filled data where applicable
- Context-aware actions
- Role-based visibility

**Permission-Based Display**
- Only shows allowed actions
- Hides restricted features
- Dynamic based on role
- Updates in real-time

**Action Categories**
```
┌─────────────────────┐
│ [Icon] Action Name  │
│ Description         │
└─────────────────────┘
```

**Visual Indicators**
- Icons for each action
- Color coding by category
- Hover effects
- Loading states

---

### 2.6 Recent Activity Feed

#### Activity Feed Overview

**What is Displayed**
```
- User actions (login, logout)
- Project updates
- Task completions
- Financial transactions
- System events
- Approval actions
```

**Activity Information**
```
For each activity:
- Activity type icon
- Description
- User who performed action
- Timestamp
- Priority level
- Related metadata
```

#### Activity Types

**Authentication Activities**
- User login
- User logout
- Password changes
- Role changes

**Project Activities**
- Project created
- Project updated
- Project completed
- Team member added

**Task Activities**
- Task created
- Task assigned
- Task completed
- Status changed

**Financial Activities**
- Invoice created
- Payment received
- Journal entry posted
- Approval granted/rejected

**System Activities**
- Configuration changes
- User created
- Permission changes
- System alerts

#### Activity Feed Features

**Real-Time Updates**
- Socket.IO integration
- Instant notifications
- No page refresh needed
- Smooth animations

**Activity Limit**
- Shows last 20 activities
- Older activities archived
- Full history in audit trail
- Searchable archive

**Priority Levels**

**High Priority** (Red indicator)
- Security events
- System errors
- Critical approvals
- Root user actions

**Normal Priority** (Default)
- Standard operations
- Regular updates
- Routine tasks

**Low Priority** (Gray)
- Background tasks
- Automated actions
- System maintenance

#### Activity Interactions

**Click Activity**
- View full details
- Navigate to related item
- See complete history
- Access related actions

**Filter Activities**
- By type
- By user
- By date range
- By priority

**Export Activities**
- CSV format
- JSON format
- Date range selection
- Filtered results

---

### 2.7 Role-Based Dashboard Views

#### Root User Dashboard

**Special Features**
```
- Red gradient welcome card
- Shield icon indicator
- "Root Access Granted" message
- Full system access notice
- Live connection badge
```

**Additional Visibility**
- All system statistics
- All user activities
- System health metrics
- Security alerts
- High-priority notifications

**Exclusive Actions**
- System configuration
- User role management
- Security settings
- Database management
- System maintenance

#### Super Admin Dashboard

**Special Features**
```
- Purple gradient welcome card
- Shield icon indicator
- "Super Admin Access" message
- Elevated permissions notice
- Live connection badge
```

**Visibility**
- Most system statistics
- User management
- Business operations
- Analytics and reports
- Approval workflows

**Available Actions**
- Create Admin users
- Manage departments
- Configure modules
- View audit trails
- Generate reports

#### Admin Dashboard

**Special Features**
```
- Blue gradient welcome card
- User cog icon indicator
- "Admin Dashboard" message
- Administrative access notice
- Live connection badge
```

**Visibility**
- Business statistics
- Employee management
- Project management
- Financial overview
- Department analytics

**Available Actions**
- Create employees
- Manage projects
- Approve requests
- Generate reports
- Configure settings

#### Employee Dashboard

**Standard Features**
```
- Standard welcome message
- User name display
- Role display
- Current date
```

**Visibility**
- Personal statistics
- Assigned tasks
- Project involvement
- Team activities
- Personal performance

**Available Actions**
- View assigned tasks
- Update task status
- Submit timesheets
- Request leave
- View payslips

---

### 2.8 Connection Status

#### Real-Time Connection

**Connection Types**

**1. Socket.IO Connection (Live)**
```
Indicator: Green badge with WiFi icon
Status: "Real-time updates active"
Features:
- Instant data updates
- Live activity feed
- Real-time notifications
- No polling required
```

**2. Polling Connection (Fallback)**
```
Indicator: Orange badge with WiFi-off icon
Status: "Using periodic updates"
Features:
- 30-second refresh interval
- Automatic retry
- Reconnect button
- Graceful degradation
```

#### Connection Status Display

**Status Card**
```
┌─────────────────────────────────┐
│ [WiFi Icon] Status Message      │
│ [Reconnect Button] (if needed)  │
└─────────────────────────────────┘
```

**Color Coding**
- Green: Connected and live
- Orange: Polling mode
- Red: Disconnected (rare)

#### Connection Features

**Automatic Reconnection**
- Attempts reconnection on disconnect
- Exponential backoff
- Maximum retry attempts
- User notification on failure

**Manual Reconnection**
- Click "Reconnect" button
- Immediate connection attempt
- Status update on success/failure
- Maintains session

**Connection Monitoring**
- Continuous health checks
- Latency monitoring
- Error detection
- Automatic fallback

#### Performance Impact

**Live Connection**
- Minimal bandwidth usage
- Instant updates
- Better user experience
- Recommended mode

**Polling Mode**
- Higher bandwidth usage
- 30-second delay
- Fallback only
- Still functional

---

## Appendix

### A. Keyboard Shortcuts

```
Dashboard Navigation:
- Alt + D: Go to Dashboard
- Alt + E: Go to Employees
- Alt + P: Go to Projects
- Alt + T: Go to Tasks

General:
- Alt + L: Logout
- Alt + S: Settings
- Alt + R: Refresh Data
```

### B. Browser Compatibility

**Fully Supported**
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

**Minimum Requirements**
- JavaScript enabled
- Cookies enabled
- LocalStorage available
- WebSocket support (for real-time)

### C. Troubleshooting

**Cannot Login**
1. Verify credentials
2. Check account status
3. Clear browser cache
4. Try different browser
5. Contact administrator

**Dashboard Not Loading**
1. Check internet connection
2. Refresh page (Ctrl+F5)
3. Clear browser cache
4. Check browser console for errors
5. Contact support

**Real-Time Updates Not Working**
1. Check connection status
2. Click reconnect button
3. Refresh page
4. Check firewall settings
5. Verify WebSocket support

**Statistics Not Updating**
1. Click manual refresh
2. Check connection status
3. Verify permissions
4. Clear cache
5. Contact administrator

### D. Support Information

**Technical Support**
- Email: support@rayerp.com
- Documentation: /docs
- System Status: /status

**Administrator Contact**
- Check with your system administrator
- Internal IT support
- Help desk portal

---

**End of User Manual**

*This document is based on RayERP version 2.0.0 and reflects the actual implementation as of 2024. Features and interfaces may change in future versions.*
