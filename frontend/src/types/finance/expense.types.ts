export interface ExpenseClaim {
  id: string;
  employeeId: string;
  date: Date;
  category: string;
  amount: number;
  description: string;
  receipts: string[];
  status: 'draft' | 'submitted' | 'approved' | 'rejected' | 'reimbursed';
}

export interface ExpenseApproval {
  id: string;
  claimId: string;
  approverId: string;
  status: 'pending' | 'approved' | 'rejected';
  comments?: string;
  date: Date;
}

export interface Reimbursement {
  id: string;
  claimId: string;
  amount: number;
  method: 'bank_transfer' | 'check' | 'cash';
  processedDate: Date;
  reference: string;
}
