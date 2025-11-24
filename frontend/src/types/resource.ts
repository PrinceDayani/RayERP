export interface ResourceAllocation {
  _id: string;
  employee: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    position: string;
    skills: string[];
  };
  project: {
    _id: string;
    name: string;
    status: string;
    startDate: string;
    endDate: string;
  };
  allocatedHours: number;
  startDate: string;
  endDate: string;
  role: string;
  utilizationRate: number;
  availability: {
    monday: number;
    tuesday: number;
    wednesday: number;
    thursday: number;
    friday: number;
    saturday: number;
    sunday: number;
  };
  leaves: {
    startDate: string;
    endDate: string;
    reason: string;
  }[];
  skills: string[];
  status: 'active' | 'completed' | 'planned';
  createdAt: string;
  updatedAt: string;
}

export interface CapacityPlan {
  employee: {
    _id: string;
    name: string;
    position: string;
    skills: string[];
  };
  capacity: number;
  allocated: number;
  available: number;
  utilizationRate: number;
  allocations: ResourceAllocation[];
}

export type SkillLevel = 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';

export interface SkillMatrix {
  employee: {
    _id: string;
    name: string;
    position: string;
    department?: string;
  };
  skills: {
    skill: string;
    level: SkillLevel | null;
    yearsOfExperience?: number;
    lastUpdated?: string;
  }[];
}

export interface SkillGapAnalysis {
  employee: {
    _id: string;
    name: string;
    position: string;
    department?: string;
  };
  missingSkills: string[];
  weakSkills: { skill: string; currentLevel: SkillLevel; requiredLevel: SkillLevel }[];
  strongSkills: { skill: string; level: SkillLevel }[];
}

export interface ProjectSkillMatch {
  employee: {
    _id: string;
    name: string;
    position: string;
  };
  matchPercentage: number;
  matchedSkills: { skill: string; level: SkillLevel; required: SkillLevel }[];
  missingSkills: string[];
}

export interface SkillDistribution {
  skill: string;
  levels: {
    Beginner: number;
    Intermediate: number;
    Advanced: number;
    Expert: number;
  };
  totalEmployees: number;
}

export interface TimeTracking {
  totalEstimated: number;
  totalActual: number;
  variance: number;
  tasks: {
    _id: string;
    title: string;
    estimatedHours: number;
    actualHours: number;
    status: string;
    assignedTo: { firstName: string; lastName: string };
    project: { name: string };
  }[];
}

export interface SkillFilters {
  employee?: string;
  skill?: string;
  department?: string;
  level?: SkillLevel;
  search?: string;
}
