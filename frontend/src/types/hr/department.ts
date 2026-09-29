// Department Types - Enterprise Grade TypeScript Interfaces

export interface Department {
  _id: string;
  name: string;
  description: string;
  location: string;
  budget: number;
  status: 'active' | 'inactive';
  manager: DepartmentManager;
  employeeCount: number;
  permissions?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface DepartmentManager {
  name: string;
  email: string;
  phone?: string;
  employeeId?: string;
}

export interface Employee {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  position: string;
  status: 'active' | 'inactive';
  department?: string;
  departments?: string[];
  departmentId?: string;
  hireDate: string;
  salary?: number;
}

export interface DepartmentAnalytics {
  overview: {
    totalEmployees: number;
    totalProjects: number;
    budget: number;
    budgetUtilization: number;
    activeProjects: number;
  };
  performance: {
    efficiency: number;
    projectCompletionRate: number;
    employeeSatisfaction: number;
    productivity: number;
  };
  employeeStats: {
    byPosition: Record<string, number>;
    byStatus: Record<string, number>;
    averageExperience: number;
  };
  projectStats: {
    byStatus: Record<string, number>;
    averageDuration: number;
    successRate: number;
  };
  activityTrends: {
    totalActivities: number;
    weeklyGrowth: number;
    monthlyGrowth: number;
  };
  goals: DepartmentGoal[];
}

export interface DepartmentProject {
  _id: string;
  name: string;
  description: string;
  status: 'planning' | 'active' | 'completed' | 'cancelled';
  budget?: number;
  startDate: string;
  endDate?: string;
  departmentId: string;
  managerId?: string;
  teamMembers: string[];
  progress: number;
}

export interface ActivityLog {
  _id: string;
  action: string;
  resource: string;
  details: string;
  userId: string;
  userName: string;
  timestamp: string;
  status: 'success' | 'error' | 'warning';
  ipAddress?: string;
}

export interface DepartmentNotification {
  _id: string;
  action: string;
  resource: string;
  details: string;
  status: 'success' | 'error' | 'warning' | 'info';
  timestamp: string;
  userId: string;
  userName: string;
  read: boolean;
}

export interface BudgetHistory {
  month: string;
  allocated: number;
  spent: number;
  remaining: number;
  utilization: number;
}

export interface PerformanceMetrics {
  productivity: number;
  satisfaction: number;
  retention: number;
  growth: number;
  efficiency: number;
  qualityScore: number;
}

export interface TeamStructure {
  managers: number;
  leads: number;
  seniors: number;
  juniors: number;
  interns: number;
  contractors: number;
}

export interface UpcomingDeadline {
  id: string;
  task: string;
  date: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  assignee: string;
  type: 'project' | 'goal' | 'compliance' | 'review';
}

export interface ResourceUtilization {
  capacity: number;
  workload: number;
  availability: number;
  efficiency: number;
  allocation: Record<string, number>;
}

export interface ComplianceStatus {
  training: number;
  certifications: number;
  policies: number;
  security: number;
  overall: number;
  lastAudit: string;
}

export interface DepartmentGoal {
  id: string;
  title: string;
  description: string;
  target: number;
  current: number;
  unit: string;
  deadline: string;
  priority: 'low' | 'medium' | 'high';
  status: 'active' | 'completed' | 'paused' | 'cancelled';
  assignedTo: string[];
  createdBy: string;
  createdAt: string;
}

export interface BudgetAdjustment {
  amount: number;
  reason: string;
  type: 'increase' | 'decrease';
  approvedBy?: string;
  approvalDate?: string;
}

export interface DepartmentFormData {
  name: string;
  description: string;
  location: string;
  budget: number;
  status: 'active' | 'inactive';
  manager: DepartmentManager;
}

export interface LoadingStates {
  department: boolean;
  employees: boolean;
  projects: boolean;
  analytics: boolean;
  activityLogs: boolean;
  notifications: boolean;
  budgetHistory: boolean;
  performanceMetrics: boolean;
  teamStructure: boolean;
  upcomingDeadlines: boolean;
  resourceUtilization: boolean;
  complianceStatus: boolean;
}

export interface ErrorStates {
  department?: string;
  employees?: string;
  projects?: string;
  analytics?: string;
  general?: string;
}

export interface DepartmentFilters {
  searchQuery: string;
  statusFilter: 'all' | 'active' | 'inactive';
  positionFilter: string;
  dateRange: {
    start: string;
    end: string;
  };
}

export interface DepartmentExportOptions {
  format: 'pdf' | 'excel' | 'csv' | 'json';
  sections: string[];
  dateRange?: {
    start: string;
    end: string;
  };
}

export interface DepartmentReport {
  id: string;
  name: string;
  type: 'performance' | 'budget' | 'compliance' | 'team' | 'projects';
  generatedAt: string;
  generatedBy: string;
  data: any;
  format: 'pdf' | 'excel' | 'csv';
}