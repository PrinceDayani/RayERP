# Project Modules - Modular Architecture

## Overview
The project functionality has been refactored into a modular architecture for better organization, maintainability, and separation of concerns.

## Directory Structure

```
backend/src/modules/projects/
├── tasks/
│   ├── taskController.ts       # Task CRUD operations
│   └── taskRoutes.ts           # Task-related routes
├── budget/
│   ├── budgetController.ts     # Budget logic (placeholder)
│   └── budgetRoutes.ts         # Budget routes (re-exports existing)
├── timeline/
│   ├── timelineController.ts   # Timeline data & events
│   └── timelineRoutes.ts       # Timeline routes
├── files/
│   ├── fileController.ts       # File management (re-exports)
│   └── fileRoutes.ts           # File upload/download routes
├── finance/
│   ├── financeController.ts    # Analytics & financial data
│   └── financeRoutes.ts        # Finance & analytics routes
├── permissions/
│   ├── permissionController.ts # Project permissions (re-exports)
│   └── permissionRoutes.ts     # Permission management routes
└── activity/
    ├── activityController.ts   # Activity logs
    └── activityRoutes.ts       # Activity tracking routes
```

## Module Responsibilities

### 1. Tasks Module (`/tasks`)
**Purpose**: Manage project tasks and task operations

**Endpoints**:
- `GET /api/projects/:id/tasks` - Get all tasks for a project
- `POST /api/projects/:id/tasks` - Create a new task
- `PUT /api/projects/:id/tasks/:taskId` - Update a task
- `DELETE /api/projects/:id/tasks/:taskId` - Delete a task
- `POST /api/projects/:id/tasks/reorder` - Reorder tasks

**Features**:
- Task CRUD operations
- Task reordering
- Timeline event creation
- Real-time socket updates

---

### 2. Budget Module (`/budget`)
**Purpose**: Handle project budgets and financial planning

**Endpoints**:
- `GET /api/projects/:id/budget/*` - All budget-related endpoints
- Re-uses existing budget routes from `routes/budgetRoutes.ts`

**Features**:
- Budget allocation
- Budget tracking
- Variance analysis
- Budget forecasting

---

### 3. Timeline Module (`/timeline`)
**Purpose**: Manage project timelines and historical events

**Endpoints**:
- `GET /api/projects/:id/timeline` - Get project timeline events
- `GET /api/projects/:id/timeline/data` - Get timeline visualization data
- `GET /api/projects/timeline/all` - Get all projects timeline data

**Features**:
- Timeline event tracking
- Gantt chart data
- Historical project events
- Multi-project timeline view

---

### 4. Files Module (`/files`)
**Purpose**: Handle project file uploads, downloads, and sharing

**Endpoints**:
- `GET /api/projects/:id/files` - List project files
- `POST /api/projects/:id/files` - Upload a file
- `GET /api/projects/:id/files/:fileId/download` - Download a file
- `PUT /api/projects/:id/files/:fileId/share` - Share a file
- `DELETE /api/projects/:id/files/:fileId` - Delete a file

**Features**:
- File upload/download
- File sharing
- Access control
- File metadata management

---

### 5. Finance Module (`/finance`)
**Purpose**: Project financial analytics and performance metrics

**Endpoints**:
- `GET /api/projects/:id/finance/analytics/burndown` - Burndown chart data
- `GET /api/projects/:id/finance/analytics/velocity` - Team velocity metrics
- `GET /api/projects/:id/finance/analytics/resource-utilization` - Resource usage
- `GET /api/projects/:id/finance/analytics/performance-indices` - Performance KPIs
- `GET /api/projects/:id/finance/analytics/risk-assessment` - Risk analysis
- `GET /api/projects/:id/finance/budget/*` - Budget routes

**Features**:
- Financial analytics
- Performance metrics
- Resource utilization tracking
- Risk assessment
- Budget integration

---

### 6. Permissions Module (`/permissions`)
**Purpose**: Manage project-level permissions and access control

**Endpoints**:
- `GET /api/projects/:id/permissions` - Get all project permissions
- `POST /api/projects/:id/permissions` - Set permissions for an employee
- `GET /api/projects/:id/permissions/:employeeId` - Get employee permissions
- `DELETE /api/projects/:id/permissions/:employeeId` - Remove permissions

**Features**:
- Granular permission management
- Role-based access control
- Employee-specific permissions
- Permission inheritance

---

### 7. Activity Module (`/activity`)
**Purpose**: Track and display project activity logs

**Endpoints**:
- `GET /api/projects/:id/activity` - Get project activity logs

**Query Parameters**:
- `resourceType` - Filter by resource type (task, file, etc.)
- `page` - Pagination page number
- `limit` - Items per page

**Features**:
- Activity logging
- Audit trail
- Filtered activity views
- Pagination support

---

## Benefits of Modular Architecture

### 1. **Separation of Concerns**
Each module handles a specific domain of project functionality, making code easier to understand and maintain.

### 2. **Scalability**
New features can be added to specific modules without affecting others. New modules can be created easily.

### 3. **Maintainability**
Bugs and issues are isolated to specific modules, making debugging faster and safer.

### 4. **Testability**
Each module can be tested independently with focused unit and integration tests.

### 5. **Team Collaboration**
Different team members can work on different modules with minimal merge conflicts.

### 6. **Code Reusability**
Modules can be reused across different parts of the application or even in other projects.

---

## Migration Notes

### Backward Compatibility
All existing API endpoints remain unchanged. The refactoring is internal only.

### Route Structure
Routes are now organized hierarchically:
```
/api/projects/:id/tasks/*
/api/projects/:id/budget/*
/api/projects/:id/timeline/*
/api/projects/:id/files/*
/api/projects/:id/finance/*
/api/projects/:id/permissions/*
/api/projects/:id/activity/*
```

### Controller Organization
- Core project operations remain in `controllers/projectController.ts`
- Module-specific operations are in their respective module controllers
- Some modules re-export existing controllers for consistency

---

## Future Enhancements

### Potential New Modules
1. **Notifications Module** - Project-specific notifications
2. **Reports Module** - Custom project reports
3. **Templates Module** - Project templates management
4. **Integrations Module** - Third-party integrations
5. **Collaboration Module** - Team collaboration features

### Planned Improvements
- Add comprehensive unit tests for each module
- Implement module-level caching strategies
- Add module-specific rate limiting
- Create module-level documentation
- Add OpenAPI/Swagger documentation per module

---

## Development Guidelines

### Adding a New Module

1. **Create Directory Structure**
```bash
mkdir backend/src/modules/projects/[module-name]
```

2. **Create Controller**
```typescript
// [module-name]Controller.ts
import { Request, Response } from 'express';

export const someFunction = async (req: Request, res: Response) => {
  // Implementation
};
```

3. **Create Routes**
```typescript
// [module-name]Routes.ts
import { Router } from 'express';
import { someFunction } from './[module-name]Controller';

const router = Router({ mergeParams: true });
router.get('/', someFunction);

export default router;
```

4. **Register in Main Routes**
```typescript
// routes/project.routes.ts
import moduleRoutes from '../modules/projects/[module-name]/[module-name]Routes';
router.use('/:id/[module-name]', moduleRoutes);
```

### Module Best Practices

1. **Use `mergeParams: true`** in Router to access parent route params
2. **Keep controllers focused** on single responsibility
3. **Reuse existing middleware** for authentication and validation
4. **Document all endpoints** with JSDoc comments
5. **Handle errors consistently** across modules
6. **Emit socket events** for real-time updates
7. **Log activities** for audit trail

---

## Testing

### Module Testing Strategy
```typescript
// Example test structure
describe('Tasks Module', () => {
  describe('GET /api/projects/:id/tasks', () => {
    it('should return all tasks for a project', async () => {
      // Test implementation
    });
  });
});
```

### Integration Testing
Test module interactions to ensure seamless integration between modules.

---

## Monitoring & Logging

Each module should:
- Log important operations
- Track performance metrics
- Report errors with context
- Emit real-time events

---

## Version History

- **v1.0.0** (Current) - Initial modular refactoring
  - Created 7 core modules
  - Maintained backward compatibility
  - Updated main project routes

---

## Support

For questions or issues related to the modular architecture:
1. Check this documentation
2. Review module-specific code
3. Check existing tests
4. Consult the team lead

---

**Last Updated**: 2024
**Maintained By**: RayERP Development Team
