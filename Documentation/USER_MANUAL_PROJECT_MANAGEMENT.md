# RayERP - User Manual: Project Management

**Version**: 2.0.0  
**Status**: Production Ready  
**Last Updated**: 2024  
**Module**: Project Management

---

## Table of Contents

1. [Overview](#1-overview)
2. [Getting Started](#2-getting-started)
3. [Project Creation](#3-project-creation)
4. [Project Management](#4-project-management)
5. [Team Management](#5-team-management)
6. [Budget Management](#6-budget-management)
7. [Timeline & Milestones](#7-timeline--milestones)
8. [File Management](#8-file-management)
9. [Risk Management](#9-risk-management)
10. [Project Instructions](#10-project-instructions)
11. [Project Permissions](#11-project-permissions)
12. [Project Analytics](#12-project-analytics)
13. [Activity Tracking](#13-activity-tracking)
14. [Project Templates](#14-project-templates)
15. [Best Practices](#15-best-practices)

---

## 1. Overview

### What is Project Management?

The Project Management module in RayERP provides comprehensive tools for planning, executing, and monitoring projects from inception to completion. It supports multi-manager projects, team collaboration, budget tracking, and real-time progress monitoring.

### Key Features

- **Project Lifecycle Management** - Planning, Active, On-Hold, Completed, Cancelled
- **Multi-Manager Support** - Assign multiple project managers
- **Team Collaboration** - Add team members with specific roles
- **Budget Tracking** - Track budget allocation and spending
- **Progress Monitoring** - Manual or automatic progress calculation
- **Milestone Management** - Define and track project milestones
- **Risk Management** - Identify, assess, and mitigate risks
- **File Management** - Upload, share, and manage project files
- **Timeline Visualization** - Gantt charts and timeline views
- **Activity Logging** - Complete audit trail of project activities
- **Permissions System** - Granular access control
- **Multi-Currency Support** - USD default with currency conversion

### Access Requirements

**Permissions Required**:
- `projects.view` - View projects
- `projects.create` - Create new projects
- `projects.edit` - Edit project details
- `projects.delete` - Delete projects
- `projects.manage_team` - Add/remove team members

**Access Path**: `/dashboard/projects`

---

## 2. Getting Started

### Accessing Projects

1. Log in to RayERP
2. Navigate to **Dashboard** → **Projects**
3. View list of all projects you have access to

### Project Views

**Available Views**:
- **All Projects** - Complete list of projects
- **My Projects** - Projects you own or manage
- **Active Projects** - Currently active projects
- **Planning** - Projects in planning phase
- **On-Hold** - Paused projects
- **Completed** - Finished projects
- **By Department** - Filter by department

### Quick Actions

- **Create Project** - Start a new project
- **View Stats** - See project statistics
- **Project Analytics** - Access analytics dashboard
- **My Tasks** - View your assigned tasks

---

## 3. Project Creation

### Creating a New Project

**Step 1: Navigate to Create Project**
- Click **"Create Project"** button
- Or go to `/dashboard/projects/create`

**Step 2: Fill Basic Information**

**Required Fields**:
- **Project Name** - Unique, descriptive name
- **Description** - Detailed project description
- **Start Date** - Project start date
- **End Date** - Expected completion date

**Optional Fields**:
- **Status** - Planning (default), Active, On-Hold, Completed, Cancelled
- **Priority** - Low, Medium (default), High, Critical
- **Budget** - Total project budget (default: 0)
- **Currency** - USD (default), EUR, GBP, INR, etc.
- **Client** - Client name or organization
- **Tags** - Keywords for categorization

**Step 3: Assign Team**

**Managers** (Required):
- Select one or more project managers
- Managers have full project control
- Can add/remove team members

**Team Members** (Optional):
- Add team members who will work on the project
- Can be added later

**Departments** (Optional):
- Link project to one or more departments
- Useful for department-wise reporting

**Step 4: Configure Settings**

**Progress Tracking**:
- **Auto-Calculate Progress** - Enabled by default
- Calculates progress based on completed tasks
- Can be disabled for manual progress updates

**Step 5: Save Project**
- Click **"Create Project"**
- Project is created with status "Planning"
- You are redirected to project details page

### Fast Project Creation

For quick project setup:
- Use minimal required fields
- Add details later as project evolves
- Start with Planning status

---

## 4. Project Management

### Viewing Project Details

**Access**: Click on any project from the list

**Project Overview Section**:
- Project name and description
- Current status and priority
- Start and end dates
- Budget and spent amount
- Progress percentage
- Owner and managers
- Team members count
- Department associations
- Client information
- Tags

### Editing Project Information

**Step 1: Access Edit Mode**
- Click **"Edit Project"** button
- Requires `projects.edit` permission

**Step 2: Update Fields**
- Modify any project field
- Changes are validated before saving

**Step 3: Save Changes**
- Click **"Save"**
- Activity log is updated automatically

**Editable Fields**:
- Name, description
- Status, priority
- Start date, end date
- Budget, currency
- Client, tags
- Progress (if auto-calculate is off)

### Project Status Management

**Available Statuses**:

1. **Planning**
   - Initial project setup
   - Team formation
   - Resource allocation
   - Budget planning

2. **Active**
   - Project execution phase
   - Tasks are being worked on
   - Regular progress updates

3. **On-Hold**
   - Temporarily paused
   - Awaiting resources or decisions
   - Can be resumed later

4. **Completed**
   - All tasks finished
   - Deliverables submitted
   - Final review done

5. **Cancelled**
   - Project terminated
   - Resources released
   - Archived for reference

**Changing Status**:
- Use status dropdown in project details
- Or use **"Update Status"** action
- Status changes are logged in activity

### Project Priority Levels

**Priority Options**:
- **Low** - Non-urgent projects
- **Medium** - Standard priority (default)
- **High** - Important projects requiring attention
- **Critical** - Urgent projects with highest priority

**Priority Impact**:
- Affects project sorting and filtering
- Influences resource allocation decisions
- Visible in dashboards and reports

### Progress Tracking

**Automatic Progress Calculation**:
- Enabled by default
- Formula: `(Completed Tasks / Total Tasks) × 100`
- Updates in real-time as tasks are completed

**Manual Progress Updates**:
- Disable auto-calculate in project settings
- Manually set progress percentage (0-100)
- Useful for projects without task breakdown

### Deleting Projects

**Requirements**:
- `projects.delete` permission
- Confirmation required

**Warning**: Deleting a project will:
- Remove all associated tasks
- Delete project files
- Remove timeline events
- Clear activity logs
- This action cannot be undone

**Steps**:
1. Open project details
2. Click **"Delete Project"**
3. Confirm deletion
4. Project is permanently removed

---

## 5. Team Management

### Adding Team Members

**Step 1: Access Team Management**
- Go to project details
- Click **"Team"** tab or **"Add Member"**

**Step 2: Select Member**
- Choose employee from dropdown
- Search by name or department

**Step 3: Assign Role**
- **Manager** - Full project control
- **Team Member** - Work on assigned tasks

**Step 4: Confirm**
- Click **"Add"**
- Member receives notification
- Activity is logged

**Requirements**:
- `projects.manage_team` permission
- Must be project manager or owner

### Managing Multiple Managers

**Benefits**:
- Shared project responsibility
- Better workload distribution
- Continuity during absences

**Adding Managers**:
- Add employee as manager during creation
- Or promote team member to manager
- Multiple managers have equal permissions

**Manager Capabilities**:
- Edit project details
- Add/remove team members
- Manage project budget
- Set permissions
- Delete project (if owner)

### Removing Team Members

**Step 1: Access Team List**
- Go to project details → Team tab

**Step 2: Select Member**
- Find member to remove
- Click **"Remove"** icon

**Step 3: Confirm Removal**
- Confirm action
- Member loses project access
- Assigned tasks are reassigned or unassigned

**Note**: Cannot remove project owner

### Viewing Team Members

**Team List Shows**:
- Member name and photo
- Role (Manager/Team Member)
- Department
- Contact information
- Assigned tasks count
- Join date

**Filtering Options**:
- By role
- By department
- By task assignment status

---

## 6. Budget Management

### Setting Project Budget

**Initial Budget Setup**:
- Set during project creation
- Or add later in project edit

**Budget Fields**:
- **Budget Amount** - Total allocated budget
- **Currency** - USD (default), EUR, GBP, INR, etc.
- **Spent Budget** - Automatically tracked

**Currency Support**:
- Default: USD
- Supports multiple currencies
- Automatic conversion for reporting

### Tracking Budget Spending

**Spent Budget Calculation**:
- Automatically updated from project expenses
- Linked to finance module
- Real-time updates

**Budget Metrics**:
- **Total Budget** - Allocated amount
- **Spent** - Amount used
- **Remaining** - Budget - Spent
- **Utilization %** - (Spent / Budget) × 100

### Budget Analytics

**Access**: Project Details → Finance → Analytics

**Available Reports**:
- **Burndown Chart** - Budget consumption over time
- **Budget vs Actual** - Planned vs actual spending
- **Cost Breakdown** - Spending by category
- **Forecast** - Projected final cost

**Budget Alerts**:
- Warning at 80% utilization
- Critical at 90% utilization
- Over-budget notification

### Budget Adjustments

**Increasing Budget**:
- Edit project details
- Update budget amount
- Requires approval (if configured)
- Change is logged

**Budget Transfers**:
- Transfer budget between projects
- Requires finance permissions
- Maintains audit trail

---

## 7. Timeline & Milestones

### Creating Milestones

**Step 1: Access Milestones**
- Go to project details
- Click **"Milestones"** tab

**Step 2: Add Milestone**
- Click **"Add Milestone"**

**Step 3: Fill Details**

**Required Fields**:
- **Name** - Milestone title
- **Due Date** - Target completion date

**Optional Fields**:
- **Description** - Milestone details
- **Status** - Pending, In-Progress, Completed, Delayed

**Step 4: Save**
- Click **"Create"**
- Milestone appears in timeline

### Milestone Statuses

**Status Options**:

1. **Pending** - Not started yet
2. **In-Progress** - Currently working on it
3. **Completed** - Successfully finished
4. **Delayed** - Past due date, not completed

**Status Updates**:
- Update manually as work progresses
- Set completion date when marking complete
- Delayed status auto-set if past due

### Timeline Visualization

**Access**: Project Details → Timeline

**Timeline Features**:
- **Gantt Chart** - Visual project timeline
- **Milestones** - Key project events
- **Tasks** - Task dependencies and duration
- **Events** - Project activities

**Timeline Data**:
- Project start and end dates
- Milestone due dates
- Task start and completion dates
- Critical path visualization

**Multi-Project Timeline**:
- View timelines of multiple projects
- Compare project schedules
- Identify resource conflicts

### Managing Timeline Events

**Event Types**:
- Project created
- Status changed
- Milestone completed
- Budget updated
- Team member added/removed
- File uploaded
- Risk identified

**Event Details**:
- Event type and description
- User who performed action
- Timestamp
- Related resources

---

## 8. File Management

### Uploading Files

**Step 1: Access Files**
- Go to project details
- Click **"Files"** tab

**Step 2: Upload**
- Click **"Upload File"**
- Select file from computer
- Or drag and drop

**Step 3: Add Details**
- File name (auto-filled)
- Description (optional)
- Category/tags (optional)

**Step 4: Confirm**
- Click **"Upload"**
- File is processed and stored
- Team is notified

**Supported File Types**:
- Documents: PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX
- Images: JPG, PNG, GIF, SVG
- Archives: ZIP, RAR
- Text: TXT, CSV, JSON, XML
- Other: As configured by admin

**File Size Limits**:
- Maximum file size: As configured
- Multiple files can be uploaded

### Managing Project Files

**File List Shows**:
- File name and type
- File size
- Upload date and time
- Uploaded by (user)
- Download count
- Shared status

**File Actions**:
- **Download** - Download file to computer
- **Share** - Share with specific team members
- **Delete** - Remove file (requires permission)
- **View Details** - See file metadata

### Sharing Files

**Step 1: Select File**
- Find file in list
- Click **"Share"** icon

**Step 2: Choose Recipients**
- Select team members
- Or share with entire team
- Or share with specific departments

**Step 3: Set Permissions**
- View only
- Download allowed
- Edit allowed (if applicable)

**Step 4: Confirm**
- Click **"Share"**
- Recipients receive notification
- Access is granted immediately

### Downloading Files

**Single File Download**:
- Click download icon
- File downloads to browser default location

**Bulk Download**:
- Select multiple files
- Click **"Download Selected"**
- Files are zipped and downloaded

**Shared Files**:
- Access shared files from **"Shared Files"** section
- View files shared across all your projects

---

## 9. Risk Management

### Identifying Risks

**Step 1: Access Risk Management**
- Go to project details
- Click **"Risks"** tab

**Step 2: Add Risk**
- Click **"Add Risk"**

**Step 3: Define Risk**

**Required Fields**:
- **Title** - Brief risk description
- **Description** - Detailed risk explanation
- **Severity** - Low, Medium, High, Critical
- **Probability** - Low, Medium, High

**Optional Fields**:
- **Mitigation Plan** - How to reduce/eliminate risk
- **Status** - Identified, Mitigated, Resolved
- **Identified Date** - When risk was discovered

**Step 4: Save**
- Click **"Create"**
- Risk is added to project

### Risk Severity Levels

**Severity Options**:

1. **Low** - Minor impact, easy to handle
2. **Medium** - Moderate impact, manageable
3. **High** - Significant impact, needs attention
4. **Critical** - Severe impact, immediate action required

### Risk Probability

**Probability Levels**:

1. **Low** - Unlikely to occur (< 30%)
2. **Medium** - Moderate chance (30-70%)
3. **High** - Likely to occur (> 70%)

### Risk Status Tracking

**Status Options**:

1. **Identified** - Risk discovered, not yet addressed
2. **Mitigated** - Actions taken to reduce risk
3. **Resolved** - Risk eliminated or occurred and handled

**Updating Risk Status**:
- Edit risk details
- Update status as mitigation progresses
- Add notes on actions taken

### Risk Assessment

**Risk Matrix**:
- Combines severity and probability
- Identifies high-priority risks
- Guides resource allocation

**Risk Score** = Severity × Probability

**Priority Ranking**:
- Critical/High probability = Highest priority
- High/Medium probability = High priority
- Medium/Medium probability = Medium priority
- Low severity = Lower priority

### Mitigation Planning

**Mitigation Strategies**:
- **Avoid** - Change plans to eliminate risk
- **Reduce** - Take actions to lower probability/impact
- **Transfer** - Shift risk to third party (insurance)
- **Accept** - Acknowledge and monitor risk

**Documenting Mitigation**:
- Add mitigation plan in risk details
- Assign responsibility for mitigation
- Set target dates for mitigation actions
- Track progress in risk status

---

## 10. Project Instructions

### Creating Instructions

**Step 1: Access Instructions**
- Go to project details
- Click **"Instructions"** tab

**Step 2: Add Instruction**
- Click **"Add Instruction"**

**Step 3: Fill Details**

**Required Fields**:
- **Title** - Instruction heading
- **Content** - Detailed instruction text

**Optional Fields**:
- **Type** - General, Task, Milestone, Safety, Quality
- **Priority** - Low, Medium, High

**Step 4: Save**
- Click **"Create"**
- Instruction is added to project

### Instruction Types

**Type Options**:

1. **General** - Overall project guidelines
2. **Task** - Task-specific instructions
3. **Milestone** - Milestone-related guidance
4. **Safety** - Safety protocols and requirements
5. **Quality** - Quality standards and checks

### Instruction Priority

**Priority Levels**:

1. **Low** - Nice-to-know information
2. **Medium** - Important guidelines (default)
3. **High** - Critical instructions, must follow

### Managing Instructions

**Viewing Instructions**:
- Listed in Instructions tab
- Sorted by priority and date
- Filterable by type

**Editing Instructions**:
- Click **"Edit"** on instruction
- Update title, content, type, or priority
- Save changes

**Deleting Instructions**:
- Click **"Delete"** on instruction
- Confirm deletion
- Instruction is removed

**Instruction Metadata**:
- Created by (user)
- Created date
- Last updated date
- Last updated by

---

## 11. Project Permissions

### Understanding Permissions

**Permission Levels**:

1. **View** - See project details
2. **Edit** - Modify project information
3. **Manage Team** - Add/remove members
4. **Manage Budget** - Update budget
5. **Manage Files** - Upload/delete files
6. **Manage Tasks** - Create/assign tasks
7. **Delete** - Remove project

### Setting Employee Permissions

**Step 1: Access Permissions**
- Go to project details
- Click **"Permissions"** tab

**Step 2: Select Employee**
- Choose employee from list
- Or search by name

**Step 3: Set Permissions**
- Check permissions to grant
- Uncheck to revoke

**Step 4: Save**
- Click **"Save Permissions"**
- Changes take effect immediately

### Default Permissions

**Project Owner**:
- All permissions automatically
- Cannot be removed as owner
- Can transfer ownership

**Project Managers**:
- All permissions except delete
- Can manage team and budget
- Can set permissions for others

**Team Members**:
- View project details
- View and complete assigned tasks
- Upload files
- Add comments

**Non-Members**:
- No access by default
- Must be added to team first

### Viewing Permissions

**Check Employee Permissions**:
- Go to Permissions tab
- Select employee
- View granted permissions

**Permission Audit**:
- See who has what access
- Identify over-privileged users
- Ensure least privilege principle

---

## 12. Project Analytics

### Accessing Analytics

**Path**: Project Details → Finance → Analytics

**Requirements**:
- Project view permission
- Finance module access (if configured)

### Available Analytics

#### 1. Burndown Chart

**Purpose**: Track budget consumption over time

**Metrics**:
- Planned spending curve
- Actual spending curve
- Variance between planned and actual
- Projected completion cost

**Use Cases**:
- Monitor budget health
- Identify overspending early
- Forecast final project cost

#### 2. Velocity Metrics

**Purpose**: Measure team productivity

**Metrics**:
- Tasks completed per sprint/week
- Average task completion time
- Team velocity trend
- Productivity index

**Use Cases**:
- Assess team performance
- Plan future sprints
- Identify bottlenecks

#### 3. Resource Utilization

**Purpose**: Track resource allocation and usage

**Metrics**:
- Team member workload
- Resource allocation percentage
- Idle time vs productive time
- Resource conflicts

**Use Cases**:
- Balance workload
- Optimize resource allocation
- Identify over/under-utilized resources

#### 4. Performance Indices

**Purpose**: Overall project health indicators

**Metrics**:
- **CPI** (Cost Performance Index) - Budget efficiency
- **SPI** (Schedule Performance Index) - Timeline efficiency
- **EAC** (Estimate at Completion) - Projected final cost
- **ETC** (Estimate to Complete) - Remaining cost

**Formulas**:
- CPI = Earned Value / Actual Cost
- SPI = Earned Value / Planned Value
- EAC = Budget / CPI
- ETC = EAC - Actual Cost

**Interpretation**:
- CPI/SPI > 1.0 = Ahead of plan
- CPI/SPI = 1.0 = On track
- CPI/SPI < 1.0 = Behind plan

#### 5. Risk Assessment

**Purpose**: Analyze project risks

**Metrics**:
- Total risks identified
- Risks by severity
- Risks by status
- Risk trend over time
- Mitigation effectiveness

**Risk Dashboard**:
- High-priority risks
- Unmitigated risks
- Recently identified risks
- Resolved risks

### Exporting Analytics

**Export Options**:
- PDF report
- Excel spreadsheet
- CSV data
- JSON data

**Export Steps**:
1. Select analytics view
2. Click **"Export"**
3. Choose format
4. Download file

---

## 13. Activity Tracking

### Viewing Activity Logs

**Access**: Project Details → Activity

**Activity Log Shows**:
- Action performed
- User who performed action
- Timestamp
- Resource affected
- Before/after values (if applicable)

### Activity Types

**Tracked Activities**:
- Project created
- Project updated (field changes)
- Status changed
- Team member added/removed
- Budget updated
- Milestone added/completed
- Risk identified/resolved
- File uploaded/deleted
- Task created/completed
- Instruction added/updated
- Permission changed

### Filtering Activities

**Filter Options**:
- **By Resource Type** - Task, File, Budget, etc.
- **By User** - Activities by specific user
- **By Date Range** - Activities in time period
- **By Action Type** - Create, Update, Delete

**Applying Filters**:
1. Click **"Filter"** button
2. Select filter criteria
3. Click **"Apply"**
4. View filtered results

### Activity Pagination

**Navigation**:
- Default: 20 activities per page
- Use pagination controls to navigate
- Jump to specific page

**Customization**:
- Change items per page (10, 20, 50, 100)
- Sort by date (newest/oldest first)

### Activity Details

**Viewing Details**:
- Click on activity entry
- See full details in modal/panel

**Details Include**:
- Complete description
- User information
- Exact timestamp
- IP address (if logged)
- Related resources
- Change history

---

## 14. Project Templates

### Using Project Templates

**Purpose**: Quickly create projects from predefined templates

**Benefits**:
- Faster project setup
- Consistent project structure
- Pre-defined tasks and milestones
- Standard workflows

### Viewing Available Templates

**Access**: Projects → Templates

**Template List Shows**:
- Template name
- Description
- Number of tasks
- Number of milestones
- Created by
- Last used date

### Creating Project from Template

**Step 1: Select Template**
- Browse template list
- Click **"Use Template"**

**Step 2: Customize Project**
- Update project name
- Modify description
- Adjust dates
- Set budget
- Assign team

**Step 3: Review Template Content**
- Preview included tasks
- Review milestones
- Check instructions

**Step 4: Create**
- Click **"Create from Template"**
- Project is created with template structure
- Tasks and milestones are copied

### Exporting Project as Template

**Step 1: Open Project**
- Navigate to project details

**Step 2: Export**
- Click **"Export as Template"**

**Step 3: Configure Template**
- Set template name
- Add description
- Choose what to include:
  - Tasks
  - Milestones
  - Instructions
  - Required skills

**Step 4: Save**
- Click **"Save Template"**
- Template is available for future use

### Cloning Projects

**Purpose**: Duplicate existing project

**Step 1: Select Project**
- Open project to clone

**Step 2: Clone**
- Click **"Clone Project"**

**Step 3: Configure Clone**
- New project name
- Adjust dates
- Choose what to copy:
  - Team members
  - Tasks
  - Milestones
  - Files
  - Budget structure

**Step 4: Create**
- Click **"Clone"**
- New project is created

**Note**: Cloning creates independent copy, changes don't affect original

---

## 15. Best Practices

### Project Planning

**Before Creating Project**:
- Define clear objectives
- Identify stakeholders
- Estimate resources needed
- Set realistic timeline
- Determine budget constraints

**During Project Setup**:
- Use descriptive project names
- Write detailed descriptions
- Set appropriate priority
- Add relevant tags
- Link to departments

### Team Management

**Building Effective Teams**:
- Assign multiple managers for large projects
- Balance team skills and experience
- Clearly define roles and responsibilities
- Ensure adequate resources

**Communication**:
- Set clear expectations
- Regular status updates
- Use project instructions for guidelines
- Document decisions in activity log

### Budget Management

**Budget Planning**:
- Include contingency (10-20%)
- Break down by categories
- Set spending milestones
- Regular budget reviews

**Cost Control**:
- Monitor spending weekly
- Address variances immediately
- Use budget alerts
- Document all expenses

### Timeline Management

**Setting Milestones**:
- Align with project phases
- Set realistic due dates
- Include buffer time
- Review and adjust regularly

**Progress Tracking**:
- Enable auto-calculate for task-based projects
- Update progress weekly
- Address delays promptly
- Communicate timeline changes

### Risk Management

**Proactive Risk Management**:
- Identify risks early
- Assess impact and probability
- Develop mitigation plans
- Review risks regularly

**Risk Response**:
- Address high-priority risks first
- Document mitigation actions
- Update risk status
- Learn from resolved risks

### File Management

**File Organization**:
- Use clear file names
- Add descriptions
- Organize by categories
- Remove obsolete files

**File Security**:
- Share files selectively
- Set appropriate permissions
- Regular access reviews
- Backup important files

### Permissions Management

**Security Best Practices**:
- Follow least privilege principle
- Review permissions regularly
- Remove access for departed members
- Document permission changes

**Access Control**:
- Grant permissions based on role
- Limit delete permissions
- Audit permission changes
- Train team on security

### Reporting and Analytics

**Regular Reviews**:
- Weekly progress reviews
- Monthly budget reviews
- Quarterly performance analysis
- Post-project retrospectives

**Data-Driven Decisions**:
- Use analytics for planning
- Track key metrics
- Identify trends early
- Adjust based on data

### Project Closure

**Completion Checklist**:
- All tasks completed
- Deliverables submitted
- Budget reconciled
- Files archived
- Lessons learned documented
- Team feedback collected

**Post-Project**:
- Update status to Completed
- Generate final reports
- Archive project files
- Share learnings with team
- Celebrate success

---

## Appendix

### Keyboard Shortcuts

- `Ctrl + N` - New project
- `Ctrl + S` - Save changes
- `Ctrl + F` - Search projects
- `Esc` - Close modal

### Common Issues

**Issue**: Cannot create project
- **Solution**: Check `projects.create` permission

**Issue**: Team member not visible
- **Solution**: Ensure employee is active in system

**Issue**: Budget not updating
- **Solution**: Check finance module integration

**Issue**: Files not uploading
- **Solution**: Check file size and type restrictions

### Support

For additional help:
- Contact system administrator
- Refer to RayERP documentation
- Submit support ticket

---

**Document Version**: 2.0.0  
**Last Updated**: 2024  
**Prepared By**: RayERP Development Team
