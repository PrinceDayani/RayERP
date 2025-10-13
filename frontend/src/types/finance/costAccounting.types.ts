export interface CostCenter {
  id: string;
  code: string;
  name: string;
  managerId: string;
  budget: number;
  actualCosts: number;
  variance: number;
}

export interface CostAllocation {
  id: string;
  fromCostCenter: string;
  toCostCenter: string;
  amount: number;
  allocationMethod: 'direct' | 'percentage' | 'activity_based';
  period: string;
}

export interface ProjectCost {
  id: string;
  projectId: string;
  costCenterId: string;
  category: 'labor' | 'material' | 'overhead';
  amount: number;
  date: Date;
}