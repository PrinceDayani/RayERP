const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export const expenseApi = {
  getExpenses: () => fetch(`${API_BASE}/api/expenses`),
  submitClaim: (data: any) => fetch(`${API_BASE}/api/expenses/claims`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }),
  getApprovals: () => fetch(`${API_BASE}/api/expenses/approvals`),
  getReimbursements: () => fetch(`${API_BASE}/api/expenses/reimbursements`)
};