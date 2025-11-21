'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getLedgerById, getGroupById, getSubGroupById } from '@/lib/api/generalLedgerAPI';
import { ArrowLeft } from 'lucide-react';

export default function DetailView() {
  const params = useParams();
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [type, setType] = useState<'ledger' | 'group' | 'subgroup'>('ledger');

  useEffect(() => {
    loadData();
  }, [params.id]);

  const loadData = async () => {
    try {
      setLoading(true);
      try {
        const ledgerData = await getLedgerById(params.id as string);
        setData(ledgerData);
        setType('ledger');
      } catch {
        try {
          const groupData = await getGroupById(params.id as string);
          setData(groupData);
          setType('group');
        } catch {
          const subGroupData = await getSubGroupById(params.id as string);
          setData(subGroupData);
          setType('subgroup');
        }
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  if (!data) {
    return <div className="p-6">Data not found</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <button onClick={() => router.back()} className="flex items-center gap-2 text-blue-600 hover:text-blue-700">
        <ArrowLeft className="h-4 w-4" />
        Back
      </button>

      {type === 'ledger' && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h1 className="text-2xl font-bold mb-4">{data.name}</h1>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Code</p>
                <p className="font-semibold">{data.code}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Balance Type</p>
                <p className="font-semibold capitalize">{data.balanceType}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Current Balance</p>
                <p className="text-2xl font-bold text-green-600">₹{data.currentBalance.toLocaleString('en-IN')}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Opening Balance</p>
                <p className="font-semibold">₹{data.openingBalance.toLocaleString('en-IN')}</p>
              </div>
            </div>

            {data.gstInfo?.gstNo && (
              <div className="mt-4 pt-4 border-t">
                <h3 className="font-semibold mb-2">GST Information</h3>
                <p><span className="text-gray-600">GST No:</span> {data.gstInfo.gstNo}</p>
                <p><span className="text-gray-600">Type:</span> {data.gstInfo.gstType}</p>
              </div>
            )}

            {data.contactInfo?.email && (
              <div className="mt-4 pt-4 border-t">
                <h3 className="font-semibold mb-2">Contact Information</h3>
                <p><span className="text-gray-600">Email:</span> {data.contactInfo.email}</p>
                {data.contactInfo.mobile && <p><span className="text-gray-600">Mobile:</span> {data.contactInfo.mobile}</p>}
                {data.contactInfo.address && <p><span className="text-gray-600">Address:</span> {data.contactInfo.address}</p>}
              </div>
            )}
          </div>

          {data.transactions && data.transactions.length > 0 && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-bold mb-4">Recent Transactions</h2>
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2">Date</th>
                    <th className="text-left py-2">Entry #</th>
                    <th className="text-left py-2">Description</th>
                    <th className="text-right py-2">Debit</th>
                    <th className="text-right py-2">Credit</th>
                  </tr>
                </thead>
                <tbody>
                  {data.transactions.map((txn: any, i: number) => (
                    <tr key={i} className="border-b">
                      <td className="py-2">{new Date(txn.date).toLocaleDateString()}</td>
                      <td className="py-2">{txn.entryNumber}</td>
                      <td className="py-2">{txn.description}</td>
                      <td className="text-right py-2 text-green-600">
                        {txn.debit > 0 ? `₹${txn.debit.toLocaleString('en-IN')}` : '-'}
                      </td>
                      <td className="text-right py-2 text-red-600">
                        {txn.credit > 0 ? `₹${txn.credit.toLocaleString('en-IN')}` : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {type === 'group' && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h1 className="text-2xl font-bold mb-4">{data.name}</h1>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-gray-600">Code</p>
                <p className="font-semibold">{data.code}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Type</p>
                <p className="font-semibold capitalize">{data.type}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Ledgers</p>
                <p className="font-semibold">{data.ledgerCount || 0}</p>
              </div>
            </div>
          </div>

          {data.subGroups && data.subGroups.length > 0 && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-bold mb-4">Sub-Groups ({data.subGroups.length})</h2>
              <div className="grid gap-3">
                {data.subGroups.map((sg: any) => (
                  <div key={sg._id} className="border rounded p-4 hover:bg-gray-50 cursor-pointer"
                    onClick={() => router.push(`/dashboard/indian-accounts/${sg._id}`)}>
                    <div className="flex justify-between">
                      <div>
                        <p className="font-semibold">{sg.name}</p>
                        <p className="text-sm text-gray-600">{sg.code}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {type === 'subgroup' && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h1 className="text-2xl font-bold mb-4">{data.name}</h1>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-gray-600">Code</p>
                <p className="font-semibold">{data.code}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Ledgers</p>
                <p className="font-semibold">{data.ledgers?.length || 0}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Balance</p>
                <p className="text-xl font-bold text-green-600">₹{(data.totalBalance || 0).toLocaleString('en-IN')}</p>
              </div>
            </div>
          </div>

          {data.ledgers && data.ledgers.length > 0 && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-bold mb-4">Ledgers ({data.ledgers.length})</h2>
              <div className="grid gap-3">
                {data.ledgers.map((ledger: any) => (
                  <div key={ledger._id} className="border rounded p-4 hover:bg-gray-50 cursor-pointer"
                    onClick={() => router.push(`/dashboard/indian-accounts/${ledger._id}`)}>
                    <div className="flex justify-between">
                      <div>
                        <p className="font-semibold">{ledger.name}</p>
                        <p className="text-sm text-gray-600">{ledger.code}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-green-600">₹{ledger.currentBalance.toLocaleString('en-IN')}</p>
                        <p className="text-sm text-gray-600">{ledger.balanceType}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
