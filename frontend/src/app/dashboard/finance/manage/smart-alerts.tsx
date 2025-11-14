'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertTriangle, CheckCircle, Zap } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export default function SmartAlerts() {
  const [alerts, setAlerts] = useState([]);
  const [duplicates, setDuplicates] = useState({ duplicates: 0 });

  useEffect(() => { fetchAlerts(); detectDuplicates(); autoDetect(); }, []);

  const fetchAlerts = async () => {
    const token = localStorage.getItem('token');
    const res = await fetch(`${API_URL}/api/finance-advanced/alerts`, { headers: { Authorization: `Bearer ${token}` } });
    setAlerts((await res.json()).alerts || []);
  };

  const detectDuplicates = async () => {
    const token = localStorage.getItem('token');
    const res = await fetch(`${API_URL}/api/finance-advanced/alerts/detect-duplicates`, { headers: { Authorization: `Bearer ${token}` } });
    setDuplicates(await res.json());
  };

  const autoDetect = async () => {
    const token = localStorage.getItem('token');
    await fetch(`${API_URL}/api/finance-advanced/alerts/auto-detect`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` }
    });
  };

  const resolveAlert = async (id: string) => {
    const token = localStorage.getItem('token');
    await fetch(`${API_URL}/api/finance-advanced/alerts/${id}/resolve`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}` }
    });
    fetchAlerts();
  };

  const getSeverityColor = (severity: string) => {
    switch(severity) {
      case 'CRITICAL': return 'bg-red-600';
      case 'HIGH': return 'bg-orange-600';
      case 'MEDIUM': return 'bg-yellow-600';
      default: return 'bg-blue-600';
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Alerts</p>
                <p className="text-3xl font-bold">{alerts.length}</p>
              </div>
              <AlertTriangle className="w-12 h-12 text-orange-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Duplicates Found</p>
                <p className="text-3xl font-bold">{duplicates.duplicates}</p>
              </div>
              <Zap className="w-12 h-12 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-lg" onClick={autoDetect}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">AI Detection</p>
                <p className="text-lg font-bold text-green-600">Run Scan</p>
              </div>
              <CheckCircle className="w-12 h-12 text-green-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Smart Alerts</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Type</TableHead>
                <TableHead>Severity</TableHead>
                <TableHead>Message</TableHead>
                <TableHead>Entity</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {alerts.map((alert: any) => (
                <TableRow key={alert._id}>
                  <TableCell><Badge>{alert.type}</Badge></TableCell>
                  <TableCell><Badge className={getSeverityColor(alert.severity)}>{alert.severity}</Badge></TableCell>
                  <TableCell>{alert.message}</TableCell>
                  <TableCell className="text-xs">{alert.entityType}</TableCell>
                  <TableCell className="text-xs">{new Date(alert.createdAt).toLocaleString()}</TableCell>
                  <TableCell>
                    {!alert.isResolved && (
                      <Button size="sm" onClick={() => resolveAlert(alert._id)}>
                        <CheckCircle className="w-4 h-4 mr-1" />Resolve
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
