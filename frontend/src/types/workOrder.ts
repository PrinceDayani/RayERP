export type WorkOrderStatus = 'draft' | 'pending-approval' | 'approved' | 'issued' | 'in-progress' | 'completed' | 'closed' | 'cancelled';
export type WOApprovalStatus = 'pending' | 'approved' | 'rejected';
export type PaymentMethod = 'bank-transfer' | 'cheque' | 'cash' | 'upi' | 'other';

export interface IWorkOrderItem {
  _id?: string;
  description: string;
  unit: string;
  quantity: number;
  unitRate: number;
  amount: number;
  boqItemId?: string;
}

export interface IWorkOrderPayment {
  _id?: string;
  amount: number;
  paymentDate: string;
  paymentReference?: string;
  paymentMethod?: PaymentMethod;
  notes?: string;
  recordedBy: { _id: string; name: string; email: string };
  createdAt?: string;
}

export interface IWorkOrder {
  _id: string;
  woNumber: string;
  project: { _id: string; name: string; status?: string; currency?: string };
  subcontractor: { _id: string; name: string; phone?: string; email?: string; company?: string; address?: string };
  subcontractorName: string;
  boq?: { _id: string; version: number; overallProgress?: number };

  title: string;
  description?: string;
  items: IWorkOrderItem[];

  totalAmount: number;
  totalPaid: number;
  totalOutstanding: number;
  retentionPercentage: number;
  retentionAmount: number;
  currency: string;

  startDate?: string;
  endDate?: string;
  paymentTerms?: string;

  status: WorkOrderStatus;
  approvalStatus: WOApprovalStatus;
  approvedBy?: { _id: string; name: string; email: string };
  approvedDate?: string;
  rejectionReason?: string;

  payments: IWorkOrderPayment[];
  notes?: string;
  attachments?: string[];

  createdBy: { _id: string; name: string; email: string };
  createdAt: string;
  updatedAt: string;
}

export interface IWorkOrderAnalytics {
  totalWorkOrders: number;
  totalContractValue: number;
  totalPaid: number;
  totalOutstanding: number;
  totalRetention: number;
  byStatus: Record<string, number>;
}

export interface CreateWorkOrderRequest {
  projectId: string;
  subcontractorId: string;
  boqId?: string;
  title: string;
  description?: string;
  items?: Partial<IWorkOrderItem>[];
  totalAmount: number;
  retentionPercentage?: number;
  currency?: string;
  startDate?: string;
  endDate?: string;
  paymentTerms?: string;
  notes?: string;
}

export interface RecordWOPaymentRequest {
  amount: number;
  paymentDate?: string;
  paymentReference?: string;
  paymentMethod?: PaymentMethod;
  notes?: string;
}
