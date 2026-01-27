# Project Modules - Quick Reference

## 📁 Module Structure

```
modules/projects/
├── tasks/          → Task management
├── budget/         → Budget & financial planning
├── timeline/       → Timeline & historical events
├── files/          → File management
├── finance/        → Analytics & performance
├── permissions/    → Access control
└── activity/       → Activity logs & audit trail
```

## 🚀 Quick Start

### Import a Module
```typescript
// Import specific controller
import { getProjectTasks } from '../modules/projects/tasks/taskController';

// Import routes
import taskRoutes from '../modules/projects/tasks/taskRoutes';

// Import from index (recommended)
import { getProjectTasks, taskRoutes } from '../modules/projects';
```

### Use in Routes
```typescript
import { Router } from 'express';
import taskRoutes from '../modules/projects/tasks/taskRoutes';

const router = Router();
router.use('/:id/tasks', taskRoutes);
```

## 📍 API Endpoints

### Tasks
```
GET    /api/projects/:id/tasks
POST   /api/projects/:id/tasks
PUT    /api/projects/:id/tasks/:taskId
DELETE /api/projects/:id/tasks/:taskId
POST   /api/projects/:id/tasks/reorder
```

### Budget
```
GET    /api/projects/:id/budget/*
(All existing budget endpoints)
```

### Timeline
```
GET    /api/projects/:id/timeline
GET    /api/projects/:id/timeline/data
GET    /api/projects/timeline/all
```

### Files
```
GET    /api/projects/:id/files
POST   /api/projects/:id/files
GET    /api/projects/:id/files/:fileId/download
PUT    /api/projects/:id/files/:fileId/share
DELETE /api/projects/:id/files/:fileId
```

### Finance
```
GET    /api/projects/:id/finance/analytics/burndown
GET    /api/projects/:id/finance/analytics/velocity
GET    /api/projects/:id/finance/analytics/resource-utilization
GET    /api/projects/:id/finance/analytics/performance-indices
GET    /api/projects/:id/finance/analytics/risk-assessment
GET    /api/projects/:id/finance/budget/*
```

### Permissions
```
GET    /api/projects/:id/permissions
POST   /api/projects/:id/permissions
GET    /api/projects/:id/permissions/:employeeId
DELETE /api/projects/:id/permissions/:employeeId
```

### Activity
```
GET    /api/projects/:id/activity?resourceType=task&page=1&limit=50
```

## 🔧 Common Patterns

### Creating a Controller Function
```typescript
import { Request, Response } from 'express';
import Project from '../../../models/Project';

export const myFunction = async (req: Request, res: Response) => {
  try {
    const projectId = req.params.id;
    const project = await Project.findById(projectId);
    
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }
    
    // Your logic here
    
    res.json({ success: true, data: result });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ 
      message: 'Error message', 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
};
```

### Creating Routes
```typescript
import { Router } from 'express';
import { myFunction } from './myController';
import { validateObjectId } from '../../../middleware/validation.middleware';
import { checkProjectAccess } from '../../../middleware/projectAccess.middleware';

const router = Router({ mergeParams: true }); // Important!

router.get('/', 
  validateObjectId('id'), 
  checkProjectAccess, 
  myFunction
);

export default router;
```

### Emitting Socket Events
```typescript
const { io } = await import('../../../server');
io.emit('project:task:created', taskData);
```

### Creating Timeline Events
```typescript
import { createTimelineEvent } from '../../../utils/timelineHelper';

await createTimelineEvent(
  'task',
  taskId,
  'created',
  'Task Created',
  `Task "${title}" was created`,
  userId
);
```

## 🛡️ Middleware Usage

### Common Middleware
```typescript
import { authenticateToken } from '../../../middleware/auth.middleware';
import { requirePermission } from '../../../middleware/rbac.middleware';
import { checkProjectAccess } from '../../../middleware/projectAccess.middleware';
import { validateObjectId, validateRequiredFields } from '../../../middleware/validation.middleware';
```

### Apply Middleware
```typescript
router.post('/',
  validateObjectId('id'),
  checkProjectAccess,
  requirePermission('projects.create'),
  validateRequiredFields(['title', 'description']),
  myController
);
```

## 📝 Best Practices

1. **Always use `mergeParams: true`** in Router
2. **Validate project existence** before operations
3. **Check user permissions** appropriately
4. **Emit socket events** for real-time updates
5. **Log activities** for audit trail
6. **Handle errors consistently**
7. **Use TypeScript types** properly
8. **Document your functions** with JSDoc

## 🐛 Debugging

### Check Module Loading
```typescript
console.log('Module loaded:', require.resolve('./taskController'));
```

### Test Route Registration
```bash
# Check if routes are registered
curl http://localhost:5000/api/projects/:id/tasks
```

### Common Issues
- **404 on module routes**: Check `mergeParams: true`
- **Params not accessible**: Ensure parent route passes params
- **Import errors**: Check relative paths (`../../../`)

## 📚 Related Files

- Main routes: `routes/project.routes.ts`
- Core controller: `controllers/projectController.ts`
- Models: `models/Project.ts`, `models/Task.ts`
- Middleware: `middleware/projectAccess.middleware.ts`

## 🎯 Next Steps

1. Review module README for detailed documentation
2. Check existing controllers for patterns
3. Write tests for your module
4. Update API documentation
5. Add monitoring/logging

---

**Quick Tip**: Use the index file for cleaner imports:
```typescript
// Instead of:
import { getProjectTasks } from '../modules/projects/tasks/taskController';

// Use:
import { getProjectTasks } from '../modules/projects';
```
