'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileText, Upload, Download, Eye, Trash2, Search, Filter, FolderOpen } from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import DataTable, { Column } from '@/components/DataTable';

interface Document {
  id: string;
  name: string;
  type: 'Invoice' | 'Receipt' | 'Contract' | 'Report' | 'Certificate' | 'Other';
  size: string;
  uploadDate: string;
  uploadedBy: string;
  category: string;
  tags: string[];
  status: 'Active' | 'Archived' | 'Pending Review';
}

export default function DocumentsPage() {
  const [documents] = useState<Document[]>([
    {
      id: '1',
      name: 'Invoice_ABC_Corp_2024_001.pdf',
      type: 'Invoice',
      size: '2.4 MB',
      uploadDate: '2024-01-15',
      uploadedBy: 'John Doe',
      category: 'Accounts Payable',
      tags: ['vendor', 'payment', 'urgent'],
      status: 'Active'
    },
    {
      id: '2',
      name: 'Annual_Audit_Report_2023.pdf',
      type: 'Report',
      size: '15.7 MB',
      uploadDate: '2024-01-10',
      uploadedBy: 'Jane Smith',
      category: 'Audit',
      tags: ['audit', 'annual', 'compliance'],
      status: 'Active'
    },
    {
      id: '3',
      name: 'GST_Certificate_2024.pdf',
      type: 'Certificate',
      size: '1.2 MB',
      uploadDate: '2024-01-05',
      uploadedBy: 'Mike Johnson',
      category: 'Tax Documents',
      tags: ['gst', 'certificate', 'tax'],
      status: 'Active'
    }
  ]);

  const [searchTerm, setSearchTerm] = useState('');

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'Invoice': return 'bg-blue-100 text-blue-700';
      case 'Receipt': return 'bg-green-100 text-green-700';
      case 'Contract': return 'bg-purple-100 text-purple-700';
      case 'Report': return 'bg-orange-100 text-orange-700';
      case 'Certificate': return 'bg-yellow-100 text-yellow-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active': return 'bg-green-100 text-green-700';
      case 'Archived': return 'bg-gray-100 text-gray-700';
      case 'Pending Review': return 'bg-yellow-100 text-yellow-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const columns: Column<Document>[] = [
    {
      key: 'name',
      header: 'Document Name',
      sortable: true,
      render: (value) => (
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-blue-500" />
          <span className="font-medium">{value}</span>
        </div>
      )
    },
    {
      key: 'type',
      header: 'Type',
      render: (value) => (
        <Badge className={getTypeColor(value)} variant="secondary">
          {value}
        </Badge>
      )
    },
    {
      key: 'category',
      header: 'Category',
      sortable: true
    },
    {
      key: 'size',
      header: 'Size',
      sortable: true
    },
    {
      key: 'uploadDate',
      header: 'Upload Date',
      render: (value) => new Date(value).toLocaleDateString(),
      sortable: true
    },
    {
      key: 'uploadedBy',
      header: 'Uploaded By',
      sortable: true
    },
    {
      key: 'status',
      header: 'Status',
      render: (value) => (
        <Badge className={getStatusColor(value)} variant="secondary">
          {value}
        </Badge>
      )
    },
    {
      key: 'id',
      header: 'Actions',
      render: (value) => (
        <div className="flex gap-2">
          <Button size="sm" variant="outline">
            <Eye className="w-4 h-4" />
          </Button>
          <Button size="sm" variant="outline">
            <Download className="w-4 h-4" />
          </Button>
          <Button size="sm" variant="outline">
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      )
    }
  ];

  const categories = [
    { name: 'Invoices', count: 45, icon: FileText },
    { name: 'Receipts', count: 32, icon: FileText },
    { name: 'Contracts', count: 18, icon: FileText },
    { name: 'Tax Documents', count: 25, icon: FileText },
    { name: 'Audit Reports', count: 12, icon: FileText },
    { name: 'Certificates', count: 8, icon: FileText }
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Document Management"
        description="Organize and manage financial documents and attachments"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Finance', href: '/dashboard/finance' },
          { label: 'Documents' }
        ]}
        actions={
          <Button>
            <Upload className="w-4 h-4 mr-2" />
            Upload Document
          </Button>
        }
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Documents</p>
                <p className="text-2xl font-bold">140</p>
              </div>
              <FileText className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Storage Used</p>
                <p className="text-2xl font-bold">2.4 GB</p>
              </div>
              <FolderOpen className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Pending Review</p>
                <p className="text-2xl font-bold">8</p>
              </div>
              <Eye className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">This Month</p>
                <p className="text-2xl font-bold">23</p>
              </div>
              <Upload className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Document Categories */}
      <Card>
        <CardHeader>
          <CardTitle>Document Categories</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {categories.map((category) => (
              <div key={category.name} className="text-center p-4 border rounded-lg hover:shadow-md transition-shadow cursor-pointer">
                <category.icon className="w-8 h-8 mx-auto mb-2 text-blue-500" />
                <h3 className="font-semibold text-sm">{category.name}</h3>
                <p className="text-2xl font-bold text-blue-600">{category.count}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Document Management */}
      <Tabs defaultValue="all" className="space-y-6">
        <TabsList>
          <TabsTrigger value="all">All Documents</TabsTrigger>
          <TabsTrigger value="recent">Recent</TabsTrigger>
          <TabsTrigger value="pending">Pending Review</TabsTrigger>
          <TabsTrigger value="archived">Archived</TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          <DataTable
            data={documents}
            columns={columns}
            title="All Documents"
            searchable
            exportable
            onExport={() => console.log('Export documents')}
          />
        </TabsContent>

        <TabsContent value="recent">
          <DataTable
            data={documents.slice(0, 5)}
            columns={columns}
            title="Recent Documents"
            searchable
          />
        </TabsContent>

        <TabsContent value="pending">
          <DataTable
            data={documents.filter(doc => doc.status === 'Pending Review')}
            columns={columns}
            title="Pending Review"
            searchable
          />
        </TabsContent>

        <TabsContent value="archived">
          <DataTable
            data={documents.filter(doc => doc.status === 'Archived')}
            columns={columns}
            title="Archived Documents"
            searchable
          />
        </TabsContent>
      </Tabs>

      {/* Upload Area */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Upload</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center">
            <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">Drop files here or click to upload</h3>
            <p className="text-muted-foreground mb-4">Support for PDF, DOC, XLS, and image files up to 10MB</p>
            <Button>Choose Files</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}