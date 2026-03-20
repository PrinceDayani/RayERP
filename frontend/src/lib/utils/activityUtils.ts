import { FileText, MessageSquare, Share2, UserPlus, CheckCircle, Edit, Eye, Upload, Trash2 } from 'lucide-react';

export const formatTimeAgo = (date: Date): string => {
  const now = new Date();
  const diff = now.getTime() - new Date(date).getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return new Date(date).toLocaleDateString();
};

export const getActionIcon = (action: string, resourceType: string) => {
  if (action === 'share' && resourceType === 'file') return Upload;
  if (action === 'delete' && resourceType === 'file') return Trash2;
  if (action === 'share') return Share2;
  if (action === 'comment' || resourceType === 'comment') return MessageSquare;
  if (action === 'assign') return UserPlus;
  if (action === 'complete') return CheckCircle;
  if (action === 'update') return Edit;
  if (action === 'view') return Eye;
  if (action === 'delete') return Trash2;
  return FileText;
};

export const getActionColor = (action: string): string => {
  switch (action) {
    case 'share': return 'bg-primary';
    case 'comment': return 'bg-primary/80';
    case 'create': return 'bg-primary';
    case 'update': return 'bg-primary/70';
    case 'delete': return 'bg-destructive';
    case 'complete': return 'bg-primary';
    default: return 'bg-muted-foreground';
  }
};

export const getCategoryIcon = (category: string) => {
  const icons: Record<string, string> = {
    system: 'Settings',
    security: 'Shield',
    data: 'Database',
    user: 'User',
  };
  return icons[category] || 'Info';
};

export const getSeverityColor = (severity: string): string => {
  switch (severity) {
    case 'critical': return 'text-red-600 bg-red-50';
    case 'high': return 'text-orange-600 bg-orange-50';
    case 'medium': return 'text-yellow-600 bg-yellow-50';
    case 'low': return 'text-green-600 bg-green-50';
    default: return 'text-gray-600 bg-gray-50';
  }
};

export const canViewSensitiveData = (userRole: string, userPermissions: string[]): boolean => {
  const adminRoles = ['root', 'admin', 'system_admin'];
  const sensitivePermissions = ['view_audit_logs', 'manage_system', 'view_sensitive_data'];
  
  return adminRoles.includes(userRole.toLowerCase()) || 
         userPermissions.some(p => sensitivePermissions.includes(p));
};
