export type BOQStatus = 'draft' | 'approved' | 'active' | 'revised' | 'closed';
export type BOQItemCategory = 'material' | 'labor' | 'equipment' | 'subcontractor' | 'other';
export type BOQItemStatus = 'not-started' | 'in-progress' | 'completed' | 'on-hold';

export interface IBOQItem {
  _id?: string;
  itemCode: string;
  description: string;
  category: BOQItemCategory;
  unit: string;
  plannedQuantity: number;
  actualQuantity: number;
  unitRate: number;
  currency: string;
  plannedAmount: number;
  actualAmount: number;
  completionPercentage: number;
  startDate?: string;
  endDate?: string;
  status: BOQItemStatus;
  milestone?: string;
  notes?: string;
  attachments?: string[];
}

export interface IBOQ {
  _id: string;
  project: {
    _id: string;
    name: string;
    status?: string;
    budget?: number;
    currency?: string;
  };
  version: number;
  status: BOQStatus;
  items: IBOQItem[];
  totalPlannedAmount: number;
  totalActualAmount: number;
  overallProgress: number;
  currency: string;
  approvedBy?: {
    _id: string;
    name: string;
    email: string;
  };
  approvedDate?: string;
  revisionNotes?: string;
  createdBy: {
    _id: string;
    name: string;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface IVarianceAnalysis {
  itemCode: string;
  description: string;
  plannedQuantity: number;
  actualQuantity: number;
  quantityVariance: number;
  quantityVariancePercentage: number;
  plannedAmount: number;
  actualAmount: number;
  costVariance: number;
  costVariancePercentage: number;
  status: 'under-budget' | 'on-budget' | 'over-budget';
}

export interface ICostForecast {
  totalPlannedCost: number;
  totalActualCost: number;
  completionPercentage: number;
  estimatedCostAtCompletion: number;
  costVariance: number;
  costVariancePercentage: number;
  estimatedCostToComplete: number;
  performanceIndex: number;
}

export interface ICategoryBreakdown {
  category: BOQItemCategory;
  itemCount: number;
  plannedAmount: number;
  actualAmount: number;
  variance: number;
  variancePercentage: number;
  progress: number;
}

export interface CreateBOQRequest {
  projectId: string;
  items: Partial<IBOQItem>[];
  currency?: string;
}

export interface UpdateBOQItemRequest {
  actualQuantity?: number;
  status?: BOQItemStatus;
  notes?: string;
  startDate?: string;
  endDate?: string;
}

export interface AddBOQItemRequest {
  itemCode: string;
  description: string;
  category: BOQItemCategory;
  unit: string;
  plannedQuantity: number;
  unitRate: number;
  currency?: string;
  milestone?: string;
}
