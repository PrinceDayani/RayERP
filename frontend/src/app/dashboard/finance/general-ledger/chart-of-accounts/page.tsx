'use client';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search, RefreshCw, Filter, Edit, Trash2 } from 'lucide-react';

export default function ChartOfAccountsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [accounts] = useState([
    { id: 1, code: '1000', name: 'Cash', type: 'Asset', balance: 25000 },
    { id: 2, code: '1100', name: 'Accounts Receivable', type: 'Asset', balance: 15000 },
    { id: 3, code: '2000', name: 'Accounts Payable', type: 'Liability', balance: 8000 },
    { id: 4, code: '3000', name: 'Owner Equity', type: 'Equity', balance: 50000 },
    { id: 5, code: '4000', name: 'Sales Revenue', type: 'Revenue', balance: 95000 },
    { id: 6, code: '5000', name: 'Office Expenses', type: 'Expense', balance: 12000 }
  ]);

  const filteredAccounts = accounts.filter(account => 
    account.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    account.code.includes(searchTerm)
  );

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="border-b bg-white px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Chart of Accounts</h1>
            <p className="text-sm text-gray-600 mt-1">Manage your account structure and hierarchy</p>
          </div>
          <div className="flex items-center space-x-3">
            <Button variant="outline" size="sm">
              <RefreshCw className="w-4 h-4 mr-2" />
              Export
            </Button>
            <Button variant="outline" size="sm">
              <Plus className="w-4 h-4 mr-2" />
              Import
            </Button>
            <Button size="sm">
              <Plus className="w-4 h-4 mr-2" />
              Add Account
            </Button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="bg-gray-50 px-6 py-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg p-4 border">
            <p className="text-sm text-gray-600">Total Accounts</p>
            <p className="text-2xl font-semibold text-gray-900">{accounts.length}</p>
          </div>
          <div className="bg-white rounded-lg p-4 border">
            <p className="text-sm text-gray-600">Asset Accounts</p>
            <p className="text-2xl font-semibold text-gray-900">{accounts.filter(a => a.type === 'Asset').length}</p>
          </div>
          <div className="bg-white rounded-lg p-4 border">
            <p className="text-sm text-gray-600">Liability Accounts</p>
            <p className="text-2xl font-semibold text-gray-900">{accounts.filter(a => a.type === 'Liability').length}</p>
          </div>
          <div className="bg-white rounded-lg p-4 border">
            <p className="text-sm text-gray-600">Revenue Accounts</p>
            <p className="text-2xl font-semibold text-gray-900">{accounts.filter(a => a.type === 'Revenue').length}</p>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search accounts..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm">
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
            <Button variant="outline" size="sm">
              <Filter className="w-4 h-4 mr-2" />
              Filters
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left py-3 px-6 font-medium text-gray-700">Code</th>
                <th className="text-left py-3 px-6 font-medium text-gray-700">Account Name</th>
                <th className="text-left py-3 px-6 font-medium text-gray-700">Type</th>
                <th className="text-right py-3 px-6 font-medium text-gray-700">Balance</th>
                <th className="text-center py-3 px-6 font-medium text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredAccounts.map((account) => (
                <tr key={account.id} className="border-b hover:bg-gray-50">
                  <td className="py-4 px-6 font-mono text-sm">{account.code}</td>
                  <td className="py-4 px-6">{account.name}</td>
                  <td className="py-4 px-6">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      account.type === 'Asset' ? 'bg-green-100 text-green-800' :
                      account.type === 'Liability' ? 'bg-red-100 text-red-800' :
                      account.type === 'Equity' ? 'bg-blue-100 text-blue-800' :
                      account.type === 'Revenue' ? 'bg-purple-100 text-purple-800' :
                      'bg-orange-100 text-orange-800'
                    }`}>
                      {account.type}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-right font-mono">
                    ${account.balance.toLocaleString()}
                  </td>
                  <td className="py-4 px-6 text-center">
                    <div className="flex justify-center space-x-2">
                      <Button variant="ghost" size="sm">
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}