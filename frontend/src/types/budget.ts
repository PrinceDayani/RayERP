export interface Budget {
  _id: string;
  projectId?: string;
  departmentId?: string;
  projectName?: string;
  departmentName?: string;
  budgetType: 'project' | 'department' | 'special';
  totalBudget: number;
  currency: string;
  status: 'draft' | 'in-review' | 'pending' | 'approved' | 'rejected';
  categories: BudgetCategory[];
  approvals: BudgetApproval[];
  deleteApprovalStatus?: 'pending' | 'approved' | 'rejected';
  deleteRequestedBy?: string;
  deleteRequestedAt?: string;
  createdBy: string;
  createdByDepartment: string;
  createdAt: string;
  updatedAt: string;
  remainingBudget?: number;
  utilizationPercentage?: number;
}

export interface BudgetCategory {
  _id: string;
  name: string;
  type: 'labor' | 'materials' | 'equipment' | 'overhead' | 'special';
  allocatedAmount: number;
  spentAmount: number;
  items: BudgetItem[];
}

export interface BudgetItem {
  _id: string;
  name: string;
  description: string;
  quantity: number;
  unitCost: number;
  totalCost: number;
}

export interface BudgetApproval {
  _id: string;
  userId: string;
  userName: string;
  status: 'pending' | 'approved' | 'rejected' | 'in-review';
  comments: string;
  approvedAt?: string;
}

export interface BudgetTemplate {
  _id: string;
  name: string;
  description: string;
  projectType: string;
  categories: Array<{
    _id?: string;
    name: string;
    type: 'labor' | 'materials' | 'equipment' | 'overhead';
    allocatedAmount: number;
    items: Array<{
      _id?: string;
      name: string;
      description: string;
      quantity: number;
      unitCost: number;
      totalCost: number;
    }>;
  }>;
  isDefault: boolean;
  createdAt: string;
}

export interface Currency {
  code: string;
  name: string;
  symbol: string;
  exchangeRate: number;
}
