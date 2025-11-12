# 🚀 Quick Start: Department Permissions

## In 3 Steps

### Step 1: Open Departments
```
Dashboard → Departments
```

### Step 2: Click Shield Button
```
Find any department card → Click 🛡️ (Shield icon)
```

### Step 3: Add Permissions
```
Type: projects.view
Press: Enter
Done! ✅
```

## Common Permissions (Copy & Paste)

### For Engineering Team
```
projects.view
projects.create
projects.update
tasks.view
tasks.create
tasks.update
```

### For HR Team
```
employees.view
employees.create
employees.update
attendance.view
leave.view
leave.approve
```

### For Finance Team
```
finance.view
finance.manage
budgets.view
expenses.view
reports.view
reports.export
```

### For Management
```
projects.view
tasks.view
employees.view
reports.view
analytics.view
```

## How to Add Multiple Permissions Fast

1. Click Shield button
2. Copy permission list above
3. Paste one permission at a time
4. Press Enter after each
5. Done!

## Verify It's Working

1. Check department card shows permission count
2. Close and reopen dialog - permissions should persist
3. Employees in that department now have those permissions

## Troubleshooting

**Can't see Shield button?**
- Refresh page (F5)
- Check you're on Departments page

**Permissions not saving?**
- Check backend is running (port 5000)
- Check browser console (F12) for errors

**Need help?**
- See [DEPARTMENT_PERMISSIONS_SETUP.md](DEPARTMENT_PERMISSIONS_SETUP.md)

---

**That's it! You're ready to use department permissions! 🎉**
