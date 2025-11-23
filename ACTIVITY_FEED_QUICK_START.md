# Activity Feed - Quick Start Guide

## 🚀 For Developers: How to Add Activity Tracking

### Step 1: Import RealTimeEmitter
```typescript
const { RealTimeEmitter } = await import('../utils/realTimeEmitter');
```

### Step 2: Emit Activity
```typescript
await RealTimeEmitter.emitActivityLog({
  type: 'employee' | 'project' | 'task' | 'auth' | 'system',
  message: 'Human-readable description',
  user: req.user?.name || 'System',
  userId: req.user?._id?.toString(),
  metadata: {
    // Any relevant data
    entityId: entity._id,
    entityName: entity.name,
    oldValue: oldValue,
    newValue: newValue
  }
});
```

### Example: Add Activity to New Controller
```typescript
export const createInvoice = async (req: Request, res: Response) => {
  try {
    const invoice = await Invoice.create(req.body);
    
    // Emit activity
    const { RealTimeEmitter } = await import('../utils/realTimeEmitter');
    await RealTimeEmitter.emitActivityLog({
      type: 'invoice',
      message: `New invoice #${invoice.number} created`,
      user: req.user?.name || 'System',
      userId: req.user?._id?.toString(),
      metadata: {
        invoiceId: invoice._id,
        invoiceNumber: invoice.number,
        amount: invoice.total
      }
    });
    
    res.status(201).json(invoice);
  } catch (error) {
    res.status(400).json({ message: 'Error creating invoice', error });
  }
};
```

## 📋 Activity Types

| Type | Use For |
|------|---------|
| `employee` | Employee CRUD operations |
| `project` | Project CRUD operations |
| `task` | Task CRUD operations |
| `auth` | Login, logout, password changes |
| `invoice` | Invoice operations |
| `payment` | Payment operations |
| `system` | System-level events |

## 🎯 Best Practices

### ✅ DO
- Use clear, action-oriented messages
- Include entity names in messages
- Add relevant metadata
- Use past tense ("created", "updated", "deleted")
- Handle errors gracefully

### ❌ DON'T
- Include sensitive data in messages
- Use technical jargon
- Emit activities for read operations
- Block operations if activity fails
- Store large objects in metadata

## 🔍 Testing Your Activity

### 1. Open Dashboard
```bash
http://localhost:3000/dashboard
```

### 2. Perform Action
Create/update/delete an entity

### 3. Check Activity Feed
Look for your activity in the "Recent Activity" section

### 4. Verify Root Notification
If logged in as Root, you should see:
- 🔴 Red indicator
- Toast notification
- Activity at top of feed

## 🐛 Troubleshooting

### Activity Not Appearing?
1. Check Socket.IO connection (green "Live" badge)
2. Verify `await` keyword is used
3. Check browser console for errors
4. Verify user is authenticated

### Root Not Getting Notifications?
1. Verify user role is "Root"
2. Check socket authentication
3. Verify `root-users` room joining
4. Check backend logs

## 📞 Need Help?
Check `ACTIVITY_FEED_PRODUCTION.md` for detailed documentation.
