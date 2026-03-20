import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import UAParser from 'ua-parser-js';
import geoip from 'geoip-lite';

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
  duration?: number;
  sessionId?: string;
  requestId?: string;
  metadata?: any;
  deviceFingerprint?: string;
  browserDetails?: {
    name?: string;
    version?: string;
    os?: string;
    platform?: string;
  };
  geolocation?: {
    country?: string;
    city?: string;
    region?: string;
    timezone?: string;
  };
  referrerUrl?: string;
}

export const exportToCSV = (activities: Activity[], filename: string = 'activities.csv') => {
  const headers = ['Timestamp', 'User', 'Action', 'Resource', 'Type', 'Details', 'Status', 'Project', 'IP Address', 'Duration (ms)', 'Session ID'];
  
  const rows = activities.map(activity => [
    new Date(activity.timestamp).toLocaleString(),
    activity.userName,
    activity.action,
    activity.resource,
    activity.resourceType,
    activity.details,
    activity.status,
    activity.projectId?.name || '',
    activity.ipAddress || '',
    activity.duration?.toString() || '',
    activity.sessionId || ''
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
  const headers = ['Timestamp', 'User', 'Action', 'Resource', 'Type', 'Details', 'Status', 'Project', 'IP Address', 'Duration (ms)', 'Session ID', 'Request ID'];
  
  const rows = activities.map(activity => [
    new Date(activity.timestamp).toLocaleString(),
    activity.userName,
    activity.action,
    activity.resource,
    activity.resourceType,
    activity.details,
    activity.status,
    activity.projectId?.name || '',
    activity.ipAddress || '',
    activity.duration || '',
    activity.sessionId || '',
    activity.requestId || ''
  ]);

  const worksheet = XLSX.utils.aoa_to_sheet([headers, ...rows]);
  
  worksheet['!cols'] = [
    { wch: 20 }, { wch: 20 }, { wch: 12 }, { wch: 25 }, { wch: 12 },
    { wch: 40 }, { wch: 10 }, { wch: 20 }, { wch: 15 }, { wch: 12 },
    { wch: 25 }, { wch: 25 }
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Activities');
  XLSX.writeFile(workbook, filename);
};

export const exportToPDF = (activities: Activity[], filename: string = 'activities.pdf') => {
  const doc = new jsPDF('l', 'mm', 'a4');
  
  doc.setFontSize(16);
  doc.text('Activity Log Report', 14, 15);
  
  doc.setFontSize(10);
  doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 22);
  doc.text(`Total Records: ${activities.length}`, 14, 27);
  
  const headers = [['Timestamp', 'User', 'Action', 'Resource', 'Type', 'Status', 'Project', 'Duration']];
  const rows = activities.map(activity => [
    new Date(activity.timestamp).toLocaleString(),
    activity.userName,
    activity.action,
    activity.resource,
    activity.resourceType,
    activity.status,
    activity.projectId?.name || '',
    activity.duration ? `${activity.duration}ms` : ''
  ]);

  autoTable(doc, {
    head: headers,
    body: rows,
    startY: 32,
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [59, 130, 246], textColor: 255 },
    alternateRowStyles: { fillColor: [245, 247, 250] },
    columnStyles: {
      0: { cellWidth: 35 }, 1: { cellWidth: 30 }, 2: { cellWidth: 20 },
      3: { cellWidth: 40 }, 4: { cellWidth: 20 }, 5: { cellWidth: 20 },
      6: { cellWidth: 35 }, 7: { cellWidth: 20 }
    }
  });
  
  doc.save(filename);
};

export const fetchAllActivities = async (
  token: string,
  filters: Record<string, any>,
  onProgress?: (current: number, total: number) => void
): Promise<Activity[]> => {
  const allActivities: Activity[] = [];
  let page = 1;
  let totalPages = 1;

  while (page <= totalPages) {
    const filterParams = new URLSearchParams();
    filterParams.append('page', page.toString());
    filterParams.append('limit', '100');

    Object.entries(filters).forEach(([key, value]) => {
      if (value && value !== 'all') {
        filterParams.append(key, value);
      }
    });

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/activity?${filterParams.toString()}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch activities: ${response.statusText}`);
    }

    const data = await response.json();
    allActivities.push(...data.data);
    totalPages = data.pagination.pages;

    if (onProgress) {
      onProgress(page, totalPages);
    }

    page++;
  }

  return allActivities;
};

export const groupActivitiesByRequest = (activities: Activity[]): Map<string, Activity[]> => {
  const grouped = new Map<string, Activity[]>();
  
  activities.forEach(activity => {
    const key = activity.requestId || activity._id;
    if (!grouped.has(key)) {
      grouped.set(key, []);
    }
    grouped.get(key)!.push(activity);
  });
  
  return grouped;
};
