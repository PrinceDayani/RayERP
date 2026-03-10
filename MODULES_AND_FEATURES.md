# RayERP — Modules & Features

> Derived entirely from source code (controllers, routes, frontend pages, mobile screens).  
> Last updated: based on current codebase state.

---

## Platforms

| Platform | Stack |
|---|---|
| Web Backend | Express.js + TypeScript + MongoDB |
| Web Frontend | Next.js 15 + TypeScript + Tailwind + Shadcn/ui |
| Mobile App | Flutter (Android, iOS, Web, Desktop) |
| Real-time | Socket.IO |

---

## 1. Authentication & Session Management

**Routes:** `/api/auth`, `/api/sessions`

- User registration with automatic role assignment (first user = Root)
- JWT-based login with HTTP-only cookie
- Logout with session invalidation
- Check auth status / get current user
- Change password
- 2-session limit enforcement per user (oldest session auto-revoked)
- Session tracking: device info, browser, OS, IP address
- Account status enforcement: `active`, `inactive`, `disabled`, `pending_approval`
- Activity logging on login/logout
- CSRF token support

---

## 2. User & Role Management (RBAC)

**Routes:** `/api/users`, `/api/rbac`, `/api/permissions`, `/api/permission-management`

- Create, read, update, delete users
- Role-based access control with hierarchical role levels
- Single Root user enforcement (cannot create second Root)
- Role permissions as string arrays with wildcard (`*`) support
- Cannot assign roles of equal or higher level than own role
- Permission management per user and per role
- High-level role manager UI
- User status management (active/inactive/disabled)
- Pending status request approval flow

---

## 3. Employee Management

**Routes:** `/api/employees`, `/api/salary`, `/api/career`, `/api/achievements`

- Full CRUD for employees with auto-generated `EMP####` IDs
- Auto-creates linked User account on employee creation (password = employeeId)
- Syncs User name/email when employee is updated
- Deletes linked User when employee is deleted
- Multi-department assignment (primary + additional departments)
- Manager assignment
- Salary management with permission-gated access (`employees.view_salary`, `employees.edit_salary`)
- Salary update with effective date and reason logging
- Employee task list and task statistics per employee
- Career history tracking
- Achievements tracking
- Skills management
- Employee reports
- Profile management
- Onboarding workflow

---

## 4. Department Management

**Routes:** `/api/departments`, `/api/department-budgets`

- Full CRUD for departments with confirmation-required deletion
- Employee assignment and unassignment
- Auto employee count sync
- Department permissions (granular permission strings per department)
- Budget tracking per department (allocated, spent, remaining, utilization %)
- Budget history (monthly records)
- Expense breakdown by category
- Department analytics: employee stats, project stats, activity trends, performance metrics
- Department projects listing
- Performance metrics: productivity, satisfaction, retention, growth, efficiency, quality score
- Resource utilization metrics
- Compliance status tracking
- Goals tracking
- Budget adjustment (increase/decrease with reason)
- Bulk delete and bulk update departments
- Export departments as CSV or JSON
- Activity logs per department
- Notifications per department
- Caching with 5-minute TTL

---

## 5. Project Management

**Routes:** `/api/projects`, `/api/project-templates`

- Full CRUD for projects
- Fast project creation endpoint (non-blocking background tasks)
- Project cloning
- Role-based project visibility: Root/`projects.view_all` see all; others see only assigned projects
- Department-level basic view for department members with `projects.view` permission
- Multiple managers support (`managers` array)
- Team member management (add/remove members)
- Project status management: `planning`, `active`, `completed`, `on-hold`
- Priority levels: `low`, `medium`, `high`, `critical`
- Milestone management (CRUD on milestones)
- Risk management (CRUD on risks)
- Project instructions (CRUD: title, content, type, priority)
- Task reordering (drag-and-drop order + column/status)
- Progress auto-calculation from task completion %
- Timeline data (Gantt-style: project + tasks with dates and progress)
- All-projects timeline overview
- Project activity log (paginated)
- Project stats: total, active, completed, overdue tasks, at-risk, overdue projects
- View filters: active, completed, overdue, high-priority
- Project templates (software, marketing, construction, R&D, event)
- Real-time socket events for all mutations
- Notification emission on project updates
- Tags support
- Client field
- Budget and currency per project

---

## 6. Task Management

**Routes:** `/api/tasks`, `/api/tasks/analytics`

- Full CRUD for tasks
- Task assignment to employees
- Task status: `todo`, `in-progress`, `completed`, `blocked`
- Priority levels
- Due dates
- Comments with user mentions
- Attachments (upload/remove files)
- Tags (name + hex color)
- Watchers (add/remove)
- Time tracking: start/stop timer per user, calculates duration in minutes, accumulates `actualHours`
- Estimated hours vs actual hours
- Task cloning
- Bulk update tasks
- Task templates (create from template, save as template)
- Task dependencies
- Subtasks / parent task hierarchy
- Recurring tasks
- Task calendar view
- Task search
- Task analytics
- Task stats (total, completed, in-progress, overdue)
- Timeline events per task (status changes, comments, updates)
- Role-based access: Root/level≥80 see all; others see assigned project tasks + directly assigned tasks
- Department-level basic task view with `tasks.view` permission
- Notification on task assignment
- Real-time socket events for all mutations

---

## 7. Attendance Management

**Routes:** `/api/attendance`

- Check-in with automatic late detection (>15 min after 9:00 AM = `late`)
- Check-out with automatic total hours calculation
- Half-day detection (<4 hours = `half-day`)
- Manual attendance request (requires approval)
- Attendance approval/rejection workflow with reason
- Card/biometric data sync (`entrySource: 'card'`, auto-approved)
- Attendance stats: monthly (present days, late days, half days, total hours, avg hours) + today's real-time stats
- Date range filtering
- Today's dashboard stats (present count, late arrivals, total hours, avg hours)
- Real-time socket events

---

## 8. Leave Management

**Routes:** `/api/leaves`

- Leave request creation with auto total-days calculation
- Leave types: `sick`, `vacation`, `personal`, `maternity`, `paternity`, `emergency`
- Leave approval/rejection with approver tracking
- Leave cancellation (pending or approved leaves)
- Leave balance per employee per year (used vs total per type)
- Date range filtering and status filtering
- Real-time socket events

---

## 9. Finance Module

**Routes:** `/api/finance`, `/api/invoices-enhanced`, `/api/journal-entries`, `/api/journal-enhanced`, `/api/vouchers`, `/api/transactions`, `/api/expenses`, `/api/receipts`, `/api/bills`

### Invoices & Payments
- Create invoices with line items, tax, discount, subtotal, balance
- Create payments with payment method (CASH, BANK_TRANSFER, CHEQUE, UPI, CARD, NEFT, RTGS, WALLET)
- Payment allocation to invoices (partial and full)
- Invoice status lifecycle: `DRAFT` → `SENT` → `VIEWED` → `PARTIALLY_PAID` → `PAID`
- Mark invoice as paid (auto journal entry)
- Approve/reject finance records
- Bulk approve and bulk delete
- Overdue invoice tracking
- Unallocated payment tracking
- Invoice duplication
- PDF generation and download
- Email sending
- Finance analytics: total revenue, invoice count, overdue amount, avg payment time, revenue trend (6 months), status breakdown, payment method breakdown
- Cash flow data (grouped by day/week/month)

### Journal Entries
- Double-entry bookkeeping
- Journal entry templates
- Enhanced journal entries
- Recurring entries
- Journal number auto-generation
- Period closing
- GL budget management

### Chart of Accounts
- Full chart of accounts management
- Account groups, sub-groups, types, ledgers
- Account notes
- Indian chart of accounts support
- Account templates

### General Ledger
- General ledger with advanced queries
- Master ledger
- Account ledger per account
- Party ledger (customer/vendor)
- Project ledger
- Reference balance tracking

### Vouchers & Bills
- Voucher management (payment, receipt, journal, contra)
- Bills management with bill details and payments
- Receipt management

### Budget (Finance)
- GL budgets
- Budget vs actual comparison
- Budget forecasting
- Budget templates
- Budget transfers between categories
- Budget variance analysis
- Budget alerts (threshold-based)
- Budget approval workflow (Director-only approval)
- Budget comments
- Budget revisions
- Budget rollover
- Budget consolidation
- Budget custom reports
- Budget dashboard
- Budget comparison
- Department budgets
- Budget spending tracking per category
- Budget utilization tracking with alerts (>90% warning, exceeded critical)

### Reports & Analytics
- Profit & Loss report
- Balance Sheet
- Cash Flow Statement
- Trial Balance
- Advanced reports
- Sales reports
- Financial reports enhanced
- Aging analysis (AR/AP)
- Bank reconciliation
- Interest calculation
- Tax management
- Cost centers with allocation rules
- Multi-currency support with exchange rates
- Currency settings per user
- Fiscal year management
- Year-end closing
- Smart alerts
- Audit trail
- Data export

### Integrated Finance
- Project finance (project-level P&L, ledger)
- Integrated finance dashboard
- Finance advanced features

---

## 10. Budget Module (Project/Department)

**Routes:** `/api/budgets`, `/api/budget-forecasts`, `/api/budget-templates`

- Create budgets linked to project or department
- Budget types: project, department, special
- Approval workflow (Director/Root only can approve)
- Reject budget with comments
- Budget deletion requires Director approval (request → approve flow)
- Approved budgets are immutable (cannot modify, must create new version)
- Category-level allocation and spending tracking
- Budget summary: total amount, spent, remaining, avg utilization, status breakdown, category breakdown
- Budget utilization tracking with on-track/warning/over status
- Forecasting engine
- Variance analyzer
- Budget socket events (real-time updates)
- Cron jobs for budget monitoring

---

## 11. Approval Workflow

**Routes:** `/api/approvals`

- Multi-level approval workflow (configurable levels per entity type)
- Amount-based level determination (higher amounts = more levels)
- Priority assignment: LOW (<50k), MEDIUM (50k–200k), HIGH (>200k)
- Approve with comments (level-by-level progression)
- Reject with mandatory reason
- All-levels-approved triggers completion handler
- Approval stats: pending, under review, approved today, total pending amount
- Approval history (paginated)
- Send reminder to approvers
- Search approvals by ID/title
- Integrations: invoice approval, journal approval, payment approval, expense voucher approval
- Real-time socket events for approval actions

---

## 12. Communication

**Routes:** `/api/chat`, `/api/broadcast`, `/api/notifications`, `/api/notification-settings`

### Chat
- 1-on-1 chat (get or create)
- Group chat support
- Send messages: text, file, image, location
- File size limit: 5MB (Base64 storage)
- Message read/unread tracking
- Mark messages as read
- Root user cannot be messaged
- Notifications to participants on new message
- Activity logging for file/image messages
- Real-time via Socket.IO rooms
- Message metadata: IP, user agent, device, browser, OS, location

### Broadcast
- System-wide broadcast messages

### Notifications
- In-app notifications with type, title, message, priority, action URL
- Notification settings per user
- Notification center with real-time updates
- Notification sound support (PWA)

---

## 13. Resource Management

**Routes:** `/api/resources`

- Resource allocation to projects
- Allocation calendar view
- Capacity planning
- Conflict detection
- Skill matrix
- Skill gap analysis
- Skill analytics
- Project-skill matching
- Workload timeline
- Available employees listing
- Allocation summary

---

## 14. Analytics & Reporting

**Routes:** `/api/analytics`, `/api/reports`, `/api/employee-reports`, `/api/sales-reports`, `/api/advanced-reports`

- Dashboard analytics with real-time stats
- Project analytics (per project and global)
- Task analytics
- Employee reports
- Sales reports
- Advanced financial reports
- Approval analytics
- Invoice analytics
- Budget analytics
- Financial reports
- Trends data
- Activity charts
- Real-time chart updates via Socket.IO

---

## 15. System Administration

**Routes:** `/api/admin`, `/api/system-logs`, `/api/audit-trail`, `/api/backup`, `/api/data-export`

- Admin dashboard stats (total users, active users, pending approvals, system alerts)
- User management (create, update, delete users + linked employees)
- Activity log viewer with filters (action, status)
- Log export: TXT, PDF, CSV, Excel
- General settings management
- Security settings management
- Notification settings management
- Backup settings management
- Manual backup trigger
- System logs viewer
- Audit trail with full action history
- Data export
- Performance monitoring
- Onboarding workflow management
- Role demo page

---

## 16. Contacts

**Routes:** `/api/contacts`

- Contact CRUD (create, view, edit, delete)
- Contact visibility migration support
- Contact health check utility

---

## 17. Settings

**Routes:** `/api/settings`

- General application settings
- Accounting mode settings
- Change password
- Real-time settings sync via Socket.IO

---

## 18. File Management

**Routes:** `/api/file-shares`

- File upload to projects (stored in `/uploads/projects/`)
- File sharing between users
- Shared files panel
- File share dialog
- File cleanup job (scheduled)
- GridFS upload support
- Document upload middleware
- Avatar uploads (`/uploads/avatars/`)
- Chat file uploads (`/uploads/chat/`)

---

## 19. Activity & Audit

**Routes:** `/api/activities`, `/api/audit-trail`

- Comprehensive activity logging on all mutations
- Activity log per project (paginated, filterable by resource type)
- Activity log per department
- Audit log with middleware auto-capture
- Admin activity middleware
- Real-time activity feed via Socket.IO
- Activity log cleanup utility

---

## 20. Mobile App (Flutter — `rayapp`)

Screens available in the Flutter app:

| Area | Screens |
|---|---|
| Auth | Login, Change Password |
| Dashboard | Dashboard Overview, Home Tab |
| Employees | List, Detail, Form, Achievements, Career, Skills, Salary, Performance, Projects, Reports, Resource Allocation |
| Attendance | List, Detail, Org Attendance, Org Leaves |
| Leave | Leave Card, Create Dialog |
| Departments | List, Detail, Form |
| Projects | List, Detail, Form, Budget, Financial, Ledger, Analytics, Timeline, Milestones, Risks, Settings, Templates, Clone, Reports, Global Analytics, Global Timeline |
| Tasks | List, Detail, Form, Kanban, Calendar, Analytics, Dependencies, Recurring, Templates |
| Resources | Dashboard, Allocation Form/Calendar/Summary, Capacity Planning, Conflict Detection, Skill Matrix/Gap/Analytics, Project-Skill Match, Workload Timeline, Available Employees |
| Analytics | Hub, Dashboard Analytics, Employee Reports, Financial Reports, Budget Analytics, Approval Analytics, Invoice Analytics |
| Communication | Chat, Broadcast, Activity Feed, Notifications, Notification Settings |
| Admin | User List/Form, Role List/Form, Permissions, Active Sessions, Pending Status Requests, Onboarding, Profile |

---

## Real-time Infrastructure (Socket.IO)

| Socket | Purpose |
|---|---|
| `auth.socket` | Auth events |
| `chat.socket` | Chat messages |
| `notification.socket` | Push notifications |
| `approval.socket` | Approval status updates |
| `realtime.socket` | Dashboard stats, activity log |
| `connection.socket` | Connection management |
| `settings.socket` | Settings sync |

---

## Background Jobs & Scheduled Tasks

- Session cleanup job
- File cleanup job
- Validation jobs
- Budget cron jobs (monitoring, alerts)
- Recurring entry scheduler
- Task reminders
- Notification cleanup
- Audit log cleanup
- Tax archival
- Recurring jobs scheduler
