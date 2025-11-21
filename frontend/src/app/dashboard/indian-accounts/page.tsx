'use client';

import { useState, useEffect } from 'react';
import { getAccountHierarchy } from '@/lib/api/generalLedgerAPI';
import { AccountHierarchy } from '@/types/finance/generalLedger.types';

export default function IndianAccountsPage() {
  const [hierarchy, setHierarchy] = useState<AccountHierarchy[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [expandedSubGroups, setExpandedSubGroups] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadHierarchy();
  }, []);

  const loadHierarchy = async () => {
    try {
      const data = await getAccountHierarchy();
      setHierarchy(data);
    } catch (error) {
      console.error('Error loading hierarchy:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleGroup = (groupId: string) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(groupId)) {
      newExpanded.delete(groupId);
    } else {
      newExpanded.add(groupId);
    }
    setExpandedGroups(newExpanded);
  };

  const toggleSubGroup = (subGroupId: string) => {
    const newExpanded = new Set(expandedSubGroups);
    if (newExpanded.has(subGroupId)) {
      newExpanded.delete(subGroupId);
    } else {
      newExpanded.add(subGroupId);
    }
    setExpandedSubGroups(newExpanded);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-lg">Loading Indian Chart of Accounts...</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Indian Chart of Accounts</h1>
        <p className="text-gray-600 mt-2">Group → Sub-Group → Ledger Hierarchy</p>
      </div>

      <div className="bg-white rounded-lg shadow">
        {hierarchy.map((group) => (
          <div key={group._id} className="border-b last:border-b-0">
            {/* Group Level */}
            <div
              className="p-4 bg-blue-50 cursor-pointer hover:bg-blue-100 flex items-center justify-between"
              onClick={() => toggleGroup(group._id)}
            >
              <div className="flex items-center gap-3">
                <span className="text-xl">{expandedGroups.has(group._id) ? '▼' : '▶'}</span>
                <div>
                  <span className="font-bold text-lg">{group.name}</span>
                  <span className="ml-3 text-sm text-gray-600">({group.code})</span>
                </div>
              </div>
              <span className="text-sm bg-blue-200 px-3 py-1 rounded">{group.type}</span>
            </div>

            {/* Sub-Groups */}
            {expandedGroups.has(group._id) && (
              <div className="ml-8">
                {group.subGroups.map((subGroup) => (
                  <div key={subGroup._id} className="border-t">
                    <div
                      className="p-3 bg-green-50 cursor-pointer hover:bg-green-100 flex items-center gap-3"
                      onClick={() => toggleSubGroup(subGroup._id)}
                    >
                      <span>{expandedSubGroups.has(subGroup._id) ? '▼' : '▶'}</span>
                      <div>
                        <span className="font-semibold">{subGroup.name}</span>
                        <span className="ml-2 text-sm text-gray-600">({subGroup.code})</span>
                      </div>
                      <span className="ml-auto text-sm text-gray-500">
                        {subGroup.ledgers.length} ledgers
                      </span>
                    </div>

                    {/* Ledgers */}
                    {expandedSubGroups.has(subGroup._id) && (
                      <div className="ml-8 bg-gray-50">
                        {subGroup.ledgers.map((ledger) => (
                          <div
                            key={ledger._id}
                            className="p-3 border-t flex items-center justify-between hover:bg-gray-100"
                          >
                            <div className="flex items-center gap-3">
                              <span className="text-gray-400">📄</span>
                              <div>
                                <span className="font-medium">{ledger.name}</span>
                                <span className="ml-2 text-sm text-gray-600">({ledger.code})</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-4">
                              <span className={`text-sm px-2 py-1 rounded ${
                                ledger.balanceType === 'debit' 
                                  ? 'bg-orange-100 text-orange-700' 
                                  : 'bg-green-100 text-green-700'
                              }`}>
                                {ledger.balanceType}
                              </span>
                              <span className="font-mono text-sm">
                                ₹{ledger.currentBalance.toLocaleString('en-IN')}
                              </span>
                              <button
                                onClick={() => window.location.href = `/dashboard/indian-accounts/${ledger._id}`}
                                className="text-blue-600 hover:text-blue-700 text-sm underline"
                              >
                                View
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <h3 className="font-semibold mb-2">📚 Quick Guide:</h3>
        <ul className="text-sm space-y-1 text-gray-700">
          <li>• <strong>Group</strong>: Top-level classification (Assets, Liabilities, Income, Expenses)</li>
          <li>• <strong>Sub-Group</strong>: Middle-level classification (Cash/Bank, Sundry Debtors, etc.)</li>
          <li>• <strong>Ledger</strong>: Individual accounts where transactions are recorded</li>
          <li>• Click on any level to expand/collapse</li>
        </ul>
      </div>
    </div>
  );
}
