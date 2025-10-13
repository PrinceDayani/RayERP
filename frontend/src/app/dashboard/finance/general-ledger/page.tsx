'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search, RefreshCw, Filter, List, FileText, BookOpen, Calculator } from 'lucide-react';
import { useGeneralLedger } from '@/hooks/finance/useGeneralLedger';

export default function GeneralLedgerPage() {
  const { accounts, journalEntries, loading, fetchAccounts } = useGeneralLedger();
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchAccounts();
  }, []);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="border-b bg-white px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">General Ledger</h1>
            <p className="text-sm text-gray-600 mt-1">Manage accounts, journal entries, and financial records</p>
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
              Add Entry
            </Button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="bg-gray-50 px-6 py-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg p-4 border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Accounts</p>
                <p className="text-2xl font-semibold text-gray-900">24</p>
              </div>
              <div className="p-2 bg-blue-100 rounded-lg">
                <List className="w-5 h-5 text-blue-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg p-4 border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Journal Entries</p>
                <p className="text-2xl font-semibold text-gray-900">156</p>
              </div>
              <div className="p-2 bg-green-100 rounded-lg">
                <FileText className="w-5 h-5 text-green-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg p-4 border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Assets Total</p>
                <p className="text-2xl font-semibold text-gray-900">$125,000</p>
              </div>
              <div className="p-2 bg-purple-100 rounded-lg">
                <BookOpen className="w-5 h-5 text-purple-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg p-4 border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Trial Balance</p>
                <p className="text-2xl font-semibold text-gray-900">Balanced</p>
              </div>
              <div className="p-2 bg-orange-100 rounded-lg">
                <Calculator className="w-5 h-5 text-orange-600" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search ledger..."
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
      <div className="flex-1 p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Link href="/dashboard/finance/general-ledger/chart-of-accounts">
            <div className="bg-white border rounded-lg p-6 hover:shadow-md transition-shadow cursor-pointer">
              <div className="flex items-center space-x-3 mb-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <List className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="font-semibold text-gray-900">Chart of Accounts</h3>
              </div>
              <p className="text-sm text-gray-600">Manage account structure and hierarchy</p>
            </div>
          </Link>
          
          <Link href="/dashboard/finance/general-ledger/journal-entries">
            <div className="bg-white border rounded-lg p-6 hover:shadow-md transition-shadow cursor-pointer">
              <div className="flex items-center space-x-3 mb-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <FileText className="w-6 h-6 text-green-600" />
                </div>
                <h3 className="font-semibold text-gray-900">Journal Entries</h3>
              </div>
              <p className="text-sm text-gray-600">Create and manage journal entries</p>
            </div>
          </Link>
          
          <Link href="/dashboard/finance/general-ledger/ledger">
            <div className="bg-white border rounded-lg p-6 hover:shadow-md transition-shadow cursor-pointer">
              <div className="flex items-center space-x-3 mb-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <BookOpen className="w-6 h-6 text-purple-600" />
                </div>
                <h3 className="font-semibold text-gray-900">Ledger View</h3>
              </div>
              <p className="text-sm text-gray-600">View account ledgers and transactions</p>
            </div>
          </Link>
          
          <Link href="/dashboard/finance/general-ledger/trial-balance">
            <div className="bg-white border rounded-lg p-6 hover:shadow-md transition-shadow cursor-pointer">
              <div className="flex items-center space-x-3 mb-3">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <Calculator className="w-6 h-6 text-orange-600" />
                </div>
                <h3 className="font-semibold text-gray-900">Trial Balance</h3>
              </div>
              <p className="text-sm text-gray-600">Generate trial balance reports</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}