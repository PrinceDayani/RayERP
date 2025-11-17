'use client';
import { useState, useEffect } from 'react';
import { recurringEntryAPI } from '@/lib/api/recurringEntryAPI';

export default function RecurringEntryManager() {
  const [entries, setEntries] = useState<any[]>([]);
  const [failed, setFailed] = useState<any[]>([]);
  const [pending, setPending] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState<'all' | 'failed' | 'pending'>('all');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const token = localStorage.getItem('token') || '';
    const [allRes, failedRes, pendingRes] = await Promise.all([
      recurringEntryAPI.getAll(token),
      recurringEntryAPI.getFailed(token),
      recurringEntryAPI.getPendingApprovals(token)
    ]);
    if (allRes.success) setEntries(allRes.data);
    if (failedRes.success) setFailed(failedRes.data);
    if (pendingRes.success) setPending(pendingRes.data);
    setLoading(false);
  };

  const handleSkipNext = async (id: string) => {
    const token = localStorage.getItem('token') || '';
    const res = await recurringEntryAPI.skipNext(token, id);
    if (res.success) {
      alert('Next occurrence skipped');
      loadData();
    }
  };

  const handleRetry = async (id: string) => {
    const token = localStorage.getItem('token') || '';
    const res = await recurringEntryAPI.retry(token, id);
    if (res.success) {
      alert('Retry initiated');
      loadData();
    }
  };

  const handleApprove = async (id: string) => {
    const token = localStorage.getItem('token') || '';
    const res = await recurringEntryAPI.approve(token, id);
    if (res.success) {
      alert('Entry approved');
      loadData();
    }
  };

  const handleBatchApprove = async () => {
    const token = localStorage.getItem('token') || '';
    const ids = pending.map(e => e._id);
    const res = await recurringEntryAPI.batchApprove(token, ids);
    if (res.success) {
      alert(`${ids.length} entries approved`);
      loadData();
    }
  };

  if (loading) return <div className="p-4">Loading...</div>;

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Recurring Entries</h1>
        <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
          + New Entry
        </button>
      </div>

      <div className="flex gap-4 mb-6">
        <button onClick={() => setSelectedTab('all')} className={`px-4 py-2 rounded ${selectedTab === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>
          All ({entries.length})
        </button>
        <button onClick={() => setSelectedTab('failed')} className={`px-4 py-2 rounded ${selectedTab === 'failed' ? 'bg-red-600 text-white' : 'bg-gray-200'}`}>
          Failed ({failed.length})
        </button>
        <button onClick={() => setSelectedTab('pending')} className={`px-4 py-2 rounded ${selectedTab === 'pending' ? 'bg-yellow-600 text-white' : 'bg-gray-200'}`}>
          Pending Approval ({pending.length})
        </button>
      </div>

      {selectedTab === 'all' && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Frequency</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Next Run</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {entries.map((entry) => (
                <tr key={entry._id}>
                  <td className="px-6 py-4">{entry.name}</td>
                  <td className="px-6 py-4">{entry.frequency}</td>
                  <td className="px-6 py-4">{new Date(entry.nextRunDate).toLocaleDateString()}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded text-xs ${entry.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                      {entry.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <button onClick={() => handleSkipNext(entry._id)} className="text-blue-600 hover:underline mr-3">Skip Next</button>
                    <button className="text-gray-600 hover:underline">Edit</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selectedTab === 'failed' && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Failure Reason</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Retry Count</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {failed.map((entry) => (
                <tr key={entry._id}>
                  <td className="px-6 py-4">{entry.name}</td>
                  <td className="px-6 py-4 text-red-600">{entry.failureReason || 'Unknown'}</td>
                  <td className="px-6 py-4">{entry.retryCount || 0} / {entry.maxRetries || 3}</td>
                  <td className="px-6 py-4">
                    <button onClick={() => handleRetry(entry._id)} className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700">
                      Retry
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selectedTab === 'pending' && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="p-4 bg-gray-50 flex justify-between items-center">
            <span className="text-sm text-gray-600">{pending.length} entries pending approval</span>
            {pending.length > 0 && (
              <button onClick={handleBatchApprove} className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">
                Approve All
              </button>
            )}
          </div>
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Frequency</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Next Run</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {pending.map((entry) => (
                <tr key={entry._id}>
                  <td className="px-6 py-4">{entry.name}</td>
                  <td className="px-6 py-4">{entry.frequency}</td>
                  <td className="px-6 py-4">{new Date(entry.nextRunDate).toLocaleDateString()}</td>
                  <td className="px-6 py-4">
                    <button onClick={() => handleApprove(entry._id)} className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 mr-2">
                      Approve
                    </button>
                    <button className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700">
                      Reject
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
