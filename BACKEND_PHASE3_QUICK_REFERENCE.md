# Backend Phase 3 - Quick Reference

## Analytics

### General Analytics
```bash
GET /api/tasks/analytics?projectId=xxx&userId=yyy&startDate=2025-01-01&endDate=2025-01-31
```

### Productivity Metrics
```bash
GET /api/tasks/analytics/productivity?userId=xxx&startDate=2025-01-01
```

### Project Analytics
```bash
GET /api/tasks/analytics/project?projectId=xxx
```

## Gantt Chart

### Get Gantt Data
```bash
GET /api/tasks/gantt?projectId=xxx
```

### Update from Gantt
```bash
PATCH /api/tasks/gantt/:id
Body: { "start_date": "2025-01-16", "end_date": "2025-01-22", "progress": 0.75 }
```

## Bulk Operations

### Bulk Delete
```bash
DELETE /api/tasks/bulk/delete
Body: { "taskIds": ["id1", "id2"] }
```

### Bulk Assign
```bash
PATCH /api/tasks/bulk/assign
Body: { "taskIds": ["id1", "id2"], "assignedTo": "employee_id" }
```

### Bulk Status Change
```bash
PATCH /api/tasks/bulk/status
Body: { "taskIds": ["id1", "id2"], "status": "in-progress" }
```

### Bulk Priority Change
```bash
PATCH /api/tasks/bulk/priority
Body: { "taskIds": ["id1", "id2"], "priority": "high" }
```

### Bulk Add Tags
```bash
PATCH /api/tasks/bulk/tags
Body: { "taskIds": ["id1", "id2"], "tags": [{"name": "urgent", "color": "#ff0000"}] }
```

### Bulk Set Due Date
```bash
PATCH /api/tasks/bulk/due-date
Body: { "taskIds": ["id1", "id2"], "dueDate": "2025-02-15" }
```

### Bulk Clone
```bash
POST /api/tasks/bulk/clone
Body: { "taskIds": ["id1", "id2"] }
```

### Bulk Archive
```bash
PATCH /api/tasks/bulk/archive
Body: { "taskIds": ["id1", "id2"] }
```

## Quick Examples

### Analytics Dashboard
```typescript
const analytics = await api.get('/tasks/analytics?projectId=xxx');
console.log(`Completion: ${analytics.data.summary.completionRate}%`);
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

## Status: Phase 3 COMPLETE ✅
- 3 Analytics endpoints
- 2 Gantt chart endpoints
- 8 Bulk operation endpoints
- 4 Calendar/Timeline endpoints (existed)
