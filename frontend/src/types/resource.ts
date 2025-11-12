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

export interface SkillMatrix {
  employee: {
    _id: string;
    name: string;
    position: string;
  };
  skills: {
    skill: string;
    has: boolean;
  }[];
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
