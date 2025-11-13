# Employee-User Synchronization Guide

## Problem
Employees and users need to be properly synchronized:
- Employees without user accounts
- User data out of sync with employee data
- Orphaned users without employees

## Solution
Run the comprehensive sync script to synchronize all employee and user data.

## Usage

```bash
cd backend
node scripts/syncEmployeesUsers.js
```

## What It Does

### Step 1: Create Users for Employees
- Finds employees without user accounts
- Links to existing users if email matches
- Creates new users with employee data

### Step 2: Sync Names
- Updates user names to match employee names
- Format: `${firstName} ${lastName}`

### Step 3: Sync Emails
- Ensures user email matches employee email
- Employee email is the source of truth

### Step 4: Detect Orphaned Users
- Identifies users without corresponding employees
- Excludes Root, Superadmin, and Admin roles

### Step 5: Validate
- Confirms all employees have valid user accounts
- Reports any remaining issues

## Output Example

```
✅ Connected to MongoDB

🔄 Starting Employee-User Synchronization...

📋 Step 1: Creating users for employees without user accounts...
  ✅ Created user for John Smith
  🔗 Linked Sarah Johnson to existing user

📋 Step 2: Syncing user names with employee names...
  🔄 Updated user name: J. Smith → John Smith

📋 Step 3: Syncing emails between employees and users...
  📧 Updated email: old@email.com → new@email.com

📋 Step 4: Checking for orphaned users...
  ⚠️  Found orphaned user: Test User (test@email.com)

📋 Step 5: Validating all employees have users...

==================================================
📊 Synchronization Summary:
==================================================
  Users Created/Linked:     5
  Names Synced:             2
  Emails Synced:            1
  Orphaned Users Found:     1
  Invalid Employees:        0
==================================================

✅ All employees are properly synced with users!
```

## Automatic Sync on Updates

When you update an employee:
- User name automatically syncs with employee name
- User email automatically syncs with employee email
- Changes propagate immediately

## After Synchronization

✅ All employees have user accounts
✅ User data matches employee data
✅ Names and emails are synchronized
✅ Orphaned users are identified
✅ System is in consistent state

## Important Notes

- **Safe to run anytime** - Idempotent and non-destructive
- **Automatic linking** - Matches existing users by email
- **Default password** - Employee ID (hashed)
- **Preserves admin users** - Won't flag Root/Superadmin/Admin as orphaned
- **Real-time sync** - Future updates automatically sync

## When to Run

- After importing employee data
- After manual database changes
- When user data seems out of sync
- As part of regular maintenance
- Before deploying to production
