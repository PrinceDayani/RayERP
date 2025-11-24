export interface ClientAccount {
  id: string;
  clientId: string;
  accountNumber: string;
  balance: number;
  creditLimit: number;
  paymentTerms: string;
  status: 'active' | 'suspended' | 'closed';
}

export interface AgingReport {
  clientId: string;
  clientName: string;
  current: number;
  days30: number;
  days60: number;
  days90: number;
  over90: number;
  total: number;
}

export interface CreditManagement {
  clientId: string;
  creditLimit: number;
  availableCredit: number;
  riskRating: 'low' | 'medium' | 'high';
  lastReview: Date;
}
