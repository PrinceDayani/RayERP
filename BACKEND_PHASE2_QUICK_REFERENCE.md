# Backend Phase 2 - Quick Reference

## Dependency Operations

### Add Dependency
```bash
POST /api/tasks/:id/dependencies
Body: { "dependsOn": "task_id", "type": "finish-to-start" }
```

### Remove Dependency
```bash
DELETE /api/tasks/:id/dependencies/:dependencyId
```

### Get Dependency Graph
```bash
GET /api/tasks/dependencies/graph?projectId=xxx
```

### Get Critical Path
```bash
GET /api/tasks/dependencies/critical-path?projectId=xxx
```

### Check Blocked Tasks
```bash
GET /api/tasks/:id/dependencies/blocked
```

## Template Operations

### Get All Templates
```bash
GET /api/tasks/templates/all
```

### Create from Template
```bash
POST /api/tasks/templates/:id/create
Body: { "title": "...", "assignedTo": "...", "assignedBy": "...", "project": "..." }
```

### Save as Template (NEW)
```bash
POST /api/tasks/:id/templates/save
Body: { "templateName": "Template Name" }
```

### Update Template (NEW)
```bash
PUT /api/tasks/templates/:id
Body: { "title": "...", "description": "...", "estimatedHours": 8, ... }
```

### Delete Template (NEW)
```bash
DELETE /api/tasks/templates/:id
```

## Dependency Types

1. **finish-to-start** - Task B starts when Task A finishes (default)
2. **start-to-start** - Task B starts when Task A starts
3. **finish-to-finish** - Task B finishes when Task A finishes
4. **start-to-finish** - Task B finishes when Task A starts

## Quick Examples

### Create Dependency Chain
```typescript
// A → B → C (sequential)
await api.post('/tasks/B/dependencies', { dependsOn: 'A', type: 'finish-to-start' });
await api.post('/tasks/C/dependencies', { dependsOn: 'B', type: 'finish-to-start' });
```

### Template Workflow
```typescript
// 1. Save as template
const { template } = await api.post('/tasks/123/templates/save', { templateName: 'Bug Fix' });

// 2. Update template
await api.put(`/tasks/templates/${template._id}`, { estimatedHours: 4 });

// 3. Create from template
await api.post(`/tasks/templates/${template._id}/create`, { 
  title: 'Fix Login Bug',
  assignedTo: 'emp_id',
  assignedBy: 'mgr_id'
});
```

## Status: Phase 2 COMPLETE ✅
- 5 Dependency operations
- 5 Template operations
- Circular dependency detection
- Critical path analysis
