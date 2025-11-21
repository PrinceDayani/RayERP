const API_BASE = process.env.NEXT_PUBLIC_API_URL  || process.env.BACKEND_URL;

export const budgetApi = {
  getBudgets: () => fetch(`${API_BASE}/api/budgets`),
  createBudget: (data: any) => fetch(`${API_BASE}/api/budgets`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }),
  getBudgetVsActual: (budgetId: string) => fetch(`${API_BASE}/api/budgets/${budgetId}/vs-actual`),
  getForecasts: () => fetch(`${API_BASE}/api/budgets/forecasts`)
};