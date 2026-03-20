export type ActivityResourceType = 
  | 'project' 
  | 'task' 
  | 'file' 
  | 'comment' 
  | 'employee' 
  | 'budget' 
  | 'user' 
  | 'role' 
  | 'department' 
  | 'report' 
  | 'notification' 
  | 'system' 
  | 'auth' 
  | 'other';

export type ActivityStatus = 'success' | 'error' | 'warning';

export type ActivityAction = 
  | 'create' 
  | 'update' 
  | 'delete' 
  | 'view' 
  | 'login' 
  | 'logout' 
  | 'share' 
  | 'upload' 
  | 'assign' 
  | 'complete' 
  | 'comment';

export type ActivityCategory = 'user' | 'system' | 'security' | 'project' | 'data';

export type ActivitySeverity = 'critical' | 'high' | 'medium' | 'low';

export interface ActivityMetadata {
  category?: ActivityCategory;
  severity?: ActivitySeverity;
  [key: string]: unknown;
}

export interface ActivityUser {
  _id: string;
  name: string;
  email: string;
}

export interface ActivityProject {
  _id: string;
  name: string;
}

export interface ActivityChanges {
  before?: Record<string, unknown>;
  after?: Record<string, unknown>;
}

export interface Activity {
  _id: string;
  timestamp: Date;
  userName: string;
  action: string;
  resource: string;
  resourceType: ActivityResourceType;
  details: string;
  status: ActivityStatus;
  projectId?: ActivityProject;
  projectName?: string;
  metadata?: ActivityMetadata;
  ipAddress?: string;
  visibility?: string;
  user?: ActivityUser;
  requestId?: string;
  duration?: number;
  errorStack?: string;
  userAgent?: string;
  sessionId?: string;
  httpMethod?: string;
  endpoint?: string;
  changes?: ActivityChanges;
  reversible?: boolean;
  reverted?: boolean;
  revertedBy?: ActivityUser;
  revertedAt?: Date;
}

export interface ActivityStats {
  totalActivities: number;
  todayActivities: number;
  weekActivities: number;
  monthActivities: number;
  resourceTypeStats: { _id: string; count: number }[];
  actionStats: { _id: string; count: number }[];
}

export interface ActivityFilters {
  filter: string;
  actionFilter: string;
  statusFilter: string;
  categoryFilter: string;
  startDate: string;
  endDate: string;
}

export interface ExportProgress {
  current: number;
  total: number;
}
