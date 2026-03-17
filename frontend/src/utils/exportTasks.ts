export const exportTasksToCSV = (tasks: any[], filename: string = 'tasks.csv') => {
  // Define CSV headers
  const headers = [
    'ID',
    'Title',
    'Description',
    'Status',
    'Priority',
    'Task Type',
    'Assignment Type',
    'Assigned To',
    'Assigned By',
    'Due Date',
    'Estimated Hours',
    'Actual Hours',
    'Tags',
    'Checklist Progress',
    'Time Logged (minutes)',
    'Attachments Count',
    'Comments Count',
    'Watchers Count',
    'Dependencies Count',
    'Subtasks Count',
    'Is Recurring',
    'Is Template',
    'Created At',
    'Updated At'
  ];

  // Convert tasks to CSV rows
  const rows = tasks.map(task => {
    const assignedTo = typeof task.assignedTo === 'object' 
      ? `${task.assignedTo.firstName} ${task.assignedTo.lastName}`
      : 'Unassigned';
    
    const assignedBy = typeof task.assignedBy === 'object'
      ? `${task.assignedBy.firstName} ${task.assignedBy.lastName}`
      : '';

    const tags = task.tags?.map((t: any) => typeof t === 'object' ? t.name : t).join('; ') || '';
    
    const checklistProgress = task.checklist?.length 
      ? `${task.checklist.filter((c: any) => c.completed).length}/${task.checklist.length}`
      : '0/0';
    
    const timeLogged = task.timeEntries?.reduce((sum: number, e: any) => sum + (e.duration || 0), 0) || 0;

    return [
      task._id,
      escapeCSV(task.title),
      escapeCSV(task.description),
      task.status,
      task.priority,
      task.taskType || 'project',
      task.assignmentType || 'assigned',
      assignedTo,
      assignedBy,
      task.dueDate ? new Date(task.dueDate).toLocaleDateString() : '',
      task.estimatedHours || 0,
      task.actualHours || 0,
      escapeCSV(tags),
      checklistProgress,
      timeLogged,
      task.attachments?.length || 0,
      task.comments?.length || 0,
      task.watchers?.length || 0,
      task.dependencies?.length || 0,
      task.subtasks?.length || 0,
      task.isRecurring ? 'Yes' : 'No',
      task.isTemplate ? 'Yes' : 'No',
      new Date(task.createdAt).toLocaleString(),
      new Date(task.updatedAt).toLocaleString()
    ];
  });

  // Combine headers and rows
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.join(','))
  ].join('\n');

  // Create and download file
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// Helper function to escape CSV values
const escapeCSV = (value: string): string => {
  if (!value) return '';
  
  // If value contains comma, newline, or quote, wrap in quotes and escape quotes
  if (value.includes(',') || value.includes('\n') || value.includes('"')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  
  return value;
};

// Export filtered tasks
export const exportFilteredTasks = (
  tasks: any[],
  filters: {
    search?: string;
    status?: string;
    priority?: string;
    assignee?: string;
    taskType?: string;
    assignmentType?: string;
    overdue?: boolean;
  }
) => {
  let filtered = [...tasks];

  if (filters.search) {
    const search = filters.search.toLowerCase();
    filtered = filtered.filter(task => 
      task.title.toLowerCase().includes(search) ||
      task.description.toLowerCase().includes(search)
    );
  }

  if (filters.status) {
    filtered = filtered.filter(task => task.status === filters.status);
  }

  if (filters.priority) {
    filtered = filtered.filter(task => task.priority === filters.priority);
  }

  if (filters.assignee) {
    filtered = filtered.filter(task => {
      const assigneeId = typeof task.assignedTo === 'object' ? task.assignedTo._id : task.assignedTo;
      return assigneeId === filters.assignee;
    });
  }

  if (filters.taskType) {
    filtered = filtered.filter(task => task.taskType === filters.taskType);
  }

  if (filters.assignmentType) {
    filtered = filtered.filter(task => task.assignmentType === filters.assignmentType);
  }

  if (filters.overdue) {
    const now = new Date();
    filtered = filtered.filter(task => {
      if (!task.dueDate || task.status === 'completed') return false;
      return new Date(task.dueDate) < now;
    });
  }

  const timestamp = new Date().toISOString().split('T')[0];
  exportTasksToCSV(filtered, `tasks_export_${timestamp}.csv`);
};
