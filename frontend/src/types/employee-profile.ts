export interface Project {
    _id: string;
    name: string;
    description?: string;
    startDate?: string;
    endDate?: string;
    status?: string;
    tags?: string[];
    team?: any[]; // Keep flexible or define UserProject
    progress?: number;
    client?: string;
    budget?: number;
}

export interface ResourceAllocation {
    _id: string;
    employee: string | any; // ID or populated object
    project: Project | string;
    role: string;
    allocationPercentage: number;
    startDate: string;
    endDate?: string;
    status: 'active' | 'completed' | 'on-hold' | 'cancelled' | 'planned';
    notes?: string;
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

