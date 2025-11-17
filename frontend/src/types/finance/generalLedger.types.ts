export interface AccountGroup {
  _id: string;
  code: string;
  name: string;
  type: 'assets' | 'liabilities' | 'income' | 'expenses';
  description?: string;
  isActive: boolean;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AccountSubGroup {
  _id: string;
  code: string;
  name: string;
  groupId: string | AccountGroup;
  description?: string;
  isActive: boolean;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AccountLedger {
  _id: string;
  code: string;
  name: string;
  subGroupId: string | AccountSubGroup;
  openingBalance: number;
  currentBalance: number;
  balanceType: 'debit' | 'credit';
  currency: string;
  isActive: boolean;
  gstInfo?: {
    gstNo?: string;
    gstType?: 'regular' | 'composition' | 'unregistered';
  };
  taxInfo?: {
    panNo?: string;
    tanNo?: string;
    cinNo?: string;
    aadharNo?: string;
  };
  contactInfo?: {
    email?: string;
    phone?: string;
    mobile?: string;
    address?: string;
    city?: string;
    state?: string;
    country?: string;
    pincode?: string;
  };
  bankDetails?: {
    accountNumber?: string;
    ifscCode?: string;
    bankName?: string;
    branch?: string;
  };
  creditLimit?: number;
  creditDays?: number;
  description?: string;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AccountHierarchy extends AccountGroup {
  subGroups: (AccountSubGroup & {
    ledgers: AccountLedger[];
  })[];
}

export interface JournalLine {
  ledgerId: string;
  debit: number;
  credit: number;
  description: string;
}

export interface JournalEntry {
  _id: string;
  entryNumber: string;
  date: string;
  reference?: string;
  description: string;
  lines: JournalLine[];
  totalDebit: number;
  totalCredit: number;
  isPosted: boolean;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
}
