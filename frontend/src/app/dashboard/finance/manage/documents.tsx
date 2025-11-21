'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Upload, FileText } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL  || process.env.BACKEND_URL;

export default function DocumentManager() {
  const [documents, setDocuments] = useState([]);
  const [form, setForm] = useState({ name: '', type: 'INVOICE', fileUrl: '', entityType: 'JOURNAL', entityId: '' });

  useEffect(() => { fetchDocuments(); }, []);

  const fetchDocuments = async () => {
    const token = localStorage.getItem('token');
    const res = await fetch(`${API_URL}/api/finance-advanced/documents`, { headers: { Authorization: `Bearer ${token}` } });
    setDocuments((await res.json()).documents || []);
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    await fetch(`${API_URL}/api/finance-advanced/documents`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ ...form, linkedTo: { entityType: form.entityType, entityId: form.entityId } })
    });
    setForm({ name: '', type: 'INVOICE', fileUrl: '', entityType: 'JOURNAL', entityId: '' });
    fetchDocuments();
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader><CardTitle>Upload Document</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
            <Input placeholder="Document Name" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required />
            <Input placeholder="File URL" value={form.fileUrl} onChange={e => setForm({...form, fileUrl: e.target.value})} required />
            <Input placeholder="Entity ID" value={form.entityId} onChange={e => setForm({...form, entityId: e.target.value})} required />
            <Button type="submit" className="col-span-2"><Upload className="w-4 h-4 mr-2" />Upload</Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Documents ({documents.length})</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Linked To</TableHead>
                <TableHead>Uploaded By</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {documents.map((doc: any) => (
                <TableRow key={doc._id}>
                  <TableCell className="flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    {doc.name}
                  </TableCell>
                  <TableCell><Badge>{doc.type}</Badge></TableCell>
                  <TableCell className="text-xs">{doc.linkedTo.entityType}</TableCell>
                  <TableCell>{doc.uploadedBy?.name || 'Unknown'}</TableCell>
                  <TableCell className="text-xs">{new Date(doc.uploadedAt).toLocaleDateString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
