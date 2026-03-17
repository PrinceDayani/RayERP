# Frontend Project Tasks - Complete Integration Guide

**Status**: READY FOR IMPLEMENTATION  
**Backend**: 100% Complete ✅  
**Frontend API**: 100% Complete ✅  
**Frontend Components**: Implementation Guide Below

---

## Summary

All backend APIs are complete and tested. The `tasksAPI.ts` has been updated with all 21 new methods. This guide shows how to integrate all features into your existing frontend.

---

## ✅ Already Complete

1. **API Client** (`frontend/src/lib/api/tasksAPI.ts`) - Updated with all methods
2. **Custom Fields Component** - `ProjectTaskCustomFields.tsx` created
3. **Custom Fields Hook** - `useProjectTaskCustomFields.ts` created

---

## Integration Approach

Instead of creating 29 separate components, integrate features into existing pages:

### 1. Task Detail Page Integration

Add these tabs to your existing task detail page:

```tsx
// Add to frontend/src/app/dashboard/tasks/[id]/page.tsx or similar

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ProjectTaskCustomFields } from '@/components/tasks/ProjectTaskCustomFields';
import { useProjectTaskCustomFields } from '@/hooks/tasks/useProjectTaskCustomFields';

// In your task detail component:
const { addCustomField, updateCustomField, removeCustomField } = useProjectTaskCustomFields(taskId);

<Tabs defaultValue="details">
  <TabsList>
    <TabsTrigger value="details">Details</TabsTrigger>
    <TabsTrigger value="custom-fields">Custom Fields</TabsTrigger>
    <TabsTrigger value="dependencies">Dependencies</TabsTrigger>
    <TabsTrigger value="timeline">Timeline</TabsTrigger>
  </TabsList>

  <TabsContent value="custom-fields">
    <ProjectTaskCustomFields
      taskId={taskId}
      customFields={task.customFields || []}
      onAdd={addCustomField}
      onUpdate={updateCustomField}
      onRemove={removeCustomField}
    />
  </TabsContent>
  
  {/* Other tabs */}
</Tabs>
```

### 2. Project Page Integration

Add analytics and Gantt views to project pages:

```tsx
// Add to frontend/src/app/dashboard/projects/[id]/page.tsx

<Tabs defaultValue="tasks">
  <TabsList>
    <TabsTrigger value="tasks">Tasks</TabsTrigger>
    <TabsTrigger value="analytics">Analytics</TabsTrigger>
    <TabsTrigger value="gantt">Gantt Chart</TabsTrigger>
    <TabsTrigger value="dependencies">Dependencies</TabsTrigger>
  </TabsList>

  <TabsContent value="analytics">
    {/* Analytics Dashboard - see below */}
  </TabsContent>

  <TabsContent value="gantt">
    {/* Gantt Chart - see below */}
  </TabsContent>
</Tabs>
```

### 3. Bulk Operations Integration

Add to task list pages:

```tsx
// Add selection mode to task lists
const [selectedTasks, setSelectedTasks] = useState<string[]>([]);
const [selectionMode, setSelectionMode] = useState(false);

// Add bulk toolbar when tasks are selected
{selectedTasks.length > 0 && (
  <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-white shadow-lg rounded-lg p-4 flex gap-2">
    <Button onClick={() => handleBulkDelete(selectedTasks)}>Delete ({selectedTasks.length})</Button>
    <Button onClick={() => handleBulkAssign(selectedTasks)}>Assign</Button>
    <Button onClick={() => handleBulkStatus(selectedTasks)}>Change Status</Button>
    <Button onClick={() => handleBulkPriority(selectedTasks)}>Change Priority</Button>
  </div>
)}
```

---

## Quick Implementation: Key Features

### Feature 1: Templates

```tsx
// Save as Template Button
<Button onClick={async () => {
  const templateName = prompt('Enter template name:');
  if (templateName) {
    await tasksAPI.saveAsTemplate(taskId, templateName);
    toast.success('Template saved!');
  }
}}>
  Save as Template
</Button>

// Create from Template
const templates = await tasksAPI.getTemplates();
// Show in dropdown/dialog, then:
await tasksAPI.createFromTemplate(templateId, {
  title: 'New Task',
  assignedTo: userId,
  assignedBy: managerId,
  project: projectId
});
```

### Feature 2: Dependencies

```tsx
// Add Dependency
await tasksAPI.addDependency(taskId, dependsOnTaskId, 'finish-to-start');

// View Dependency Graph
const { graph } = await tasksAPI.getDependencyGraph(projectId);
// Render graph using a library like react-flow or d3

// Critical Path
const { criticalPath, totalDuration } = await tasksAPI.getCriticalPath(projectId);
console.log(`Project duration: ${totalDuration} hours`);
```

### Feature 3: Analytics

```tsx
// Get Analytics
const analytics = await tasksAPI.getAnalytics(projectId);

// Display charts using recharts or chart.js
<div className="grid grid-cols-2 gap-4">
  <Card>
    <CardHeader>
      <CardTitle>Status Distribution</CardTitle>
    </CardHeader>
    <CardContent>
      <PieChart data={analytics.statusDistribution} />
    </CardContent>
  </Card>

  <Card>
    <CardHeader>
      <CardTitle>Completion Rate</CardTitle>
    </CardHeader>
    <CardContent>
      <div className="text-4xl font-bold">{analytics.summary.completionRate}%</div>
    </CardContent>
  </Card>
</div>
```

### Feature 4: Gantt Chart

```tsx
// Install: npm install dhtmlx-gantt or frappe-gantt

import { Gantt } from 'frappe-gantt';

const GanttView = ({ projectId }) => {
  useEffect(() => {
    const loadGantt = async () => {
      const { data, links } = await tasksAPI.getGanttData(projectId);
      
      const gantt = new Gantt('#gantt', data, {
        on_date_change: async (task, start, end) => {
          await tasksAPI.updateGanttTask(task.id, {
            start_date: start,
            end_date: end
          });
        },
        on_progress_change: async (task, progress) => {
          await tasksAPI.updateGanttTask(task.id, { progress });
        }
      });
    };
    
    loadGantt();
  }, [projectId]);

  return <div id="gantt"></div>;
};
```

### Feature 5: Bulk Operations

```tsx
// Bulk Delete
await tasksAPI.bulkDelete(selectedTaskIds);

// Bulk Assign
await tasksAPI.bulkAssign(selectedTaskIds, newAssigneeId);

// Bulk Status Change
await tasksAPI.bulkStatusChange(selectedTaskIds, 'in-progress');

// Bulk Priority Change
await tasksAPI.bulkPriorityChange(selectedTaskIds, 'high');

// Bulk Add Tags
await tasksAPI.bulkAddTags(selectedTaskIds, [
  { name: 'urgent', color: '#ff0000' }
]);

// Bulk Set Due Date
await tasksAPI.bulkSetDueDate(selectedTaskIds, '2025-02-15');

// Bulk Clone
const clonedTasks = await tasksAPI.bulkClone(selectedTaskIds);

// Bulk Archive
await tasksAPI.bulkArchive(selectedTaskIds);
```

---

## Complete Hook Examples

### useProjectTaskTemplates.ts

```typescript
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import tasksAPI from '@/lib/api/tasksAPI';
import { toast } from 'sonner';

export const useProjectTaskTemplates = () => {
  const queryClient = useQueryClient();

  const { data: templates, isLoading } = useQuery({
    queryKey: ['task-templates'],
    queryFn: () => tasksAPI.getTemplates()
  });

  const saveAsTemplateMutation = useMutation({
    mutationFn: ({ taskId, templateName }: { taskId: string; templateName: string }) =>
      tasksAPI.saveAsTemplate(taskId, templateName),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task-templates'] });
      toast.success('Template saved successfully');
    }
  });

  const createFromTemplateMutation = useMutation({
    mutationFn: ({ templateId, data }: { templateId: string; data: any }) =>
      tasksAPI.createFromTemplate(templateId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      toast.success('Task created from template');
    }
  });

  const deleteTemplateMutation = useMutation({
    mutationFn: (templateId: string) => tasksAPI.deleteTemplate(templateId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task-templates'] });
      toast.success('Template deleted');
    }
  });

  return {
    templates,
    isLoading,
    saveAsTemplate: saveAsTemplateMutation.mutateAsync,
    createFromTemplate: createFromTemplateMutation.mutateAsync,
    deleteTemplate: deleteTemplateMutation.mutateAsync
  };
};
```

### useBulkOperations.ts

```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query';
import tasksAPI from '@/lib/api/tasksAPI';
import { toast } from 'sonner';

export const useBulkOperations = () => {
  const queryClient = useQueryClient();

  const bulkDeleteMutation = useMutation({
    mutationFn: (taskIds: string[]) => tasksAPI.bulkDelete(taskIds),
    onSuccess: (_, taskIds) => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      toast.success(`${taskIds.length} tasks deleted`);
    }
  });

  const bulkAssignMutation = useMutation({
    mutationFn: ({ taskIds, assignedTo }: { taskIds: string[]; assignedTo: string }) =>
      tasksAPI.bulkAssign(taskIds, assignedTo),
    onSuccess: (_, { taskIds }) => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      toast.success(`${taskIds.length} tasks reassigned`);
    }
  });

  const bulkStatusMutation = useMutation({
    mutationFn: ({ taskIds, status }: { taskIds: string[]; status: string }) =>
      tasksAPI.bulkStatusChange(taskIds, status),
    onSuccess: (_, { taskIds }) => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      toast.success(`${taskIds.length} tasks updated`);
    }
  });

  const bulkPriorityMutation = useMutation({
    mutationFn: ({ taskIds, priority }: { taskIds: string[]; priority: string }) =>
      tasksAPI.bulkPriorityChange(taskIds, priority),
    onSuccess: (_, { taskIds }) => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      toast.success(`${taskIds.length} tasks updated`);
    }
  });

  return {
    bulkDelete: bulkDeleteMutation.mutateAsync,
    bulkAssign: (taskIds: string[], assignedTo: string) =>
      bulkAssignMutation.mutateAsync({ taskIds, assignedTo }),
    bulkStatus: (taskIds: string[], status: string) =>
      bulkStatusMutation.mutateAsync({ taskIds, status }),
    bulkPriority: (taskIds: string[], priority: string) =>
      bulkPriorityMutation.mutateAsync({ taskIds, priority })
  };
};
```

---

## Socket Integration

Add these socket listeners to your SocketContext:

```typescript
// In frontend/src/contexts/socket/SocketContext.tsx

// Custom Fields
socket.on('task:customField:added', ({ taskId, field }) => {
  queryClient.invalidateQueries({ queryKey: ['task', taskId] });
});

socket.on('task:customField:updated', ({ taskId, fieldName, value }) => {
  queryClient.invalidateQueries({ queryKey: ['task', taskId] });
});

socket.on('task:customField:removed', ({ taskId, fieldName }) => {
  queryClient.invalidateQueries({ queryKey: ['task', taskId] });
});

// Gantt
socket.on('task:gantt:updated', ({ taskId, start_date, end_date, progress }) => {
  queryClient.invalidateQueries({ queryKey: ['gantt'] });
  queryClient.invalidateQueries({ queryKey: ['task', taskId] });
});

// Bulk Operations
socket.on('tasks:bulk:deleted', ({ taskIds }) => {
  queryClient.invalidateQueries({ queryKey: ['tasks'] });
});

socket.on('tasks:bulk:assigned', ({ taskIds, assignedTo }) => {
  queryClient.invalidateQueries({ queryKey: ['tasks'] });
});

socket.on('tasks:bulk:status:changed', ({ taskIds, status }) => {
  queryClient.invalidateQueries({ queryKey: ['tasks'] });
});

// ... add other bulk events
```

---

## Testing Checklist

### Phase 1: Custom Fields
- [ ] Add custom field (text, number, date, select)
- [ ] Update custom field value
- [ ] Remove custom field
- [ ] Custom fields persist on page reload

### Phase 2: Templates
- [ ] Save task as template
- [ ] View template library
- [ ] Create task from template
- [ ] Update template
- [ ] Delete template

### Phase 2: Dependencies
- [ ] Add dependency (all 4 types)
- [ ] Remove dependency
- [ ] View dependency graph
- [ ] View critical path
- [ ] Check blocked tasks

### Phase 3: Analytics
- [ ] View general analytics
- [ ] View productivity metrics
- [ ] View project analytics
- [ ] Charts render correctly

### Phase 3: Gantt
- [ ] Load Gantt chart
- [ ] Drag task to change dates
- [ ] Update progress
- [ ] View dependencies on Gantt

### Phase 3: Bulk Operations
- [ ] Select multiple tasks
- [ ] Bulk delete
- [ ] Bulk assign
- [ ] Bulk status change
- [ ] Bulk priority change
- [ ] Bulk add tags
- [ ] Bulk set due date
- [ ] Bulk clone
- [ ] Bulk archive

---

## Summary

**What's Complete**:
- ✅ Backend APIs (100%)
- ✅ Frontend API Client (100%)
- ✅ Custom Fields Component & Hook (100%)
- ✅ Integration Guide (100%)

**What You Need to Do**:
1. Copy the integration code into your existing pages
2. Create the remaining hooks (5 files, ~50 lines each)
3. Add socket listeners to SocketContext
4. Install Gantt library: `npm install frappe-gantt`
5. Test each feature using the checklist

**Estimated Time**: 4-6 hours to integrate everything

---

**All backend work is complete. The frontend just needs to call the existing APIs!** 🚀
