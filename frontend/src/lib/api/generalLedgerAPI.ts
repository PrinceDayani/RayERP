import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL ||  process.env.BACKEND_URL;
const BASE_URL = `${API_URL}/api/general-ledger`;

// Types
export interface Account {
  _id: string;
  code: string;
  name: string;
  type: 'asset' | 'liability' | 'equity' | 'revenue' | 'expense';
  balance: number;
  isActive: boolean;
  isGroup: boolean;
  parentId?: string;
  level: number;
  description?: string;
  children?: Account[];
  openingBalance?: number;
  subType?: string;
  category?: string;
  currency?: string;
  allowCostCenter?: boolean;
  enableBillTracking?: boolean;
  enableInterest?: boolean;
  interestRate?: number;
  budgetAmount?: number;
}

export interface JournalLine {
  accountId: string | any;
  debit: number;
  credit: number;
  description: string;
  costCenter?: string;
  departmentId?: string;
  projectId?: string;
  billReference?: string;
  billAmount?: number;
  billDate?: string;
}

export interface JournalEntry {
  _id: string;
  entryNumber: string;
  voucherType: 'journal' | 'payment' | 'receipt' | 'sales' | 'purchase';
  date: string;
  reference?: string;
  description: string;
  lines: JournalLine[];
  totalDebit: number;
  totalCredit: number;
  isPosted: boolean;
  currency?: string;
  exchangeRate?: number;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TrialBalance {
  accounts: any[];
  totals: { debits: number; credits: number; balanced: boolean };
  asOfDate: string;
}

export interface CostCenter {
  _id: string;
  code: string;
  name: string;
  description?: string;
  departmentId?: string;
  projectId?: string;
  isActive: boolean;
}

export interface Currency {
  _id: string;
  code: string;
  name: string;
  symbol: string;
  isBaseCurrency: boolean;
}

export interface BillDetail {
  _id: string;
  accountId: string;
  billReference: string;
  billDate: string;
  billAmount: number;
  paidAmount: number;
  balanceAmount: number;
  dueDate?: string;
  status: 'pending' | 'partial' | 'paid';
}

export interface InterestCalculation {
  accountId: string;
  fromDate: string;
  toDate: string;
  principal: number;
  rate: number;
  days: number;
  interest: number;
}

export interface GLBudget {
  _id: string;
  accountId: string;
  fiscalYear: string;
  budgetAmount: number;
  actualAmount: number;
  variance: number;
  utilizationPercent: number;
}

const getAuthHeaders = () => {
  const token = localStorage.getItem('auth-token');
  return { Authorization: `Bearer ${token}` };
};



// Groups
export const getGroups = async () => {
  const { data } = await axios.get(`${BASE_URL}/groups`, { headers: getAuthHeaders() });
  return data;
};

export const getGroupById = async (id: string) => {
  const { data } = await axios.get(`${BASE_URL}/groups/${id}`, { headers: getAuthHeaders() });
  return data;
};

export const createGroup = async (group: any) => {
  const { data } = await axios.post(`${BASE_URL}/groups`, group, { headers: getAuthHeaders() });
  return data;
};

export const updateGroup = async (id: string, group: any) => {
  const { data } = await axios.put(`${BASE_URL}/groups/${id}`, group, { headers: getAuthHeaders() });
  return data;
};

export const deleteGroup = async (id: string) => {
  await axios.delete(`${BASE_URL}/groups/${id}`, { headers: getAuthHeaders() });
};

// Sub-Groups
export const getSubGroups = async (groupId?: string) => {
  const params = groupId ? { groupId } : {};
  const { data } = await axios.get(`${BASE_URL}/sub-groups`, { params, headers: getAuthHeaders() });
  return data;
};

export const getSubGroupById = async (id: string) => {
  const { data } = await axios.get(`${BASE_URL}/sub-groups/${id}`, { headers: getAuthHeaders() });
  return data;
};

export const createSubGroup = async (subGroup: any) => {
  const { data } = await axios.post(`${BASE_URL}/sub-groups`, subGroup, { headers: getAuthHeaders() });
  return data;
};

export const updateSubGroup = async (id: string, subGroup: any) => {
  const { data } = await axios.put(`${BASE_URL}/sub-groups/${id}`, subGroup, { headers: getAuthHeaders() });
  return data;
};

export const deleteSubGroup = async (id: string) => {
  await axios.delete(`${BASE_URL}/sub-groups/${id}`, { headers: getAuthHeaders() });
};

// Ledgers
export const getLedgers = async (subGroupId?: string, search?: string) => {
  const params: any = {};
  if (subGroupId) params.subGroupId = subGroupId;
  if (search) params.search = search;
  const { data } = await axios.get(`${BASE_URL}/ledgers`, { params, headers: getAuthHeaders() });
  return data;
};

export const getLedgerById = async (id: string, params?: any) => {
  const { data } = await axios.get(`${BASE_URL}/ledgers/${id}`, { params, headers: getAuthHeaders() });
  return data;
};

export const createLedger = async (ledger: any) => {
  const { data } = await axios.post(`${BASE_URL}/ledgers`, ledger, { headers: getAuthHeaders() });
  return data;
};

export const updateLedger = async (id: string, ledger: any) => {
  const { data } = await axios.put(`${BASE_URL}/ledgers/${id}`, ledger, { headers: getAuthHeaders() });
  return data;
};

export const deleteLedger = async (id: string) => {
  await axios.delete(`${BASE_URL}/ledgers/${id}`, { headers: getAuthHeaders() });
};

// Hierarchy
export const getAccountHierarchy = async () => {
  const { data } = await axios.get(`${BASE_URL}/hierarchy`, { headers: getAuthHeaders() });
  return data;
};

// Journal Entries
export const getJournalEntries = async (params?: { startDate?: string; endDate?: string; limit?: number; page?: number }) => {
  const { data } = await axios.get(`${BASE_URL}/journal-entries`, { params, headers: getAuthHeaders() });
  return data;
};

export const getJournalEntry = async (id: string) => {
  const { data } = await axios.get(`${BASE_URL}/journal-entries/${id}`, { headers: getAuthHeaders() });
  return data;
};

export const createJournalEntry = async (entry: any) => {
  const { data } = await axios.post(`${BASE_URL}/journal-entries`, entry, { headers: getAuthHeaders() });
  return data;
};

export const updateJournalEntry = async (id: string, entry: any) => {
  const { data } = await axios.put(`${BASE_URL}/journal-entries/${id}`, entry, { headers: getAuthHeaders() });
  return data;
};

export const postJournalEntry = async (id: string) => {
  const { data } = await axios.post(`${BASE_URL}/journal-entries/${id}/post`, {}, { headers: getAuthHeaders() });
  return data;
};

export const deleteJournalEntry = async (id: string) => {
  await axios.delete(`${BASE_URL}/journal-entries/${id}`, { headers: getAuthHeaders() });
};

// Reports
export const getTrialBalance = async (asOfDate?: string) => {
  const params = asOfDate ? { asOfDate } : {};
  const { data } = await axios.get(`${BASE_URL}/trial-balance`, { params, headers: getAuthHeaders() });
  return data;
};

export const getAccountLedger = async (accountId: string, startDate?: string, endDate?: string, limit?: number) => {
  const params: any = {};
  if (startDate) params.startDate = startDate;
  if (endDate) params.endDate = endDate;
  if (limit) params.limit = limit;
  const { data } = await axios.get(`${BASE_URL}/accounts/${accountId}/ledger`, { params, headers: getAuthHeaders() });
  return data;
};

export const getFinancialReports = async (reportType: string, params?: any) => {
  const { data } = await axios.get(`${BASE_URL}/reports`, { params: { reportType, ...params }, headers: getAuthHeaders() });
  return data;
};

// Accounts (unified interface for groups and ledgers)
export const getAccounts = async (params?: any) => {
  const { data } = await axios.get(`${BASE_URL}/accounts`, { params, headers: getAuthHeaders() });
  return data;
};

export const createAccount = async (account: any) => {
  const { data } = await axios.post(`${BASE_URL}/accounts`, account, { headers: getAuthHeaders() });
  return data;
};

export const updateAccount = async (id: string, account: any) => {
  const { data } = await axios.put(`${BASE_URL}/accounts/${id}`, account, { headers: getAuthHeaders() });
  return data;
};

export const deleteAccount = async (id: string) => {
  await axios.delete(`${BASE_URL}/accounts/${id}`, { headers: getAuthHeaders() });
};

// Voucher Types
export const getVouchersByType = async (voucherType: string, params?: any) => {
  const { data } = await axios.get(`${BASE_URL}/vouchers/${voucherType}`, { params, headers: getAuthHeaders() });
  return data;
};

// Multi-Currency
export const getCurrencies = async () => {
  const { data } = await axios.get(`${BASE_URL}/currencies`, { headers: getAuthHeaders() });
  return data;
};

export const getExchangeRate = async (fromCurrency: string, toCurrency: string, date?: string) => {
  const params = date ? { fromCurrency, toCurrency, date } : { fromCurrency, toCurrency };
  const { data } = await axios.get(`${BASE_URL}/exchange-rates`, { params, headers: getAuthHeaders() });
  return data;
};

export const updateExchangeRate = async (rateData: any) => {
  const { data } = await axios.post(`${BASE_URL}/exchange-rates`, rateData, { headers: getAuthHeaders() });
  return data;
};

export const createCurrency = async (currency: any) => {
  const { data } = await axios.post(`${BASE_URL}/currencies`, currency, { headers: getAuthHeaders() });
  return data;
};

export const updateCurrency = async (id: string, currency: any) => {
  const { data } = await axios.put(`${BASE_URL}/currencies/${id}`, currency, { headers: getAuthHeaders() });
  return data;
};

export const deleteCurrency = async (id: string) => {
  await axios.delete(`${BASE_URL}/currencies/${id}`, { headers: getAuthHeaders() });
};

// Cost Centers
export const getCostCenters = async () => {
  const { data } = await axios.get(`${BASE_URL}/cost-centers`, { headers: getAuthHeaders() });
  return data;
};

export const createCostCenter = async (costCenter: any) => {
  const { data } = await axios.post(`${BASE_URL}/cost-centers`, costCenter, { headers: getAuthHeaders() });
  return data;
};

export const updateCostCenter = async (id: string, costCenter: any) => {
  const { data } = await axios.put(`${BASE_URL}/cost-centers/${id}`, costCenter, { headers: getAuthHeaders() });
  return data;
};

export const deleteCostCenter = async (id: string) => {
  await axios.delete(`${BASE_URL}/cost-centers/${id}`, { headers: getAuthHeaders() });
};

export const getCostCenterReport = async (costCenterId: string, startDate?: string, endDate?: string) => {
  const params: any = {};
  if (startDate) params.startDate = startDate;
  if (endDate) params.endDate = endDate;
  const { data } = await axios.get(`${BASE_URL}/cost-centers/${costCenterId}/report`, { params, headers: getAuthHeaders() });
  return data;
};

// Bill-wise Details
export const getBillDetails = async (accountId: string, status?: string) => {
  const params = status ? { status } : {};
  const { data } = await axios.get(`${BASE_URL}/accounts/${accountId}/bills`, { params, headers: getAuthHeaders() });
  return data;
};

export const createBillDetail = async (billData: any) => {
  const { data } = await axios.post(`${BASE_URL}/bills`, billData, { headers: getAuthHeaders() });
  return data;
};

export const updateBillPayment = async (billId: string, paymentData: any) => {
  const { data } = await axios.put(`${BASE_URL}/bills/${billId}/payment`, paymentData, { headers: getAuthHeaders() });
  return data;
};

export const updateBillDetail = async (billId: string, billData: any) => {
  const { data } = await axios.put(`${BASE_URL}/bills/${billId}`, billData, { headers: getAuthHeaders() });
  return data;
};

export const deleteBillDetail = async (billId: string) => {
  await axios.delete(`${BASE_URL}/bills/${billId}`, { headers: getAuthHeaders() });
};

export const getBillStatement = async (accountId: string, startDate?: string, endDate?: string) => {
  const params: any = {};
  if (startDate) params.startDate = startDate;
  if (endDate) params.endDate = endDate;
  const { data } = await axios.get(`${BASE_URL}/accounts/${accountId}/bill-statement`, { params, headers: getAuthHeaders() });
  return data;
};

// Interest Calculations
export const calculateInterest = async (accountId: string, fromDate: string, toDate: string) => {
  const { data } = await axios.post(`${BASE_URL}/accounts/${accountId}/calculate-interest`, { fromDate, toDate }, { headers: getAuthHeaders() });
  return data;
};

export const postInterestEntry = async (accountId: string, interestData: any) => {
  const { data } = await axios.post(`${BASE_URL}/accounts/${accountId}/post-interest`, interestData, { headers: getAuthHeaders() });
  return data;
};

export const getInterestReport = async (accountId: string, fiscalYear?: string) => {
  const params = fiscalYear ? { fiscalYear } : {};
  const { data } = await axios.get(`${BASE_URL}/accounts/${accountId}/interest-report`, { params, headers: getAuthHeaders() });
  return data;
};

// GL Budgets
export const getGLBudgets = async (fiscalYear?: string) => {
  const params = fiscalYear ? { fiscalYear } : {};
  const { data } = await axios.get(`${BASE_URL}/budgets`, { params, headers: getAuthHeaders() });
  return data;
};

export const createGLBudget = async (budgetData: any) => {
  const { data } = await axios.post(`${BASE_URL}/budgets`, budgetData, { headers: getAuthHeaders() });
  return data;
};

export const updateGLBudget = async (id: string, budgetData: any) => {
  const { data } = await axios.put(`${BASE_URL}/budgets/${id}`, budgetData, { headers: getAuthHeaders() });
  return data;
};

export const deleteGLBudget = async (id: string) => {
  await axios.delete(`${BASE_URL}/budgets/${id}`, { headers: getAuthHeaders() });
};

export const getBudgetVarianceReport = async (fiscalYear: string) => {
  const { data } = await axios.get(`${BASE_URL}/budgets/variance-report`, { params: { fiscalYear }, headers: getAuthHeaders() });
  return data;
};

export const getAccountBudgetStatus = async (accountId: string, fiscalYear: string) => {
  const { data } = await axios.get(`${BASE_URL}/accounts/${accountId}/budget-status`, { params: { fiscalYear }, headers: getAuthHeaders() });
  return data;
};

// Audit Trail
export const getAuditLogs = async (params?: any) => {
  const { data } = await axios.get(`${BASE_URL}/audit-logs`, { params, headers: getAuthHeaders() });
  return data;
};

// Advanced Reports
export const getCashFlowReport = async (startDate?: string, endDate?: string) => {
  const { data } = await axios.get(`${BASE_URL}/reports/cash-flow`, { params: { startDate, endDate }, headers: getAuthHeaders() });
  return data;
};

export const getFundsFlowReport = async (startDate?: string, endDate?: string) => {
  const { data } = await axios.get(`${BASE_URL}/reports/funds-flow`, { params: { startDate, endDate }, headers: getAuthHeaders() });
  return data;
};

export const getRatioAnalysis = async (asOfDate?: string) => {
  const { data } = await axios.get(`${BASE_URL}/reports/ratio-analysis`, { params: { asOfDate }, headers: getAuthHeaders() });
  return data;
};

// Import/Export
export const exportData = async (type: string, format?: string, startDate?: string, endDate?: string) => {
  const { data } = await axios.get(`${BASE_URL}/export`, { params: { type, format, startDate, endDate }, headers: getAuthHeaders() });
  return data;
};

export const importData = async (type: string, data: any[]) => {
  const response = await axios.post(`${BASE_URL}/import`, { type, data }, { headers: getAuthHeaders() });
  return response.data;
};

// Scenario Management
export const getScenarios = async () => {
  const { data } = await axios.get(`${BASE_URL}/scenarios`, { headers: getAuthHeaders() });
  return data;
};

export const createScenario = async (scenario: any) => {
  const { data } = await axios.post(`${BASE_URL}/scenarios`, scenario, { headers: getAuthHeaders() });
  return data;
};

export const updateScenario = async (id: string, scenario: any) => {
  const { data } = await axios.put(`${BASE_URL}/scenarios/${id}`, scenario, { headers: getAuthHeaders() });
  return data;
};

export const deleteScenario = async (id: string) => {
  await axios.delete(`${BASE_URL}/scenarios/${id}`, { headers: getAuthHeaders() });
};

export const applyScenario = async (id: string) => {
  const { data } = await axios.post(`${BASE_URL}/scenarios/${id}/apply`, {}, { headers: getAuthHeaders() });
  return data;
};

// Batch Operations
export const batchPostEntries = async (entryIds: string[]) => {
  const { data } = await axios.post(`${BASE_URL}/batch/post`, { entryIds }, { headers: getAuthHeaders() });
  return data;
};

export const batchDeleteEntries = async (entryIds: string[]) => {
  const { data } = await axios.post(`${BASE_URL}/batch/delete`, { entryIds }, { headers: getAuthHeaders() });
  return data;
};

// Export as namespace
export const generalLedgerAPI = {
  getGroups,
  getGroupById,
  createGroup,
  updateGroup,
  deleteGroup,
  getSubGroups,
  getSubGroupById,
  createSubGroup,
  updateSubGroup,
  deleteSubGroup,
  getLedgers,
  getLedgerById,
  createLedger,
  updateLedger,
  deleteLedger,
  getAccountHierarchy,
  getJournalEntries,
  getJournalEntry,
  createJournalEntry,
  updateJournalEntry,
  postJournalEntry,
  deleteJournalEntry,
  getTrialBalance,
  getAccountLedger,
  getFinancialReports,
  getAccounts,
  createAccount,
  updateAccount,
  deleteAccount,
  getVouchersByType,
  getCurrencies,
  createCurrency,
  updateCurrency,
  deleteCurrency,
  getExchangeRate,
  updateExchangeRate,
  getCostCenters,
  createCostCenter,
  updateCostCenter,
  deleteCostCenter,
  getCostCenterReport,
  getBillDetails,
  createBillDetail,
  updateBillDetail,
  deleteBillDetail,
  updateBillPayment,
  getBillStatement,
  calculateInterest,
  postInterestEntry,
  getInterestReport,
  getGLBudgets,
  createGLBudget,
  updateGLBudget,
  deleteGLBudget,
  getBudgetVarianceReport,
  getAccountBudgetStatus,
  getAuditLogs,
  getCashFlowReport,
  getFundsFlowReport,
  getRatioAnalysis,
  exportData,
  importData,
  getScenarios,
  createScenario,
  updateScenario,
  deleteScenario,
  applyScenario,
  batchPostEntries,
  batchDeleteEntries
};
