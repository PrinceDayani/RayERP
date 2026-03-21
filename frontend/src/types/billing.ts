export type BillingType = 'milestone' | 'progress' | 'time-based' | 'completion';
export type BillingStatus = 'draft' | 'pending-approval' | 'approved' | 'invoiced' | 'paid' | 'cancelled';
export type ApprovalStatus = 'pending' | 'approved' | 'rejected';
export type PaymentScheduleStatus = 'pending' | 'invoiced' | 'paid' | 'overdue' | 'cancelled';

export interface IPaymentSchedule {
  _id?: string;
  milestoneId: string;
  milestoneName: string;
  dueDate: string;
  percentage: number;
  amount: number;
  status: PaymentScheduleStatus;
  invoiceNumber?: string;
  invoiceDate?: string;
  paymentDate?: string;
  paymentReference?: string;
  notes?: string;
}

export interface IBillingItem {
  _id?: string;
  boqItemId: string;
  itemCode: string;
  description: string;
  quantity: number;
  unitRate: number;
  amount: number;
  completionPercentage: number;
}

export interface IMilestoneBilling {
  _id: string;
  project: {
    _id: string;
    name: string;
    status?: string;
    budget?: number;
    currency?: string;
  };
  boq: {
    _id: string;
    version: number;
    overallProgress?: number;
    totalPlannedAmount?: number;
    totalActualAmount?: number;
  };
  milestoneId: string;
  milestoneName: string;
  billingType: BillingType;
  
  paymentSchedules: IPaymentSchedule[];
  billingItems: IBillingItem[];
  
  totalContractValue: number;
  totalBilledAmount: number;
  totalPaidAmount: number;
  outstandingAmount: number;
  retentionPercentage: number;
  retentionAmount: number;
  
  currency: string;
  
  status: BillingStatus;
  approvalStatus: ApprovalStatus;
  approvedBy?: {
    _id: string;
    name: string;
    email: string;
  };
  approvedDate?: string;
  rejectionReason?: string;
  
  invoiceNumber?: string;
  invoiceDate?: string;
  dueDate?: string;
  paymentTerms?: string;
  
  notes?: string;
  attachments?: string[];
  
  createdBy: {
    _id: string;
    name: string;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface IBillingAnalytics {
  totalContractValue: number;
  totalBilled: number;
  totalPaid: number;
  totalOutstanding: number;
  totalRetention: number;
  billingsByStatus: {
    draft: number;
    pendingApproval: number;
    approved: number;
    invoiced: number;
    paid: number;
    cancelled: number;
  };
}

export interface CreateMilestoneBillingRequest {
  projectId: string;
  boqId: string;
  milestoneId: string;
  milestoneName: string;
  billingType?: BillingType;
  paymentSchedules?: Partial<IPaymentSchedule>[];
  billingItems?: Partial<IBillingItem>[];
  totalContractValue: number;
  retentionPercentage?: number;
  currency?: string;
  paymentTerms?: string;
  notes?: string;
}

export interface UpdateBillingRequest {
  milestoneName?: string;
  billingType?: BillingType;
  totalContractValue?: number;
  retentionPercentage?: number;
  paymentTerms?: string;
  notes?: string;
}

export interface GenerateInvoiceRequest {
  invoiceNumber: string;
  invoiceDate?: string;
  dueDate?: string;
}

export interface RecordPaymentRequest {
  amount: number;
  paymentReference: string;
  paymentDate?: string;
}

export interface RejectBillingRequest {
  rejectionReason: string;
}
