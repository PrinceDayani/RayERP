//path: frontend/src/lib/api/tendersAPI.ts
import api from './api';
import { unwrapResponse } from './unwrap';

export type TenderDirection = 'issued' | 'bidding';

export type TenderStatus =
  // shared
  | 'in-progress' | 'completed' | 'cancelled'
  // issued
  | 'draft' | 'published' | 'bid-submission' | 'evaluation' | 'negotiation'
  | 'awarded' | 'work-order-issued' | 'no-bid'
  // bidding
  | 'identified' | 'go-no-go' | 'preparing' | 'submitted'
  | 'technical-opening' | 'financial-opening' | 'won' | 'lost' | 'dropped';

export type TenderPortal = 'gem' | 'cppp' | 'state-eproc' | 'railway-ireps' | 'defence-proc' | 'offline' | 'other';

/** Statuses each direction can legally move to, mirroring the server. */
export const TENDER_TRANSITIONS: Record<TenderDirection, Partial<Record<TenderStatus, TenderStatus[]>>> = {
  issued: {
    'draft': ['published', 'cancelled'],
    'published': ['bid-submission', 'cancelled'],
    'bid-submission': ['evaluation', 'no-bid', 'cancelled'],
    'evaluation': ['negotiation', 'awarded', 'cancelled'],
    'negotiation': ['awarded', 'cancelled'],
    'awarded': ['work-order-issued', 'cancelled'],
    'work-order-issued': ['in-progress', 'cancelled'],
    'in-progress': ['completed', 'cancelled'],
    'completed': [],
    'cancelled': [],
    'no-bid': ['published']
  },
  bidding: {
    'identified': ['go-no-go', 'dropped', 'cancelled'],
    'go-no-go': ['preparing', 'dropped', 'cancelled'],
    'preparing': ['submitted', 'dropped', 'cancelled'],
    'submitted': ['technical-opening', 'lost', 'cancelled'],
    'technical-opening': ['financial-opening', 'lost', 'cancelled'],
    'financial-opening': ['won', 'lost', 'cancelled'],
    'won': ['in-progress', 'cancelled'],
    'in-progress': ['completed', 'cancelled'],
    'lost': [],
    'dropped': [],
    'completed': [],
    'cancelled': []
  }
};

export const PORTAL_LABELS: Record<TenderPortal, string> = {
  'gem': 'GeM',
  'cppp': 'CPP Portal',
  'state-eproc': 'State e-Procurement',
  'railway-ireps': 'IREPS (Railways)',
  'defence-proc': 'Defence Procurement',
  'offline': 'Offline / Physical',
  'other': 'Other'
};

export interface IssuingAuthority {
  name: string;
  department?: string;
  officerName?: string;
  designation?: string;
  email?: string;
  phone?: string;
  address?: string;
}

export interface TenderFee {
  amount: number;
  exempted: boolean;
  paid: boolean;
  paidOn?: string;
  mode?: 'online' | 'dd' | 'cheque' | 'cash' | 'other';
  reference?: string;
  documentUrl?: string;
}

export interface EarnestMoneyDeposit {
  amount: number;
  mode: 'dd' | 'bank-guarantee' | 'online' | 'fdr' | 'exempted';
  exemptionReason?: string;
  submittedOn?: string;
  instrumentRef?: string;
  issuingBank?: string;
  validTill?: string;
  status: 'pending' | 'submitted' | 'returned' | 'forfeited';
  returnedOn?: string;
  documentUrl?: string;
}

export interface EligibilityCriterion {
  _id?: string;
  criterion: string;
  category: 'technical' | 'financial' | 'legal' | 'experience' | 'other';
  mandatory: boolean;
  ourStatus: 'met' | 'not-met' | 'partial' | 'not-applicable' | 'unverified';
  evidenceDocuments: string[];
  remarks?: string;
  verifiedBy?: { _id: string; name: string } | string;
  verifiedAt?: string;
}

export interface OurBid {
  technical: {
    documents: string[];
    notes?: string;
    score?: number;
    qualified?: boolean;
    resultDeclaredOn?: string;
  };
  financial: {
    baseAmount: number;
    rebatePercentage?: number;
    finalAmount: number;
    boq?: string;
    documents: string[];
    notes?: string;
  };
  submittedAt?: string;
  submittedBy?: { _id: string; name: string } | string;
  acknowledgementRef?: string;
  validityDays?: number;
}

export interface CompetitorBid {
  _id?: string;
  name: string;
  bidAmount?: number;
  rank?: number;
  technicallyQualified?: boolean;
  remarks?: string;
}

export interface TenderOutcome {
  result: 'awaited' | 'technically-qualified' | 'technically-disqualified' | 'won' | 'lost' | 'cancelled-by-authority';
  ourRank?: number;
  l1Amount?: number;
  l1Bidder?: string;
  declaredOn?: string;
  reason?: string;
}

export interface LetterOfAward {
  received: boolean;
  number?: string;
  date?: string;
  awardedAmount?: number;
  documentUrl?: string;
  acceptedOn?: string;
}

export interface AgreementRecord {
  number?: string;
  signedOn?: string;
  commencementDate?: string;
  completionDate?: string;
  documentUrl?: string;
}

export interface PerformanceGuarantee {
  amount: number;
  percentage?: number;
  mode: 'bank-guarantee' | 'dd' | 'fdr' | 'online' | 'not-required';
  issuingBank?: string;
  instrumentRef?: string;
  submittedOn?: string;
  validTill?: string;
  status: 'pending' | 'submitted' | 'released' | 'forfeited';
  releasedOn?: string;
  documentUrl?: string;
}

export interface Corrigendum {
  _id?: string;
  number: string;
  issuedOn: string;
  summary: string;
  revisedSubmissionDeadline?: string;
  documentUrl?: string;
}

export interface Tender {
  _id: string;
  tenderNumber: string;
  direction: TenderDirection;
  title: string;
  description?: string;
  type: 'open' | 'limited' | 'single-source' | 'two-envelope' | 'reverse-auction';
  category: 'works' | 'goods' | 'services' | 'consultancy';
  status: TenderStatus;

  scopeOfWork?: string;
  eligibilityCriteria?: string;
  termsAndConditions?: string;
  specialInstructions?: string;

  estimatedValue: number;
  currency: string;
  earnestMoneyDeposit?: number;
  securityDeposit?: number;
  retentionPercentage?: number;

  publishDate?: string;
  preBidMeetingDate?: string;
  submissionDeadline?: string;
  openingDate?: string;
  evaluationDeadline?: string;
  awardDate?: string;
  workOrderDate?: string;
  technicalOpeningDate?: string;
  financialOpeningDate?: string;

  project?: { _id: string; name: string; status: string } | string;
  boq?: string;
  workOrder?: string;
  department?: { _id: string; name: string } | string;

  createdBy?: { _id: string; name: string; email: string } | string;
  tenderCommittee?: Array<{ _id: string; name: string }> | string[];

  // issued
  bids?: any[];
  awardedBidder?: any;
  awardedAmount?: number;
  evaluationCriteria?: Array<{ name: string; maxScore: number; weight: number; type: string }>;
  evaluationMethod?: string;

  // bidding
  issuingAuthority?: IssuingAuthority;
  portal?: TenderPortal;
  portalTenderId?: string;
  portalUrl?: string;
  tenderNoticeNumber?: string;
  corrigenda?: Corrigendum[];
  tenderFee?: TenderFee;
  emd?: EarnestMoneyDeposit;
  bidSecurityDeclaration?: boolean;
  eligibility?: EligibilityCriterion[];
  ourBid?: OurBid;
  competitors?: CompetitorBid[];
  outcome?: TenderOutcome;
  loa?: LetterOfAward;
  agreement?: AgreementRecord;
  performanceGuarantee?: PerformanceGuarantee;

  timeline?: Array<{ event: string; plannedDate: string; actualDate?: string; status: string }>;
  auditTrail?: Array<{ action: string; performedBy: any; timestamp: string; notes?: string }>;
  documents?: string[];
  tags?: string[];
  priority: 'low' | 'medium' | 'high' | 'critical';
  location?: string;
  referenceNumber?: string;
  createdAt: string;
  updatedAt: string;
}

export interface BidReadiness {
  ready: boolean;
  blockers: string[];
  daysRemaining: number | null;
  overdue: boolean;
  eligibility: { total: number; mandatory: number; met: number };
}

export interface TenderStats {
  total: number;
  byStatus: Record<string, number>;
  byDirection: Record<string, number>;
  totalEstimatedValue: number;
  totalAwardedValue: number;
  savingsPercentage: string | number;
  recentTenders: Tender[];
  bidding: {
    byOutcome: Record<string, number>;
    won: number;
    lost: number;
    winRate: number;
    emdLodgedAmount: number;
    emdLodgedCount: number;
    closingWithin7Days: number;
  };
}

export interface TenderListParams {
  direction?: TenderDirection;
  status?: string;
  type?: string;
  category?: string;
  department?: string;
  priority?: string;
  portal?: string;
  outcome?: string;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export const tendersAPI = {
  list: async (params: TenderListParams = {}) => {
    const response = await api.get('/tenders', { params });
    return response.data as {
      success: boolean;
      data: Tender[];
      pagination: { page: number; limit: number; total: number; pages: number };
    };
  },

  getById: async (id: string): Promise<Tender> => {
    const response = await api.get(`/tenders/${id}`);
    return unwrapResponse(response.data);
  },

  create: async (tender: Partial<Tender>): Promise<Tender> => {
    const response = await api.post('/tenders', tender);
    return unwrapResponse(response.data);
  },

  update: async (id: string, tender: Partial<Tender>): Promise<Tender> => {
    const response = await api.put(`/tenders/${id}`, tender);
    return unwrapResponse(response.data);
  },

  remove: async (id: string) => {
    const response = await api.delete(`/tenders/${id}`);
    return unwrapResponse(response.data);
  },

  transition: async (id: string, newStatus: TenderStatus, notes?: string): Promise<Tender> => {
    const response = await api.post(`/tenders/${id}/transition`, { newStatus, notes });
    return unwrapResponse(response.data);
  },

  getStats: async (params: { direction?: TenderDirection; department?: string } = {}): Promise<TenderStats> => {
    const response = await api.get('/tenders/stats', { params });
    return unwrapResponse(response.data);
  },

  getTimeline: async (id: string) => {
    const response = await api.get(`/tenders/${id}/timeline`);
    return unwrapResponse(response.data);
  },

  // --- direction: 'issued' ---
  addBidder: async (id: string, bidder: any) => {
    const response = await api.post(`/tenders/${id}/bids`, bidder);
    return unwrapResponse(response.data);
  },

  getBidComparison: async (id: string) => {
    const response = await api.get(`/tenders/${id}/bid-comparison`);
    return unwrapResponse(response.data);
  },

  award: async (id: string, payload: any) => {
    const response = await api.post(`/tenders/${id}/award`, payload);
    return unwrapResponse(response.data);
  },

  // --- direction: 'bidding' ---
  getReadiness: async (id: string): Promise<BidReadiness> => {
    const response = await api.get(`/tenders/${id}/readiness`);
    return unwrapResponse(response.data);
  },

  updateEligibility: async (id: string, eligibility: EligibilityCriterion[]) => {
    const response = await api.put(`/tenders/${id}/eligibility`, { eligibility });
    return unwrapResponse(response.data);
  },

  addCorrigendum: async (id: string, corrigendum: Partial<Corrigendum>) => {
    const response = await api.post(`/tenders/${id}/corrigenda`, corrigendum);
    return unwrapResponse(response.data);
  },

  saveOurBid: async (id: string, bid: Partial<OurBid>) => {
    const response = await api.put(`/tenders/${id}/our-bid`, bid);
    return unwrapResponse(response.data);
  },

  recordTenderFee: async (id: string, fee: Partial<TenderFee>) => {
    const response = await api.put(`/tenders/${id}/tender-fee`, fee);
    return unwrapResponse(response.data);
  },

  recordEMD: async (id: string, emd: Partial<EarnestMoneyDeposit>) => {
    const response = await api.put(`/tenders/${id}/emd`, emd);
    return unwrapResponse(response.data);
  },

  recordPerformanceGuarantee: async (id: string, pbg: Partial<PerformanceGuarantee>) => {
    const response = await api.put(`/tenders/${id}/performance-guarantee`, pbg);
    return unwrapResponse(response.data);
  },

  recordOpening: async (
    id: string,
    payload: { competitors?: CompetitorBid[]; ourRank?: number; l1Amount?: number; l1Bidder?: string }
  ) => {
    const response = await api.put(`/tenders/${id}/opening`, payload);
    return unwrapResponse(response.data);
  },

  recordLOA: async (id: string, loa: Partial<LetterOfAward>) => {
    const response = await api.put(`/tenders/${id}/loa`, loa);
    return unwrapResponse(response.data);
  },

  recordAgreement: async (id: string, agreement: Partial<AgreementRecord>) => {
    const response = await api.put(`/tenders/${id}/agreement`, agreement);
    return unwrapResponse(response.data);
  },

  convertToProject: async (id: string, payload: any = {}) => {
    const response = await api.post(`/tenders/${id}/convert-to-project`, payload);
    return unwrapResponse(response.data);
  }
};

export default tendersAPI;
