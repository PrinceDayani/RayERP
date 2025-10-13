'use client';
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, FileText, Calendar } from 'lucide-react';

export default function JournalEntriesPage() {
  const [entries] = useState([
    {
      id: 1,
      entryNumber: 'JE2024001',
      date: '2024-01-15',
      description: 'Office supplies purchase',
      reference: 'INV-001',
      totalDebit: 500,
      totalCredit: 500,
      status: 'Posted'
    },
    {
      id: 2,
      entryNumber: 'JE2024002',
      date: '2024-01-16',
      description: 'Sales revenue recognition',
      reference: 'SAL-001',
      totalDebit: 2500,
      totalCredit: 2500,
      status: 'Posted'
    },
    {
      id: 3,
      entryNumber: 'JE2024003',
      date: '2024-01-17',
      description: 'Equipment depreciation',
      reference: 'DEP-001',
      totalDebit: 1000,
      totalCredit: 1000,
      status: 'Draft'
    }
  ]);

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Journal Entries</h1>
          <p className="text-gray-600 mt-1">Create and manage journal entries</p>
        </div>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          New Journal Entry
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Entries</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{entries.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Posted Entries</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {entries.filter(e => e.status === 'Posted').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Draft Entries</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {entries.filter(e => e.status === 'Draft').length}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Journal Entries</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {entries.map((entry) => (
              <div key={entry.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                <div className="flex items-center space-x-4">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <FileText className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <h3 className="font-semibold">{entry.entryNumber}</h3>
                      <Badge variant={entry.status === 'Posted' ? 'default' : 'secondary'}>
                        {entry.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600">{entry.description}</p>
                    <div className="flex items-center space-x-4 text-xs text-gray-500 mt-1">
                      <span className="flex items-center">
                        <Calendar className="w-3 h-3 mr-1" />
                        {entry.date}
                      </span>
                      <span>Ref: {entry.reference}</span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium">
                    Dr: ${entry.totalDebit.toLocaleString()}
                  </div>
                  <div className="text-sm font-medium">
                    Cr: ${entry.totalCredit.toLocaleString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}