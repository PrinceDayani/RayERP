interface Activity {
  _id: string;
  timestamp: Date;
  userName: string;
  action: string;
  resource: string;
  resourceType: string;
  details: string;
  status: string;
  projectId?: { name: string };
  ipAddress?: string;
}

export const exportToCSV = (activities: Activity[], filename: string = 'activities.csv') => {
  const headers = ['Timestamp', 'User', 'Action', 'Resource', 'Type', 'Details', 'Status', 'Project', 'IP Address'];
  
  const rows = activities.map(activity => [
    new Date(activity.timestamp).toLocaleString(),
    activity.userName,
    activity.action,
    activity.resource,
    activity.resourceType,
    activity.details,
    activity.status,
    activity.projectId?.name || '',
    activity.ipAddress || ''
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
};

export const exportToExcel = (activities: Activity[], filename: string = 'activities.xlsx') => {
  const headers = ['Timestamp', 'User', 'Action', 'Resource', 'Type', 'Details', 'Status', 'Project', 'IP Address'];
  
  const rows = activities.map(activity => [
    new Date(activity.timestamp).toLocaleString(),
    activity.userName,
    activity.action,
    activity.resource,
    activity.resourceType,
    activity.details,
    activity.status,
    activity.projectId?.name || '',
    activity.ipAddress || ''
  ]);

  let html = '<table><thead><tr>';
  headers.forEach(header => {
    html += `<th>${header}</th>`;
  });
  html += '</tr></thead><tbody>';
  
  rows.forEach(row => {
    html += '<tr>';
    row.forEach(cell => {
      html += `<td>${String(cell)}</td>`;
    });
    html += '</tr>';
  });
  html += '</tbody></table>';

  const blob = new Blob([html], { type: 'application/vnd.ms-excel' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
};
