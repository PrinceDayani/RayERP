# Backend Task APIs - Master Quick Reference

## Phase 1: Core Operations

### Custom Fields
```bash
POST   /api/tasks/:id/custom-fields
DELETE /api/tasks/:id/custom-fields/:fieldName
PATCH  /api/tasks/:id/custom-fields/:fieldName
```

## Phase 2: Dependencies & Templates

### Dependencies
```bash
POST   /api/tasks/:id/dependencies
DELETE /api/tasks/:id/dependencies/:dependencyId
GET    /api/tasks/dependencies/graph
GET    /api/tasks/dependencies/critical-path
GET    /api/tasks/:id/dependencies/blocked
```

### Templates
```bash
GET    /api/tasks/templates/all
POST   /api/tasks/templates/:id/create
POST   /api/tasks/:id/templates/save
PUT    /api/tasks/templates/:id
DELETE /api/tasks/templates/:id
```

## Phase 3: Advanced Features

### Analytics
```bash
GET /api/tasks/analytics
GET /api/tasks/analytics/productivity
GET /api/tasks/analytics/project
```

### Gantt Chart
```bash
GET   /api/tasks/gantt
PATCH /api/tasks/gantt/:id
```

### Bulk Operations
```bash
DELETE /api/tasks/bulk/delete
PATCH  /api/tasks/bulk/assign
PATCH  /api/tasks/bulk/status
PATCH  /api/tasks/bulk/priority
PATCH  /api/tasks/bulk/tags
PATCH  /api/tasks/bulk/due-date
POST   /api/tasks/bulk/clone
PATCH  /api/tasks/bulk/archive
```

## Common Request Examples

### Add Custom Field
```json
POST /api/tasks/:id/custom-fields
{
  "fieldName": "Sprint",
  "fieldType": "select",
  "value": "Sprint 23",
  "options": ["Sprint 22", "Sprint 23", "Sprint 24"]
}
```

### Save as Template
```json
POST /api/tasks/:id/templates/save
{
  "templateName": "Bug Fix Template"
}
```

### Add Dependency
```json
POST /api/tasks/:id/dependencies
{
  "dependsOn": "task_id",
  "type": "finish-to-start"
}
```

### Bulk Status Change
```json
PATCH /api/tasks/bulk/status
{
  "taskIds": ["id1", "id2", "id3"],
  "status": "in-progress"
}
```

### Update from Gantt
```json
PATCH /api/tasks/gantt/:id
{
  "start_date": "2025-01-16",
  "end_date": "2025-01-22",
  "progress": 0.75
}
```

## Quick Workflows

### Template Workflow
```typescript
// 1. Save task as template
const { template } = await api.post('/tasks/123/templates/save', {
  templateName: 'Feature Template'
});

// 2. Create from template
await api.post(`/tasks/templates/${template._id}/create`, {
  title: 'New Feature',
  assignedTo: 'emp_id',
  assignedBy: 'mgr_id'
});
```

### Bulk Update Workflow
```typescript
const taskIds = ['task1', 'task2', 'task3'];

// Change priority
await api.patch('/tasks/bulk/priority', { taskIds, priority: 'high' });

// Add tags
await api.patch('/tasks/bulk/tags', { 
  taskIds, 
  tags: [{ name: 'urgent', color: '#ff0000' }] 
});

// Set due date
await api.patch('/tasks/bulk/due-date', { taskIds, dueDate: '2025-02-01' });
```

### Analytics Dashboard
```typescript
// Get analytics
const analytics = await api.get('/tasks/analytics?projectId=xxx');

// Get productivity
const productivity = await api.get('/tasks/analytics/productivity?userId=yyy');

// Get project stats
const project = await api.get('/tasks/analytics/project?projectId=xxx');
```

## Status: ALL PHASES COMPLETE ✅
- Phase 1: Core Operations (3 endpoints)
- Phase 2: Dependencies & Templates (10 endpoints)
- Phase 3: Advanced Features (13 endpoints)
- **Total New Endpoints**: 19
- **Total Endpoints**: 70+
