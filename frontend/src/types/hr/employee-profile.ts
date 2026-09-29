export interface Project {
    _id: string;
    name: string;
    description?: string;
    startDate?: string;
    endDate?: string;
    status?: string;
    tags?: string[];
    team?: any[];
    progress?: number;
    client?: string;
    budget?: number;
    priority?: 'low' | 'medium' | 'high';
}

export interface ResourceAllocation {
    _id: string;
    employee: string | any; // ID or populated object
    project: Project | string;
    role: string;
    allocationPercentage: number;
    allocatedHours?: number;
    startDate: string;
    endDate?: string;
    status: 'active' | 'completed' | 'on-hold' | 'cancelled' | 'planned';
    notes?: string;
    name?: string;
    team?: string[];
}

export interface LeaveBalanceType {
    used: number;
    total: number;
}

export interface LeaveBalance {
    sick: LeaveBalanceType;
    vacation: LeaveBalanceType;
    personal: LeaveBalanceType;
    [key: string]: LeaveBalanceType; // Index signature for iteration
}

export interface Task {
    _id: string;
    title: string;
    description?: string;
    project?: {
        _id: string;
        name: string;
    };
    dueDate: string;
    priority: 'Low' | 'Medium' | 'High';
    status: 'Todo' | 'In Progress' | 'Review' | 'Completed';
}

export interface TaskStats {
    completed: number;
    inProgress: number;
    overdue: number;
    total: number;
}

export interface Skill {
    skill: string;
    level: 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';
    yearsOfExperience?: number;
    lastUpdated?: Date;
}

export interface SkillMatrixData {
    matrix: Skill[];
    lastUpdated?: string;
}

export interface Achievement {
    _id?: string;
    title: string;
    description: string;
    date: string;
    dateEarned?: string;
    category: 'award' | 'certification' | 'milestone' | 'training' | 'recognition';
    issuer?: string;
    credentialId?: string;
    expiryDate?: string;
    url?: string;
}

export interface WorkSummary {
    totalProjects: number;
    activeProjects: number;
    completedProjects: number;
    totalHours: number;
    totalTasks: number;
    completedTasks: number;
    attendanceRate: number;
    topSkills: string[];
    topRoles: string[];
    yearsOfExperience: number;
}

export interface CareerEvent {
    date: string;
    type: 'hire' | 'promotion' | 'role_change' | 'department_change' | 'project_start' | 'project_end' | 'certification' | 'achievement';
    title: string;
    description: string;
    metadata?: {
        from?: string;
        to?: string;
        project?: string;
        role?: string;
    };
}

export interface Address {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
}

export interface Role {
    _id: string;
    name: string;
}

export interface User {
    _id: string;
    name: string;
    email: string;
    role: string | Role;
}

export interface Employee {
    _id: string;
    employeeId: string;
    firstName: string;
    lastName: string;
    position: string;
    department: string;
    phone: string;
    hireDate: string;
    status: string;
    skills: Skill[];
    address: Address;
    avatarUrl?: string;
    supervisor?: { _id: string; name: string; position?: string };
}

export interface ProfileData {
    user: User;
    employee: Employee | null;
    projects: Project[];
}

export interface ProfileFormData {
    name: string;
    phone: string;
    skills: Skill[];
    address: Address;
    bio?: string;
    socialLinks?: {
        linkedin?: string;
        github?: string;
        twitter?: string;
        portfolio?: string;
    };
    notificationSettings?: NotificationSettings;
    timezone?: string;
}

export interface Document {
    _id?: string;
    name: string;
    type: 'Resume' | 'Certificate' | 'ID' | 'Other';
    url: string;
    size: number;
    uploadDate: Date;
}

export interface NotificationSettings {
    email: {
        projectUpdates: boolean;
        taskAssignments: boolean;
        mentions: boolean;
        weeklyDigest: boolean;
        systemAlerts?: boolean;
    };
    sms: {
        urgentTasks: boolean;
        deadlineReminders: boolean;
        projectUpdates?: boolean;
        taskAssignments?: boolean;
        mentions?: boolean;
        systemAlerts?: boolean;
    };
}

export interface LoginHistory {
    _id: string;
    timestamp: Date;
    ipAddress: string;
    userAgent: string;
    location?: string;
    success?: boolean;
}

export interface ActiveSession {
    _id: string;
    deviceInfo: string;
    lastActive: Date;
    ipAddress: string;
    device?: string;
    browser?: string;
    current?: boolean;
}

