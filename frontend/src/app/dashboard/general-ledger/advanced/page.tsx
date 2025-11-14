'use client';

import { useState } from 'react';
import { generalLedgerAPI } from '@/lib/api/generalLedgerAPI';

type Tab = 'audit' | 'reports' | 'import-export' | 'scenarios' | 'batch';

export default function AdvancedGLPage() {
  const [tab, setTab] = useState<Tab>('audit');
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [report, setReport] = useState<any>(null);
  const [scenarios, setScenarios] = useState<any[]>([]);
  const [selectedEntries, setSelectedEntries] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const loadAuditLogs = async () => {
    setLoading(true);
    try {
      const data = await generalLedgerAPI.getAuditLogs();
      setAuditLogs(data);
    } catch (error) {
      alert('Failed to load audit logs');
    }
    setLoading(false);
  };

  const loadReport = async (type: string) => {
    setLoading(true);
    try {
      let data;
      if (type === 'cashflow') data = await generalLedgerAPI.getCashFlowReport();
      else if (type === 'fundsflow') data = await generalLedgerAPI.getFundsFlowReport();
      else if (type === 'ratio') data = await generalLedgerAPI.getRatioAnalysis();
      setReport({ type, data });
    } catch (error) {
      alert('Failed to load report');
    }
    setLoading(false);
  };

  const handleExport = async (type: string, format: string) => {
    try {
      const data = await generalLedgerAPI.exportData(type, format);
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${type}.${format}`;
      a.click();
    } catch (error) {
      alert('Export failed');
    }
  };

  const handleImport = async (type: string, file: File) => {
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      const result = await generalLedgerAPI.importData(type, data);
      alert(`Imported ${result.imported} of ${result.total} records`);
    } catch (error) {
      alert('Import failed');
    }
  };

  const loadScenarios = async () => {
    setLoading(true);
    try {
      const data = await generalLedgerAPI.getScenarios();
      setScenarios(data);
    } catch (error) {
      alert('Failed to load scenarios');
    }
    setLoading(false);
  };

  const handleBatchPost = async () => {
    if (!selectedEntries.length) return alert('Select entries');
    try {
      const result = await generalLedgerAPI.batchPostEntries(selectedEntries);
      alert(`Posted ${result.success} entries, ${result.failed} failed`);
      setSelectedEntries([]);
    } catch (error) {
      alert('Batch post failed');
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Advanced GL Features</h1>

      <div className="flex gap-2 mb-6">
        {(['audit', 'reports', 'import-export', 'scenarios', 'batch'] as Tab[]).map(t => (
          <button key={t} onClick={() => setTab(t)} className={`px-4 py-2 rounded capitalize ${tab === t ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>
            {t.replace('-', ' ')}
          </button>
        ))}
      </div>

      {tab === 'audit' && (
        <div>
          <button onClick={loadAuditLogs} className="px-4 py-2 bg-blue-600 text-white rounded mb-4">Load Audit Logs</button>
          <div className="bg-white rounded shadow overflow-auto">
            <table className="w-full">
              <thead className="bg-gray-100">
                <tr>
                  <th className="p-3 text-left">Time</th>
                  <th className="p-3 text-left">User</th>
                  <th className="p-3 text-left">Action</th>
                  <th className="p-3 text-left">Entity</th>
                  <th className="p-3 text-left">IP</th>
                </tr>
              </thead>
              <tbody>
                {auditLogs.map((log, i) => (
                  <tr key={i} className="border-t">
                    <td className="p-3">{new Date(log.timestamp).toLocaleString()}</td>
                    <td className="p-3">{log.userName}</td>
                    <td className="p-3">{log.action}</td>
                    <td className="p-3">{log.entityType}</td>
                    <td className="p-3">{log.ipAddress}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'reports' && (
        <div>
          <div className="flex gap-2 mb-4">
            <button onClick={() => loadReport('cashflow')} className="px-4 py-2 bg-green-600 text-white rounded">Cash Flow</button>
            <button onClick={() => loadReport('fundsflow')} className="px-4 py-2 bg-green-600 text-white rounded">Funds Flow</button>
            <button onClick={() => loadReport('ratio')} className="px-4 py-2 bg-green-600 text-white rounded">Ratio Analysis</button>
          </div>
          {report && (
            <div className="bg-white p-6 rounded shadow">
              <h3 className="text-lg font-semibold mb-4 capitalize">{report.type} Report</h3>
              <pre className="bg-gray-100 p-4 rounded overflow-auto">{JSON.stringify(report.data, null, 2)}</pre>
            </div>
          )}
        </div>
      )}

      {tab === 'import-export' && (
        <div className="space-y-4">
          <div className="bg-white p-6 rounded shadow">
            <h3 className="text-lg font-semibold mb-4">Export Data</h3>
            <div className="flex gap-2">
              <button onClick={() => handleExport('journals', 'json')} className="px-4 py-2 bg-blue-600 text-white rounded">Export Journals (JSON)</button>
              <button onClick={() => handleExport('accounts', 'json')} className="px-4 py-2 bg-blue-600 text-white rounded">Export Accounts (JSON)</button>
            </div>
          </div>
          <div className="bg-white p-6 rounded shadow">
            <h3 className="text-lg font-semibold mb-4">Import Data</h3>
            <input type="file" accept=".json" onChange={(e) => e.target.files?.[0] && handleImport('journals', e.target.files[0])} className="border p-2 rounded" />
          </div>
        </div>
      )}

      {tab === 'scenarios' && (
        <div>
          <button onClick={loadScenarios} className="px-4 py-2 bg-blue-600 text-white rounded mb-4">Load Scenarios</button>
          <div className="grid gap-4">
            {scenarios.map(s => (
              <div key={s._id} className="bg-white p-4 rounded shadow">
                <h3 className="font-semibold">{s.name}</h3>
                <p className="text-sm text-gray-600">{s.description}</p>
                <button onClick={async () => {
                  await generalLedgerAPI.applyScenario(s._id);
                  alert('Scenario applied');
                }} className="mt-2 px-3 py-1 bg-green-600 text-white rounded text-sm">Apply</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'batch' && (
        <div className="bg-white p-6 rounded shadow">
          <h3 className="text-lg font-semibold mb-4">Batch Operations</h3>
          <div className="mb-4">
            <input type="text" placeholder="Entry IDs (comma separated)" onChange={(e) => setSelectedEntries(e.target.value.split(',').map(s => s.trim()))} className="w-full border p-2 rounded" />
          </div>
          <div className="flex gap-2">
            <button onClick={handleBatchPost} className="px-4 py-2 bg-green-600 text-white rounded">Batch Post</button>
            <button onClick={async () => {
              if (!selectedEntries.length) return alert('Select entries');
              await generalLedgerAPI.batchDeleteEntries(selectedEntries);
              alert('Deleted');
              setSelectedEntries([]);
            }} className="px-4 py-2 bg-red-600 text-white rounded">Batch Delete</button>
          </div>
        </div>
      )}
    </div>
  );
}
