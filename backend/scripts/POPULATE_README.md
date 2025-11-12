# ERP Population Script

## Overview
The `populateERP.js` script creates comprehensive sample data for the RayERP system, including users, departments, employees, projects, tasks, contacts, and budgets.

## Usage

### Run the Population Script
```bash
cd backend
node scripts/populateERP.js
```

### Clear Finance Data Only
```bash
cd backend
node scripts/clearFinanceData.js
```

## What Gets Created

### 🔐 Roles (5)
- **Root** - System administrator (Level 100)
- **Superadmin** - Administrative access (Level 90)
- **Admin** - Department-level admin (Level 80)
- **Manager** - Team/project management (Level 70)
- **Employee** - Basic user access (Level 60)

### 🏢 Departments (5)
- **Information Technology** - $500K budget
- **Human Resources** - $300K budget
- **Finance** - $250K budget
- **Marketing** - $400K budget
- **Operations** - $350K budget

### 👥 Users & Employees (10)
- **Root Admin** (root@rayerp.com)
- **John Smith** - IT Director
- **Sarah Johnson** - HR Manager
- **Michael Brown** - Finance Manager
- **Emily Davis** - Marketing Manager
- **David Wilson** - Operations Manager
- **Alice Cooper** - Senior Developer
- **Bob Martinez** - DevOps Engineer
- **Carol White** - Marketing Specialist
- **Daniel Lee** - Financial Analyst

### 📊 Projects (3)
- **ERP System Enhancement** - Active, High Priority
- **Employee Onboarding Portal** - Planning, Medium Priority
- **Marketing Campaign Analytics** - Active, Medium Priority

### 📋 Tasks (4)
- Database Schema Design (In Progress)
- API Development (Todo)
- Onboarding Workflow Design (Todo)
- Campaign Data Integration (Completed)

### 📞 Contacts (3)
- TechCorp Solutions (Vendor)
- Global Marketing Inc (Partner)
- Enterprise Client Corp (Client)

### 💰 Department Budgets (3)
- IT Department Budget with 4 categories
- HR Department Budget with 3 categories
- Marketing Department Budget with 3 categories

## Login Credentials

All users have the password: **password123**

### Key Accounts
- **Root Admin**: root@rayerp.com
- **IT Director**: john.smith@rayerp.com
- **HR Manager**: sarah.johnson@rayerp.com
- **Finance Manager**: michael.brown@rayerp.com
- **Marketing Manager**: emily.davis@rayerp.com

## Features Demonstrated

### ✅ Complete User Hierarchy
- Role-based access control
- Department assignments
- Manager-employee relationships

### ✅ Project Management
- Multi-department projects
- Task assignments
- Progress tracking
- Milestones and risks

### ✅ Budget Management
- Department-wise budgets
- Category-based tracking
- Approval workflows

### ✅ Employee Management
- Complete employee profiles
- Skills and emergency contacts
- Department associations

## Notes

- **Data Safety**: Script clears existing data before populating
- **Realistic Data**: Uses professional names, addresses, and scenarios
- **Relationships**: All foreign key relationships are properly established
- **Permissions**: Department-based permissions are configured
- **Status Variety**: Different statuses for projects, tasks, and employees

## Customization

To modify the sample data:
1. Edit the arrays in `populateERP.js`
2. Adjust budgets, dates, or relationships as needed
3. Run `npm run populate` to apply changes

## Troubleshooting

### Common Issues
- **MongoDB Connection**: Ensure MongoDB is running and `.env` is configured
- **Permission Errors**: Check file permissions in the scripts directory
- **Duplicate Data**: Script clears existing data, but manual cleanup may be needed

### Reset Everything
```bash
# Clear all data and repopulate
node scripts/populateERP.js
```