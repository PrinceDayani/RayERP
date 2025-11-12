'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export default function DepartmentBudgetsPage() {
  const [budgets, setBudgets] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    departmentId: '',
    fiscalYear: new Date().getFullYear().toString(),
    totalBudget: 0,
    categories: [{ name: '', allocated: 0 }],
    notes: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      const [budgetsRes, deptsRes] = await Promise.all([
        axios.get(`${API_URL}/api/department-budgets`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API_URL}/api/departments`, { headers: { Authorization: `Bearer ${token}` } })
      ]);
      setBudgets(budgetsRes.data.data);
      setDepartments(deptsRes.data.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API_URL}/api/department-budgets`, formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setShowForm(false);
      setFormData({ departmentId: '', fiscalYear: new Date().getFullYear().toString(), totalBudget: 0, categories: [{ name: '', allocated: 0 }], notes: '' });
      fetchData();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Error creating budget');
    }
  };

  const addCategory = () => {
    setFormData({ ...formData, categories: [...formData.categories, { name: '', allocated: 0 }] });
  };

  const updateCategory = (index: number, field: string, value: any) => {
    const updated = [...formData.categories];
    updated[index] = { ...updated[index], [field]: value };
    setFormData({ ...formData, categories: updated });
  };

  const removeCategory = (index: number) => {
    setFormData({ ...formData, categories: formData.categories.filter((_, i) => i !== index) });
  };

  const approveBudget = async (id: string) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`${API_URL}/api/department-budgets/${id}/approve`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchData();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Error approving budget');
    }
  };

  if (loading) return <div className="p-6">Loading...</div>;

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Department Budgets</h1>
        <button onClick={() => setShowForm(!showForm)} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
          {showForm ? 'Cancel' : 'Add Budget'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded shadow mb-6">
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block mb-2 font-medium">Department</label>
              <select value={formData.departmentId} onChange={(e) => setFormData({ ...formData, departmentId: e.target.value })} className="w-full border p-2 rounded" required>
                <option value="">Select Department</option>
                {departments.map(d => <option key={d._id} value={d._id}>{d.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block mb-2 font-medium">Fiscal Year</label>
              <input type="text" value={formData.fiscalYear} onChange={(e) => setFormData({ ...formData, fiscalYear: e.target.value })} className="w-full border p-2 rounded" required />
            </div>
            <div>
              <label className="block mb-2 font-medium">Total Budget</label>
              <input type="number" value={formData.totalBudget} onChange={(e) => setFormData({ ...formData, totalBudget: Number(e.target.value) })} className="w-full border p-2 rounded" required />
            </div>
          </div>

          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <label className="font-medium">Budget Categories</label>
              <button type="button" onClick={addCategory} className="text-blue-600 text-sm">+ Add Category</button>
            </div>
            {formData.categories.map((cat, i) => (
              <div key={i} className="flex gap-2 mb-2">
                <input type="text" placeholder="Category name" value={cat.name} onChange={(e) => updateCategory(i, 'name', e.target.value)} className="flex-1 border p-2 rounded" required />
                <input type="number" placeholder="Amount" value={cat.allocated} onChange={(e) => updateCategory(i, 'allocated', Number(e.target.value))} className="w-32 border p-2 rounded" required />
                {formData.categories.length > 1 && <button type="button" onClick={() => removeCategory(i)} className="text-red-600">Remove</button>}
              </div>
            ))}
          </div>

          <div className="mb-4">
            <label className="block mb-2 font-medium">Notes</label>
            <textarea value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} className="w-full border p-2 rounded" rows={3} />
          </div>

          <button type="submit" className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700">Create Budget</button>
        </form>
      )}

      <div className="grid gap-4">
        {budgets.map(budget => (
          <div key={budget._id} className="bg-white p-6 rounded shadow">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-xl font-bold">{budget.departmentId?.name}</h3>
                <p className="text-gray-600">FY {budget.fiscalYear}</p>
              </div>
              <span className={`px-3 py-1 rounded text-sm ${budget.status === 'approved' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                {budget.status}
              </span>
            </div>

            <div className="grid grid-cols-4 gap-4 mb-4">
              <div>
                <p className="text-sm text-gray-600">Total Budget</p>
                <p className="text-lg font-bold">₹{budget.totalBudget.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Allocated</p>
                <p className="text-lg font-bold">₹{budget.allocatedBudget.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Spent</p>
                <p className="text-lg font-bold text-red-600">₹{budget.spentBudget.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Remaining</p>
                <p className="text-lg font-bold text-green-600">₹{budget.remainingBudget.toLocaleString()}</p>
              </div>
            </div>

            {budget.categories?.length > 0 && (
              <div className="mb-4">
                <p className="font-medium mb-2">Categories:</p>
                <div className="grid grid-cols-2 gap-2">
                  {budget.categories.map((cat: any, i: number) => (
                    <div key={i} className="border p-2 rounded">
                      <p className="font-medium">{cat.name}</p>
                      <p className="text-sm">Allocated: ₹{cat.allocated.toLocaleString()} | Spent: ₹{cat.spent.toLocaleString()}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {budget.status === 'draft' && (
              <button onClick={() => approveBudget(budget._id)} className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">
                Approve Budget
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
