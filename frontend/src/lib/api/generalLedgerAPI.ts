import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
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
  currency?: string;
  subType?: string;
  category?: string;
}

export interface JournalLine {
  accountId: string | any;
  ledgerId?: string;
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

export interface TrialBalance {
  accounts: any[];
  totals: { debits: number; credits: number; balanced: boolean };
  asOfDate: string;
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

// Export as namespace
export const generalLedgerAPI = {
  getGroups,
  getGroupById,
  createGroup,
  getSubGroups,
  getSubGroupById,
  createSubGroup,
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
  deleteAccount
};
